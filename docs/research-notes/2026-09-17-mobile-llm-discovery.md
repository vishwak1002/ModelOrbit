# Mobile LLM discovery — 2026-09-17

## Decision

The scoped discovery found 15 records: 3 verified exact cross-platform candidates, 7 claimed-but-unverified records, 4 exclusions, and 1 deduplicated artifact variant. The verified intersection is:

| Model repository | Revision | iOS evidence | Android evidence |
|---|---|---|---|
| `Qwen/Qwen3-0.6B` | `a9c98e602b9d36d2a2f7ba1eb0f5f31e4e8e5143` | Apple Core AI Qwen3 recipe | ExecuTorch Qwen3 example and mobile app path |
| `Qwen/Qwen3-1.7B` | `70d244cc86ccca08cf5af4e1e306ecf908b1ad5e` | Apple Core AI Qwen3 recipe | ExecuTorch Qwen3 example and mobile app path |
| `Qwen/Qwen3-4B` | `1cfa9a7` | Apple Core AI Qwen3 recipe | ExecuTorch Qwen3 example and mobile app path |

The inventory is intentionally conservative: “verified” means the same canonical Hugging Face repository and immutable revision have primary evidence on both runtime lanes. It does not mean that a physical-device benchmark has passed.

## Primary evidence

- Apple Core AI model catalog and runtime requirements: <https://github.com/apple/coreai-models>
- Apple Qwen3 model recipe, including iOS support and export commands: <https://github.com/apple/coreai-models/blob/main/models/qwen3/README.md>
- Apple Qwen2.5 recipe: <https://github.com/apple/coreai-models/blob/main/models/qwen2/README.md>
- Apple SmolLM2 recipe: <https://raw.githubusercontent.com/apple/coreai-models/main/models/smollm2/README.md>
- Apple Phi recipe, where the listed Phi variants are iOS unsupported: <https://raw.githubusercontent.com/apple/coreai-models/main/models/phi/README.md>
- Apple Gemma3 recipe, where the listed Gemma3 variants are iOS unsupported: <https://raw.githubusercontent.com/apple/coreai-models/main/models/gemma3/README.md>
- Apple Mistral recipe: <https://raw.githubusercontent.com/apple/coreai-models/main/models/mistral/README.md>
- ExecuTorch LLM export guide and supported model families: <https://github.com/pytorch/executorch/blob/main/docs/source/llm/export-llm.md>
- ExecuTorch Qwen3 example, exact model sources, export commands, and mobile app path: <https://github.com/pytorch/executorch/blob/main/examples/models/qwen3/README.md>
- ExecuTorch Llama Android/iOS app path: <https://github.com/pytorch/executorch/blob/main/examples/models/llama/README.md>
- ExecuTorch source mapping for Qwen3, Qwen2.5, Phi-4 mini, and SmolLM2: <https://github.com/pytorch/executorch/blob/main/examples/models/llama/export_llama_lib.py>
- Hugging Face ExecuTorch quickstart: <https://huggingface.co/docs/optimum-executorch/quickstart>

## Interpretation and exclusions

- Qwen2.5 1.5B Instruct and SmolLM2 Instruct are strong iOS-family claims, but the Android evidence maps to a base or different exact artifact/revision, so they remain claimed-but-unverified.
- SmolLM2 360M and 1.7B have Apple Core AI family recipes, but no exact Android artifact/revision was established in this discovery.
- Mistral 7B is listed by Apple for iOS with a memory warning, but no matching Android evidence was established.
- Llama 3.2 1B Instruct has Android/ExecuTorch evidence, but no exact Apple Core AI recipe was established.
- Phi-4 mini and Gemma3 4B are excluded because the Apple recipes explicitly mark the listed variants as unsupported on iOS.
- GPT-2 is a generative baseline but was not admitted as a current Apple Core AI + ExecuTorch intersection. MiniLM is an encoder/similarity model, not a generative text LLM.
- `executorch-community/SmolLM2-135M` is retained as a deduplicated exported artifact variant of `HuggingFaceTB/SmolLM2-135M`, not as a second canonical candidate.

## Reproduction and current blockers

The inventory and derived artifacts are reproducible with `npm run research:validate`, `npm run research:preflight`, and `npm run research:poc-status`. The three candidate POC entries are built as fail-closed harness records; no inference run or benchmark is claimed.

The current device manifest records Xcode 26.4.1, iOS SDK 26.4, and no physical iPhone. Apple Core AI's repository currently documents the iOS 27/Xcode 27 requirement. The host also has no Android SDK, ADB, Gradle, Java, Kotlin toolchain, or Android device. These conditions produce explicit `blocked` rows in `data/preflight/research-2026-09-17.json` and `evidence/runs/research-poc-status.json`. The native projects are nevertheless complete enough to open, install their dependencies, add local model assets, and run on the procured devices.

Exact records and source claims are in [`data/research/mobile-llm-inventory-2026-09-17.json`](../../data/research/mobile-llm-inventory-2026-09-17.json).
