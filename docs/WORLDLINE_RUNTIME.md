# Worldline Runtime

Worldline is the master visual simulation application built on the WorldGen rendering runtime.

## Runtime contract

Committed simulation/world state is separate from presentation. `src/worldline/` owns world identity, epistemic class, model fidelity, branch ancestry, snapshots, provider policy, provenance, benchmark receipts, recursive-candidate policy, and runtime interchange. React rendering components project that state. Changing a camera, lens, tile provider, map style, or renderer must not mutate canonical state.

## Visible modes

Primary surfaces remain World, Time, Futures, Compare, Data, and Library. Mechanics is the evidence/lineage/benchmark inspector. Temporal modes are Playback, Time Slice, Temporal Parallax, and Time Volume.

## v0.2 free-first Earth provider model

Worldline v0.2 does not require Google, Cesium, or Earth Engine credentials.

- `procedural-worldgen` is the guaranteed credential-free/offline fallback.
- `open-earth-maplibre` is the free network Earth view using MapLibre at runtime with OpenFreeMap/OpenStreetMap-derived geography.
- `local-new-bedford` represents the versioned static New Bedford provenance/data package.
- `google-photorealistic` remains an optional adapter and is not a release gate.

The Open Earth runtime loads MapLibre from a pinned public CDN at runtime instead of making it a build dependency. This is an intentional v0.2 tradeoff: the production bundle still builds without adding a paid provider or new package-install dependency, while network failure is handled by the existing procedural fallback. A later release may vendor/self-host MapLibre and tiles for stricter offline Earth support.

OpenFreeMap/OpenStreetMap provider attribution remains visible. External tile IDs never become Worldline world or branch IDs.

## World and truth classes

Epistemic classes are `OBSERVED`, `RECONSTRUCTED`, `SIMULATED`, `GENERATED`, and `SPECULATIVE`. Model-fidelity labels are `FIELD`, `COHORT`, `MICROSIM`, `AGENT`, `INTERACTING_AGENT`, `COGNITIVE_AGENT`, and `EXPERIENTIAL_MODEL`.

v0.2 adds an explicit rendered-surface class. An observed body can therefore use generated local geometry without the interface implying that the rendered surface itself was observed. Mars and Europa use this distinction. The Truth Lens exposes epistemic rendering status without rewriting underlying state.

## New Bedford World #001

New Bedford is the first real-Earth proving ground. The repository contains a versioned static package at `public/data/new-bedford/` with:

- a strict provenance manifest;
- source-time snapshot metadata;
- a small derived geographic coverage artifact;
- source references for City of New Bedford and MassGIS public datasets.

The package intentionally excludes owner/address/person-level assessor data. Several MassGIS sources are metadata references only in v0.2; their full imagery/building/parcel datasets are not redistributed by this repository. The Open Earth map provides live geographic context when reachable. This combination is labeled `RECONSTRUCTED`, not a complete observed/photogrammetric digital twin.

Source validators require publisher, dataset name, URL, retrieval time, spatial reference, license/usage note, checksum/status, coverage, resolution, epistemic class, and transformation lineage before a source can enter the canonical package.

## Historical/source time

The Time surface distinguishes observation time, nearest-observation time, reconstruction time, and simulation time. New Bedford source metadata currently exposes 2023 parcel-service baseline metadata, 2025 MassGIS aerial-source metadata, a 2026 reconstructed Worldline view, and later simulated time. Missing years are not silently claimed as direct observations.

Temporal Parallax in the Open Earth view shows distinct source/simulation planes while keeping those time classes labeled.

## Deterministic state and branching

The WorldGen launch fixture retains deterministic committed snapshots. `createBranch` creates isolated children from an actual committed snapshot without mutating the parent. `replayBranch` returns committed branch history. `compareSnapshots` computes differences without changing inputs.

The v0.2 UI does not attach these WorldGen branch metrics to New Bedford, Mars, Europa, or exoworlds. Future generation is disabled for worlds without an attached simulation model rather than presenting unrelated synthetic metrics as forecasts.

## Future representation

WorldGen branch visualization scales by count:

- 1–2: direct comparison
- 3–4: individual worldlines
- 5–50: Future Families
- 51–10,000: Future Landscape
- 10,001+: Future Continents

These remain visualization groupings over discrete scenario state, not calibrated probability surfaces.

## Cosmos v0.2

Planetary state can now carry radius, gravity, rotation period, orbital period, atmosphere, pressure description, temperature, radiation, illumination, light-time, reference-frame metadata, physical-state source notes, and multiple habitability dimensions.

Observed physical identity and rendered surface provenance are separate. The current exoworld remains a speculative candidate family rather than an asserted observed planet surface.

## Benchmark Lab

`src/worldline/benchmarks.ts` provides deterministic compatibility/export contracts for 4DWorldBench-style temporal render bundles and Omni-WorldBench-style interaction/state-transition traces. Benchmark receipts support `NOT_RUN`, `COMPLETED`, `FAILED`, and `INCOMPATIBLE`.

Worldline refuses to attach a score to a non-completed benchmark receipt. v0.2 therefore exposes adapter readiness without fabricating benchmark success.

## Recursive Research Engine

The B+ constitutional loop remains:

`OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE/REJECT → MONITOR → REALITY WAKE → REOPEN`

v0.2 adds a concrete data-update/reconciliation cycle. It creates a frozen evaluator before candidate generation, records generator and independent-verifier identities, compares multiple reconciliation candidates, rejects candidates that drift the evaluator or fail thresholds, stores rollback references, and permits automatic promotion only for explicitly reversible low-risk rendering/data-normalization candidates. Architectural/policy/model/scientific-claim changes remain gated.

Reality Wake wording is intentionally epistemic: `The set of futures consistent with current evidence changed.`

## Chronos Bridge

`src/worldline/chronos.ts` exports a deterministic provider-independent `worldline-chronos-v0.2` bundle containing world identity, spatial reference, selected time, branch ancestry, events, metrics, seeds, evidence/fidelity labels, and replay commitments. Provider IDs are excluded.

This is an interchange contract for later Unreal/Cesium tooling, not a shipping Unreal build.

## Deployment

The application remains React 19 / TypeScript / Vite with the existing Three.js/R3F procedural runtime. CI installs dependencies, type-checks, runs the full Vitest suite, and builds production output. GitHub Pages deploys from `main` using `VITE_BASE=/WorldGen/`.

No paid credential is required for the mandatory build/deploy path. Network Earth enhancements may fail independently without making the app unusable.

## Evidence boundary

Worldline v0.2 is an evidence-aware visualization/simulation research application. It does not claim calibrated future probabilities, a fully validated municipal digital twin, realistic interacting populations, formal manifold geometry, benchmark success without executed benchmark evidence, observed exoplanet surfaces without supporting data, or unrestricted autonomous research authority. Visual fidelity must not outrun epistemic fidelity.
