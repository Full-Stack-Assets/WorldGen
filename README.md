# WorldGen / Worldline 2.0

**WorldGen is the canonical rendering/runtime repository for Worldline.**

**Worldline 2.0 · Worldline Studio** is an evidence-aware full-stack simulation environment for navigating 3D worlds through time, branching futures, recursive research history, extraterrestrial worlds, deterministic Chronos experiences, and persistent scenario projects.

**Production:** https://nowfable.com

**Full-stack fallback origin:** https://worldline-production.onrender.com

Release notes: [`v0.2`](docs/WORLDLINE_V0.2.md) · [`v0.3`](docs/WORLDLINE_V0.3.md) · [`v0.5`](docs/WORLDLINE_V0.5.md) · [`v0.7`](docs/WORLDLINE_V0.7.md) · [`v1.0`](docs/WORLDLINE_V1.0.md) · [`v2.0`](docs/WORLDLINE_V2.0.md)

Runtime contract: [`docs/WORLDLINE_RUNTIME.md`](docs/WORLDLINE_RUNTIME.md)

Research synthesis: [`docs/WORLDLINE_OMPHALIS_SYNTHESIS.md`](docs/WORLDLINE_OMPHALIS_SYNTHESIS.md)

## The product

Worldline keeps the human-facing grammar deliberately understandable: **3D space + navigable time**. Possibility, evidence, uncertainty, memory, model disagreement, branch ancestry, research history, and scenario interventions appear as lenses rather than competing geometric axes.

Primary surfaces:

- **World** — procedural worlds or free Open Earth.
- **Time** — Playback, Time Slice, Temporal Parallax, Time Volume, and independent source-time inspection.
- **Futures** — deterministic branches, Future Families, Future Landscape, and explicit interventions.
- **Compare** — committed-state Difference Lens and scenario-result comparison.
- **Data** — attached simulation metrics, planetary state, provenance, and source classification.
- **Library** — Earth, Solar-System worlds, speculative world families, saved Studio projects, and exports.

Secondary experiences:

- **Truth Lens** — inspect epistemic rendering state.
- **Mechanics** — evidence, schemas, release state, benchmarks, research lineage, constitutional gates, and the World Model Lab.
- **Chronos** — playable deterministic Anchor/Echo/Convergence worldline arena.

Worldline explicitly separates `OBSERVED`, `RECONSTRUCTED`, `SIMULATED`, `GENERATED`, and `SPECULATIVE` state.

## Worldline Studio

Worldline 2.0 adds persistent Studio projects and deterministic experiment sessions.

A Studio project can preserve:

- canonical world state;
- branch and selected time;
- explicit intervention objects;
- deterministic experiment receipts;
- Future Family membership;
- visualization preferences;
- Worldpack export data.

Local storage remains an offline mirror. Production persistence is provided through the full-stack Node service and the dedicated **Worldline v2 Production** Supabase database.

Scenario outputs remain `SIMULATED`. Saving a project never upgrades them to observed evidence.

## Free-first Earth

Worldline does **not** require Google, Cesium, Earth Engine, or another paid geospatial credential for the mandatory path.

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

Worldline renders deterministic Future Landscape geometry derived from committed branch metric vectors. It preserves exact parent-child ancestry and computes normalized divergence from the root branch.

The visualization is explicitly labeled:

> **Scenario geometry · not probability**

Branch ordering does not affect the projection and the implementation contains no random numbers.

## Discovery Engine

The B+ loop is:

`OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE/REJECT → MONITOR → REALITY WAKE → REOPEN`

Research history persists as immutable observation, anomaly, hypothesis, frozen evaluator, independent verification, promotion, Reality Wake, and reopening receipts.

Worldline 2.0 adds bounded champion/challenger memory, deterministic experience replay, rollback receipts, and typed recursive skill compression. Degraded challengers do not silently replace a stronger champion.

Only reversible machine-verifiable low-risk rendering/data-normalization candidates are eligible for automatic promotion. Architecture, policy, model, benchmark, authority, and scientific-claim changes remain gated.

## World Model Lab

Mechanics exposes research-reference architectures for systems such as Genie 3 and NVIDIA Cosmos 3 without claiming those systems are connected.

The shared evaluation receipt schema uses four top-level 4DWorldBench dimensions:

- Perceptual Quality
- Condition-4D Alignment
- Physical Realism
- 4D Consistency

A world-model adapter has no score until an actual evaluation produces an executed evidence receipt. Adapter readiness is **not** benchmark success.

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

Named Solar-System bodies can remain `OBSERVED` celestial identities while browser-local surfaces remain explicitly `GENERATED`. Asterion is entirely `SPECULATIVE`.

Planetary state separately exposes physical metadata, terrain-source status, rendered-surface class, light-time, reference frame, evidence references, and multiple habitability dimensions.

## Schemas

Current major schemas include:

- `worldline-state-v1`
- `worldline-project-v2`
- `worldline-experiment-v2`
- `worldline-worldpack-v2`
- `worldline-research-ledger-v0.5`
- `worldline-chronos-v0.7`
- `worldline-skill-compression-v2`
- `worldline-improvement-memory-v2`

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

For the full-stack production-style server after building:

```bash
npm run build
npm start
```

## Verification

```bash
npm run typecheck
npm test
npm run build
```

CI runs the same type-check/test/build gate on pull requests and `main`. The canonical production application is the Node service at `https://nowfable.com`; GitHub Pages remains a static fallback artifact rather than the primary deployment.

## Optional AI lore

The original Gemini-powered lore feature remains optional. Earth, branching, Studio persistence, Discovery Engine, Cosmos, Chronos, and the mandatory production path do not require that feature.

## Evidence boundary

**Worldline 2.0 is not a calibrated forecast or oracle.** It does not claim a fully validated municipal digital twin, realistic interacting human populations, external benchmark success without executed receipts, connected external world-model runtimes without an executing adapter, observed exoplanet surfaces without evidence, physically real Chronos abilities, or unrestricted self-modification.

**Visual and model capability claims may never outrun the executed evidence attached to the active Worldline state.**

## License

MIT
