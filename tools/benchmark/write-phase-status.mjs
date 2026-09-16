import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertValid } from "../../packages/evidence-schema/src/index.mjs";

const root = resolve(new URL("../..", import.meta.url).pathname);
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const matrix = read("data/preflight/2026-09-17.json");
const deviceFile = readdirSync(resolve(root, "data/devices")).filter((file) => file.endsWith(".json")).sort().at(-1);
const devices = read(`data/devices/${deviceFile}`);
const payload = { schemaVersion: "0.2.0", runId: `phase-2-${new Date().toISOString()}`, generatedAt: new Date().toISOString(), deviceManifests: devices.manifests.map((manifest) => manifest.manifestId), pocSelection: matrix.intersection, counts: { modelsSeen: 26, iosEligible: matrix.results.filter((result) => result.platform === "ios" && result.status === "eligible").length, androidEligible: matrix.results.filter((result) => result.platform === "android" && result.status === "eligible").length, intersection: matrix.intersection.candidateIds.length, deviceRunsStarted: 0, deviceRunsPassed: 0 } };
assertValid(payload, "phase-run-status");
mkdirSync(resolve(root, "evidence/runs"), { recursive: true });
writeFileSync(resolve(root, "evidence/runs/phase-2-status.json"), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote phase status: ${payload.pocSelection.status}; POC candidates=${payload.pocSelection.candidateIds.length}; device runs=${payload.counts.deviceRunsStarted}.`);
