# Worldline Runtime — 1.0

Worldline is the master visual simulation application built on the WorldGen rendering runtime. The 1.0 release codename is **Worldline One**.

## Runtime contract

Committed simulation/world state is separate from presentation. `src/worldline/` owns world identity, epistemic class, model fidelity, branch ancestry, snapshots, provider policy, provenance, future projection, research receipts, recursive-candidate policy, Chronos state/export, and release identity. React rendering components project that state.

Changing a camera, lens, tile provider, map style, Future Landscape view, first-contact animation, or renderer must not mutate canonical state.

## Release identity

`src/worldline/release.ts` defines the immutable 1.0 release manifest:

- version: `1.0.0`
- codename: `Worldline One`
- world-state schema: `worldline-state-v1`
- research-ledger schema: `worldline-research-ledger-v0.5`
- Chronos interchange schema: `worldline-chronos-v0.7`
- mandatory provider classes: `procedural-worldgen`, `open-earth-maplibre`, `local-new-bedford`

Production builds receive `VITE_GIT_SHA=${{ github.sha }}` from the GitHub Pages workflow so Mechanics can display the deployed commit. Development builds use the explicit fallback label `development`.

## Human-facing modes

Primary surfaces:

- **World** — procedural generation or the free Open Earth view.
- **Time** — Playback, Time Slice, Temporal Parallax, Time Volume, plus independent source-time inspection for New Bedford.
- **Futures** — exact deterministic branches, Future Families, and Future Landscape.
- **Compare** — committed-snapshot Difference Lens.
- **Data** — attached simulation metrics, planetary state, and source/provenance state.
- **Library** — Earth/Solar-System/exoworld catalog and runtime-neutral exports.

Secondary experiences:

- **Truth Lens** — visually exposes epistemic rendering state.
- **Mechanics** — evidence, lineage, release state, benchmarks, and Discovery Engine receipts.
- **Chronos** — deterministic local worldline gameplay slice.

## Epistemic and fidelity classes

Epistemic classes remain:

- `OBSERVED`
- `RECONSTRUCTED`
- `SIMULATED`
- `GENERATED`
- `SPECULATIVE`

Model-fidelity labels remain:

- `FIELD`
- `COHORT`
- `MICROSIM`
- `AGENT`
- `INTERACTING_AGENT`
- `COGNITIVE_AGENT`
- `EXPERIENTIAL_MODEL`

Observed identity and rendered-surface class are separate. An observed celestial body may currently use a generated browser surface without the interface claiming that geometry is measured terrain.

## Free-first Earth runtime

Worldline 1.0 requires no Google, Cesium, Earth Engine, or other paid geospatial credential.

Surface-provider classes:

- `procedural-worldgen` — guaranteed credential-free fallback and offline procedural mode.
- `open-earth-maplibre` — free network Earth view using pinned MapLibre at runtime with OpenFreeMap/OpenStreetMap-derived geography.
- `local-new-bedford` — versioned static provenance/source package.

Provider health is represented as `READY`, `DEGRADED`, `UNAVAILABLE`, or `FALLBACK`. Failure of the initial Open Earth network surface moves the presentation to procedural WorldGen while preserving canonical world identity and branch state. A failure reason remains visible and the free Earth provider can be retried.

The free Earth view prefers globe projection when the loaded MapLibre runtime supports it and otherwise uses Mercator. Provider IDs never become Worldline world or branch IDs.

## New Bedford World #001

New Bedford is the evidence-backed real-Earth proving ground. The repository package at `public/data/new-bedford/` contains:

- `manifest.json` — source/publisher/license/coverage/checksum/status/transformation metadata;
- `snapshots.json` — source-time metadata;
- `geometry.geojson` — small safe derived coverage geometry.

The package references City of New Bedford and MassGIS public datasets while excluding parcel-owner/address/person-level assessor data. It is labeled `RECONSTRUCTED`, not a complete photogrammetric or operational municipal digital twin.

The package distinguishes observed source records from reconstructed visual state. Missing data is shown as unavailable rather than fabricated.

## Twin timelines

New Bedford exposes independent clocks:

- **Source time** — when packaged evidence was observed, valid, or reconstructed.
- **Simulation time** — the active modeled worldline from 2026 forward.

Changing source time does not move simulation time. Moving simulation time does not create an observation for a year with no source snapshot. Source gaps remain explicit.

Temporal Parallax can visually juxtapose observation/reconstruction/simulation states without collapsing their epistemic labels.

## Deterministic state and branching

The WorldGen simulation fixture retains committed snapshots and deterministic branching.

- `createBranch` forks from an actual committed snapshot without mutating the parent.
- `replayBranch` returns committed branch history deterministically.
- `compareSnapshots` computes differences without changing either input.

Worlds without an attached simulation model do not inherit WorldGen branch metrics. New Bedford, Solar-System bodies, and speculative exoworlds therefore do not present unrelated WorldGen metrics as forecasts.

## Future Families and Future Landscape

Branch representation still scales by count:

- 1–2: direct comparison
- 3–4: individual worldlines
- 5–50: Future Families
- 51–10,000: Future Landscape
- 10,001+: Future Continents semantics

Worldline 1.0 adds `src/worldline/futureLandscape.ts`, a deterministic projection of committed branch metric vectors into normalized visual coordinates. It:

- sorts branches and metric keys for stable results;
- derives coordinates from latest committed metrics only;
- preserves exact parent-child ancestry in the SVG view;
- computes normalized divergence from the root branch;
- keeps root divergence at zero;
- contains no random numbers.

Future Landscape is labeled **Scenario geometry · not probability**. Position, family grouping, and divergence are not calibrated forecast probabilities.

## Discovery Engine

The B+ constitutional loop is:

`OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE/REJECT → MONITOR → REALITY WAKE → REOPEN`

Worldline 1.0 preserves the v0.5 durable research ledger. A source-conflict cycle can be stored as immutable:

- observation;
- anomaly;
- competing hypotheses;
- frozen evaluation contract;
- independent verification receipts;
- promotion decision;
- Reality Wake;
- reopening record.

Generator and verifier identities remain separate. A candidate cannot change the evaluator used to decide its own promotion. Automatic promotion remains limited to reversible, machine-verifiable, low-risk rendering/data-normalization candidates. Architecture, policy, model, benchmark, authority, and scientific-claim changes remain gated.

Research history persists locally and can be exported/imported as versioned JSON. Corrupt stored history fails closed with a warning and is not silently rewritten. Reset requires an explicit user action.

## Model Worldline

Model Worldline is derived from research-ledger receipts rather than a second hidden graph state. It exposes observation → hypothesis → verification → promotion → Reality Wake/reopen ancestry and answers which frozen evaluator and verifier decided a promotion.

## Reality Wake

Reality Wake is epistemic rather than oracular. The canonical wording is:

> The set of futures consistent with current evidence changed.

A Reality Wake appends new research history and does not rewrite the earlier observation or decision receipt.

## Chronos Paradigm browser slice

Chronos is a deterministic local experiential layer, separate from canonical simulation state.

The pure gameplay kernel supports:

- recorded movement samples;
- **Anchor** at an exact sample boundary;
- **Echo** as exact replay of post-anchor samples;
- deterministic spatial **Convergence** detection;
- fixed-state **Reset**.

The browser arena provides WASD/arrow-key and button controls. Current path, anchor, and Echo are visually distinct.

Chronos permanently labels itself as a **fictional gameplay mechanic inspired by worldline/spacetime concepts**. These abilities are not presented as experimentally verified relativistic phenomena.

## Chronos interchange

`src/worldline/chronos.ts` exports the deterministic provider-independent `worldline-chronos-v0.7` bundle containing:

- world identity;
- world/surface epistemic class;
- family/variant metadata;
- spatial/reference-frame metadata;
- terrain-source status;
- selected time;
- branch ancestry;
- events, snapshots, metrics, and deterministic seeds;
- replay commitment.

This remains an interchange contract for future higher-fidelity runtimes, not a claim that the browser ships an Unreal/Cesium game.

## Cosmos

The 1.0 catalog contains:

- WorldGen Prime;
- New Bedford / Earth;
- Moon;
- Mars;
- Venus;
- Europa;
- Titan;
- three Asterion speculative variants in one world family.

Planetary state can include mass, radius, gravity, rotation/orbit periods, atmosphere/pressure description, temperature/radiation/illumination context, terrain-source status, rendered-surface class, light-time, reference frame, physical-state references, and multiple habitability dimensions.

Named Solar-System objects can be `OBSERVED` celestial identities while their current local browser surfaces remain explicitly `GENERATED`. Asterion remains entirely `SPECULATIVE` and is not represented as a discovered exoplanet.

## Benchmark Lab

`src/worldline/benchmarks.ts` provides compatibility/export contracts for 4DWorldBench-style temporal render bundles and Omni-WorldBench-style action/state-transition traces.

Benchmark receipts support `NOT_RUN`, `COMPLETED`, `FAILED`, and `INCOMPATIBLE`. Worldline does not attach an external benchmark score unless the benchmark was actually executed to completion. Adapter readiness is not benchmark success.

## First Contact

Worldline 1.0 adds a presentation-only first-load sequence:

- duration: 1400 ms;
- Skip is available immediately;
- the world runtime initializes underneath the overlay;
- a seen flag suppresses repeat automatic playback;
- a World control can replay it;
- `prefers-reduced-motion: reduce` bypasses it.

The sequence creates visual identity but is not part of canonical state.

## Accessibility and motion

Worldline 1.0 includes visible `:focus-visible` treatment for interactive controls, text status labels in addition to color, accessible SVG labels for Future Landscape and Chronos, keyboard equivalents for Chronos movement/selection, mobile layout adjustments, and a reduced-motion CSS policy that suppresses non-essential animation/transition behavior.

## Zero-credential smoke contract

Automated smoke tests assert that:

- the initial world is `worldgen-prime` with `GENERATED` / `FIELD` labels;
- a no-network Open Earth request resolves to procedural fallback;
- the mandatory 1.0 provider set contains no paid-required provider;
- branch replay remains deterministic;
- an empty research ledger initializes without a backend;
- Chronos initializes without a provider service.

## Deployment

The application is React 19 / TypeScript / Vite with the existing Three.js/R3F procedural runtime. CI installs dependencies, type-checks, runs the full Vitest suite, and builds production output.

GitHub Pages deploys from `main` with:

- `VITE_BASE=/WorldGen/`
- `VITE_GIT_SHA=${{ github.sha }}`

The release is not considered production-complete until the exact merge commit passes `main` CI and the GitHub Pages build/deploy workflow.

## Evidence boundary

Worldline 1.0 is **not a calibrated forecast or oracle**. It does not claim a fully validated New Bedford digital twin, realistic interacting human populations, formal manifold geometry, executed external benchmark scores without receipts, observed exoplanet surfaces without evidence, physically real Chronos abilities, or unrestricted self-modification.

Its governing rule remains: **visual fidelity must not outrun epistemic fidelity.**
