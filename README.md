# ModelOrbit

ModelOrbit is an open-source research workspace for answering one question:

> Which exact open-source model revisions can run on both an iPhone and an Android phone?

The first interface is a visual model galaxy backed by an evidence ledger. Phase 1 uses Apple Core AI for iOS and ExecuTorch for Android, then admits a model to the POC lane only when the same Hugging Face repository and immutable revision pass both lanes.

## Current status

Design and engineering reviews are complete. The executable schema/preflight/device-detection phase and benchmark evidence gate are now checked in. The current run has no verified cross-platform candidates because the snapshot has no immutable revisions, Android tooling is unavailable, and no physical phones were detected; the native harnesses fail closed until those prerequisites exist.

Read the [MVP plan](docs/mvp-plan.md) and [handoff](docs/handoff.md) before changing scope.

## Repository map

- `apps/galaxy-web`: read-only galaxy, evidence inspector, filters, and comparisons.
- `packages/evidence-schema`: versioned JSON Schemas and validators.
- `packages/model-data`: snapshots, normalization, and status reduction.
- `pocs/ios-coreai`: iOS Core AI prototype.
- `pocs/android-executorch`: Android ExecuTorch prototype.
- `tools/preflight`: cross-platform export eligibility matrix.
- `tools/benchmark`: device manifests and evidence capture.
- `tools/ingest`: scheduled Hugging Face snapshot refresh.
- `data/snapshots`: immutable source inputs.
- `evidence/runs`: validated benchmark artifacts, never model weights.

## Trust boundary

Model cards, URLs, metadata, pull requests, and contributor artifacts are untrusted input. Model weights, credentials, private device data, and raw network payloads must not be committed.

## Runtime direction

- iOS: [Apple Core AI](https://developer.apple.com/core-ai/)
- Android: [ExecuTorch](https://docs.pytorch.org/executorch/stable/edge-platforms-section.html)

The project does not claim mobile readiness from parameter count, desktop wrappers, or a single-platform result.
