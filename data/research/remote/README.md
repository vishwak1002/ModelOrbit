# Remote research snapshots

These snapshots are collected by the credential-free GitHub Actions workflow in `.github/workflows/mobile-llm-research.yml`.

The collector uses only public endpoints and does not require OpenAI API credits, repository secrets, model weights, or private device data. It records normalized Hugging Face model leads, official runtime repository metadata, and public community signals from Hacker News, Reddit, and Bluesky.

The three-model shortlist is a transparent popularity-plus-mobile-signal heuristic. It is not a readiness claim and must not be copied into the verified inventory without manual review of exact Hugging Face revisions and primary Apple Core AI/ExecuTorch evidence.

If a source is unavailable, its error remains visible in the snapshot. If every source is unavailable, the collector exits non-zero and the workflow does not commit a replacement snapshot.
