# Local iOS model bundles

Xcode copies this `Models` folder into the app. Add only locally converted assets; model weights and compiled binaries are ignored by Git.

| Folder | Required runtime format | Source checkpoint |
| --- | --- | --- |
| `parakeet_tdt_0_6b_v3/` | Apple Core AI Parakeet bundle: `metadata.json`, `encoder`, `decoder_step`, `joint` `.aimodel` assets, processor | `nvidia/parakeet-tdt-0.6b-v3@541d1f99c6b0c3cd0b11a95167540bb8edefd82b` |
| `qwen3_0_6b/` | Apple Core AI language bundle with `.aimodel`, tokenizer, `metadata.json` | `Qwen/Qwen3-0.6B@a9c98e602b9d36d2a2f7ba1eb0f5f31e4e8e5143` |
| `qwen3_1_7b/` | Apple Core AI language bundle with `.aimodel`, tokenizer, `metadata.json` | `Qwen/Qwen3-1.7B@70d244cc86ccca08cf5af4e1e306ecf908b1ad5e` |
| `qwen3_4b/` | Apple Core AI language bundle with `.aimodel`, tokenizer, `metadata.json` | `Qwen/Qwen3-4B@1cfa9a7208912126459214e8b04321603b3df60c` |
| `smollm2_135m_instruct/` | Apple Core AI iOS language bundle with `.aimodel`, tokenizer, `metadata.json` | `HuggingFaceTB/SmolLM2-135M-Instruct@12fd25f77366fa6b3b4b768ec3050bf629380bac` |
| `llama_3_2_1b_instruct/` | ExecuTorch `llama_3_2_1b_instruct.pte` and `tokenizer.model` from the same pinned source snapshot | `meta-llama/Llama-3.2-1B-Instruct@9213176726f574b556790deb65791e0c5aa438b6` |
| `whisper_large_v3_turbo/` | WhisperKit Core ML folder, including tokenizer and encoder/decoder resources | `openai/whisper-large-v3-turbo@41f01f3fe87f28c78e2fbf8b568835947dd65ed9` |
| `qwen3_vl_2b/` | Apple Core AI `kind=vlm` bundle with `main`, `embedding`, `vision`, tokenizer, `metadata.json` | `Qwen/Qwen3-VL-2B-Instruct@89644892e4d85e24eaac8bacfd4f463576704203` |

An asset is not considered the pinned checkpoint merely because its folder has this name. Record the source snapshot SHA, converter commit, parameters, output hashes, and license in the run evidence before interpreting native output as evidence for that exact revision. The app does not make network requests to fetch models. WhisperKit's public preconverted Turbo variant is not assumed to equal the pinned Hugging Face revision.
