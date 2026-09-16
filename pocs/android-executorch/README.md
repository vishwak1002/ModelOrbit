# Android ExecuTorch POC

This directory is a real Android Studio/Gradle app project. It uses the official `org.pytorch:executorch-android:1.4.1` AAR and `LlmModule`/`LlmGenerationConfig`/`LlmCallback` to load `.pte` assets, run the canonical text-generation fixture, and write a ModelOrbit benchmark JSON artifact into app-private storage.

The app contains an offline chat interface with all three verified candidates and records their exact inventory revisions. Each sent message uses the selected native model, measures cold and warm generation latency, samples process PSS, computes SHA-256 checksums, and deliberately omits the Android `INTERNET` permission. A captured device manifest ID is required before a chat generation and benchmark can be saved.

## Prepare model assets

Use the official ExecuTorch Qwen3 export recipe with the same release as the Gradle dependency. For each candidate, export the corresponding XNNPACK `.pte` and copy the tokenizer from the same Hugging Face revision:

```text
app/src/main/assets/models/qwen3_0_6b/model.pte
app/src/main/assets/models/qwen3_0_6b/tokenizer.json
app/src/main/assets/models/qwen3_1_7b/model.pte
app/src/main/assets/models/qwen3_1_7b/tokenizer.json
app/src/main/assets/models/qwen3_4b/model.pte
app/src/main/assets/models/qwen3_4b/tokenizer.json
```

The model files are local-only and ignored by Git. The ExecuTorch Qwen3 example documents the `qwen3_0_6b`, `qwen3_1_7b`, and `qwen3_4b` model classes and XNNPACK export configs.

## Build and run

Open `pocs/android-executorch` in Android Studio, sync Gradle, enable USB debugging on a trusted physical Android device, and run the app. Enter its captured `device-android-...` manifest ID, choose a candidate, and send a message in **ModelOrbit · ExecuTorch chat**. The artifact is written under the displayed `filesDir/benchmarks/` path; pull it with `adb` and validate it in the repository:

```text
adb shell run-as dev.modelorbit.executorch ls files/benchmarks
adb exec-out run-as dev.modelorbit.executorch cat files/benchmarks/<benchmark-result>.json > evidence/runs/<benchmark-result>.json
node tools/benchmark/validate-result.mjs evidence/runs/<benchmark-result>.json
node tools/benchmark/link-artifact.mjs evidence/runs/<benchmark-result>.json
```

Current host status: Android execution is blocked until the SDK, build toolchain, physical device, and three exported assets are available.
