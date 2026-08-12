# WorldGen / Worldline

**WorldGen is the canonical rendering/runtime repository for the Worldline master application.**

Worldline v0.5 combines a credential-free procedural 3D runtime, free-first real-Earth mode, explicit provider health, twin source/simulation timelines, branching simulation, Cosmos, benchmark/export contracts, and a durable B+ Discovery Engine.

**Live production:** https://full-stack-assets.github.io/WorldGen/

See [`docs/WORLDLINE_RUNTIME.md`](docs/WORLDLINE_RUNTIME.md), [`docs/WORLDLINE_V0.2.md`](docs/WORLDLINE_V0.2.md), [`docs/WORLDLINE_V0.3.md`](docs/WORLDLINE_V0.3.md), and [`docs/WORLDLINE_V0.5.md`](docs/WORLDLINE_V0.5.md).

## Primary surfaces

- **World** — procedural worlds or the free Open Earth view.
- **Time** — Playback, Time Slice, Temporal Parallax, Time Volume, plus independent source-time inspection for New Bedford.
- **Futures** — deterministic branches for worlds with an attached simulation model.
- **Compare** — committed-state Difference Lens.
- **Data** — simulation metrics, planetary state, source/provenance state.
- **Library** — Earth, New Bedford World #001, Mars, Europa, generated/exoworld families, and Chronos export.
- **Mechanics** — lineage, provenance, benchmark adapters, Discovery Engine receipts, Model Worldline, and constitutional gates.

Worldline explicitly separates `OBSERVED`, `RECONSTRUCTED`, `SIMULATED`, `GENERATED`, and `SPECULATIVE` state. A world's physical identity and its rendered surface can carry different epistemic classes.

## Free-first Earth

No Google, Cesium, Earth Engine, or paid geospatial credential is required. New Bedford World #001 attempts a free Open Earth view using pinned MapLibre loaded at runtime with OpenFreeMap/OpenStreetMap-derived geography. It prefers globe projection when supported and safely falls back to Mercator.

Provider health is explicit: `READY`, `DEGRADED`, `UNAVAILABLE`, or `FALLBACK`. When the initial network map cannot be established, Worldline falls back to the procedural Three.js renderer without changing canonical world identity, branch ancestry, or simulation state.

The Truth Lens visually distinguishes observed/reconstructed/generated/simulated/speculative display state. Runtime provider IDs never become canonical branch or world IDs.

## New Bedford World #001

`public/data/new-bedford/` contains a privacy-minimized real-city provenance package:

- `manifest.json` — publisher/source/license/coverage/checksum/status/transformation metadata.
- `snapshots.json` — source-time metadata separating observation, reconstruction, and simulation time.
- `geometry.geojson` — a small derived geographic coverage artifact, not a parcel-owner dataset.

The package references public City of New Bedford and MassGIS sources while excluding owner/address/person-level assessor information. New Bedford remains **RECONSTRUCTED**, not a complete photogrammetric or operational municipal digital twin.

### Twin timelines

New Bedford exposes independent clocks:

- **SOURCE TIME** — packaged evidence snapshots.
- **SIMULATION TIME** — the active Worldline branch from 2026 forward.

Selecting evidence does not rewrite simulation state, and moving simulation time does not invent observations for missing years.

## 3D / visual engine

The procedural WorldGen runtime includes real-time terrain/biomes, ocean, sky, clouds, stars, fog, shadows, postprocessing, vegetation, settlements, reproducible seed generation, Web Worker generation, Temporal Parallax markers, and a luminous Chronos-style worldline trail.

The Open Earth runtime adds geographic planet/city navigation and attempts 3D building extrusion from the available map building layer.

## Futures

WorldGen Prime retains deterministic branch simulation and scalable future representation:

- 1–2 branches: direct comparison
- 3–4: individual worldlines
- 5–50: Future Families
- 51–10,000: Future Landscape
- 10,001+: Future Continents

These are discrete scenario groupings, not calibrated probabilities. Worlds without an attached simulation model do not reuse WorldGen future metrics.

## Cosmos

Planetary state can represent radius, gravity, rotation/orbit periods, atmosphere, pressure context, temperature, radiation, illumination, light-time, reference frame, source-state metadata, surface-rendering class, and multiple habitability dimensions.

Mars and Europa are represented as **observed celestial identities** while their current local visual surfaces remain explicitly **generated**. The exoworld family remains speculative.

## Benchmark Lab

Worldline provides deterministic compatibility/export contracts for 4DWorldBench-style temporal render sequences and Omni-WorldBench-style ordered interaction/state-transition traces.

Benchmark receipts support `NOT_RUN`, `COMPLETED`, `FAILED`, and `INCOMPATIBLE`. Worldline refuses to attach an external benchmark score unless that benchmark was actually executed to completion. Adapter readiness is not benchmark success.

## v0.5 Discovery Engine

The B+ loop is:

`OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE/REJECT → MONITOR → REALITY WAKE → REOPEN`

v0.5 adds a durable local research ledger. A source-conflict experiment is stored as immutable observation, anomaly, hypothesis, frozen evaluator, verification, promotion, and Reality Wake receipts. Generator and verifier identities remain separate.

Research history persists locally in the browser and can be exported/imported as `worldline-research-ledger-v0.5.json`. Corrupt stored history fails closed with a warning; Worldline does not silently repair it or claim it was recovered. Resetting local history requires an explicit action.

**Model Worldline** is derived directly from ledger receipts and exposes how an observation led to candidate hypotheses, which failed, which verifier evaluated them, which frozen contract decided the outcome, what was promoted, and whether a later observation reopened the decision.

Only reversible low-risk rendering/data-normalization changes are eligible for automatic promotion. Architecture, policy, model, benchmark, authority, and scientific-claim changes remain gated.

Reality Wake is phrased epistemically: **the set of futures consistent with current evidence changed**, not "the future changed."

## Chronos Bridge

The Library can export a deterministic provider-independent Chronos interchange package containing world identity, spatial reference, selected time, branch ancestry, events, metrics, seeds, evidence/fidelity labels, and replay commitments.

This prepares a future higher-fidelity Chronos runtime without pretending the browser application already contains a shipping Unreal game.

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

CI runs the same gates on pull requests and `main`. GitHub Pages deploys automatically from `main` with `VITE_BASE=/WorldGen/`.

## Optional AI lore

The original Gemini-powered lore feature remains optional. The simulation/Earth/Discovery Engine does not require an AI key.

## Evidence boundary

Worldline v0.5 does not claim calibrated future probabilities, forecasting accuracy, a fully validated New Bedford digital twin, realistic interacting populations, formal manifold geometry, executed external benchmark scores without receipts, observed exoplanet surfaces without evidence, or unrestricted self-modification. Open data/providers are visual/evidence substrates; canonical Worldline state remains provider-independent.

## License

MIT
