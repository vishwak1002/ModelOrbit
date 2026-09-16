# Evidence capture

Capture exact device manifests, canonical task output, cold and warm latency, peak memory, network events, tool versions, and checksums. A cancelled or partial run remains visible as incomplete evidence.

Platform runners emit a benchmark JSON into `evidence/runs/`. Validate it with `npm run benchmark:validate -- evidence/runs/<run>.json`; a `pass` is rejected unless output validity, output checksum, cold/warm latency, peak memory, and zero network events are all present. Then run `node tools/benchmark/link-artifact.mjs evidence/runs/<run>.json` to create the checksum-bearing evidence link beside it.
