import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertValid } from "../packages/evidence-schema/src/index.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const normalizedPath = resolve(root, "data/normalized/models.json");
const normalized = JSON.parse(readFileSync(normalizedPath, "utf8"));
const matrixPath = resolve(root, "data/preflight/2026-09-17.json");
const matrix = JSON.parse(readFileSync(matrixPath, "utf8"));
const byModel = new Map();
for (const result of matrix.results) { const entry = byModel.get(result.modelId) ?? {}; entry[result.platform] = result; byModel.set(result.modelId, entry); }
const overall = (ios, android) => {
  if (ios?.status === "device-tested" && android?.status === "device-tested") return "cross-platform-ready";
  if ([ios?.status, android?.status].includes("failed")) return "failed";
  if ([ios?.status, android?.status].includes("partial")) return "partial";
  if ([ios?.status, android?.status].includes("blocked")) return "blocked";
  if (ios?.status === "eligible" && android?.status === "eligible") return "exported";
  return "unknown";
};
normalized.schemaVersion = "0.2.0";
// Keep the generated read model reproducible from the immutable snapshot.
normalized.generatedAt = normalized.generatedAt ?? `${normalized.sourceSnapshot.slice(0, 10)}T00:00:00.000Z`;
normalized.records = normalized.records.map((record) => {
  const evidence = byModel.get(record.id) ?? {};
  const iosStatus = evidence.ios?.status ?? "unknown"; const androidStatus = evidence.android?.status ?? "unknown";
  const updated = { ...record, schemaVersion: "0.2.0", status: overall({ status: iosStatus === "eligible" ? "eligible" : iosStatus }, { status: androidStatus === "eligible" ? "eligible" : androidStatus }), iosStatus, androidStatus, preflight: { ios: evidence.ios?.reason ?? "No iOS preflight record.", android: evidence.android?.reason ?? "No Android preflight record." }, evidence: [], statusReason: evidence.ios?.reason === evidence.android?.reason ? evidence.ios.reason : `iOS: ${evidence.ios?.reason ?? "unknown"}; Android: ${evidence.android?.reason ?? "unknown"}` };
  return assertValid(updated, "model-record");
});
normalized.readModelChecksum = `sha256:${createHash("sha256").update(JSON.stringify(normalized.records)).digest("hex")}`;
writeFileSync(normalizedPath, `${JSON.stringify(normalized, null, 2)}\n`);
console.log(`Built validated read model for ${normalized.records.length} records (${normalized.readModelChecksum}).`);
