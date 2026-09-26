import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertValid, loadSchema, validate } from "../packages/evidence-schema/src/index.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const inventory = read("data/research/mobile-llm-inventory-2026-09-17.json");
const pocStatus = read("evidence/runs/research-poc-status.json");
const preflight = read("data/preflight/research-2026-09-17.json");

test("research inventory is valid and its exact intersection is derived from verified records", () => {
  assert.doesNotThrow(() => assertValid(inventory, "research-inventory"));
  const verified = inventory.records.filter((record) => record.disposition === "verified").map((record) => record.modelId).sort();
  assert.deepEqual(verified, [...inventory.verifiedIntersection].sort());
  assert.ok(verified.length > 0);
});

test("verified candidates require one immutable revision and two verified runtime lanes", () => {
  for (const record of inventory.records.filter((candidate) => candidate.disposition === "verified")) {
    assert.match(record.revision, /^[0-9a-f]{7,64}$/);
    assert.equal(record.runtimeSupport.find((lane) => lane.platform === "ios")?.status, "verified");
    assert.equal(record.runtimeSupport.find((lane) => lane.platform === "android")?.status, "verified");
  }
  const invalid = structuredClone(inventory);
  invalid.records[0].revision = "not-a-revision";
  assert.ok(validate(invalid, loadSchema("research-inventory")).some((error) => error.includes("revision")));
});

test("deduplication preserves the exported repository identity without adding a candidate", () => {
  const variant = inventory.records.find((record) => record.disposition === "deduplicated-variant");
  assert.ok(variant);
  assert.notEqual(variant.modelId, variant.canonicalModelId);
  assert.equal(inventory.verifiedIntersection.includes(variant.modelId), false);
});

test("research preflight is explicit and fail-closed", () => {
  assert.doesNotThrow(() => assertValid(preflight, "preflight-matrix"));
  assert.equal(preflight.results.length, inventory.verifiedIntersection.length * 2);
  assert.ok(preflight.results.every((result) => result.status === "blocked"));
  for (const result of preflight.results) {
    const record = inventory.records.find((candidate) => candidate.modelId === result.modelId);
    assert.equal(result.runtime, record.runtimeSupport.find((lane) => lane.platform === result.platform && lane.status === "verified")?.runtime);
  }
  assert.equal(preflight.intersection.status, "verified-empty");
});

test("research POC status covers every verified candidate without fabricating measurements", () => {
  assert.doesNotThrow(() => assertValid(pocStatus, "research-poc-status"));
  assert.deepEqual(pocStatus.records.map((record) => record.modelId).sort(), inventory.pocSelection.map((record) => record.modelId).sort());
  assert.ok(pocStatus.records.every((record) => record.ios.status === "blocked" && record.android.status === "blocked"));
  assert.ok(pocStatus.records.every((record) => record.ios.artifactPath === undefined && record.android.artifactPath === undefined));
});

test("existing ledger retains unknown, blocked, and zero-run semantics", () => {
  const ledger = read("evidence/runs/phase-2-status.json");
  const devices = read("data/devices/2026-09-16.json").manifests;
  assert.equal(ledger.pocSelection.status, "unknown");
  assert.ok(devices.some((manifest) => manifest.status === "blocked"));
  assert.ok(devices.some((manifest) => manifest.status === "unknown"));
  assert.equal(ledger.counts.deviceRunsStarted, 0);
  assert.equal(ledger.counts.deviceRunsPassed, 0);
});
