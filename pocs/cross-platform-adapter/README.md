# Cross-platform adapter fixture POC

This small POC exercises the shared model-registry and adapter-strategy boundary without downloading model weights. It is the runnable contract test for the three verified exact model revisions in [`data/research/mobile-llm-inventory-2026-09-17.json`](../../data/research/mobile-llm-inventory-2026-09-17.json).

```sh
npm run poc:fixture -- --mock --model-id Qwen/Qwen3-0.6B --platform both
```

The fixture deliberately returns `blocked`: its response is deterministic plumbing, not model inference, and it does not claim latency, memory, network, or quality evidence. The iOS strategy boundary is a Core AI/Core ML-compatible export loaded on a physical iPhone; the Android strategy boundary is an ExecuTorch `.pte` export loaded on a physical Android device. The native POCs remain the place to attach device manifests and benchmark artifacts.
