# iOS on-device POCs

Open `ModelOrbitDevices.xcodeproj` in Xcode 27+ and run on an iOS 27+ iPhone. The app has a fixture switch for every catalog record and a native path for each modality. Fixture output is deterministic plumbing only; it is never labeled as model inference. Native output also does not claim a quality or latency benchmark.

Run the no-weights smoke test on macOS:

```sh
sh devices/ios/Tests/run-fixture-smoke.sh
```

The Xcode project uses Apple's [`coreai-models`](https://github.com/apple/coreai-models) `CoreAILM` and `CoreAISpeech` products, Argmax's [`WhisperKit`](https://github.com/argmaxinc/argmax-oss-swift), and [ExecuTorch](https://docs.pytorch.org/executorch/stable/using-executorch-ios.html) `executorch_llm` with XNNPACK and CPU kernels. The Core AI dependency is pinned to commit `e7b24da85ea64a77d26324d7ce9607de9b955f57`; WhisperKit uses the 1.x package line; ExecuTorch uses the official `swiftpm-1.5.1` branch. Dependencies are build-time only. Native runs read local files and local model bundles.

## Prepare model artifacts

Download each source checkpoint at the exact revision in `model-pocs.json` into a local conversion workspace. Save `huggingface-cli` or `hf download --revision <sha>` output and hash the exported bundle. Do not add weight files to Git.

- **Parakeet:** Apple's [Parakeet recipe](https://github.com/apple/coreai-models/tree/main/models/parakeet) exports the three-model speech bundle with `uv run models/parakeet/export.py --model nvidia/parakeet-tdt-0.6b-v3 --dtype float16 --output-dir <local-output>`. Confirm the exporter actually reads the pinned snapshot; the stock model-name option does not itself guarantee a revision. Add the complete bundle as `Resources/Models/parakeet_tdt_0_6b_v3/`. The app calls `SpeechRecognitionModel(resourcesAt:)` and `transcribe(audioURL:)`.
- **Qwen3 0.6B, 1.7B, and 4B:** Follow Apple's [iOS Qwen3 export](https://github.com/apple/coreai-models/blob/main/models/README.md): `uv run coreai.llm.export <model-id> --platform iOS --max-context-length 4096`. Use each exact ID and revision from `model-pocs.json`, confirm the input snapshot revision, and add complete bundles as `Resources/Models/qwen3_0_6b/`, `qwen3_1_7b/`, and `qwen3_4b/`. The app uses `CoreAILanguageModel` and `LanguageModelSession`. Device memory and speed for the larger variants are unmeasured.
- **SmolLM2 135M Instruct:** Apple's [SmolLM2 recipe](https://github.com/apple/coreai-models/blob/main/models/smollm2/README.md) lists this variant for iOS and uses `CoreAILanguageModel` with `LanguageModelSession`. Obtain `HuggingFaceTB/SmolLM2-135M-Instruct` at revision `12fd25f77366fa6b3b4b768ec3050bf629380bac`, then export from that verified snapshot using `uv run coreai.llm.export HuggingFaceTB/SmolLM2-135M-Instruct --platform iOS --max-context-length 4096`. The model ID alone does not pin the input: verify that the exporter loaded the pinned snapshot before using the resulting bundle. Add the complete output as `Resources/Models/smollm2_135m_instruct/`. The native adapter is wired, but the export and device run are unverified.
- **Llama 3.2 1B Instruct:** Accept the model's license and fetch the exact `meta-llama/Llama-3.2-1B-Instruct@9213176726f574b556790deb65791e0c5aa438b6` snapshot, including `original/consolidated.00.pth`, `original/params.json`, and `original/tokenizer.model`. Follow the [ExecuTorch Llama export recipe](https://github.com/pytorch/executorch/blob/main/examples/models/llama/README.md) with matching 1.5.1 export tools:

  ```sh
  LLAMA_SNAPSHOT=/path/to/pinned-snapshot
  hf download meta-llama/Llama-3.2-1B-Instruct \
    --revision 9213176726f574b556790deb65791e0c5aa438b6 \
    --local-dir "$LLAMA_SNAPSHOT"
  python -m extension.llm.export.export_llm \
    --config examples/models/llama/config/llama_bf16.yaml \
    +base.model_class=llama3_2 \
    +base.checkpoint="$LLAMA_SNAPSHOT/original/consolidated.00.pth" \
    +base.params="$LLAMA_SNAPSHOT/original/params.json"
  ```

  This BF16 path preserves the pinned source checkpoint; a separate SpinQuant or QAT checkpoint is not presumed identical. Add the generated `.pte` as `Resources/Models/llama_3_2_1b_instruct/llama_3_2_1b_instruct.pte` and the snapshot tokenizer as `Resources/Models/llama_3_2_1b_instruct/tokenizer.model`. The app uses [ExecuTorch `TextLLMRunner`](https://github.com/pytorch/executorch/blob/main/docs/source/llm/run-on-ios.md) with a Llama Instruct chat prompt. XNNPACK export, package resolution, native build, memory, speed, and iPhone output are unverified here.
- **Whisper large-v3-turbo:** Use [whisperkittools](https://github.com/argmaxinc/whisperkittools) to convert the pinned source snapshot to a WhisperKit Core ML folder, then add it as `Resources/Models/whisper_large_v3_turbo/`. The app calls WhisperKit with `download: false`. Apple's standalone Whisper `.aimodel` export is a logits graph without the speech decoding pipeline and cannot be substituted for this folder. Argmax's preconverted hosted variant has unverified source-revision equivalence for this record.
- **Qwen3-VL 2B:** Apple's [VLM exporter](https://github.com/apple/coreai-models/blob/main/models/README.md) produces `kind=vlm` via `uv run coreai.vlm.export qwen3-vl`. Confirm the source revision and add the complete bundle as `Resources/Models/qwen3_vl_2b/`. The experimental adapter follows Apple's `llm-runner` image encoding and generation flow. Apple's exporter currently documents no `--platform iOS` target; the Swift route has not compiled on Xcode 27 here, and iPhone conversion and execution remain blocked until an iOS build and physical run succeed.

## Validation state

The fixture smoke test proves catalog, modality input routing, and no-weight output. `plutil -lint` checks Xcode project syntax. This host has Xcode 26.4.1, so it cannot compile the iOS 27 Core AI app or produce physical-device inference evidence. On an iOS 27 device, run each locally exported bundle with a representative input, check nonempty output, and record the exact bundle hashes, runtime result, and device manifest before reporting a model as working. Qwen3-VL may remain blocked if Apple's export cannot produce an iPhone-compatible bundle.
