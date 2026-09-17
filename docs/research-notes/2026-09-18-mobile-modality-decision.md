# Mobile modality decision — 2026-09-18

## Decision

The POC lane contains exactly three models overall, without a quota for category diversity:

1. `Qwen/Qwen3-0.6B` — revision `a9c98e602b9d36d2a2f7ba1eb0f5f31e4e8e5143`
2. `Qwen/Qwen3-1.7B` — revision `70d244cc86ccca08cf5af4e1e306ecf908b1ad5e`
3. `Qwen/Qwen3-4B` — revision `1cfa9a7`

These are the only exact Hugging Face repository/revision records in the current inventory with direct Apple Core AI iOS evidence and direct ExecuTorch Android evidence. They are research candidates, not device-proven ready models.

## Ranking rubric

Each candidate is scored out of 30 using six explicit factors scored 0–5: exact two-platform evidence, research value, size/latency practicality, runtime maturity, license, and integration effort. The resulting scores are 27.5, 26.5, and 22.5 respectively. Size/latency scores are feasibility judgments from parameter scale, not measured device benchmarks; no latency or memory claim is made until a physical run emits validated evidence.

## Modality review

Discovery covered text generation, vision-language/image-to-text, OCR and computer vision, speech recognition/audio-language, text-to-speech, embeddings, image generation, and segmentation/detection. Apple’s Core AI catalog currently describes VLM, vision, audio, diffusion, and text families, while ExecuTorch documents multimodal text/image/audio runners and Android backends. Those family-level capabilities are useful leads, but they do not prove that one exact Hugging Face repository and immutable revision is deployable on both target phones.

The selected lane is therefore intentionally text-only. A future modality can displace a current candidate only after the same exact-ID/revision gate is met and its score is higher; category diversity is never an admission criterion.

Evidence used for the modality boundary:

- [Apple Core AI Models catalog](https://github.com/apple/coreai-models/blob/main/models/README.md)
- [ExecuTorch Android LLM and multimodal API](https://github.com/pytorch/executorch/blob/main/docs/source/llm/run-on-android.md)
- [ExecuTorch model/runtime overview](https://github.com/pytorch/executorch)

## Implementation consequence

`tools/research/model-registry.mjs` is the source of truth for POC adapters and resolves only the three verified records from the dated inventory. `pocs/cross-platform-adapter/runner.mjs` exposes reusable `ModelAdapterStrategy` and a deterministic fixture adapter for both platform boundaries. The fixture remains `blocked` by design: native iPhone/Core AI and Android/ExecuTorch runs must supply the exported artifact, device manifest, no-network evidence, and benchmark result.
