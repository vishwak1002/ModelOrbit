import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const project = resolve(root, "devices/android");
const inventory = JSON.parse(readFileSync(resolve(root, "data/research/mobile-llm-inventory-2026-09-17.json"), "utf8"));
const catalog = JSON.parse(readFileSync(resolve(project, "model-pocs.json"), "utf8"));
const source = ["ModelCatalog.kt", "NativeAdapters.kt", "MainActivity.kt"].map((name) =>
  readFileSync(resolve(project, "app/src/main/java/dev/modelorbit/executorch", name), "utf8")
).join("\n");
const selected = catalog.models.filter((model) => !model.nativeStatus.startsWith("blocked-upstream"));
assert.equal(catalog.platform, "android");
assert.ok(selected.length >= inventory.verifiedIntersection.length);
for (const modelId of inventory.verifiedIntersection) {
  assert.ok(selected.some((model) => model.modelId === modelId), `${modelId} must have an Android POC`);
}
assert.equal(new Set(catalog.models.map((model) => `${model.modelId}@${model.revision}`)).size, catalog.models.length);
for (const model of selected) {
  const record = inventory.records.find((candidate) => candidate.modelId === model.modelId && candidate.revision === model.revision);
  assert.ok(record, `${model.modelId} revision must exist in the inventory`);
  assert.ok(source.includes(model.modelId) && source.includes(model.revision), `${model.modelId} must be wired in Android source`);
  assert.ok(model.requiredFiles.length > 0);
  assert.ok(source.includes(model.adapter), `${model.modelId} adapter must be present`);
}
assert.match(source, /class FixtureAdapter/);
assert.match(source, /"blocked"/);
assert.match(source, /ParakeetModule/);
assert.match(source, /AsrModule/);
assert.match(source, /LlmModule/);
const manifest = readFileSync(resolve(project, "app/src/main/AndroidManifest.xml"), "utf8");
assert.doesNotMatch(manifest, /android\.permission\.INTERNET/);
assert.match(manifest, /MainActivity/);
console.log(JSON.stringify({ status: "pass", mode: "no-weight-project-smoke", checkedModels: selected.map(({ modelId, revision }) => ({ modelId, revision })), nativeInference: "blocked-until-device-assets-and-compatible-aar" }, null, 2));
