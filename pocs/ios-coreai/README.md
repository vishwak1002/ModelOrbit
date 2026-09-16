# iOS Core AI POC

The Swift harness is compile-checked locally and is deliberately fail-closed. A device target must supply a candidate admitted by `data/preflight/2026-09-17.json`, an exact device manifest, and the shared fixture before the Core AI adapter may load a model. The host harness emits a blocked result when those inputs are absent; it does not fabricate latency, memory, output, or device evidence.
