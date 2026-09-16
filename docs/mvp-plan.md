# ModelOrbit MVP Plan

Status: CEO-reviewed, engineering-reviewed, design-reviewed, ready for implementation
Date: 2026-09-17
Repository: new standalone GitHub repository named `ModelOrbit`

## Outcome

ModelOrbit answers one research question with evidence:

> Which exact open-source model revisions can run on both an iPhone and an Android phone?

The visual galaxy is the interface. The evidence ledger is the product.

## Phase 1 scope

- Start with the 26 models in the supplied tab-separated dataset.
- Preserve model metadata and immutable dated snapshots.
- Run a cross-platform export preflight before building device POCs.
- Use Core AI for iOS and ExecuTorch for Android.
- Require the same Hugging Face repository and revision on both platforms.
- Select only models that pass the iOS and Android eligibility intersection.
- Test selected models on one real iPhone and one real Android phone.
- Mark a model `cross-platform-ready` only when it loads, completes the same canonical task, returns valid output, stays within recorded memory limits, records latency, and makes no network request.
- Show unsupported and untested models in the catalog, but keep them out of the Phase 1 POC lane.

## Repository shape

```text
ModelOrbit/
  apps/
    galaxy-web/                 # visual galaxy and comparison URLs
  packages/
    evidence-schema/            # versioned JSON Schemas and validators
    model-data/                 # snapshot readers and normalization
  pocs/
    ios-coreai/                 # Swift/Xcode POC
    android-executorch/         # Kotlin/Android POC
  tools/
    preflight/                  # 26-model export eligibility matrix
    benchmark/                  # evidence capture and manifest tooling
    ingest/                     # scheduled Hugging Face refresh
  data/
    snapshots/                  # immutable source snapshots
    normalized/                 # generated normalized records
  evidence/
    runs/                       # benchmark artifacts, never model weights
  docs/
    mvp-plan.md
    handoff.md
    research-notes/
  .github/
    workflows/
    pull_request_template.md
```

## Canonical records

All producers validate against versioned schemas:

- `model-record`: source repository, revision, pipeline, license, artifact metadata, snapshot timestamp.
- `preflight-result`: iOS Core AI status, Android ExecuTorch status, export logs, failure reason, tool versions.
- `device-manifest`: platform, exact device model, OS version, build, locale, thermal and battery state.
- `benchmark-result`: canonical task, output validity, cold and warm latency, peak memory, network status, pass/fail.
- `evidence-link`: artifact path, source revision, checksum, run timestamp, reviewer or contributor.

## Data flow

```text
Hugging Face metadata
        |
        v
immutable snapshot --> normalized model record --> preflight matrix
                                                     |
                           +-------------------------+----------------------+
                           v                                                v
                    iOS Core AI export                              Android ExecuTorch export
                           |                                                |
                           v                                                v
                    iPhone benchmark                                Android benchmark
                           +-------------------------+----------------------+
                                                     v
                                      evidence validator and status reducer
                                                     |
                                                     v
                                           galaxy and comparison views
```

Shadow paths are explicit: missing metadata becomes `unknown`; empty model files become `blocked`; export or device failures become `failed` with logs; stale results remain visible with their original timestamp.

## Status model

```text
unknown -> preflight-eligible -> exported -> device-tested
   |             |                 |             |
   +---------> blocked <-----------+----------> failed
                                                   |
                                                   v
                                          cross-platform-ready
```

`cross-platform-ready` requires two valid platform evidence records from the same model revision. No heuristic alone can produce that status.

## Delivery sequence

1. Create the isolated `ModelOrbit` repository and copy this plan and handoff.
2. Add schemas, validators, dataset snapshot, and deterministic fixtures.
3. Run the 26-model Core AI and ExecuTorch preflight matrix.
4. Pick the top 1–3 models in the verified intersection.
5. Build the iOS and Android POCs around the same canonical task fixtures.
6. Capture real-device evidence and validate artifacts.
7. Build the galaxy and comparison links from evidence records.
8. Add scheduled refresh, contribution templates, and CI checks.

## CI and device policy

- Every pull request runs schema validation, normalized-data tests, preflight parser tests, web tests, and native compile checks where hosted toolchains allow.
- Physical-device benchmarks are attached evidence, not simulated CI claims.
- No model weights, private device data, signing credentials, or tokens enter Git.
- A failed refresh or benchmark never replaces the last valid snapshot silently.

## Error and rescue rules

- Missing or malformed Hugging Face metadata: preserve the prior snapshot, create a visible failed-ingest record, and mark the new record `unknown`.
- Unsupported Core AI or ExecuTorch architecture: record `blocked` with the exact tool output and continue the matrix.
- Export timeout or toolchain failure: retry once, then record `failed`; never label eligible.
- Device run cancellation, thermal warning, or memory pressure: record partial evidence and mark the result incomplete.
- Invalid model output: fail the canonical task; do not coerce it into a pass.
- Network detected during a no-network run: fail the gate and retain the network event in the artifact.

## Security and trust

- Treat model-card text, URLs, and metadata as untrusted input.
- Do not execute commands supplied by a model card or pull request.
- Allowlist model sources and store checksums for downloaded artifacts.
- Keep device identifiers minimal and document what is recorded.
- Never commit model weights or credentials.
- Render markdown and URLs safely in the galaxy.

## Success criteria

- The 26-model dataset is preserved as a dated, reproducible snapshot.
- The preflight matrix explains every model’s iOS and Android status.
- At least one same-revision model passes the research-grade gate on both phones, or the project reports a verified empty intersection with failure evidence.
- Every `cross-platform-ready` status links to both platform artifacts.
- A contributor can add a benchmark result through a validated pull request.
- A comparison URL reproduces the selected models, platforms, and filters.
- `docs/mvp-plan.md` and `docs/handoff.md` let a new contributor continue without conversation history.

## Not in scope

- Running every modality in Phase 1.
- Full device-fleet automation.
- Hosting model inference as a service.
- Shipping model weights in Git.
- Adding MLC, ONNX Runtime, llama.cpp, or MLX Swift as first-class lanes before the Core AI and ExecuTorch intersection is measured.

## Engineering review

Review mode: full engineering review. The review is against the proposed standalone ModelOrbit repository, not the existing Jarvis checkout. No implementation changes were made.

### Review outcome

The architecture is approved for implementation with two load-bearing controls:

1. The 26-model cross-platform preflight is the first executable gate. Native POCs must not be selected from popularity, parameter count, or model-card claims.
2. The evidence schema and status reducer are the source of truth. The galaxy is a read-only projection and must never infer `cross-platform-ready` from incomplete records.

The exact iPhone/OS and Android/OS manifests are still a prerequisite for device runs. Until they are recorded, the intersection is an unknown, not a failure. A verified empty intersection is an acceptable Phase 1 result if every exclusion has a reproducible reason.

### Architecture review

```text
source TSV + Hugging Face metadata
              |
              v
immutable snapshot + checksum
              |
              v
normalizer -> versioned schemas -> deterministic preflight matrix
                                              |
                         +--------------------+--------------------+
                         v                                         v
                  Core AI iOS lane                         ExecuTorch Android lane
                         |                                         |
                         v                                         v
                   iPhone evidence                         Android evidence
                         +--------------------+--------------------+
                                              v
                                    status reducer
                                              |
                                   normalized read model
                                              |
                               galaxy + comparison URLs
```

Approved decisions:

- One canonical model identity is `hf_repo_id + immutable revision`; platform artifacts are separate evidence for that identity.
- Schemas are versioned and validated at every boundary. Generated types may be added later, but each producer remains responsible for validating its own output.
- Preflight is a hard dependency for selecting device POCs, while the web shell, ingest fixtures, and schema tooling can begin in parallel.
- Native runners produce evidence; they do not own catalog status. A reducer applies the status rules once, centrally.
- Model weights never enter the web bundle or Git history. The galaxy consumes compact metadata and evidence summaries only.

### Code quality and maintainability

- Keep platform adapters narrow: model loading, canonical task execution, network observation, and evidence emission only.
- Keep normalization in one package. Do not duplicate TSV parsing or status rules in the web app, iOS app, and Android app.
- Treat generated normalized data as build output with a checked-in source snapshot and checksum, not as hand-edited application state.
- Make schema version, source revision, toolchain versions, and evidence checksum mandatory fields rather than optional annotations.
- Use fixtures for every status transition, including malformed metadata, stale evidence, partial runs, and duplicate submissions.
- Make benchmark commands deterministic and idempotent so a rerun creates a new evidence record rather than mutating an old run.

### Failure modes and rescue paths

| Boundary | Failure | Required behavior | User-visible result |
|---|---|---|---|
| ingest | missing, malformed, or rate-limited source metadata | keep last valid snapshot; store failed-ingest record | catalog shows stale timestamp and ingest warning |
| normalization | unknown pipeline or invalid field | preserve raw source; emit `unknown` normalized record | model remains searchable but not eligible |
| preflight | unsupported architecture, converter failure, timeout | capture tool output and versions; retry timeout once | `blocked` or `failed`, never eligible |
| device load | missing artifact, incompatible OS, load failure | retain partial run and exact error; do not coerce pass | platform status is failed/incomplete |
| benchmark | invalid output, timeout, thermal or memory pressure | record measured values and stop reason | evidence is incomplete or failed |
| privacy gate | network request or unexpected file access | fail no-network gate and retain event log | model cannot be cross-platform-ready |
| evidence reducer | duplicate or conflicting submissions | choose by immutable run ID and validation rules; surface conflict | comparison view shows conflict state |
| galaxy read | stale, empty, or malformed generated data | render last valid read model with banner, or explicit empty state | no blank screen and no silent reset |

Critical failures must be visible in logs and the UI. The system must never turn an error into an empty successful catalog.

### Data and interaction edge cases

- Zero models pass both preflight lanes: show a verified-empty-intersection state with counts and exclusion reasons.
- A model passes preflight but no physical device run exists: show `exported` or `device-untested`, never ready.
- iOS and Android evidence refer to different revisions: split the records and exclude them from the intersection.
- One platform has stale evidence: show the age and preserve the prior result; do not silently present it as current.
- A run is cancelled after load: retain load evidence and mark task evidence incomplete.
- A device goes offline during a run: record the network state and fail the no-network gate if any request occurred.
- A user applies filters that yield no results: show “no matches for these filters” with a reset action.
- A comparison URL contains unknown model IDs or schema versions: validate and display a recoverable invalid-link state.
- A slow snapshot or benchmark load: show progress and allow navigation without losing the pending state.

### Test strategy

```text
schema fixtures + property tests
              |
              v
snapshot/normalizer tests -> preflight parser tests -> reducer tests
              |                                      |
              +------------------+-------------------+
                                 v
                 native compile + no-network integration
                                 |
                                 v
                    attached-device evidence validation
                                 |
                                 v
                    galaxy E2E + comparison-link tests
```

Required checks before calling the MVP complete:

- Schema validation for every checked-in snapshot, normalized record, preflight result, device manifest, benchmark result, and evidence link.
- Parser fixtures for all 26 source records and each known failure class.
- Reducer tests proving that one missing platform, a revision mismatch, stale evidence, or a network event cannot produce `cross-platform-ready`.
- No-network integration tests around the native adapters, with the network monitor result included in the evidence artifact.
- iOS and Android compile checks in CI where toolchains are available; physical-device evidence remains attached/manual until runners are justified.
- Web tests for loading, empty, stale, partial, error, filtering, deep-link, and comparison states.
- A reproducibility check that rebuilds the normalized read model from the immutable snapshot and gets the same checksum.

### Performance and resource policy

- Precompute the normalized read model and galaxy coordinates; the browser must not download or process model weights.
- Load only compact records needed for the current view, with a table/list fallback for low-power devices and accessibility.
- Use clustering or virtualization so the galaxy remains responsive as the catalog grows beyond the initial 26 records.
- Cache source metadata by immutable revision and avoid re-downloading unchanged records during scheduled refresh.
- Run preflight and ingest asynchronously outside the web request path.
- Capture cold and warm latency separately, and record peak memory with the exact device manifest.
- Set an explicit web bundle and normalized-data size budget in CI; fail the check when the budget regresses materially.

### Security and trust review

- Treat model cards, URLs, repository metadata, pull requests, and contributor artifacts as untrusted data.
- Never execute commands copied from model cards, issue text, or PR descriptions.
- Use an allowlist for source hosts, validate URLs, pin immutable revisions, and record artifact checksums.
- Sanitize markdown and links before rendering them in the galaxy.
- Keep device manifests to the minimum needed for reproducibility; exclude personal identifiers and unrelated telemetry.
- Keep credentials, signing material, private device files, raw network payloads, and model weights out of Git and CI logs.
- Enforce artifact size/type limits on contributor uploads and validate evidence before merging.

### Observability and reproducibility

Every run should emit structured JSON with a run ID, model identity, revision, schema version, tool versions, device manifest reference, timestamps, status, measurements, checksums, and failure reason where applicable.

Track at least these counters in CI summaries and snapshot reports: `models_seen`, `preflight_ios_eligible`, `preflight_android_eligible`, `intersection_count`, `device_runs_started`, `device_runs_passed`, `network_gate_failures`, `ingest_failures`, and `stale_records`. The repository does not need a hosted telemetry service for Phase 1; committed reports and GitHub Actions artifacts are sufficient.

### Deployment and rollback

- Publish the galaxy as a static site or GitHub Pages artifact built from normalized data.
- Run scheduled ingestion in GitHub Actions with least-privilege permissions and no secret access unless a later source requires it.
- Treat snapshot/data commits as versioned releases. Rollback means reverting to the last valid snapshot and read model, not deleting evidence.
- Keep native POCs buildable locally and document the exact Xcode, iOS, Android, Kotlin, and ExecuTorch/Core AI versions used.
- Mark stale or partial data in the UI so a static deployment never implies that a failed refresh succeeded.

### Worktree and parallelization review

The recommended execution split is:

| Lane | Work | Dependency | Parallel status |
|---|---|---|---|
| A | schemas, fixtures, snapshot loader, normalizer | none | start first |
| B | galaxy shell, read-only filters, empty/error states | schema shape | parallel with C after A contract |
| C | ingest and contributor validation workflow | schema shape | parallel with B after A contract |
| D | iOS Core AI POC | preflight candidate set and device manifest | parallel with E after preflight |
| E | Android ExecuTorch POC | preflight candidate set and device manifest | parallel with D after preflight |
| F | evidence reducer, comparisons, release report | A, D, E evidence | sequential integration |

Avoid splitting the schema package and status reducer across branches after implementation begins; that would create the highest merge-conflict and semantic-drift risk. Native POCs should be separate worktrees or clearly separate directories because their toolchains and dependency graphs are independent. The web and ingest lanes can proceed in parallel after the contract is frozen.

### Design and UX review handoff

The product has meaningful UI scope: galaxy navigation, comparison links, evidence confidence, stale/partial/error states, and accessible list fallback. Engineering review accepts those requirements as constraints, but detailed interaction, visual hierarchy, responsive behavior, keyboard navigation, and screen-reader treatment should receive a dedicated design review before the web implementation is finalized. Recommended next review: `plan-design-review`.

### Explicit non-goals for Phase 1

- No claim that all 26 models support mobile.
- No automatic fleet-wide device coverage.
- No hosted inference API or account system.
- No weights committed to the repository.
- No extra runtime lanes before the Core AI/ExecuTorch intersection has been measured.
- No background telemetry from personal devices beyond the declared evidence fields.

### Engineering review completion

- Review mode: full review.
- Critical architecture gaps left open: 0.
- Load-bearing concerns recorded: 2 (device manifests pending; intersection may be empty).
- Failure classes reviewed: ingest, normalization, preflight, device, benchmark, privacy, evidence, and web read paths.
- Parallel implementation lanes: 5 execution lanes plus 1 integration lane.
- Implementation changes made during review: none.
- Existing Jarvis checkout modified: no.

## Design review

Review mode: full text fallback. The gstack designer binary was present, but visual generation could not run because no OpenAI API key was configured. No implementation changes were made and no mockup was approved.

### Design scope assessment

Initial design completeness: 6/10. The plan named the galaxy, filters, comparisons, and evidence states, but did not yet specify the visual hierarchy, screen structure, state copy, typography, responsive behavior, or keyboard model. A 10/10 plan would let an implementer build the first screen and every important state without inventing product behavior.

No `DESIGN.md` exists in the proposed repository. The plan now carries the first-phase design tokens and interaction rules so the visual system is explicit from day one. The existing Jarvis UI is not a dependency and is not copied because ModelOrbit must remain a standalone repository.

The product is classified as an app UI, not a marketing landing page. The visual anchor is the galaxy, but the user’s job is evidence inspection, not browsing decorative content.

### What already exists

- The current Jarvis checkout contains an unrelated on-device model lab, but global project isolation rules prohibit reusing or nesting it for ModelOrbit.
- No ModelOrbit repository, `DESIGN.md`, component library, or visual baseline exists yet.
- The approved product decisions already provide the galaxy concept, evidence ledger, comparison links, Core AI/ExecuTorch lanes, and the 26-record catalog. The design work below turns those decisions into visible interface behavior.

### Pass 1: Information architecture

Before: 6/10. After: 9/10.

The first screen has one job: help a researcher find which exact model revisions have evidence on both platforms.

```text
ModelOrbit / Explore / Evidence / Research notes
------------------------------------------------
Research question + snapshot date + data freshness
------------------------------------------------
Readiness lens | platform filters | pipeline filters | search | list/galaxy toggle
------------------------------------------------
Galaxy canvas                         Evidence inspector
  model nodes by readiness               selected model identity
  orbit clusters by pipeline             iOS / Android evidence
  dimmed unsupported records              revision + task + measurements
------------------------------------------------
Table fallback: model | revision | iOS | Android | memory | latency | evidence age
```

Hierarchy is fixed:

1. The research question and current evidence freshness.
2. The readiness lens and the galaxy/list control.
3. The selected model’s evidence and next action.

Primary navigation is shallow: Explore, Evidence, and Research notes. A model deep link opens the inspector with the exact repository and revision visible. The default lens is “Runs on both phones,” while a “Show all 26” control exposes unknown, blocked, failed, and untested records without implying readiness.

### Pass 2: Interaction state coverage

Before: 5/10. After: 9/10.

| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Snapshot | orbit skeleton plus “Loading dated snapshot” | “No snapshot published yet” plus view-source action | last valid snapshot with stale banner and failure timestamp | snapshot date, checksum, and record count | old snapshot plus “refresh in progress” |
| Galaxy | pulsing node placeholders; no fake counts | “No model has passed both lanes yet” plus “View exclusions” | readable fallback table and retry action | nodes grouped by pipeline and readiness | dimmed nodes with per-platform status labels |
| Inspector | reserved layout with model identity skeleton | “Select a model to inspect evidence” | source link, failure reason, and prior evidence age | revision, both platform records, task, latency, memory, network gate | separate iOS/Android rows with missing side called out |
| Filters/search | controls remain usable; result count hidden until ready | “No matches for these filters” plus reset | preserve controls and show query error | result count and active filter chips | show matching records plus stale/unknown count |
| Comparison URL | decode progress | “No models selected” plus browse action | invalid-link explanation and safe reset | selected models, platform columns, export/share action | missing evidence shown as explicit gaps |

Empty states use plain context and one primary action. Error states preserve the last useful evidence. Color never carries state alone: each status has a text label and icon or shape.

### Pass 3: User journey and emotional arc

Before: 6/10. After: 8/10.

| Step | User does | User should feel | Plan specifies |
|---|---|---|---|
| 1 | Lands on Explore | oriented, not marketed to | question, snapshot date, and “26 models” appear before the galaxy |
| 2 | Scans the orbit | curious with a clear next move | one highlighted readiness lens and a visible list fallback |
| 3 | Selects a node | confident that the record is inspectable | inspector exposes revision, source, evidence age, and platform gates |
| 4 | Compares two or three models | able to judge tradeoffs | comparison preserves filters and shows missing evidence as gaps |
| 5 | Reads a failure | informed, not misled | exact failure class, tool version, and retry or research-note path |
| 6 | Returns months later | trustful of change over time | snapshot history and stale evidence remain visible |

The first five seconds answer “what is this and what can I trust?” The first five minutes support model selection and comparison. The long-term relationship is an evidence history, not a leaderboard.

### Pass 4: AI slop risk and visual language

Before: 5/10. After: 8/10.

The plan rejects a centered marketing hero, decorative card grid, purple gradient, generic feature cards, emoji, and unsupported “best model” language. The galaxy is an instrument panel with a research notebook nearby, not a sci-fi poster.

Visual tokens for Phase 1:

```css
--void: #0A0D0F;
--surface: #121719;
--paper: #F2F0E8;
--muted: #9EA6A8;
--line: #2A3335;
--signal: #D9FF57;      /* verified ready */
--amber: #F2B35B;       /* stale or partial */
--rose: #F08080;        /* failed or blocked */
--display-font: "Fraunces";
--ui-font: "IBM Plex Sans";
--data-font: "IBM Plex Mono";
```

Use the display face only for the product mark and research question, the sans face for controls and explanatory text, and the mono face for revisions, measurements, timestamps, and status codes. Use asymmetrical orbital geometry, thin evidence lines, restrained motion, and a warm paper-colored inspector against the dark canvas. Each section has one job and cards exist only when the record itself is the interaction.

### Pass 5: Design system alignment

Before: 4/10. After: 8/10.

There is no existing ModelOrbit design system to reuse. The tokens above are the minimum shared vocabulary. Component rules:

- `StatusBadge` always includes text, semantic color, and a non-color shape.
- `EvidenceRow` puts the platform, revision, task, result, latency, memory, and evidence age in a stable order.
- `FilterBar` uses visible labels, removable chips, and a reset action.
- `GalaxyNode` has a minimum 44px interactive hit area even when its visual point is smaller.
- `Inspector` is a persistent right column on desktop and a bottom sheet on small screens.
- `DataFreshnessBanner` is reserved for stale, refreshing, or failed snapshots and never appears as decorative chrome.

### Pass 6: Responsive and accessibility review

Before: 5/10. After: 9/10.

Responsive behavior is intentional:

- At 1280px and above, use a two-column workspace: galaxy canvas and 360px inspector, with the table below.
- From 768px to 1279px, keep the galaxy primary, move the inspector to a dismissible side panel, and keep filters in one horizontal scroll row with visible overflow cues.
- Below 768px, make the table/list the default primary surface, keep a compact orbit preview above it, and open model details as a bottom sheet. Filters become a sticky, labeled control row.
- At every size, keep the research question, evidence freshness, selected model identity, and reset path visible without horizontal page scrolling.

Accessibility requirements:

- Use landmarks `header`, `nav`, `main`, `aside`, and `footer` with one page heading.
- Give the galaxy an accessible list mirror. Each node has a name, readiness status, pipeline, and revision.
- Use roving `tabindex` for nodes; arrow keys move between nodes, Enter opens the inspector, and Escape closes it.
- Keep all controls and node hit areas at least 44px by 44px.
- Meet WCAG AA contrast, including status text against the dark canvas and the warm inspector surface.
- Announce filter result changes and benchmark state changes through a polite live region.
- Respect `prefers-reduced-motion`; motion is never required to identify a status or locate a node.
- Test keyboard navigation, VoiceOver, and TalkBack against loading, empty, error, partial, and success states.

### Pass 7: Design decisions resolved

Auto-decided using the user’s standing preference for recommended choices:

| Decision | Chosen direction | Reason |
|---|---|---|
| First-screen type | App UI workspace, not landing page | Research users need evidence immediately |
| Primary visual anchor | Galaxy plus table/list mirror | The galaxy creates discovery; the list provides precision and accessibility |
| Default lens | “Runs on both phones” | Matches the Phase 1 question and prevents unsupported browsing from becoming the implied goal |
| Desktop detail pattern | Persistent right inspector | Keeps evidence visible while preserving spatial orientation |
| Mobile detail pattern | Bottom sheet over list-first layout | Keeps the primary evidence surface usable with one hand |
| Status expression | Text plus shape plus color | Prevents color-only interpretation and supports stale/partial trust cues |
| Motion | Subtle entry and selection motion; reduced-motion fallback | Adds orientation without turning data into decoration |
| Catalog visibility | Show all 26 in the data view, dim non-ready records in the default lens | Preserves research context without implying support |
| Comparison scope | Two or three models, same filters and revision identity | Keeps comparisons readable and evidence-specific |
| Design system | Token-first, no external component library in Phase 1 | Avoids a generic UI kit and keeps the catalog visually coherent |

### NOT in scope

- No marketing landing page, testimonials, pricing, account system, or growth funnel.
- No 3D WebGL scene, physics simulation, or decorative starfield that competes with evidence.
- No leaderboard, recommendation score, or “best model” ranking without an explicit research method.
- No custom theming or dark/light switch in Phase 1; the observatory canvas is the product identity.
- No live model inference from the browser and no loading state that pretends a benchmark is running.
- No reliance on hover, color alone, or animation for meaning.

### TODOs updates

These are accepted as later work, not blockers for the MVP plan:

1. Add visual regression snapshots for 375px, 768px, and 1440px after the first web implementation. This protects the intentional responsive layouts.
2. Run a dedicated VoiceOver and TalkBack audit with real evidence fixtures after the accessible list mirror exists.
3. Add a motion budget and selection-transition spec after the static evidence hierarchy is validated.

### Design review completion

```text
                          before -> after
Information architecture       6 -> 9
Interaction states              5 -> 9
User journey                    6 -> 8
AI slop risk                   5 -> 8
Design system                  4 -> 8
Responsive + accessibility    5 -> 9
Decision clarity               7 -> 9
Overall design completeness    6 -> 8
```

- System audit: no ModelOrbit `DESIGN.md`; plan now contains tokens and interaction rules.
- UI scope: galaxy workspace, inspector, filters, table fallback, comparisons, and evidence states.
- Mockups: 0 generated, 0 approved because the designer lacked an API key; text fallback completed.
- Decisions made: 10.
- Decisions deferred: 3 non-blocking design TODOs.
- Unresolved design decisions: 0; choices were auto-decided per the user’s standing preference.
- Next visual QA: run `/design-review` after the first web implementation.

### Post-design engineering validation

The design review adds implementation constraints that the engineering plan must carry:

- The normalized read model needs stable node IDs and a deterministic keyboard order so the galaxy and accessible list mirror cannot drift.
- Comparison links must encode model IDs, revision identities, filters, and schema version in a validated compact route state; unknown IDs and future schema versions render a recoverable invalid-link state.
- Snapshot freshness, stale banners, and “last valid read model” fallback require freshness metadata and source checksums in the generated read model.
- Responsive behavior must preserve one semantic inspector and one semantic evidence table; CSS can rearrange surfaces, but it must not create separate status logic for desktop and mobile.
- Status badges, live regions, reduced-motion behavior, and keyboard navigation need web tests in addition to visual checks.
- Font assets must be self-hosted or have a non-blocking fallback so the research surface does not depend on a third-party font request.
- Add a web bundle budget that includes font assets, normalized data, and the galaxy renderer.

Post-design result: no new critical architecture gap. The existing engineering gate remains valid, with these constraints added before implementation.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|---|---|---|---:|---|---|
| CEO Review | `/plan-ceo-review` | Scope and strategy | 1 | COMPLETE | Selective expansion accepted; device intersection and isolated-repo risks recorded |
| Codex Review | `/codex review` | Independent second opinion | 0 | — | Not run |
| Eng Review | `/plan-eng-review` | Architecture and tests | 1 | CLEAR (PLAN) | 0 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR (PLAN) | score: 6/10 → 8/10, 10 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | Not run |

- **UNRESOLVED:** 0 decisions; device manifests remain an implementation prerequisite, not a plan-choice blocker.
- **VERDICT:** CEO + ENG + DESIGN CLEARED; ready for isolated-repo implementation, with visual QA after the first web build.
