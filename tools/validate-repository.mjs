import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { assertValid } from "../packages/evidence-schema/src/index.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const json = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const normalized = json("data/normalized/models.json");
if (normalized.records.length !== 26) throw new Error(`Expected 26 normalized records, found ${normalized.records.length}`);
normalized.records.forEach((record) => assertValid(record, "model-record"));
const matrix = json("data/preflight/2026-09-17.json");
assertValid(matrix, "preflight-matrix");
matrix.results.forEach((result) => assertValid(result, "preflight-result"));
if (matrix.results.length !== 52) throw new Error(`Expected 52 preflight results, found ${matrix.results.length}`);
const manifests = json(`data/devices/${readdirSync(resolve(root, "data/devices")).sort().at(-1)}`).manifests;
manifests.forEach((manifest) => assertValid(manifest, "device-manifest"));
assertValid(json("evidence/runs/phase-2-status.json"), "phase-run-status");
console.log(`Validated ${normalized.records.length} model records, ${matrix.results.length} preflight results, ${manifests.length} device manifests, and the phase ledger.`);
