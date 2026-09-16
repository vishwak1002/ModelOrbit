# Galaxy web

The web app is a read-only projection of normalized model records and validated evidence. It must not download model weights or infer readiness from UI heuristics.

The first screen is an app-style research workspace: galaxy canvas, evidence inspector, filters, comparison links, and an accessible list/table mirror.

## Run locally

From the repository root:

```bash
node tools/normalize-snapshot.mjs
node tools/preflight/run-preflight.mjs
node tools/build-read-model.mjs
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/apps/galaxy-web/`. The browser needs a local HTTP server because the app fetches the normalized snapshot.

Comparison links use `?schema=0.2.0&models=owner%2Fmodel,owner%2Fother&lens=both&pipeline=all`. Unknown model IDs and future schema versions render a recoverable invalid-link banner.
