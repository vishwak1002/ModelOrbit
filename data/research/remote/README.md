# Remote research snapshots

These snapshots are collected by `npm run research:remote:collect` during the daily Codex research task. The GitHub Actions workflow validates committed research and POC work; it does not collect or publish snapshots on a schedule.

The collector uses only public endpoints and does not require OpenAI API credits, repository secrets, model weights, or private device data. It records normalized Hugging Face model leads across text, vision-language, OCR, audio/speech, TTS, embeddings, image generation, detection, and segmentation searches, plus official runtime repository metadata and public community signals from Hacker News, Reddit, and Bluesky.

The three-model shortlist is a transparent popularity-plus-mobile-signal heuristic. It is not a readiness claim and must not be copied into the verified inventory without manual review of exact Hugging Face revisions and primary Apple Core AI/ExecuTorch evidence.

If a source is unavailable, its error remains visible in the snapshot. If every source is unavailable, the collector exits non-zero without replacing the last valid snapshot.

Snapshots use a semantic fingerprint so repeated observations with no normalized content change preserve the existing dated file. A daily run publishes a snapshot only together with validated POC implementation work.
