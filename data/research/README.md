# On-device model research data

`mobile-llm-inventory-2026-09-17.json` is the evidence-backed inventory for models considered for on-device iOS and Android execution. The filename retains its original date; later evidence corrections are recorded in `docs/research-notes/`.

The inventory distinguishes exact same-repository/same-revision intersections from runtime-family claims, platform-only support, exclusions, and deduplicated artifact variants. A record is `verified` only when primary documentation establishes an on-device iPhone and Android path for the same canonical Hugging Face repository and immutable revision. Eligible modalities include text, vision, speech, OCR, audio, and embeddings; the runtime need not be Core AI or ExecuTorch when another primary-backed on-device implementation exists.

`remote/` holds dated discovery snapshots. A snapshot's popularity score or mobile signal is a lead, not proof that an exact revision works on both phones. Review its model, format, license, preprocessing, and native runtime before admitting it to the verified intersection.

Regenerate and validate the derived status artifacts with:

```text
npm run research:validate
npm run research:preflight
npm run research:poc-status
```

Weights and private device data do not belong in this directory. Device availability is recorded separately in `data/devices/`.
