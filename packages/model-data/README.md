# Model data

This package reads immutable snapshots, normalizes source records, preserves freshness and checksums, and produces the compact read model consumed by the galaxy.

Model identity is `hf_repo_id + immutable revision`. A platform artifact never changes the identity.
