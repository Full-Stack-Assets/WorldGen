# Worldline v0.3 — Earth Native

Worldline v0.3 promotes the free-Earth/New Bedford path from an adapter demonstration into a first-class evidence-aware Earth mode.

## What changed

- Added a pure Earth provider-health runtime with `READY`, `DEGRADED`, `UNAVAILABLE`, and `FALLBACK` states.
- Open Earth failures now carry an explicit reason and transition to the procedural WorldGen renderer without changing canonical world or branch state.
- Added a deterministic New Bedford source timeline covering the packaged 2023, 2025, and reconstructed 2026 evidence states.
- Separated **SOURCE TIME** from **SIMULATION TIME** in the Time surface. Source-time selection inspects evidence history; simulation time moves the active worldline.
- Source-time gaps are not silently interpolated.
- Added a free-Earth globe-projection preference when the loaded MapLibre runtime supports it, with Mercator fallback.
- Expanded Source & Provenance inspection to show the packaged source-time history and to state explicitly that no live municipal operations feed is attached.
- Provider health is visible in the top status strip.

## Evidence boundary

New Bedford World #001 remains `RECONSTRUCTED`. The free Open Earth surface is based on open geographic/vector sources and is not claimed to be photogrammetric observation. The local provenance package stores source metadata and selected safe derived geometry; it is not a full municipal digital twin and does not include parcel-owner PII.

Source time and simulation time are deliberately independent. Selecting a 2023 or 2025 observation does not rewrite a 2035 or 2040 simulation branch, and moving a simulation branch into the future does not create an observation that never existed.

## Failure behavior

If the free network map cannot establish its initial surface, Worldline falls back to the credential-free procedural renderer. The requested provider, active provider, health state, and failure reason remain visible. Retrying Open Earth clears the local failure state and attempts the free provider again.

## Release gate

v0.3 is accepted only after the exact branch head passes type-check, the full Vitest suite, production build, merge-to-main verification, and the GitHub Pages production deploy.