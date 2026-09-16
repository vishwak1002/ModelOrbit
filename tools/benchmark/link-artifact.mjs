import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import { assertValid } from "../../packages/evidence-schema/src/index.mjs";
import { validateBenchmarkResult } from "./validate-result.mjs";

const root = resolve(new URL("../..", import.meta.url).pathname);
export function createEvidenceLink(repositoryRoot, absolutePath) {
  const relativePath = relative(repositoryRoot, absolutePath);
  if (!relativePath.startsWith("evidence/") || relativePath.startsWith("../")) throw new Error("Evidence links may only point to artifacts inside evidence/");
  const result = JSON.parse(readFileSync(absolutePath, "utf8"));
  validateBenchmarkResult(result);
  const checksum = `sha256:${createHash("sha256").update(readFileSync(absolutePath)).digest("hex")}`;
  const link = { schemaVersion: "0.2.0", linkId: `evidence-${result.runId.replace(/^benchmark-/, "").toLowerCase()}`, modelId: result.modelId, modelRevision: result.modelRevision, platform: result.platform, artifactPath: relativePath, artifactChecksum: checksum, createdAt: result.checkedAt, kind: "benchmark-result", reviewer: null };
  return assertValid(link, "evidence-link");
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const artifact = process.argv[2];
  if (!artifact) throw new Error("Usage: node tools/benchmark/link-artifact.mjs <evidence/runs/benchmark.json>");
  const absolutePath = resolve(artifact);
  const link = createEvidenceLink(root, absolutePath);
  mkdirSync(resolve(root, "evidence/runs"), { recursive: true });
  const output = resolve(root, `${relative(root, absolutePath)}.link.json`);
  writeFileSync(output, `${JSON.stringify(link, null, 2)}\n`);
  console.log(JSON.stringify({ ...link, outputPath: relative(root, output) }, null, 2));
}
