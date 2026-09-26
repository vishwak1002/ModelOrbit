# iOS on-device POCs

Open `ModelOrbitDevices.xcodeproj` in Xcode 27+ and run on an iOS 27+ iPhone. The app has a fixture switch for all six model records and a native path for each modality. Fixture output is deterministic plumbing only; it is never labeled as model inference. Native output also does not claim a quality or latency benchmark.

Run the no-weights smoke test on macOS:

```sh
sh devices/ios/Tests/run-fixture-smoke.sh
```

The Xcode project uses Apple's [`coreai-models`](https://github.com/apple/coreai-models) `CoreAILM` and `CoreAISpeech` products and Argmax's [`WhisperKit`](https://github.com/argmaxinc/argmax-oss-swift) product. The Core AI dependency is pinned to commit `e7b24da85ea64a77d26324d7ce9607de9b955f57`; WhisperKit uses the 1.x package line. Dependencies are build-time only. Native runs read local files and local model bundles.

## Prepare model artifacts

Download each source checkpoint at the exact revision in `model-pocs.json` into a local conversion workspace. Save `huggingface-cli` or `hf download --revision <sha>` output and hash the exported bundle. Do not add weight files to Git.

- **Parakeet:** Apple's [Parakeet recipe](https://github.com/apple/coreai-models/tree/main/models/parakeet) exports the three-model speech bundle with `uv run models/parakeet/export.py --model nvidia/parakeet-tdt-0.6b-v3 --dtype float16 --output-dir <local-output>`. Confirm the exporter actually reads the pinned snapshot; the stock model-name option does not itself guarantee a revision. Add the complete bundle as `Resources/Models/parakeet_tdt_0_6b_v3/`. The app calls `SpeechRecognitionModel(resourcesAt:)` and `transcribe(audioURL:)`.
- **Qwen3 0.6B, 1.7B, and 4B:** Follow Apple's [iOS Qwen3 export](https://github.com/apple/coreai-models/blob/main/models/README.md): `uv run coreai.llm.export <model-id> --platform iOS --max-context-length 4096`. Use each exact ID and revision from `model-pocs.json`, confirm the input snapshot revision, and add complete bundles as `Resources/Models/qwen3_0_6b/`, `qwen3_1_7b/`, and `qwen3_4b/`. The app uses `CoreAILanguageModel` and `LanguageModelSession`. Device memory and speed for the larger variants are unmeasured.
- **Whisper large-v3-turbo:** Use [whisperkittools](https://github.com/argmaxinc/whisperkittools) to convert the pinned source snapshot to a WhisperKit Core ML folder, then add it as `Resources/Models/whisper_large_v3_turbo/`. The app calls WhisperKit with `download: false`. Apple's standalone Whisper `.aimodel` export is a logits graph without the speech decoding pipeline and cannot be substituted for this folder. Argmax's preconverted hosted variant has unverified source-revision equivalence for this record.
- **Qwen3-VL 2B:** Apple's [VLM exporter](https://github.com/apple/coreai-models/blob/main/models/README.md) produces `kind=vlm` via `uv run coreai.vlm.export qwen3-vl`. Confirm the source revision and add the complete bundle as `Resources/Models/qwen3_vl_2b/`. The experimental adapter follows Apple's `llm-runner` image encoding and generation flow. Apple's exporter currently documents no `--platform iOS` target; the Swift route has not compiled on Xcode 27 here, and iPhone conversion and execution remain blocked until an iOS build and physical run succeed.

## Validation state

The fixture smoke test proves catalog, modality input routing, and no-weight output. `plutil -lint` checks Xcode project syntax. This host has Xcode 26.4.1, so it cannot compile the iOS 27 Core AI app or produce physical-device inference evidence. On an iOS 27 device, run each locally exported bundle with a representative input, check nonempty output, and record the exact bundle hashes, runtime result, and device manifest before reporting a model as working. Qwen3-VL may remain blocked if Apple's export cannot produce an iPhone-compatible bundle.
