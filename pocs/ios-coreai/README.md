# iOS Core AI POC

This directory is a real Xcode iOS app project. It uses Apple's `CoreAILanguageModels` Swift package and `CoreAILanguageModel(resourcesAt:)` to load exported `.aimodel` resource folders, run the canonical text-generation fixture, and write a ModelOrbit benchmark JSON artifact into the app's Documents directory.

The app contains an offline chat interface with all three verified candidates and records their exact inventory revisions. Each sent message uses the selected native model, measures cold and warm generation latency, samples process resident memory before/after inference, computes SHA-256 checksums, and makes no network requests. A captured device manifest ID is required before a chat generation and benchmark can be saved.

## Prepare model resources

Use Xcode 27/macOS 27 and Apple's export tools. The official Qwen3 recipe supports these iOS variants:

```text
cd /path/to/coreai-models
uv run coreai.llm.export Qwen/Qwen3-0.6B --platform iOS --max-context-length 4096 --output-dir /path/to/ModelOrbit/pocs/ios-coreai/Resources/Models/qwen3_0_6b
uv run coreai.llm.export Qwen/Qwen3-1.7B --platform iOS --max-context-length 4096 --output-dir /path/to/ModelOrbit/pocs/ios-coreai/Resources/Models/qwen3_1_7b
uv run coreai.llm.export Qwen/Qwen3-4B --platform iOS --max-context-length 4096 --output-dir /path/to/ModelOrbit/pocs/ios-coreai/Resources/Models/qwen3_4b
```

The exported directories are local-only and ignored by Git. Keep the source revision aligned with the revision recorded in `data/research/mobile-llm-inventory-2026-09-17.json`.

## Build and run

Open `ModelOrbitCoreAI.xcodeproj`, select a trusted physical iPhone running iOS 27+, choose a candidate, enter its captured `device-ios-...` manifest ID, and send a message in **ModelOrbit Chat**. The generated artifact can be copied from the app container and validated with:

```text
node tools/benchmark/validate-result.mjs evidence/runs/<benchmark-result>.json
node tools/benchmark/link-artifact.mjs evidence/runs/<benchmark-result>.json
```

Current host status: iOS execution is blocked by Xcode 26.4.1/iOS SDK 26.4 and the absence of a physical iPhone. Apple documents macOS/iOS 27+ and Xcode 27+ for Core AI app integration.
