# Manual mobile-model research run — 2026-09-27

The populated Google Sheet source was reviewed through `Consolidated_Models`; the dated `2026-09-25` and `2026-09-26` tabs were empty in the authenticated sheet view. No new sheet lead had enough exact, primary iOS and Android evidence to replace the current shortlist.

The inventory remains six source-verified cross-platform records. The ranked POC selection is unchanged:

1. `nvidia/parakeet-tdt-0.6b-v3@541d1f99c6b0c3cd0b11a95167540bb8edefd82b`
2. `Qwen/Qwen3-0.6B@a9c98e602b9d36d2a2f7ba1eb0f5f31e4e8e5143`
3. `Qwen/Qwen3-1.7B@70d244cc86ccca08cf5af4e1e306ecf908b1ad5e`

`Qwen/Qwen3-4B@1cfa9a7208912126459214e8b04321603b3df60c` remains source-verified but below the top three for device practicality. The native no-weight POCs cover the verified set plus experimental Whisper and Qwen3-VL lanes in [devices/ios](../../devices/ios) and [devices/android](../../devices/android). iOS fixture smoke and Swift parsing pass; Android fixture smoke passes, while Android compilation and both physical-device lanes remain blocked by missing Android tooling, exported assets, JNI AARs where required, and devices. No latency, memory, WER, or quality measurements were claimed.

This run corrected four runtime-source evidence entries so ExecuTorch documentation no longer appears to pin HF revisions that it does not pin: Qwen3 1.7B, Qwen3 4B, Llama 3.2 1B, and Parakeet TDT v3. The HF records remain the immutable revision source. The Mobile App Builder reviewer was unavailable at model capacity; the AI Engineer and ECC architect reviews found no additional qualifying candidate or required code change.

Validation passed: `npm test`, `npm run validate`, `npm run research:validate`, `npm run research:preflight`, `npm run research:poc-status`, `npm run research:registry:validate`, `npm run devices:validate`, `npm run devices:smoke`, `npm run normalize`, `npm run native:check`, and `git diff --check`.
