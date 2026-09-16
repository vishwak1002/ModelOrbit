import test from "node:test";
import assert from "node:assert/strict";
import { parseComparisonRoute } from "../packages/evidence-schema/src/route-state.mjs";

const known = ["openai-community/gpt2", "sentence-transformers/all-MiniLM-L6-v2"];
test("comparison route accepts known models and preserves filters", () => {
  const result = parseComparisonRoute("https://modelorbit.local/?schema=0.2.0&models=openai-community%2Fgpt2%2Csentence-transformers%2Fall-MiniLM-L6-v2&lens=ios&pipeline=text-generation&revision=0123456789abcdef", known);
  assert.equal(result.valid, true); assert.equal(result.state.lens, "ios"); assert.equal(result.state.models.length, 2);
});
test("comparison route rejects unknown models and future schema", () => {
  const result = parseComparisonRoute("https://modelorbit.local/?schema=9.0.0&models=someone%2Fmissing&lens=both&pipeline=all", known);
  assert.equal(result.valid, false); assert.ok(result.errors.some((error) => error.includes("Unsupported"))); assert.ok(result.errors.some((error) => error.includes("unknown model")));
});
