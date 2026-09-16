import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateBenchmarkResult } from "../tools/benchmark/validate-result.mjs";
import { createEvidenceLink } from "../tools/benchmark/link-artifact.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const fixture = JSON.parse(readFileSync(resolve(root, "packages/evidence-schema/fixtures/benchmark-result.valid.json"), "utf8"));
test("benchmark gate accepts a complete no-network pass", () => assert.equal(validateBenchmarkResult(fixture).status, "pass"));
test("benchmark gate rejects a pass with a network event", () => {
  const result = structuredClone(fixture); result.network.requestCount = 1; result.network.events = [{ kind: "request", timestamp: result.checkedAt, destination: "example.invalid" }];
  assert.throws(() => validateBenchmarkResult(result), /zero network/);
});
test("benchmark gate rejects a pass without measurements", () => {
  const result = structuredClone(fixture); result.latencyMs.warm = null;
  assert.throws(() => validateBenchmarkResult(result), /cold and warm latency/);
});
test("evidence link contains the actual artifact checksum", () => {
  const path = resolve(root, "evidence/runs/.test-benchmark.json");
  mkdirSync(resolve(root, "evidence/runs"), { recursive: true });
  writeFileSync(path, `${JSON.stringify(fixture)}\n`);
  try {
    const link = createEvidenceLink(root, path);
    const expected = `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
    assert.equal(link.artifactChecksum, expected);
  } finally { rmSync(path, { force: true }); }
});
