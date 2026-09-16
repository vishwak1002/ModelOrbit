# iOS Core AI POC

The Swift harness is compile-checked locally and is deliberately fail-closed. It is parameterized for each verified inventory candidate through `--model-id`, `--revision`, and `--device-manifest`. A device target must supply a candidate admitted by the research preflight, an exact device manifest, and the shared fixture before the Core AI adapter may load a model. The host harness emits a blocked result when those inputs are absent; it does not fabricate latency, memory, output, or device evidence.

Current research status: the three verified candidates are represented in `evidence/runs/research-poc-status.json`, but iOS execution is blocked by the host's Xcode 26.4.1/iOS SDK 26.4 and the absence of a physical iPhone. Apple Core AI model recipes require the iOS 27/Xcode 27 line.
