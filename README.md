# WorldGen / Worldline

**WorldGen is the canonical rendering/runtime repository for the Worldline master application.**

Worldline v0.2 combines a credential-free procedural 3D runtime with a free-first real-Earth view, explicit source provenance, navigable time, branching simulation, Cosmos, benchmark/export contracts, and B+ constitutional recursive research.

**Live production:** https://full-stack-assets.github.io/WorldGen/

See [`docs/WORLDLINE_RUNTIME.md`](docs/WORLDLINE_RUNTIME.md) for the runtime/evidence contract and [`docs/WORLDLINE_V0.2.md`](docs/WORLDLINE_V0.2.md) for v0.2 scope.

## v0.2 architecture

The application has six primary surfaces plus an evidence inspector:

- **World** — procedural worlds or the free Open Earth view.
- **Time** — Playback, Time Slice, Temporal Parallax, and Time Volume.
- **Futures** — deterministic branches for worlds with an attached simulation model.
- **Compare** — committed-state Difference Lens.
- **Data** — simulation metrics, planetary state, source/provenance state.
- **Library** — Earth, New Bedford World #001, Mars, Europa, generated/exoworld families, and Chronos export.
- **Mechanics** — lineage, provenance, benchmark adapters, recursive research receipts, and constitutional gates.

Worldline explicitly separates `OBSERVED`, `RECONSTRUCTED`, `SIMULATED`, `GENERATED`, and `SPECULATIVE` state. A world's physical identity and its rendered surface can carry different epistemic classes.

## Free-first Earth

v0.2 does **not** require Google, Cesium, Earth Engine, or any paid geospatial credential.

For New Bedford World #001, the app attempts a free Open Earth view using pinned MapLibre loaded at runtime with the OpenFreeMap Liberty style and OpenStreetMap/OpenMapTiles-derived geography. When the initial network map cannot be established, Worldline falls back to the existing procedural Three.js world without changing canonical world identity.

The provider/status strip shows the active rendering path and epistemic surface class. The Truth Lens makes observed/reconstructed/generated/simulated/speculative display state visually distinguishable.

The procedural renderer remains the guaranteed build-time/offline fallback. Runtime map/tile provider IDs never become branch or world IDs.

## New Bedford World #001

`public/data/new-bedford/` contains the first versioned real-city provenance package:

- `manifest.json` — publisher/source/license/coverage/checksum/status/transformation metadata.
- `snapshots.json` — source-time metadata separating observation, nearest observation, reconstruction, and simulation time.
- `geometry.geojson` — a small derived geographic coverage artifact, not a parcel-owner dataset.

The package references public City of New Bedford and MassGIS sources while intentionally excluding owner/address/person-level assessor information. Full MassGIS imagery/building/parcel datasets are not redistributed in this repository.

New Bedford remains labeled **RECONSTRUCTED**, not a complete photogrammetric or operational municipal digital twin.

## 3D / visual engine

The procedural WorldGen runtime includes:

- real-time 3D terrain mesh and biome/elevation displacement;
- ocean, sky, clouds, stars, fog, shadows, bloom, vignette, and chromatic effects;
- procedural vegetation and settlements;
- seed-based reproducible generation;
- Web Worker generation with synchronous fallback;
- Temporal Parallax markers and a luminous Chronos-style worldline trail.

The Open Earth runtime adds planet/city geographic navigation and attempts 3D building extrusion from the map's building source when available.

## Time and futures

New Bedford's current source timeline distinguishes a 2023 parcel-service baseline, 2025 aerial-source metadata, a 2026 reconstructed view, and later simulated time. Missing years are not presented as direct observations.

Open Earth Temporal Parallax renders labeled time planes so source-time and simulation-time states can coexist without erasing provenance.

WorldGen Prime retains deterministic branch simulation and scalable future representation:

- 1–2 branches: direct comparison
- 3–4: individual worldlines
- 5–50: Future Families
- 51–10,000: Future Landscape
- 10,001+: Future Continents

These are discrete scenario groupings, not calibrated probabilities. Worlds without an attached simulation model do not reuse WorldGen future metrics.

## Cosmos v0.2

Planetary state can represent radius, gravity, rotation/orbit periods, atmosphere, pressure description, temperature, radiation, illumination, light-time, reference frame, source-state metadata, and multiple habitability dimensions.

Mars and Europa are represented as **observed celestial identities** while their current local visual surfaces remain explicitly **generated**. The exoworld family remains speculative.

## Benchmark Lab

Worldline provides deterministic compatibility/export contracts for:

- **4DWorldBench-style** temporal render sequences;
- **Omni-WorldBench-style** ordered action/state-transition traces.

Benchmark receipts support `NOT_RUN`, `COMPLETED`, `FAILED`, and `INCOMPATIBLE`. Worldline refuses to attach a score unless the benchmark was actually executed to completion. Adapter readiness is not benchmark success.

## Recursive Research Engine

The B+ loop is:

`OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE/REJECT → MONITOR → REALITY WAKE → REOPEN`

v0.2 includes a concrete source-update conflict cycle with competing reconciliation candidates, a frozen evaluator established before candidate generation, separate generator/verifier identities, evaluator-drift blocking, rollback references, and promotion receipts.

Only reversible low-risk rendering/data-normalization changes are eligible for automatic promotion. Architecture, policy, model, authority, and scientific-claim changes remain gated.

Reality Wake is phrased epistemically: **the set of futures consistent with current evidence changed** — not "the future changed."

## Chronos Bridge

The Library can export `worldline-chronos-v0.2.json`, a deterministic provider-independent interchange package containing world identity, spatial reference, selected time, branch ancestry, events, metrics, seeds, evidence/fidelity labels, and replay commitments.

This prepares a future Unreal/Cesium Chronos runtime without pretending v0.2 includes a shipping Unreal build.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Verification

```bash
npm run typecheck
npm test
npm run build
```

CI runs the same type-check/test/build gates on pull requests and `main`. GitHub Pages deploys automatically from `main` with `VITE_BASE=/WorldGen/`.

## Optional AI lore

The original Gemini-powered lore feature remains optional. The simulation/Earth runtime does not require an AI key. Set `VITE_GEMINI_API_KEY` or use the existing in-app configuration only if you want lore generation.

## Evidence boundary

Worldline v0.2 does not claim calibrated future probabilities, forecasting accuracy, a fully validated New Bedford digital twin, realistic interacting populations, formal manifold geometry, executed external benchmark scores without receipts, observed exoplanet surfaces without evidence, or unrestricted self-modification. Open data/providers are visual and evidence substrates; canonical Worldline state remains provider-independent.

## License

MIT
