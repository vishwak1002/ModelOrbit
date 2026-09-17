import test from "node:test";
import assert from "node:assert/strict";
import { assertValid } from "../packages/evidence-schema/src/index.mjs";
import { runFixture } from "../pocs/cross-platform-adapter/runner.mjs";

test("cross-platform fixture emits blocked results for both native strategy boundaries", async () => {
  const result = await runFixture({ modelId: "Qwen/Qwen3-0.6B", prompt: "test prompt", platform: "both" });
  assertValid(result, "poc-fixture-run");
  assert.deepEqual(result.results.map((entry) => entry.platform), ["ios", "android"]);
  assert.ok(result.results.every((entry) => entry.status === "blocked"));
});
