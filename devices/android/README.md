# Android on-device POCs

Open this directory as an Android Studio project. `app/src/main/java/dev/modelorbit/executorch/` contains one shared `ModelAdapter` contract and distinct Qwen3 text, Parakeet TDT, and Whisper ASR execution paths. The text adapter covers the 0.6B, 1.7B, and 4B Qwen3 variants. The UI has a no-weight **Run fixture** action and a **Run on device** action. Native output is labeled `pass` only when the selected runner returns nonempty output. This is an execution smoke result, not a quality or benchmark claim. The app requests no `INTERNET` permission.

The four source-verified cross-platform model IDs, experimental Whisper and Qwen3-VL records, immutable Hugging Face revisions, required files, and native blockers are in [`model-pocs.json`](./model-pocs.json). `Qwen3-VL-2B-Instruct` is shown as a blocked research lane: [ExecuTorch's Android PR](https://github.com/pytorch/executorch/pull/17572) and [Optimum's export PR](https://github.com/huggingface/optimum-executorch/pull/214) were still open at review, with the vision encoder path incomplete. The app does not route it through a text LLM runner.

## No-weight smoke

Run `node devices/android/fixture-smoke.mjs` from the repository root. It validates the exact model/revision catalog, project wiring, and fixture response contract without fetching weights. In the app, select a model and tap **Run fixture** to verify UI-to-adapter routing. Fixture status is always `blocked` because no native model runs.

## Prepare native artifacts

Export using the upstream recipe from an ExecuTorch checkout matching the Android AAR. Keep each model at the exact revision listed in `model-pocs.json`; save the source revision, exporter commit, and artifact SHA-256 with device evidence. Never commit model artifacts or private audio.

| Model | Asset directory under `app/src/main/assets/models/` | Upstream recipe |
| --- | --- | --- |
| Parakeet TDT v3 | `parakeet_tdt_0_6b_v3/model.pte`, `tokenizer.model` | [ExecuTorch Parakeet XNNPACK exporter](https://github.com/pytorch/executorch/blob/main/examples/models/parakeet/README.md) |
| Whisper large-v3-turbo | `whisper_large_v3_turbo/model.pte`, `whisper_preprocessor.pte`, `tokenizer.json` | [ExecuTorch Whisper export and preprocessor](https://github.com/pytorch/executorch/blob/main/examples/models/whisper/README.md) |
| Qwen3 0.6B | `qwen3_0_6b/model.pte`, `tokenizer.json` | [ExecuTorch Qwen3 exporter](https://github.com/pytorch/executorch/blob/main/examples/models/qwen3/README.md) |
| Qwen3 1.7B | `qwen3_1_7b/model.pte`, `tokenizer.json` | [ExecuTorch Qwen3 exporter](https://github.com/pytorch/executorch/blob/main/examples/models/qwen3/README.md) |
| Qwen3 4B | `qwen3_4b/model.pte`, `tokenizer.json` | [ExecuTorch Qwen3 exporter](https://github.com/pytorch/executorch/blob/main/examples/models/qwen3/README.md) |

For immutable inputs, download a local Hugging Face snapshot with `hf download <model-id> --revision <full-revision> --local-dir <private-directory>`. Point the exporter at that directory where its CLI accepts a local path. **The upstream Parakeet script currently hardcodes an unpinned model ID in both `ASRModel.from_pretrained` and `hf_hub_download`.** Change both calls to use the listed revision, or use a locally pinned snapshot, and verify the generated artifact provenance before claiming it represents the listed revision. The Whisper exporter accepts a local model path through `--model`; the preprocessor must use `--feature_size 128` for large-v3-turbo. The Qwen3 `.pte` and tokenizer must come from the same revision and a compatible ExecuTorch release. Do not rename an unrelated exported model to satisfy the asset preflight.

## Android runtime

The default Gradle dependency is `org.pytorch:executorch-android:1.4.1` and supports the Qwen3 `LlmModule` path. It does **not** establish Parakeet or Whisper support. The [official Parakeet Android demo](https://github.com/meta-pytorch/executorch-examples/tree/main/parakeet/android/ParakeetApp) uses a custom AAR containing `ParakeetModule`; the [official Whisper Android demo](https://github.com/meta-pytorch/executorch-examples/tree/main/whisper/android/WhisperApp) says `AsrModule` is not yet released and requires an AAR with audio JNI bindings. Build or obtain an AAR from the same ExecuTorch source revision as your `.pte`, containing the needed binding, then set `executorchAar=/absolute/path/to/executorch.aar` in a local Gradle property or pass `-PexecutorchAar=/absolute/path/to/executorch.aar`. The project substitutes that AAR for Maven. An AAR with only the Parakeet binding does not enable Whisper; verify both classes before expecting both ASR paths to work in one build.

The app uses the dedicated Parakeet `transcribe(wavPath)` and Whisper `transcribe(wavPath, callback)` APIs through a narrow reflection boundary. If the custom bindings or required assets are absent, the UI shows `blocked`. It does not attempt to treat ASR `.pte` files as LLMs. Use a 16 kHz mono PCM16 RIFF/WAVE file through **Choose WAV**. Qwen3 takes a text prompt. Native tests must run on a physical Android device with its model artifacts and compatible AAR; host-only fixture success does not establish model quality, memory, latency, or offline execution evidence.

## Current validation limits

This source tree can be checked without weights. A full Gradle build requires Android SDK and dependency access; ASR device inference additionally requires custom JNI AARs and exported artifacts. Record these as blocked until a physical run proves them. Use the repository's benchmark evidence schema only after measured device execution; the app deliberately does not emit invented benchmark JSON.
