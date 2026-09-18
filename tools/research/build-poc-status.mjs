import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertValid } from "../../packages/evidence-schema/src/index.mjs";

const root = resolve(new URL("../..", import.meta.url).pathname);
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const inventory = read("data/research/mobile-llm-inventory-2026-09-17.json");
const deviceFile = readdirSync(resolve(root, "data/devices")).filter((file) => file.endsWith(".json")).sort().at(-1);
const devices = read(`data/devices/${deviceFile}`).manifests;
const device = (platform) => devices.find((manifest) => manifest.platform === platform);
const ios = device("ios"); const android = device("android");
const iosReady = ios?.status === "available" && /Xcode 27/i.test(ios.toolchain.version);
const androidReady = android?.status === "available" && android.toolchain.available;
const lane = (platform, runtime, ready, manifest, modality) => {
  const nativeHarness = platform === "ios" ? "pocs/ios-coreai/main.swift" : "pocs/android-executorch/Main.kt";
  const harnessPath = modality === "text-generation" ? nativeHarness : "pocs/cross-platform-adapter/runner.mjs";
  return ready
    ? { runtime, status: "built", harnessPath, reason: "Parameterized harness is admitted; physical benchmark must still emit a validated result." }
    : { runtime, status: "blocked", harnessPath, reason: platform === "ios" ? `Core AI POC blocked: requires Xcode/iOS 27 and an available physical iPhone; observed ${manifest?.toolchain?.version ?? "no manifest"}.` : `ExecuTorch POC blocked: requires Android SDK/adb and an available physical Android device; observed ${(manifest?.reason ?? "no manifest").replace(/\.$/, "")}.` };
};
const records = inventory.pocSelection.map(({ modelId }) => {
  const record = inventory.records.find((entry) => entry.modelId === modelId);
  const result = { pocId: `poc-${modelId.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`, modelId, modelRevision: record.revision, fixtureId: "text-generation/basic-v1", ios: lane("ios", "core-ai", iosReady, ios, record.modality), android: lane("android", "executorch", androidReady, android, record.modality) };
  assertValid({ schemaVersion: "0.2.0", ...result, generatedAt: inventory.searchedAt }, "research-poc-result");
  return result;
});
const payload = { schemaVersion: "0.2.0", inventoryId: inventory.inventoryId, generatedAt: inventory.searchedAt, records };
assertValid(payload, "research-poc-status");
writeFileSync(resolve(root, "evidence/runs/research-poc-status.json"), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote research POC status for ${records.length} exact candidates: iOS ${iosReady ? "built" : "blocked"}, Android ${androidReady ? "built" : "blocked"}.`);
