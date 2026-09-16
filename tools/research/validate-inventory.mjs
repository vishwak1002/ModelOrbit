import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertValid } from "../../packages/evidence-schema/src/index.mjs";

const root = resolve(new URL("../..", import.meta.url).pathname);
const inventory = JSON.parse(readFileSync(resolve(root, "data/research/mobile-llm-inventory-2026-09-17.json"), "utf8"));
assertValid(inventory, "research-inventory");
const byId = new Map(inventory.records.map((record) => [record.modelId, record]));
if (byId.size !== inventory.records.length) throw new Error("Research inventory contains duplicate exact model IDs.");
const verified = inventory.records.filter((record) => record.disposition === "verified");
const verifiedIds = verified.map((record) => record.modelId).sort();
if (JSON.stringify(verifiedIds) !== JSON.stringify([...inventory.verifiedIntersection].sort())) throw new Error("Verified intersection must exactly equal verified inventory records.");
for (const record of verified) {
  if (!record.revision) throw new Error(`${record.modelId} is verified without an immutable HF revision.`);
  for (const platform of ["ios", "android"]) {
    const lane = record.runtimeSupport.find((entry) => entry.platform === platform);
    if (!lane || lane.status !== "verified") throw new Error(`${record.modelId} is verified without verified ${platform} evidence.`);
  }
}
for (const record of inventory.records.filter((entry) => entry.disposition === "deduplicated-variant")) {
  if (record.modelId === record.canonicalModelId) throw new Error(`${record.modelId} is marked as a variant of itself.`);
}
console.log(`Validated ${inventory.records.length} research records; verified intersection=${verified.length}; claimed=${inventory.records.filter((r) => r.disposition === "claimed-but-unverified").length}; excluded=${inventory.records.filter((r) => r.disposition === "excluded").length}; variants=${inventory.records.filter((r) => r.disposition === "deduplicated-variant").length}.`);
