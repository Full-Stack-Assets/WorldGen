# WorldGen / Worldline

**WorldGen is the canonical rendering/runtime repository for the Worldline master application.**

Worldline v0.7 combines a credential-free procedural 3D runtime, free-first real-Earth mode, explicit provider health, twin source/simulation timelines, deterministic branching, a durable B+ Discovery Engine, expanded Cosmos, and a playable Chronos worldline slice.

**Live production:** https://full-stack-assets.github.io/WorldGen/

Release notes: [`v0.2`](docs/WORLDLINE_V0.2.md) · [`v0.3`](docs/WORLDLINE_V0.3.md) · [`v0.5`](docs/WORLDLINE_V0.5.md) · [`v0.7`](docs/WORLDLINE_V0.7.md)

## Primary experience

- **World** — procedural worlds or the free Open Earth view.
- **Time** — Playback, Time Slice, Temporal Parallax, Time Volume, plus independent source-time inspection for New Bedford.
- **Futures** — deterministic branches for worlds with an attached simulation model.
- **Compare** — committed-state Difference Lens.
- **Data** — simulation metrics, planetary state, source/provenance state.
- **Library** — Earth, Moon, Mars, Venus, Europa, Titan, generated/exoworld families, and runtime-neutral exports.
- **Mechanics** — provenance, benchmark adapters, Discovery Engine receipts, Model Worldline, and constitutional gates.
- **Chronos** — secondary playable worldline arena using local deterministic gameplay state.

Worldline explicitly separates `OBSERVED`, `RECONSTRUCTED`, `SIMULATED`, `GENERATED`, and `SPECULATIVE` state. Celestial identity and rendered surface state can carry different epistemic classes.

## Free-first Earth

No Google, Cesium, Earth Engine, or paid geospatial credential is required. New Bedford World #001 attempts a free Open Earth view using pinned MapLibre loaded at runtime with OpenFreeMap/OpenStreetMap-derived geography. It prefers globe projection when supported and safely falls back to Mercator.

Provider health is explicit: `READY`, `DEGRADED`, `UNAVAILABLE`, or `FALLBACK`. When the initial network map cannot be established, Worldline falls back to the procedural Three.js renderer without changing canonical world identity, branch ancestry, or simulation state.

`public/data/new-bedford/` contains the privacy-minimized New Bedford provenance package. Source time and simulation time are independent: inspecting a historical source snapshot does not rewrite a future simulation, and advancing simulation time does not invent an observation for a year with no source evidence.

## 3D / visual runtime

The procedural WorldGen renderer includes real-time terrain/biomes, water, sky, clouds, stars, fog, shadows, postprocessing, vegetation, settlements, deterministic seed generation, Web Worker generation, Temporal Parallax markers, and a luminous worldline trail.

The Open Earth runtime adds geographic planet/city navigation and attempts 3D building extrusion from the available map building layer.

## Futures

WorldGen Prime retains deterministic branch simulation and scalable future representation:

- 1–2 branches: direct comparison
- 3–4: individual worldlines
- 5–50: Future Families
- 51–10,000: Future Landscape
- 10,001+: Future Continents

These are discrete scenario groupings, not calibrated probabilities. Worlds without an attached simulation model do not reuse WorldGen future metrics.

## v0.5 Discovery Engine

The B+ loop is:

`OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE/REJECT → MONITOR → REALITY WAKE → REOPEN`

Research cycles persist locally as immutable observation, anomaly, hypothesis, frozen evaluator, independent verification, promotion, Reality Wake, and reopening receipts. History can be exported/imported as a versioned JSON ledger. Corrupt local history fails closed with an explicit warning.

**Model Worldline** is derived from the research ledger and exposes the evidence/decision ancestry instead of maintaining a second hidden graph state.

Only reversible low-risk rendering/data-normalization changes are eligible for automatic promotion. Architecture, policy, model, benchmark, authority, and scientific-claim changes remain gated.

## v0.7 Chronos Paradigm

The secondary **CHRONOS** control opens a bounded playable arena. The pure gameplay kernel records movement samples, anchors an exact temporal boundary, creates an Echo from the exact post-anchor recorded samples, detects deterministic spatial convergence, and supports a fixed reset.

Chronos is explicitly labeled as a **fictional gameplay mechanic inspired by worldline/spacetime concepts**. Echo is exact replay, not an AI companion, and the arena does not mutate canonical Worldline simulation state.

## v0.7 Cosmos

The catalog now includes WorldGen Prime, New Bedford/Earth, Moon, Mars, Venus, Europa, Titan, and three Asterion candidate variants.

Moon, Mars, Venus, Europa, and Titan are **OBSERVED celestial identities** while the current local browser surface remains explicitly **GENERATED**. Planetary state separately records terrain-source status, surface-rendering class, gravity/mass/radius, rotation/orbit, atmosphere/pressure description, temperature/radiation/illumination context, light-time, reference frame, evidence references, and habitability dimensions.

Asterion is deliberately synthetic. Its thin, temperate, and dense-atmosphere variants share one speculative world family rather than pretending there is one known exoplanet surface.

## Benchmark Lab

Worldline provides deterministic compatibility/export contracts for 4DWorldBench-style temporal render sequences and Omni-WorldBench-style ordered interaction/state-transition traces. Adapter readiness is not benchmark success, and no external benchmark score is shown without an executed receipt.

## Chronos Bridge v0.7

The Library exports a deterministic provider-independent `worldline-chronos-v0.7` bundle containing world identity, epistemic/rendering class, family/variant metadata, spatial/reference-frame state, terrain-source status, selected time, branch ancestry, events, metrics, seeds, and replay commitments.

This is an interchange contract for future higher-fidelity runtimes, not a claim of a shipping Unreal/Cesium game.

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

The original Gemini-powered lore feature remains optional. Earth, Cosmos, Chronos, branching, and the Discovery Engine do not require an AI key.

## Evidence boundary

Worldline v0.7 does not claim calibrated future probabilities, forecasting accuracy, a fully validated New Bedford digital twin, realistic interacting populations, formal manifold geometry, executed external benchmark scores without receipts, observed exoplanet surfaces without evidence, physically real Chronos abilities, or unrestricted self-modification. Open data/providers and NASA reference metadata inform visual/evidence state; canonical Worldline state remains provider-independent.

## License

MIT
