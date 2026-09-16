import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertValid } from "../../packages/evidence-schema/src/index.mjs";

export function validateBenchmarkResult(result) {
  assertValid(result, "benchmark-result");
  const failures = [];
  if (result.status === "pass") {
    if (!result.output.valid || !result.output.checksum) failures.push("pass requires valid output and an output checksum");
    if (result.latencyMs.cold === null || result.latencyMs.warm === null) failures.push("pass requires cold and warm latency");
    if (result.peakMemoryBytes === null) failures.push("pass requires peak memory");
    if (result.network.requestCount !== 0 || result.network.events.length !== 0) failures.push("pass requires zero network requests and events");
  }
  if (result.network.allowed) failures.push("network must remain disabled for every benchmark");
  if (failures.length) throw new Error(`benchmark gate failed:\n${failures.join("\n")}`);
  return { runId: result.runId, status: result.status, modelId: result.modelId, platform: result.platform, networkRequests: result.network.requestCount };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: node tools/benchmark/validate-result.mjs <benchmark-result.json>");
  const result = JSON.parse(readFileSync(path, "utf8"));
  console.log(JSON.stringify(validateBenchmarkResult(result), null, 2));
}
