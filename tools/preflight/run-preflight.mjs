import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertValid, validate, loadSchema } from "../../packages/evidence-schema/src/index.mjs";

const root = resolve(new URL("../..", import.meta.url).pathname);
const outputDir = resolve(root, "data/preflight");
const snapshot = JSON.parse(readFileSync(resolve(root, "data/normalized/models.json"), "utf8"));
const checkedAt = new Date().toISOString();
const day = snapshot.sourceSnapshot.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? checkedAt.slice(0, 10);
const commandVersion = (command, args, unavailable) => { try { return execFileSync(command, args, { encoding: "utf8", timeout: 5000, stdio: ["ignore", "pipe", "pipe"] }).trim().split(/\r?\n/).slice(0, 2).join(" | "); } catch { return unavailable; } };
const toolchains = {
  ios: { name: "Xcode/Core AI export adapter", available: commandVersion("xcodebuild", ["-version"], "unavailable") !== "unavailable", version: commandVersion("xcodebuild", ["-version"], "unavailable") },
  android: { name: "Android SDK/ExecuTorch export adapter", available: commandVersion("adb", ["--version"], "unavailable") !== "unavailable", version: commandVersion("adb", ["--version"], "unavailable") },
};
const supportedPipelines = { ios: new Set(["text-generation", "sentence-similarity"]), android: new Set(["text-generation", "sentence-similarity"]) };
const resultFor = (model, platform) => {
  const toolchain = toolchains[platform];
  const runtime = platform === "ios" ? "core-ai" : "executorch";
  let status = "unknown";
  let reason = "";
  if (!supportedPipelines[platform].has(model.pipeline)) { status = "blocked"; reason = `Pipeline ${model.pipeline} has no ${runtime} adapter in this phase.`; }
  else if (!toolchain.available) reason = `${toolchain.name} was not available on this host; no export was attempted.`;
  else if (!model.revision) reason = "Immutable Hugging Face revision is not present in the dated snapshot; export was not attempted.";
  else reason = "No export adapter was run for this record; readiness cannot be inferred from metadata or parameter count.";
  return assertValid({ schemaVersion: "0.2.0", runId: `preflight-${day}-${platform}-${createHash("sha1").update(model.id).digest("hex").slice(0, 8)}`, modelId: model.id, modelRevision: model.revision, platform, runtime, status, toolchain, checkedAt, reason, command: null, logPath: null, logChecksum: null, capabilities: [] }, "preflight-result");
};
const results = snapshot.records.flatMap((model) => [resultFor(model, "ios"), resultFor(model, "android")]);
const eligibleBy = (platform) => new Map(results.filter((result) => result.platform === platform && result.status === "eligible" && result.modelRevision).map((result) => [result.modelId, result.modelRevision]));
const ios = eligibleBy("ios"); const android = eligibleBy("android");
const candidateIds = [...ios].filter(([id, revision]) => android.get(id) === revision).map(([id]) => id);
const hasUnknown = results.some((result) => result.status === "unknown");
const intersection = { status: candidateIds.length ? "ready" : hasUnknown ? "unknown" : "verified-empty", candidateIds, reason: candidateIds.length ? "Same repository and immutable revision is eligible on both lanes." : hasUnknown ? "The eligible intersection is not yet knowable because one or more records or toolchains are unknown." : "Every record has a reproducible non-eligible result on at least one lane." };
const matrix = { schemaVersion: "0.2.0", snapshot: snapshot.sourceSnapshot, generatedAt: checkedAt, toolchains, results, intersection };
const matrixErrors = validate(matrix, loadSchema("preflight-matrix"));
if (matrixErrors.length) throw new Error(matrixErrors.join("\n"));
mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, `${day}.json`), `${JSON.stringify(matrix, null, 2)}\n`);
console.log(`Preflighted ${snapshot.records.length} models x 2 lanes; iOS eligible=${ios.size}, Android eligible=${android.size}, intersection=${candidateIds.length} (${intersection.status}).`);
