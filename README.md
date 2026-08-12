# WorldGen / Worldline 1.0

**WorldGen is the canonical rendering/runtime repository for Worldline.**

**Worldline 1.0 · Worldline One** is an evidence-aware visual simulation environment for navigating 3D worlds through time, branching futures, recursive research history, extraterrestrial worlds, and a deterministic playable worldline experience.

**Production:** https://full-stack-assets.github.io/WorldGen/

Release notes: [`v0.2`](docs/WORLDLINE_V0.2.md) · [`v0.3`](docs/WORLDLINE_V0.3.md) · [`v0.5`](docs/WORLDLINE_V0.5.md) · [`v0.7`](docs/WORLDLINE_V0.7.md) · [`v1.0`](docs/WORLDLINE_V1.0.md)

Runtime contract: [`docs/WORLDLINE_RUNTIME.md`](docs/WORLDLINE_RUNTIME.md)

## The product

Worldline keeps the human-facing grammar deliberately understandable: **3D space + navigable time**. Possibility, evidence, uncertainty, memory, model disagreement, branch ancestry, and research history appear as lenses rather than competing geometric axes.

Primary surfaces:

- **World** — procedural worlds or free Open Earth.
- **Time** — Playback, Time Slice, Temporal Parallax, Time Volume, and independent source-time inspection.
- **Futures** — deterministic branches, Future Families, and Future Landscape.
- **Compare** — committed-state Difference Lens.
- **Data** — attached simulation metrics, planetary state, and provenance.
- **Library** — Earth, Solar-System worlds, speculative world families, and exports.

Secondary experiences:

- **Truth Lens** — inspect epistemic rendering state.
- **Mechanics** — evidence, schemas, release state, benchmarks, research lineage, and constitutional gates.
- **Chronos** — playable deterministic Anchor/Echo/Convergence worldline arena.

Worldline explicitly separates `OBSERVED`, `RECONSTRUCTED`, `SIMULATED`, `GENERATED`, and `SPECULATIVE` state.

## First Contact

A fresh normal-motion visit opens with a **1.4 second immediately skippable** Worldline sequence while the actual application initializes underneath it. Users with reduced-motion preferences bypass the cinematic. A World control can replay it later.

## Free-first Earth

Worldline 1.0 does **not** require Google, Cesium, Earth Engine, or another paid geospatial credential.

New Bedford World #001 uses:

- pinned MapLibre loaded at runtime;
- OpenFreeMap / OpenStreetMap-derived geography;
- globe projection when supported, Mercator fallback otherwise;
- explicit provider health: `READY`, `DEGRADED`, `UNAVAILABLE`, `FALLBACK`;
- procedural Three.js WorldGen as the guaranteed fallback;
- a privacy-minimized versioned provenance/source package under `public/data/new-bedford/`.

Provider failure changes presentation only. It does not mutate world identity, branch ancestry, or committed simulation state.

### Twin timelines

New Bedford exposes separate clocks:

- **SOURCE TIME** — observation/reconstruction history;
- **SIMULATION TIME** — the active modeled worldline.

Changing one does not silently rewrite the other, and source gaps are not fabricated.

## Future Landscape

Worldline 1.0 adds a deterministic SVG Future Landscape derived from committed branch metric vectors. It preserves exact parent-child ancestry and computes normalized divergence from the root branch.

The visualization is explicitly labeled:

> **Scenario geometry · not probability**

Branch ordering does not affect the projection and the implementation contains no random numbers.

## Discovery Engine

The B+ loop is:

`OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE/REJECT → MONITOR → REALITY WAKE → REOPEN`

Research history persists locally as immutable observation, anomaly, hypothesis, frozen evaluator, independent verification, promotion, Reality Wake, and reopening receipts.

**Model Worldline** derives evidence/decision ancestry from the ledger itself. Corrupt stored history fails closed with a warning rather than being silently repaired.

Only reversible machine-verifiable low-risk rendering/data-normalization candidates are eligible for automatic promotion. Architecture, policy, model, benchmark, authority, and scientific-claim changes remain gated.

## Chronos Paradigm

The **CHRONOS** arena records exact movement samples. **Anchor** captures a sample boundary, **Echo** replays the exact post-anchor segment, **Convergence** uses a fixed geometric threshold, and **Reset** restores the fixed initial state.

Chronos is permanently labeled as a **fictional gameplay mechanic inspired by worldline/spacetime concepts**. It does not mutate canonical simulation state and is not represented as experimentally verified time manipulation.

## Cosmos

The catalog includes:

- WorldGen Prime;
- New Bedford / Earth;
- Moon;
- Mars;
- Venus;
- Europa;
- Titan;
- three Asterion speculative variants.

Named Solar-System bodies can remain `OBSERVED` celestial identities while their current browser-local surfaces remain explicitly `GENERATED`. Asterion is entirely `SPECULATIVE`.

Planetary state separately exposes physical metadata, terrain-source status, rendered-surface class, light-time, reference frame, evidence references, and multiple habitability dimensions.

## Benchmark Lab

Worldline provides deterministic compatibility/export contracts for 4DWorldBench-style temporal render bundles and Omni-WorldBench-style action/state-transition traces.

Adapter readiness is **not** benchmark success. No external benchmark score is attached without an executed completion receipt.

## Chronos interchange

`worldline-chronos-v0.7` is a deterministic provider-independent export containing world/surface epistemic classes, family/variant identity, reference-frame state, terrain-source status, time, branch ancestry, events, metrics, seeds, and replay commitment.

It is an interchange contract, not a claim that the browser ships a full Unreal/Cesium game.

## Release identity

Mechanics exposes:

- `Worldline 1.0.0 · Worldline One`
- `worldline-state-v1`
- `worldline-research-ledger-v0.5`
- `worldline-chronos-v0.7`
- mandatory free-first provider classes
- exact deployed Git commit when built by GitHub Pages

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

CI runs the same type-check/test/build gate on pull requests and `main`. GitHub Pages deploys from `main` with `VITE_BASE=/WorldGen/` and stamps the production bundle with the deployed Git SHA.

## Optional AI lore

The original Gemini-powered lore feature remains optional. Earth, branching, Discovery Engine, Cosmos, Chronos, and the mandatory production path do not require an AI key.

## Evidence boundary

**Worldline 1.0 is not a calibrated forecast or oracle.** It does not claim a fully validated municipal digital twin, realistic interacting human populations, formal manifold geometry, external benchmark success without executed receipts, observed exoplanet surfaces without evidence, physically real Chronos abilities, or unrestricted self-modification.

**Visual fidelity must not outrun epistemic fidelity.**

## License

MIT
