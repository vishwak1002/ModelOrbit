# Mobile modality decision — 2026-09-18

Historical decision: the cross-platform claims for Qwen3-VL below were corrected on 2026-09-26. See [native feasibility correction](2026-09-26-native-feasibility-correction.md) and the current inventory before using this selection.

## Decision

The verified intersection now contains six exact repository/revision records. The POC lane contains exactly three genuinely new models, without a quota for category diversity and without repeating the prior Qwen3 text-only POC selection:

1. `nvidia/parakeet-tdt-0.6b-v3` — revision `541d1f99c6b0c3cd0b11a95167540bb8edefd82b`, speech recognition, score 27.5
2. `Qwen/Qwen3-VL-2B-Instruct` — revision `89644892e4d85e24eaac8bacfd4f463576704203`, vision-language, score 26.5
3. `openai/whisper-large-v3-turbo` — revision `41f01f3fe87f28c78e2fbf8b568835947dd65ed9`, speech recognition, score 25.5

The earlier `Qwen/Qwen3-0.6B`, `Qwen/Qwen3-1.7B`, and `Qwen/Qwen3-4B` records remain verified inventory entries and remain available for a future selection, but they are not repeated in this daily POC selection. All six are research candidates, not device-proven ready models.

## Ranking rubric

Each candidate is scored out of 30 using six explicit factors scored 0–5: exact two-platform evidence, research value, size/latency practicality, runtime maturity, license, and integration effort. The resulting scores are 27.5, 26.5, and 25.5 respectively. Size/latency scores are feasibility judgments from parameter scale, not measured device benchmarks; no latency or memory claim is made until a physical run emits validated evidence.

## Modality review

Discovery covered text generation, vision-language/image-to-text, OCR and computer vision, speech recognition/audio-language, text-to-speech, embeddings, image generation, and segmentation/detection. Apple’s Core AI catalog currently describes VLM, vision, audio, diffusion, and text families, while ExecuTorch documents multimodal text/image/audio runners and Android backends. Those family-level capabilities are useful leads, but they do not prove that one exact Hugging Face repository and immutable revision is deployable on both target phones.

The selected lane is therefore limited to the three highest-ranked new records that clear the exact-ID/revision gate. A future modality can displace a current candidate only after the same gate is met and its score is higher; category diversity is never an admission criterion.

Evidence used for the modality boundary:

- [Apple Core AI Models catalog](https://github.com/apple/coreai-models/blob/main/models/README.md)
- [ExecuTorch Android LLM and multimodal API](https://github.com/pytorch/executorch/blob/main/docs/source/llm/run-on-android.md)
- [ExecuTorch model/runtime overview](https://github.com/pytorch/executorch)
- [Apple Parakeet TDT exporter](https://github.com/apple/coreai-models/blob/main/models/parakeet/export.py)
- [Apple Whisper exporter](https://github.com/apple/coreai-models/blob/main/models/whisper/export.py)
- [ExecuTorch Parakeet example](https://github.com/pytorch/executorch/blob/main/examples/models/parakeet/README.md)
- [ExecuTorch Whisper example](https://github.com/pytorch/executorch/blob/main/examples/models/whisper/README.md)
- [Optimum ExecuTorch Qwen3-VL export discussion](https://github.com/huggingface/optimum-executorch/pull/214)

## Implementation consequence

`tools/research/model-registry.mjs` is the source of truth for POC adapters and resolves the three ranked records from `pocSelection`. `pocs/cross-platform-adapter/runner.mjs` exposes reusable `ModelAdapterStrategy` and a deterministic, modality-aware fixture adapter for both platform boundaries. The fixture remains `blocked` by design: native iPhone/Core AI and Android/ExecuTorch runs must supply the exported artifact, device manifest, no-network evidence, and benchmark result.
