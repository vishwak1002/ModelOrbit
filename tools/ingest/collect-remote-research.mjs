import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(new URL("../..", import.meta.url).pathname);
const collectorVersion = "1.0.0";
const mobileSignals = ["mobile", "android", "ios", "coreml", "core-ai", "executorch", "edge", "on-device", "phone", "mlx", "llm"];

const nowFromEnvironment = () => {
  const value = process.env.MODELORBIT_COLLECTION_NOW;
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.valueOf())) throw new Error(`Invalid MODELORBIT_COLLECTION_NOW: ${value}`);
  return date;
};

const iso = (date) => date.toISOString();
const dateStamp = (date) => iso(date).slice(0, 10);
const asInteger = (value) => Number.isInteger(value) && value >= 0 ? value : null;
const asText = (value) => typeof value === "string" && value.trim() ? value.trim() : null;
const unique = (values) => [...new Set(values.filter(Boolean))];
const fingerprintExcludedKeys = new Set(["snapshotId", "collectedAt", "observedAt", "semanticFingerprint"]);

function canonicalize(value, key = null) {
  if (fingerprintExcludedKeys.has(key)) return undefined;
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((childKey) => [childKey, canonicalize(value[childKey], childKey)]).filter(([, childValue]) => childValue !== undefined));
  }
  return value;
}

export function calculateSemanticFingerprint(snapshot) {
  return createHash("sha256").update(JSON.stringify(canonicalize(snapshot))).digest("hex");
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "ModelOrbit-free-research-collector/1.0", ...headers },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  return response.json();
}

function modelSignals(model, querySignal) {
  const haystack = [model.id, ...(model.tags ?? []), querySignal].join(" ").toLowerCase();
  return unique(mobileSignals.filter((signal) => haystack.includes(signal)));
}

function modalityForPipeline(pipelineTag) {
  return {
    "text-generation": "text-generation",
    "image-text-to-text": "vision-language",
    "image-to-text": "ocr-image-to-text",
    "automatic-speech-recognition": "speech-recognition",
    "audio-classification": "audio",
    "text-to-speech": "text-to-speech",
    "feature-extraction": "embeddings",
    "text-to-image": "image-generation",
    "object-detection": "object-detection",
    "image-segmentation": "image-segmentation",
  }[pipelineTag] ?? "other";
}

export function normalizeHuggingFaceModel(model, querySignal, observedAt) {
  const modelId = asText(model?.id);
  if (!modelId || !modelId.includes("/")) return null;
  const tags = Array.isArray(model.tags) ? model.tags.filter((tag) => typeof tag === "string").slice(0, 40) : [];
  const signals = modelSignals(model, querySignal);
  const downloads = asInteger(model.downloads) ?? 0;
  const likes = asInteger(model.likes) ?? 0;
  const discoveryScore = Math.round((Math.log10(downloads + 1) * 10 + Math.log10(likes + 1) * 5 + signals.length * 8) * 100) / 100;
  const revision = asText(model.sha);
  const parameterCount = asInteger(model.safetensors?.total) ?? asInteger(model.config?.num_parameters);
  return {
    modelId,
    repositoryUrl: `https://huggingface.co/${modelId}`,
    revision,
    pipelineTag: asText(model.pipeline_tag),
    libraryName: asText(model.library_name),
    modality: modalityForPipeline(asText(model.pipeline_tag)),
    license: asText(model.cardData?.license),
    parameterCount,
    downloads,
    likes,
    lastModified: asText(model.lastModified),
    gated: Boolean(model.gated),
    tags,
    mobileSignals: signals,
    discoveryScore,
    evidenceUrls: unique([
      `https://huggingface.co/${modelId}`,
      revision ? `https://huggingface.co/${modelId}/tree/${revision}` : null,
    ]),
    observedAt,
  };
}

async function collectHuggingFace(observedAt) {
  const queries = [
    ["mobile-text", "mobile", "text-generation"],
    ["executorch-text", "executorch", "text-generation"],
    ["edge-llm", "edge llm", "text-generation"],
    ["coreml-text", "coreml", "text-generation"],
    ["vision-language", "vision language", "image-text-to-text"],
    ["ocr", "ocr", "image-to-text"],
    ["speech", "speech", "automatic-speech-recognition"],
    ["audio", "audio", "audio-classification"],
    ["tts", "text to speech", "text-to-speech"],
    ["embeddings", "mobile embedding", "feature-extraction"],
    ["image-generation", "mobile image generation", "text-to-image"],
    ["detection", "mobile detection", "object-detection"],
    ["segmentation", "mobile segmentation", "image-segmentation"],
  ];
  const models = new Map();
  const queryResults = await Promise.all(queries.map(async ([label, search, pipelineTag]) => {
    const url = `https://huggingface.co/api/models?search=${encodeURIComponent(search)}&pipeline_tag=${encodeURIComponent(pipelineTag)}&sort=downloads&direction=-1&limit=30&full=true`;
    try {
      const payload = await fetchJson(url);
      const entries = Array.isArray(payload) ? payload : [];
      for (const model of entries) {
        const normalized = normalizeHuggingFaceModel(model, search, observedAt);
        if (!normalized) continue;
        const revisionKey = `${normalized.modelId}@${normalized.revision ?? "unresolved"}`;
        const previous = models.get(revisionKey);
        if (!previous || normalized.discoveryScore > previous.discoveryScore) models.set(revisionKey, normalized);
      }
      return { label, url, pipelineTag, status: "ok", itemCount: entries.length };
    } catch (error) {
      return { label, url, pipelineTag, status: "error", itemCount: 0, error: error.message };
    }
  }));
  const items = [...models.values()].sort((a, b) => b.discoveryScore - a.discoveryScore || b.downloads - a.downloads || a.modelId.localeCompare(b.modelId));
  return { sourceId: "huggingface-models", authority: "huggingface", sourceType: "public-model-api", url: "https://huggingface.co/models", status: items.length || queryResults.some((query) => query.status === "ok") ? "ok" : "error", itemCount: Math.min(items.length, 50), items: items.slice(0, 50), queries: queryResults, observedAt, ...(items.length || queryResults.some((query) => query.status === "ok") ? {} : { error: "All Hugging Face queries failed." }) };
}

function normalizeGitHubRepository(repository, observedAt) {
  return {
    repositoryId: asText(repository.full_name),
    url: asText(repository.html_url),
    description: asText(repository.description),
    stars: asInteger(repository.stargazers_count) ?? 0,
    forks: asInteger(repository.forks_count) ?? 0,
    openIssues: asInteger(repository.open_issues_count) ?? 0,
    defaultBranch: asText(repository.default_branch),
    pushedAt: asText(repository.pushed_at),
    topics: Array.isArray(repository.topics) ? repository.topics.slice(0, 30) : [],
    license: asText(repository.license?.spdx_id),
    archived: Boolean(repository.archived),
    observedAt,
  };
}

async function collectGitHub(observedAt) {
  const repositories = ["apple/coreai-models", "apple/coremltools", "pytorch/executorch", "google-ai-edge/ai-edge-torch"];
  const items = [];
  const errors = [];
  for (const repositoryId of repositories) {
    const url = `https://api.github.com/repos/${repositoryId}`;
    try {
      const repository = normalizeGitHubRepository(await fetchJson(url, { accept: "application/vnd.github+json" }), observedAt);
      if (repository.repositoryId && repository.url) items.push(repository);
    } catch (error) {
      errors.push(`${repositoryId}: ${error.message}`);
    }
  }
  return { sourceId: "github-runtime-repositories", authority: "github", sourceType: "public-repository-api", url: "https://github.com/apple/coreai-models", status: items.length ? "ok" : "error", itemCount: items.length, items, observedAt, ...(errors.length ? { errors } : {}), ...(items.length ? {} : { error: "All official runtime repository queries failed." }) };
}

async function collectHackerNews(observedAt) {
  const url = "https://hn.algolia.com/api/v1/search_by_date?query=mobile%20LLM&tags=story&hitsPerPage=25";
  try {
    const payload = await fetchJson(url);
    const items = (Array.isArray(payload.hits) ? payload.hits : []).map((hit) => ({
      title: asText(hit.title),
      url: asText(hit.url) ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
      discussionUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      author: asText(hit.author),
      points: asInteger(hit.points) ?? 0,
      comments: asInteger(hit.num_comments) ?? 0,
      createdAt: asText(hit.created_at),
    })).filter((item) => item.title && item.url);
    return { sourceId: "hacker-news-mobile-llm", authority: "hacker-news", sourceType: "public-community-search", url, status: "ok", itemCount: items.length, items, observedAt };
  } catch (error) {
    return { sourceId: "hacker-news-mobile-llm", authority: "hacker-news", sourceType: "public-community-search", url, status: "error", itemCount: 0, items: [], observedAt, error: error.message };
  }
}

async function collectReddit(observedAt) {
  const url = "https://www.reddit.com/r/LocalLLaMA/search.json?q=mobile%20LLM&restrict_sr=1&sort=new&limit=25";
  try {
    const payload = await fetchJson(url, { accept: "application/json", "user-agent": "ModelOrbit-free-research-collector/1.0 (public research)" });
    const children = Array.isArray(payload?.data?.children) ? payload.data.children : [];
    const items = children.map(({ data }) => ({
      title: asText(data?.title),
      url: data?.permalink ? `https://www.reddit.com${data.permalink}` : null,
      externalUrl: asText(data?.url),
      subreddit: asText(data?.subreddit),
      author: asText(data?.author),
      score: asInteger(data?.score) ?? 0,
      comments: asInteger(data?.num_comments) ?? 0,
      createdAt: typeof data?.created_utc === "number" ? new Date(data.created_utc * 1000).toISOString() : null,
    })).filter((item) => item.title && item.url);
    return { sourceId: "reddit-localllama-mobile", authority: "reddit", sourceType: "public-community-search", url, status: "ok", itemCount: items.length, items, observedAt };
  } catch (error) {
    return { sourceId: "reddit-localllama-mobile", authority: "reddit", sourceType: "public-community-search", url, status: "error", itemCount: 0, items: [], observedAt, error: error.message };
  }
}

async function collectBluesky(observedAt) {
  const url = "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=mobile%20LLM&limit=25";
  try {
    const payload = await fetchJson(url);
    const items = (Array.isArray(payload?.posts) ? payload.posts : []).map((post) => ({
      author: asText(post?.author?.handle),
      text: asText(post?.record?.text)?.slice(0, 500),
      createdAt: asText(post?.record?.createdAt),
      url: post?.uri ? `https://bsky.app/profile/${post.author?.handle}/post/${post.uri.split("/").at(-1)}` : null,
      likeCount: asInteger(post?.likeCount) ?? 0,
      repostCount: asInteger(post?.repostCount) ?? 0,
      replyCount: asInteger(post?.replyCount) ?? 0,
    })).filter((item) => item.text && item.url);
    return { sourceId: "bluesky-mobile-llm", authority: "bluesky", sourceType: "public-community-search", url, status: "ok", itemCount: items.length, items, observedAt };
  } catch (error) {
    return { sourceId: "bluesky-mobile-llm", authority: "bluesky", sourceType: "public-community-search", url, status: "error", itemCount: 0, items: [], observedAt, error: error.message };
  }
}

export function buildSnapshot({ collectedAt, sources }) {
  const modelItems = sources.find((source) => source.sourceId === "huggingface-models")?.items ?? [];
  const shortlist = modelItems.slice(0, 3).map((model, index) => ({ rank: index + 1, modelId: model.modelId, revision: model.revision, discoveryScore: model.discoveryScore, reason: "Transparent popularity plus mobile-signal heuristic; requires Codex review against primary runtime evidence before admission." }));
  const snapshot = {
    schemaVersion: "0.1.0",
    snapshotId: `remote-mobile-llm-${dateStamp(collectedAt)}`,
    collectedAt: iso(collectedAt),
    collector: { name: "ModelOrbit free remote research collector", version: collectorVersion, credentialsRequired: false, rawPayloadsCommitted: false },
    scope: { purpose: "Collect public leads for mobile-specific open-source model research before manual Codex synthesis.", modelFilter: "Hugging Face repositories across text generation, vision-language, OCR, audio/speech, TTS, embeddings, image generation, detection, and segmentation searches.", communitySources: ["Hacker News", "Reddit r/LocalLLaMA", "Bluesky public search"] },
    sources,
    shortlist,
    pipeline: {
      stages: [
        { name: "discovery", status: "complete", description: "Collect normalized public leads from allowlisted sources." },
        { name: "verification", status: "manual-required", description: "Confirm exact immutable revisions and primary Apple/ExecuTorch evidence." },
        { name: "ranking", status: "heuristic-complete", description: "Rank leads with transparent popularity and mobile-signal inputs." },
        { name: "implementation", status: "manual-required", description: "Use the model registry and adapter strategies to wire platform POCs." },
        { name: "validation", status: "complete", description: "Validate the snapshot contract and repository gates." },
        { name: "delivery", status: "workflow-controlled", description: "Commit and push only validated changes; preserve the no-change path." },
      ],
    },
    limitations: ["Popularity and community signals are discovery aids, not proof of iOS or Android execution.", "Exact immutable revisions and primary Apple Core AI/ExecuTorch evidence must be reviewed before changing the verified inventory.", "Unavailable sources remain visible as errors; a run is invalid only when every source fails."],
  };
  snapshot.semanticFingerprint = calculateSemanticFingerprint(snapshot);
  return snapshot;
}

export function validateRemoteSnapshot(snapshot) {
  const errors = [];
  if (snapshot?.schemaVersion !== "0.1.0") errors.push("schemaVersion must be 0.1.0");
  if (!/^remote-mobile-llm-[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{3}Z)?$/.test(snapshot?.snapshotId ?? "")) errors.push("snapshotId must contain a UTC date");
  if (Number.isNaN(new Date(snapshot?.collectedAt ?? "").valueOf())) errors.push("collectedAt must be a valid date");
  if (!Array.isArray(snapshot?.sources) || !snapshot.sources.length) errors.push("sources must be non-empty");
  const successful = (snapshot?.sources ?? []).filter((source) => source.status === "ok");
  if (!successful.length) errors.push("at least one source must succeed");
  for (const source of snapshot?.sources ?? []) {
    if (!source.sourceId || !source.url || !["ok", "error"].includes(source.status)) errors.push(`invalid source contract: ${source.sourceId ?? "unknown"}`);
    if (!Array.isArray(source.items) || source.itemCount !== source.items.length) errors.push(`source item count mismatch: ${source.sourceId ?? "unknown"}`);
    if (source.status === "error" && !source.error) errors.push(`failed source lacks an error: ${source.sourceId ?? "unknown"}`);
    if (JSON.stringify(source).match(/rawPayload|privateKey|apiKey|authorization/i)) errors.push(`sensitive/raw field found in source: ${source.sourceId ?? "unknown"}`);
  }
  if (!Array.isArray(snapshot?.shortlist) || snapshot.shortlist.length > 3) errors.push("shortlist must contain at most three candidates");
  const stageNames = (snapshot?.pipeline?.stages ?? []).map((stage) => stage.name);
  if (JSON.stringify(stageNames) !== JSON.stringify(["discovery", "verification", "ranking", "implementation", "validation", "delivery"])) errors.push("pipeline must contain the six research stages in order");
  if (!/^[0-9a-f]{64}$/.test(snapshot?.semanticFingerprint ?? "") || snapshot.semanticFingerprint !== calculateSemanticFingerprint(snapshot)) errors.push("semanticFingerprint must match the normalized snapshot");
  return errors;
}

function markdown(snapshot) {
  const lines = [
    `# Remote mobile LLM research — ${snapshot.collectedAt.slice(0, 10)}`,
    "",
    `Generated by the credential-free remote collector at ${snapshot.collectedAt}. This is a lead-collection snapshot, not a mobile-readiness decision.`,
    "",
    "## Heuristic shortlist",
    "",
    "| Rank | Hugging Face repository | Revision | Score | Review status |",
    "|---:|---|---|---:|---|",
    ...snapshot.shortlist.map((candidate) => `| ${candidate.rank} | [${candidate.modelId}](https://huggingface.co/${candidate.modelId}) | ${candidate.revision ?? "not returned"} | ${candidate.discoveryScore} | Manual primary-source review required |`),
    ...(snapshot.shortlist.length ? [] : ["| — | No model candidates returned | — | — | Investigate Hugging Face availability |"]),
    "",
    "## Source status",
    "",
    "| Source | Status | Items | URL |",
    "|---|---|---:|---|",
    ...snapshot.sources.map((source) => `| ${source.sourceId} | ${source.status}${source.error ? ` — ${source.error}` : ""} | ${source.itemCount} | [open](${source.url}) |`),
    "",
    "## Guardrails",
    "",
    ...snapshot.limitations.map((limitation) => `- ${limitation}`),
    "",
    `Machine-readable snapshot: [${snapshot.snapshotId}.json](./${snapshot.snapshotId}.json).`,
    "",
  ];
  return lines.join("\n");
}

export async function collectAndWrite({ collectedAt = nowFromEnvironment(), outputDir = resolve(root, "data/research/remote") } = {}) {
  const observedAt = iso(collectedAt);
  const sources = await Promise.all([
    collectHuggingFace(observedAt),
    collectGitHub(observedAt),
    collectHackerNews(observedAt),
    collectReddit(observedAt),
    collectBluesky(observedAt),
  ]);
  const snapshot = buildSnapshot({ collectedAt, sources });
  const errors = validateRemoteSnapshot(snapshot);
  if (errors.length) throw new Error(`Remote research snapshot validation failed:\n${errors.join("\n")}`);
  mkdirSync(outputDir, { recursive: true });
  const jsonPath = resolve(outputDir, `${snapshot.snapshotId}.json`);
  const markdownPath = resolve(outputDir, `${snapshot.snapshotId}.md`);
  try {
    const previous = JSON.parse(readFileSync(jsonPath, "utf8"));
    if (validateRemoteSnapshot(previous).length === 0 && previous.semanticFingerprint === snapshot.semanticFingerprint) {
      console.log(`No semantic research changes for ${snapshot.snapshotId}; preserving the existing snapshot.`);
      return snapshot;
    }
  } catch {
    // A missing or malformed previous file is replaced by the validated snapshot below.
  }
  writeFileSync(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  writeFileSync(markdownPath, markdown(snapshot));
  console.log(`Collected ${snapshot.shortlist.length} heuristic model leads from ${sources.filter((source) => source.status === "ok").length}/${sources.length} public source groups.`);
  console.log(`Wrote ${jsonPath} and ${markdownPath}`);
  return snapshot;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await collectAndWrite();
