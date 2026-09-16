export const SCHEMA_VERSION = "0.2.0";

export function parseComparisonRoute(input, knownModelIds = []) {
  const url = new URL(input, "https://modelorbit.local/");
  const rawModels = url.searchParams.get("models")?.split(",").filter(Boolean) ?? [];
  const state = { schemaVersion: url.searchParams.get("schema") ?? SCHEMA_VERSION, models: [...new Set(rawModels)], lens: url.searchParams.get("lens") ?? "both", pipeline: url.searchParams.get("pipeline") ?? "all", revision: url.searchParams.get("revision") || null };
  const errors = [];
  if (state.schemaVersion !== SCHEMA_VERSION) errors.push(`Unsupported comparison schema ${state.schemaVersion}`);
  if (!state.models.length || state.models.length > 3) errors.push("Comparison requires between 1 and 3 model IDs");
  if (!["both", "all", "ios", "android"].includes(state.lens)) errors.push(`Invalid lens ${state.lens}`);
  if (!state.pipeline) errors.push("Pipeline is required");
  if (state.revision && !/^[0-9a-f]{7,64}$/.test(state.revision)) errors.push("Revision must be an immutable hexadecimal commit");
  if (new Set(state.models).size !== state.models.length) errors.push("Comparison model IDs must be unique");
  if (state.models.some((modelId) => !/^[^/]+\/.+/.test(modelId))) errors.push("Model IDs must be Hugging Face repository IDs");
  for (const modelId of state.models) if (knownModelIds.length && !knownModelIds.includes(modelId)) errors.push(`$.models contains unknown model ${modelId}`);
  return errors.length ? { valid: false, state, errors } : { valid: true, state, errors: [] };
}
