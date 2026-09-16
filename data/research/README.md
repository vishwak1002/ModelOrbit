# Mobile LLM research data

`mobile-llm-inventory-2026-09-17.json` is the dated, evidence-backed discovery inventory for generative text LLMs considered for native iOS and Android execution.

The inventory distinguishes exact same-repository/same-revision intersections from runtime-family claims, platform-only support, exclusions, and deduplicated artifact variants. A record is `verified` only when primary Apple Core AI and PyTorch ExecuTorch evidence covers the same canonical Hugging Face repository and immutable revision.

Regenerate and validate the derived status artifacts with:

```text
npm run research:validate
npm run research:preflight
npm run research:poc-status
```

Weights and private device data do not belong in this directory. Device availability is recorded separately in `data/devices/`.
