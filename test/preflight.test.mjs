import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertValid } from "../packages/evidence-schema/src/index.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const matrix = JSON.parse(readFileSync(resolve(root, "data/preflight/2026-09-17.json"), "utf8"));
test("preflight covers all 26 models on both lanes", () => { assert.equal(matrix.results.length, 52); assert.equal(new Set(matrix.results.map((result) => result.modelId)).size, 26); });
test("preflight outcomes are explicit and never parameter-derived", () => { for (const result of matrix.results) { assert.ok(["eligible", "blocked", "failed", "unknown"].includes(result.status)); assert.ok(result.reason.length > 0); } assert.ok(matrix.results.some((result) => result.status === "blocked")); assert.ok(matrix.results.some((result) => result.status === "unknown")); });
test("current intersection is honest", () => { assert.equal(matrix.intersection.candidateIds.length, 0); assert.equal(matrix.intersection.status, "unknown"); assert.match(matrix.intersection.reason, /unknown|knowable/i); });
test("checked-in results satisfy their schema", () => matrix.results.forEach((result) => assert.doesNotThrow(() => assertValid(result, "preflight-result"))));
