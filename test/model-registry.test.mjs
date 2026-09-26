import test from "node:test";
import assert from "node:assert/strict";
import { loadModelRegistry } from "../tools/research/model-registry.mjs";

test("model registry is an exact, immutable-revision projection of the inventory", () => {
  const registry = loadModelRegistry();
  assert.equal(registry.records.length, 3);
  assert.deepEqual(registry.records.map((record) => record.modelId), ["nvidia/parakeet-tdt-0.6b-v3", "Qwen/Qwen3-0.6B", "Qwen/Qwen3-1.7B"]);
  assert.deepEqual(registry.records.map((record) => record.selectionRank), [1, 2, 3]);
  assert.equal(new Set(registry.records.map((record) => `${record.modelId}@${record.revision}`)).size, 3);
  assert.ok(registry.records.every((record) => record.runtimes.ios === "core-ai" && record.runtimes.android === "executorch"));
});
