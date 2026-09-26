import test from "node:test";
import assert from "node:assert/strict";
import { assertValid } from "../packages/evidence-schema/src/index.mjs";
import { runFixture } from "../pocs/cross-platform-adapter/runner.mjs";

test("cross-platform fixture emits blocked results for both native strategy boundaries", async () => {
  const result = await runFixture({ modelId: "nvidia/parakeet-tdt-0.6b-v3", prompt: "audio fixture: 16 kHz mono sample", platform: "both" });
  assertValid(result, "poc-fixture-run");
  assert.equal(result.modality, "speech-recognition");
  assert.equal(result.fixtureId, "speech-recognition-pcm16k-v1");
  assert.deepEqual(result.results.map((entry) => entry.platform), ["ios", "android"]);
  assert.ok(result.results.every((entry) => entry.status === "blocked"));
});
