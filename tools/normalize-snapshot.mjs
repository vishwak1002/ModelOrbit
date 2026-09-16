import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const sourcePath = resolve(root, "data/snapshots/2026-09-17-models.tsv");
const outputPath = resolve(root, "data/normalized/models.json");
const source = readFileSync(sourcePath, "utf8");
const checksum = createHash("sha256").update(source).digest("hex");
const snapshotDate = sourcePath.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? "unknown";
const lines = source.split(/\r?\n/).filter((line) => line.split("\t")[0]?.trim());
const [headerLine, ...recordLines] = lines;
const headers = headerLine.split("\t");

const asNumber = (value) => {
  if (value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const records = recordLines.map((line, index) => {
  const values = line.split("\t");
  const sourceRecord = Object.fromEntries(headers.map((header, fieldIndex) => [header, values[fieldIndex] ?? ""]));
  const modelId = sourceRecord.model_id;
  return {
    id: modelId,
    modelId,
    author: sourceRecord.author,
    pipeline: sourceRecord.pipeline_tag || "unknown",
    url: sourceRecord.url,
    parameters: asNumber(sourceRecord.latest_numParameters),
    latestRank: asNumber(sourceRecord.latest_rank),
    daysSeen: asNumber(sourceRecord.days_seen),
    frequencyPct: asNumber(sourceRecord.frequency_pct),
    firstSeen: sourceRecord.first_seen || null,
    lastSeen: sourceRecord.last_seen || null,
    sourceModified: sourceRecord.latest_lastModified || null,
    schemaVersion: "0.2.0",
    revision: null,
    status: "unknown",
    iosStatus: "unknown",
    androidStatus: "unknown",
    evidenceAgeDays: null,
    orbitIndex: index,
  };
});

const payload = {
  schemaVersion: "0.2.0",
  sourceSnapshot: "2026-09-17-models.tsv",
  sourceChecksum: `sha256:${checksum}`,
  generatedAt: snapshotDate === "unknown" ? null : `${snapshotDate}T00:00:00.000Z`,
  statusPolicy: "No readiness is inferred before preflight and device evidence.",
  records,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Normalized ${records.length} model records to ${outputPath}`);
