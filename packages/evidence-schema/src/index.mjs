import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const schemaDir = resolve(dirname(fileURLToPath(import.meta.url)), "../schemas");
export const SCHEMA_VERSION = "0.2.0";
export const schemaNames = ["model-record", "preflight-result", "device-manifest", "benchmark-result", "evidence-link", "comparison-route-state", "research-inventory", "research-poc-result", "research-poc-status", "poc-fixture-run"];
export const loadSchema = (name) => JSON.parse(readFileSync(resolve(schemaDir, `${name}.schema.json`), "utf8"));

const typeMatches = (value, type) => type === "null" ? value === null : type === "integer" ? Number.isInteger(value) : type === "number" ? typeof value === "number" && Number.isFinite(value) : type === "array" ? Array.isArray(value) : type === "object" ? value !== null && typeof value === "object" && !Array.isArray(value) : typeof value === type;
const formatMatches = (value, format) => format === "uri" ? /^https?:\/\/[^\s]+$/.test(value) : format === "date" ? /^\d{4}-\d{2}-\d{2}$/.test(value) : format === "date-time" ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) : true;

export function validate(value, schema, path = "$", root = schema) {
  const errors = [];
  if (schema.$ref) {
    const target = schema.$ref.replace("#/$defs/", "");
    return validate(value, root.$defs?.[target] ?? {}, path, root);
  }
  if (schema.const !== undefined && value !== schema.const) errors.push(`${path} must equal ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path} must be one of ${schema.enum.join(", ")}`);
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (types.length && !types.some((type) => typeMatches(value, type))) errors.push(`${path} has invalid type`);
  if (typeof value === "string") {
    if (schema.minLength && value.length < schema.minLength) errors.push(`${path} is too short`);
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) errors.push(`${path} does not match ${schema.pattern}`);
    if (schema.format && !formatMatches(value, schema.format)) errors.push(`${path} has invalid ${schema.format}`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path} is below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path} is above maximum`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path} has too few items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path} has too many items`);
    if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) errors.push(`${path} must be unique`);
    value.forEach((item, index) => errors.push(...validate(item, schema.items ?? {}, `${path}[${index}]`, root)));
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of schema.required ?? []) if (!(key in value)) errors.push(`${path}.${key} is required`);
    if (schema.additionalProperties === false) for (const key of Object.keys(value)) if (!schema.properties?.[key]) errors.push(`${path}.${key} is not allowed`);
    for (const [key, child] of Object.entries(schema.properties ?? {})) if (key in value) errors.push(...validate(value[key], child, `${path}.${key}`, root));
  }
  return errors;
}

export function assertValid(value, name) {
  const errors = validate(value, loadSchema(name));
  if (errors.length) throw new Error(`${name} validation failed:\n${errors.join("\n")}`);
  return value;
}
