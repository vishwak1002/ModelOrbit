# ModelOrbit

ModelOrbit is an open-source research workspace for answering one question:

> Which exact open-source model revisions can run on both an iPhone and an Android phone?

The first interface is a visual model galaxy backed by an evidence ledger. Phase 1 uses Apple Core AI for iOS and ExecuTorch for Android, then admits a model to the POC lane only when the same Hugging Face repository and immutable revision pass both lanes.

## Current status

Design and engineering reviews are complete. The executable schema/preflight/device-detection phase and benchmark evidence gate are checked in. The dated mobile-LLM discovery contains 18 scoped records: 6 verified exact cross-platform candidates, 7 claimed-but-unverified records, 4 exclusions, and 1 deduplicated artifact variant. The ranked POC selection is three new multimodal/audio candidates—Parakeet TDT v3, Qwen3-VL 2B, and Whisper large-v3-turbo—while the earlier Qwen3 text revisions remain in the verified intersection. All native runs remain blocked on this host because Xcode/iOS 27 and physical devices are unavailable, and Android SDK/ADB/device prerequisites are absent.

Read the [MVP plan](docs/mvp-plan.md) and [handoff](docs/handoff.md) before changing scope.

## Repository map

- `apps/galaxy-web`: read-only galaxy, evidence inspector, filters, and comparisons.
- `packages/evidence-schema`: versioned JSON Schemas and validators.
- `packages/model-data`: snapshots, normalization, and status reduction.
- `pocs/ios-coreai`: iOS Core AI prototype.
- `pocs/android-executorch`: Android ExecuTorch prototype.
- `pocs/cross-platform-adapter`: runnable no-weight adapter-strategy fixture POC for both native lanes.
- `tools/preflight`: cross-platform export eligibility matrix.
- `tools/research`: mobile-LLM inventory validation, research preflight, and POC status reduction.
- `tools/benchmark`: device manifests and evidence capture.
- `tools/ingest`: scheduled Hugging Face snapshot refresh.
- `data/snapshots`: immutable source inputs.
- `data/research`: dated discovery inventory and reproducibility notes.
- `evidence/runs`: validated benchmark artifacts, never model weights.
- `data/research/remote`: credential-free, dated public-source research snapshots from the remote GitHub Actions collector.

## Trust boundary

Model cards, URLs, metadata, pull requests, and contributor artifacts are untrusted input. Model weights, credentials, private device data, and raw network payloads must not be committed.

## Runtime direction

- iOS: [Apple Core AI](https://developer.apple.com/core-ai/)
- Android: [ExecuTorch](https://docs.pytorch.org/executorch/stable/edge-platforms-section.html)

The project does not claim mobile readiness from parameter count, desktop wrappers, or a single-platform result.

## Research reproduction

The research inventory is validated and the host-specific POC/preflight status can be rebuilt with:

```text
npm run research:validate
npm run research:preflight
npm run research:poc-status
npm run research:remote:validate
npm run research:registry:validate
npm run poc:fixture -- --mock --platform both
npm test
npm run validate
```

See [`data/research/mobile-llm-inventory-2026-09-17.json`](data/research/mobile-llm-inventory-2026-09-17.json) and [`docs/research-notes/2026-09-17-mobile-llm-discovery.md`](docs/research-notes/2026-09-17-mobile-llm-discovery.md) for the exact repository IDs, revisions, runtime claims, evidence URLs, and exclusions.
