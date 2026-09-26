import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadModelRegistry, resolveRegistryModel } from "../../tools/research/model-registry.mjs";

const root = resolve(new URL("../..", import.meta.url).pathname);
const platforms = {
  ios: { runtime: "core-ai", boundary: "Core AI/Core ML-compatible export on a physical iPhone" },
  android: { runtime: "executorch", boundary: "ExecuTorch .pte export on a physical Android device" },
};

export class ModelAdapterStrategy {
  constructor(platform, runtime) {
    this.platform = platform;
    this.runtime = runtime;
  }

  async generate() {
    throw new Error("ModelAdapterStrategy.generate must be implemented by a platform adapter.");
  }
}

export class FixtureAdapterStrategy extends ModelAdapterStrategy {
  async generate({ model, prompt }) {
    const boundary = platforms[this.platform].boundary;
    return {
      platform: this.platform,
      runtime: this.runtime,
      modality: model.modality,
      status: "blocked",
      responseText: `[fixture:${model.modality}] ${model.modelId} received fixture input: ${prompt}`,
      reason: `Mock adapter only. Replace with a ${boundary} and the modality-specific input path; this run contains no device quality, latency, memory, or network evidence.`,
    };
  }
}

export async function runFixture({ modelId, prompt, platform = "both", inventoryPath } = {}) {
  const registry = loadModelRegistry(inventoryPath);
  const model = resolveRegistryModel(modelId ?? registry.records[0]?.modelId, registry);
  const fixtureIds = { "text-generation": "text-generation-basic-v1", "speech-recognition": "speech-recognition-pcm16k-v1", "vision-language": "vision-language-image-question-v1" };
  const fixtureInput = prompt ?? (model.modality === "speech-recognition" ? "16 kHz mono PCM fixture; no waveform loaded" : "Explain why immutable model revisions matter for mobile POCs.");
  const selectedPlatforms = platform === "both" ? Object.keys(platforms) : [platform];
  if (selectedPlatforms.some((candidate) => !platforms[candidate])) throw new Error(`Unsupported platform: ${platform}`);
  const results = await Promise.all(selectedPlatforms.map((candidate) => new FixtureAdapterStrategy(candidate, platforms[candidate].runtime).generate({ model, prompt: fixtureInput })));
  return {
    schemaVersion: "0.2.0",
    runId: `poc-fixture-${model.modelId.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${model.revision.slice(0, 8)}`,
    mode: "fixture",
    modelId: model.modelId,
    modelRevision: model.revision,
    modality: model.modality,
    sourceInventoryId: registry.sourceInventoryId,
    fixtureId: fixtureIds[model.modality] ?? `${model.modality}-basic-v1`,
    prompt: fixtureInput,
    status: "blocked",
    results,
    limitations: ["Fixture output is deterministic adapter plumbing, not a model response.", "Native POCs must attach device manifests, exported artifacts, and validated benchmark evidence before status can become pass."],
  };
}

function parseArgs(args) {
  const options = { modelId: "Qwen/Qwen3-0.6B", platform: "both" };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--model-id") options.modelId = args[++index];
    else if (args[index] === "--platform") options.platform = args[++index];
    else if (args[index] === "--prompt") options.prompt = args[++index];
    else if (args[index] === "--output") options.output = args[++index];
    else if (args[index] === "--mock") options.mode = "fixture";
    else throw new Error(`Unknown argument: ${args[index]}`);
  }
  return options;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const options = parseArgs(process.argv.slice(2));
  const result = await runFixture(options);
  const output = `${JSON.stringify(result, null, 2)}\n`;
  if (options.output) writeFileSync(resolve(root, options.output), output);
  process.stdout.write(output);
}
