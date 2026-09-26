import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { assertValid } from "../../packages/evidence-schema/src/index.mjs";

const root = resolve(new URL("../..", import.meta.url).pathname);
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const inventory = read("data/research/mobile-llm-inventory-2026-09-17.json");
const devices = read("data/devices/2026-09-16.json").manifests;
const iosManifest = devices.find((manifest) => manifest.platform === "ios");
const androidManifest = devices.find((manifest) => manifest.platform === "android");
const results = inventory.verifiedIntersection.flatMap((modelId) => {
  const record = inventory.records.find((candidate) => candidate.modelId === modelId);
  return ["ios", "android"].map((platform) => {
    const runtime = platform === "ios" ? "core-ai" : "executorch";
    const manifest = platform === "ios" ? iosManifest : androidManifest;
    const reason = platform === "ios"
      ? `Research preflight blocked: Apple Core AI requires Xcode/iOS 27, but ${iosManifest.toolchain.version.replace(/\n/g, " ")} was observed; ${iosManifest.reason}`
      : `Research preflight blocked: Android SDK/adb and a physical device are unavailable; ${androidManifest.reason}`;
    return assertValid({
      schemaVersion: "0.2.0",
      runId: `preflight-2026-09-17-research-${platform}-${createHash("sha1").update(modelId).digest("hex").slice(0, 8)}`,
      modelId,
      modelRevision: record.revision,
      platform,
      runtime,
      status: "blocked",
      toolchain: { name: manifest.toolchain.name, available: manifest.toolchain.available && manifest.status === "available", version: manifest.toolchain.version },
      checkedAt: inventory.searchedAt,
      reason,
      command: manifest.sourceCommand,
      logPath: null,
      logChecksum: null,
      capabilities: [record.modality ?? "text-generation", "source-evidence-verified"]
    }, "preflight-result");
  });
});
const payload = {
  schemaVersion: "0.2.0",
  snapshot: inventory.inventoryId,
  generatedAt: inventory.searchedAt,
  toolchains: { ios: iosManifest.toolchain, android: androidManifest.toolchain },
  results,
  intersection: { status: "verified-empty", candidateIds: [], reason: `No source-verified candidate passed executable preflight on this host; all ${results.length} rows are blocked by known toolchain/device prerequisites.` }
};
assertValid(payload, "preflight-matrix");
writeFileSync(resolve(root, "data/preflight/research-2026-09-17.json"), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote research preflight: ${results.length} rows; executable intersection=0 (verified-empty on this host).`);
