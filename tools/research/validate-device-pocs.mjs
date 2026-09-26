import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const inventory = read("data/research/mobile-llm-inventory-2026-09-17.json");
const platforms = {
  ios: {
    manifest: "devices/ios/model-pocs.json",
    catalog: "devices/ios/Sources/ModelCatalog.swift",
    adapter: "devices/ios/Sources/NativeAdapters.swift",
    projectFile: "devices/ios/ModelOrbitDevices.xcodeproj/project.pbxproj",
  },
  android: {
    manifest: "devices/android/model-pocs.json",
    catalog: "devices/android/app/src/main/java/dev/modelorbit/executorch/ModelCatalog.kt",
    adapter: "devices/android/app/src/main/java/dev/modelorbit/executorch/NativeAdapters.kt",
    projectFile: "devices/android/app/build.gradle.kts",
  },
};

for (const [platform, paths] of Object.entries(platforms)) {
  for (const path of Object.values(paths)) {
    if (!existsSync(resolve(root, path))) throw new Error(`${platform} POC is missing ${path}`);
  }
  const manifest = read(paths.manifest);
  if (manifest.platform !== platform || !Array.isArray(manifest.models)) throw new Error(`${platform} POC manifest is malformed.`);
  if (!existsSync(resolve(root, manifest.project))) throw new Error(`${platform} project does not exist: ${manifest.project}`);
  const catalog = readFileSync(resolve(root, paths.catalog), "utf8");
  const adapter = readFileSync(resolve(root, paths.adapter), "utf8");
  const projectFile = readFileSync(resolve(root, paths.projectFile), "utf8");
  if (platform === "ios" && !projectFile.includes("NativeAdapters.swift in Sources")) throw new Error("iOS native adapter is not in the Xcode target.");
  if (platform === "android" && !projectFile.includes("com.android.application")) throw new Error("Android app module is not configured.");
  const seen = new Set();
  for (const model of manifest.models) {
    const record = inventory.records.find((entry) => entry.modelId === model.modelId);
    if (!record || model.revision !== record.revision) throw new Error(`${platform} POC has an unknown or mismatched revision: ${model.modelId}@${model.revision}`);
    const key = `${model.modelId}@${model.revision}`;
    if (seen.has(key)) throw new Error(`${platform} POC repeats ${key}`);
    seen.add(key);
    if (!model.nativeStatus || !catalog.includes(model.modelId) || !catalog.includes(model.revision)) throw new Error(`${platform} catalog does not identify ${key} and its status.`);
  }
  for (const modelId of inventory.verifiedIntersection) {
    const record = inventory.records.find((entry) => entry.modelId === modelId);
    const model = manifest.models.find((entry) => entry.modelId === modelId && entry.revision === record.revision);
    if (!model) throw new Error(`${platform} project has no verified POC for ${modelId}@${record.revision}`);
    const modality = record.modality ?? "text-generation";
    const route = platform === "ios" ? modelId : modality === "text-generation" ? "runText" : "runSpeech";
    if (!adapter.includes(route)) throw new Error(`${platform} native adapter has no ${modality} route for ${modelId}`);
    if (platform === "ios" && (!model.adapterSource || !existsSync(resolve(root, model.adapterSource)))) throw new Error(`iOS adapter source is missing for ${modelId}`);
    if (platform === "android" && !model.adapter) throw new Error(`Android native adapter is missing for ${modelId}`);
  }
}

console.log(`Validated ${inventory.verifiedIntersection.length} source-verified device POC routes in the iOS and Android projects.`);
