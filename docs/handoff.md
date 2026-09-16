# ModelOrbit Handoff

Date: 2026-09-17
Status: CEO, engineering, and design reviews complete; schema/preflight/device phase implemented; physical-device POCs blocked by missing prerequisites

## What was decided

- New standalone GitHub repository: `ModelOrbit`.
- Primary goal: open-source research and learning around mobile model feasibility.
- Main experience: visual model galaxy.
- Phase 1 is device-first: only same-repository, same-revision models that can run on both iPhone and Android enter the POC lane.
- iOS runtime: Core AI.
- Android runtime: ExecuTorch.
- Readiness gate: load, canonical task, valid output, memory, latency, and no network.
- Five selective expansions accepted: reproducible evidence bundle, device capture kit, scheduled snapshots, contributor workflow, and shareable comparisons.
- Cross-platform export preflight across all 26 models is the first engineering gate.
- Versioned JSON Schemas are the shared contract across web, scripts, iOS, Android, and CI.
- CI validates contracts and native builds; physical-device evidence is attached and reviewed until device runners are justified.

## Repository isolation

Do not modify or nest this project inside the existing `jarvis-personal-os` checkout. The target repository does not exist yet.

## Source input

The initial dataset is at:

`/Users/vishwasaikarnati/.codex/attachments/83838db3-8843-40b6-ae1c-f1ee5efd969d/pasted-text.txt`

It contains 26 model records covering text, vision-language, video, audio, time-series, and similarity pipelines.

## First implementation sequence

1. Create an isolated `ModelOrbit` repository.
2. Add `docs/mvp-plan.md` and this handoff.
3. Add model/evidence JSON Schemas and fixtures.
4. Import the TSV as an immutable snapshot.
5. Implement Core AI and ExecuTorch preflight checks across all 26 records.
6. Record exact iPhone and Android device manifests before running benchmarks.
7. Select the first 1–3 same-revision models in the intersection.
8. Build the two native POCs and capture evidence.
9. Build the galaxy from normalized records and evidence.

## Still required before device runs

- Exact iPhone model and iOS version.
- Exact Android model and Android version.
- Canonical task fixtures for each selected pipeline.
- Confirmation of the Core AI and ExecuTorch tool versions used by the preflight.

## Do not do

- Do not label a model mobile-ready from parameter count alone.
- Do not claim cross-platform support from a desktop wrapper.
- Do not commit model weights, credentials, or raw private device data.
- Do not treat a failed refresh as an empty dataset.

## Engineering review result

Engineering review is complete for the proposed MVP. The plan is ready for implementation after a dedicated design review of the galaxy and comparison experience.

The review locked in the following implementation rules:

- Build schemas, immutable snapshots, normalization, and deterministic fixtures before native POCs.
- Run the 26-model Core AI and ExecuTorch preflight matrix before selecting device candidates.
- Use a central status reducer; the web app only projects validated records.
- Keep iOS and Android POCs independent and run them in parallel after the candidate set and device manifests exist.
- Treat physical-device evidence as attached, validated artifacts until device runners are justified.
- Preserve stale and partial data visibly; never replace a valid snapshot with a failed refresh.
- Require reproducibility checks, no-network evidence, checksums, and exact tool/device manifests.

The engineering review found no critical architecture gap. The two active risks are deliberate and visible: the exact test devices/OS versions still need to be recorded, and the Core AI/ExecuTorch intersection may be empty. Both are handled by the preflight and evidence model rather than being hidden assumptions.

Recommended next sequence after this phase: obtain trusted physical iPhone and Android manifests, refresh immutable source revisions, then run the fail-closed native adapters on the verified intersection.

## Design review result

The first screen is an app-style research workspace, not a marketing landing page. The galaxy is the visual anchor, with a table/list mirror for precision and accessibility. Desktop uses a persistent evidence inspector; mobile uses a list-first layout with a bottom-sheet inspector.

The plan now defines the visual tokens, status semantics, loading/empty/error/partial/success states, filter and comparison behavior, keyboard navigation, screen-reader mirror, touch targets, reduced-motion behavior, and responsive breakpoints. The default lens is “Runs on both phones,” while all 26 records remain available in the full catalog.

The visual mockup generator could not run because the local design tool has no configured API key. The review therefore used the text fallback. Visual QA should run after the first web implementation.

## Post-design engineering constraints

- Keep stable model node IDs and deterministic keyboard order shared by the galaxy and accessible list.
- Encode comparison selections, revisions, filters, and schema version in validated route state.
- Include freshness metadata and checksums in the generated read model so stale and last-valid states are truthful.
- Keep one semantic inspector and evidence table across desktop and mobile layouts.
- Test keyboard navigation, live regions, reduced motion, filter reset, deep links, and invalid comparison links.
- Self-host or non-blockingly fall back for fonts, and include font assets in the web bundle budget.

## Implementation checkpoint

Commit `50c8728` adds the first working galaxy MVP, deterministic snapshot normalizer, and 26-record normalized read model. The default lens intentionally shows zero verified models because no preflight or physical-device evidence has been collected yet.

The versioned schema package and preflight/device evidence are now implemented; remaining work is physical-device adapter execution once the documented prerequisites are available.

## Phase 2 handoff — actual run

The phase is implemented on `main` from baseline `395bf11`. Start with `npm test`, `npm run validate`, and inspect `evidence/runs/phase-2-status.json`.

The checked-in matrix has 52 validated rows in `data/preflight/2026-09-17.json`. It has no eligible intersection: the dated snapshot contains `revision: null` for every record, Android export tooling is unavailable, and unsupported pipeline families are blocked. Because unknown results remain, the intersection is correctly `unknown`, not `verified-empty`.

The exact device detection artifact is `data/devices/2026-09-16.json` (timestamps are UTC; manifests `device-ios-20260916T195533Z` and `device-android-20260916T195533Z`). Xcode 26.4.1 / build 17E202, xcrun 72, Swift 6.3.1, iOS SDK 26.4 were available; no physical iPhone was listed. ADB, Android SDK, Gradle, Java, and Kotlin were unavailable; no Android device was listed. The host is an Apple M1 MacBook Air running macOS 26.4.1. No private device identifiers were retained.

The Swift fail-closed harness is in `pocs/ios-coreai/main.swift`; the portable Kotlin harness is in `pocs/android-executorch/Main.kt`. They emit no measurements without an admitted candidate and exact device manifest. Once a same-repository, immutable-revision candidate appears in the matrix and both manifests are available, the next safe work is to add the platform adapter, run `data/fixtures/*-basic-v1.json` on both devices, validate benchmark results, and rebuild the read model.
