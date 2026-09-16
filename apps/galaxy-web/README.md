# Galaxy web

The web app is a read-only projection of normalized model records and validated evidence. It must not download model weights or infer readiness from UI heuristics.

The first screen is an app-style research workspace: galaxy canvas, evidence inspector, filters, comparison links, and an accessible list/table mirror.

## Run locally

From the repository root:

```bash
node tools/normalize-snapshot.mjs
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/apps/galaxy-web/`. The browser needs a local HTTP server because the app fetches the normalized snapshot.
