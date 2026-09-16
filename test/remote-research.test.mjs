import test from "node:test";
import assert from "node:assert/strict";
import { buildSnapshot, normalizeHuggingFaceModel, validateRemoteSnapshot } from "../tools/ingest/collect-remote-research.mjs";

const collectedAt = new Date("2026-09-17T00:00:00.000Z");

test("Hugging Face normalization keeps mobile signals and omits raw payloads", () => {
  const model = normalizeHuggingFaceModel({
    id: "org/edge-mobile-llm",
    sha: "0123456789abcdef0123456789abcdef01234567",
    pipeline_tag: "text-generation",
    library_name: "transformers",
    downloads: 1000,
    likes: 10,
    tags: ["executorch", "text-generation"],
    safetensors: { total: 1000000 },
    cardData: { license: "apache-2.0" },
  }, "executorch", collectedAt.toISOString());
  assert.equal(model.modelId, "org/edge-mobile-llm");
  assert.match(model.revision, /^[0-9a-f]{40}$/);
  assert.ok(model.mobileSignals.includes("executorch"));
  assert.equal("rawPayload" in model, false);
  assert.equal(model.parameterCount, 1000000);
});

test("remote snapshot accepts partial public-source failure", () => {
  const snapshot = buildSnapshot({
    collectedAt,
    sources: [
      { sourceId: "huggingface-models", authority: "huggingface", sourceType: "public-model-api", url: "https://huggingface.co/models", status: "ok", itemCount: 0, items: [], observedAt: collectedAt.toISOString() },
      { sourceId: "reddit-localllama-mobile", authority: "reddit", sourceType: "public-community-search", url: "https://www.reddit.com/r/LocalLLaMA", status: "error", itemCount: 0, items: [], observedAt: collectedAt.toISOString(), error: "HTTP 429" },
    ],
  });
  assert.deepEqual(validateRemoteSnapshot(snapshot), []);
  assert.equal(snapshot.shortlist.length, 0);
});

test("remote snapshot rejects an all-source outage", () => {
  const snapshot = buildSnapshot({
    collectedAt,
    sources: [{ sourceId: "source-a", authority: "test", sourceType: "public", url: "https://example.com", status: "error", itemCount: 0, items: [], observedAt: collectedAt.toISOString(), error: "offline" }],
  });
  assert.ok(validateRemoteSnapshot(snapshot).some((error) => error.includes("at least one source must succeed")));
});
