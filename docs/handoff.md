# ModelOrbit Handoff

Date: 2026-09-17
Status: CEO, engineering, and design reviews complete; schema/preflight/device/research phase implemented; physical-device POCs blocked by missing prerequisites

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

Do not modify or nest this project inside the existing `jarvis-personal-os` checkout. This project is the standalone repository at `/Users/vishwasaikarnati/Documents/Codex/2026-09-17/ModelOrbit` with remote `https://github.com/vishwak1002/ModelOrbit.git`.

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

The evidence gate is also implemented. A platform runner must emit a validated benchmark result, then `node tools/benchmark/link-artifact.mjs evidence/runs/<run>.json` creates a checksum-bearing link. CI runs the contract tests and verifies that rebuilding the normalized read model produces the same SHA-256 twice.

## Phase 2 handoff — actual run

The phase is implemented on `main` from baseline `395bf11`. Start with `npm test`, `npm run validate`, and inspect `evidence/runs/phase-2-status.json`.

The checked-in matrix has 52 validated rows in `data/preflight/2026-09-17.json`. It has no eligible intersection: the dated snapshot contains `revision: null` for every record, Android export tooling is unavailable, and unsupported pipeline families are blocked. Because unknown results remain, the intersection is correctly `unknown`, not `verified-empty`.

The exact device detection artifact is `data/devices/2026-09-16.json` (timestamps are UTC; manifests `device-ios-20260916T195533Z` and `device-android-20260916T195533Z`). Xcode 26.4.1 / build 17E202, xcrun 72, Swift 6.3.1, iOS SDK 26.4 were available; no physical iPhone was listed. ADB, Android SDK, Gradle, Java, and Kotlin were unavailable; no Android device was listed. The host is an Apple M1 MacBook Air running macOS 26.4.1. No private device identifiers were retained.

The iOS app project is `pocs/ios-coreai/ModelOrbitCoreAI.xcodeproj`, with the Core AI adapter in `pocs/ios-coreai/Sources/CoreAIAdapter.swift`. The Android Studio project is `pocs/android-executorch`, with the ExecuTorch adapter in `pocs/android-executorch/app/src/main/java/dev/modelorbit/executorch/MainActivity.kt`. Both apps are parameterized for the three verified candidates, write schema-shaped benchmark artifacts, and make no network requests. Model weights and exported assets remain local-only. Once both manifests are available, run `data/fixtures/text-generation-basic-v1.json` on both devices, validate benchmark results, and rebuild the read model.

## Phase 4 handoff — mobile-LLM discovery

The current discovery inventory is `data/research/mobile-llm-inventory-2026-09-17.json`. It records 15 records: 3 verified exact candidates, 7 claimed-but-unverified records, 4 exclusions, and 1 deduplicated artifact variant. The verified intersection is `Qwen/Qwen3-0.6B`, `Qwen/Qwen3-1.7B`, and `Qwen/Qwen3-4B`; the inventory records the exact revisions and primary Apple/ExecuTorch source URLs.

The derived artifacts are `data/preflight/research-2026-09-17.json` and `evidence/runs/research-poc-status.json`. They are intentionally blocked on this host, not empty or successful: iOS has Xcode 26.4.1/iOS SDK 26.4 and no physical iPhone, while Android has no SDK/ADB/Gradle/Java/Kotlin toolchain or device. The next operator should supply trusted iOS 27/Xcode 27 and Android/device manifests, export the three admitted revisions, then run the shared fixture on both native adapters.

Reproduce with `npm run research:validate`, `npm run research:preflight`, `npm run research:poc-status`, `npm test`, and `npm run validate`. See `docs/research-notes/2026-09-17-mobile-llm-discovery.md` for the source-by-source rationale.

## Remote recurring research

The remote scheduler is `.github/workflows/mobile-llm-research.yml`. It runs weekly on Monday at 09:00 Asia/Kolkata via GitHub Actions and can also be started with `workflow_dispatch`. It requires no OpenAI API key or third-party secret. The workflow collects normalized public signals from Hugging Face, official runtime repositories, Hacker News, Reddit, and Bluesky; validates the dated JSON/Markdown snapshot; runs the existing repository gates; and only then commits and pushes to `main`.

The three-model shortlist is intentionally heuristic and is not a readiness decision. A later manual Codex session must review exact immutable revisions and primary Apple Core AI/ExecuTorch evidence before updating the verified inventory or POCs. If all public sources fail, the run exits without replacing the last valid snapshot. See `data/research/remote/README.md` and `spec/spec-process-cicd-mobile-llm-research.md`.
