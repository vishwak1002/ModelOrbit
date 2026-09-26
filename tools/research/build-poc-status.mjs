import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
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
const projects = {
  ios: { catalog: read("devices/ios/model-pocs.json"), harnessPath: "devices/ios/Sources/NativeAdapters.swift" },
  android: { catalog: read("devices/android/model-pocs.json"), harnessPath: "devices/android/app/src/main/java/dev/modelorbit/executorch/NativeAdapters.kt" },
};
const fixtureIds = { "text-generation": "text-generation/basic-v1", "speech-recognition": "speech-recognition/pcm16k-v1", "vision-language": "vision-language/image-question-v1" };
const lane = (platform, ready, deviceManifest, record) => {
  const project = projects[platform];
  const entry = project.catalog.models.find((model) => model.modelId === record.modelId);
  if (!entry || entry.revision !== record.revision) throw new Error(`${platform} device POC is missing ${record.modelId}@${record.revision}`);
  if (!existsSync(resolve(root, project.harnessPath))) throw new Error(`${platform} device POC has no native adapter source at ${project.harnessPath}`);
  const runtime = entry.runtime ?? (platform === "ios" ? "core-ai" : "executorch");
  const status = ready && !entry.nativeStatus?.startsWith("blocked") ? "unknown" : "blocked";
  const reason = status === "unknown"
    ? "Native source is present; no validated build, exported artifact, or physical-device inference result is recorded."
    : `${entry.nativeStatus ?? "native status unrecorded"}; ${platform === "ios" ? `observed ${deviceManifest?.toolchain?.version ?? "no iPhone toolchain manifest"}` : `observed ${(deviceManifest?.reason ?? "no Android device manifest").replace(/\.$/, "")}`}. No native inference is claimed.`;
  return { runtime, status, harnessPath: project.harnessPath, reason };
};
const records = inventory.pocSelection.map(({ modelId }) => {
  const record = inventory.records.find((entry) => entry.modelId === modelId);
  const result = { pocId: `poc-${modelId.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`, modelId, modelRevision: record.revision, fixtureId: fixtureIds[record.modality ?? "text-generation"] ?? `${record.modality}/basic-v1`, ios: lane("ios", iosReady, ios, record), android: lane("android", androidReady, android, record) };
  assertValid({ schemaVersion: "0.2.0", ...result, generatedAt: inventory.searchedAt }, "research-poc-result");
  return result;
});
const payload = { schemaVersion: "0.2.0", inventoryId: inventory.inventoryId, generatedAt: inventory.searchedAt, records };
assertValid(payload, "research-poc-status");
writeFileSync(resolve(root, "evidence/runs/research-poc-status.json"), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote research POC status for ${records.length} exact candidates; native inference remains unverified.`);
