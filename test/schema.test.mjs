import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertValid, loadSchema, schemaNames, validate } from "../packages/evidence-schema/src/index.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
for (const name of schemaNames) test(`${name} fixture validates`, () => assert.doesNotThrow(() => assertValid(JSON.parse(readFileSync(resolve(root, `packages/evidence-schema/fixtures/${name}.valid.json`), "utf8")), name)));
test("invalid model status is rejected", () => {
  const fixture = JSON.parse(readFileSync(resolve(root, "packages/evidence-schema/fixtures/model-record.valid.json"), "utf8"));
  fixture.status = "ready";
  assert.ok(validate(fixture, loadSchema("model-record")).length > 0);
});
test("additional properties are rejected", () => {
  const fixture = JSON.parse(readFileSync(resolve(root, "packages/evidence-schema/fixtures/evidence-link.valid.json"), "utf8"));
  fixture.secret = "must not enter evidence";
  assert.ok(validate(fixture, loadSchema("evidence-link")).some((error) => error.includes("secret")));
});
