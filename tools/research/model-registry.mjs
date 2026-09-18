import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
export const DEFAULT_INVENTORY_PATH = resolve(root, "data/research/mobile-llm-inventory-2026-09-17.json");

export function assetNameForModel(modelId) {
  const name = modelId.split("/").at(-1) ?? modelId;
  return name.toLowerCase().replace(/^qwen3-/, "qwen3_").replaceAll(".", "_").replaceAll("-", "_");
}

export function loadModelRegistry(inventoryPath = DEFAULT_INVENTORY_PATH) {
  const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
  const selectedIds = new Set(inventory.pocSelection.map((candidate) => candidate.modelId));
  const records = inventory.records
    .filter((record) => selectedIds.has(record.modelId) && record.disposition === "verified")
    .map((record) => {
      const selection = inventory.pocSelection?.find((candidate) => candidate.modelId === record.modelId && candidate.revision === record.revision);
      return {
      modelId: record.modelId,
      revision: record.revision,
      assetName: assetNameForModel(record.modelId),
      repositoryUrl: record.repositoryUrl,
      modality: record.modality ?? "text-generation",
      selectionRank: selection?.rank ?? null,
      selectionScore: selection?.score ?? null,
      runtimes: { ios: "core-ai", android: "executorch" },
      };
    })
    .sort((left, right) => (left.selectionRank ?? Number.MAX_SAFE_INTEGER) - (right.selectionRank ?? Number.MAX_SAFE_INTEGER));
  const revisionKeys = records.map((record) => `${record.modelId}@${record.revision}`);
  if (records.length !== selectedIds.size) throw new Error("Model registry does not match the ranked POC selection.");
  if (new Set(revisionKeys).size !== revisionKeys.length) throw new Error("Model registry contains duplicate model revisions.");
  return { sourceInventoryId: inventory.inventoryId, generatedAt: inventory.searchedAt, records };
}

export function resolveRegistryModel(modelId, registry = loadModelRegistry()) {
  const model = registry.records.find((record) => record.modelId === modelId);
  if (!model) throw new Error(`Model is not in the verified registry: ${modelId}`);
  return model;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  console.log(JSON.stringify(loadModelRegistry(), null, 2));
}
