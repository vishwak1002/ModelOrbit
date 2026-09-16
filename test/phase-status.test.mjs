import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertValid } from "../packages/evidence-schema/src/index.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
test("phase ledger is validated and records no fabricated device run", () => {
  const ledger = JSON.parse(readFileSync(resolve(root, "evidence/runs/phase-2-status.json"), "utf8"));
  assert.doesNotThrow(() => assertValid(ledger, "phase-run-status"));
  assert.equal(ledger.counts.deviceRunsStarted, 0);
  assert.equal(ledger.counts.deviceRunsPassed, 0);
  assert.equal(ledger.pocSelection.status, "unknown");
});
