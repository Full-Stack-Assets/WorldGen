# Worldline v0.2 Design

## Status
Approved under standing user authority. This specification advances the v0.1 master application into a free-first Earth runtime with evidence-backed New Bedford ingestion, benchmark adapters, deeper extraterrestrial modeling, a realistic recursive research loop, and a shared Chronos runtime contract.

## Release thesis
Worldline v0.2 keeps the v0.1 invariant that the application must always boot without paid credentials. External providers enhance fidelity but never determine whether Worldline works.

The required default stack is free-first:
- MapLibre GL JS for geographic Earth interaction where appropriate.
- OpenFreeMap vector tiles/styles for global basemap and 3D-extruded building coverage.
- Public terrain/elevation data such as Mapzen Terrain Tiles, Copernicus DEM, USGS 3DEP, and state/local elevation sources.
- MassGIS aerial imagery, lidar/elevation, parcels, buildings, transportation, and other public New Bedford-relevant datasets.
- Existing procedural WorldGen renderer as the guaranteed offline/fallback provider.

Optional adapters may include Google Photorealistic 3D Tiles, Cesium-hosted content, Earth Engine, and other paid or credentialed services. They are not production acceptance blockers in v0.2.

## Core release modes
Worldline remains one application with shared canonical state and four major experiential modes:
1. Observatory — inspect Earth/world state, time, provenance, uncertainty, and futures.
2. Laboratory — run deterministic interventions, experiments, benchmarks, and model comparisons.
3. Cosmos — move from Earth to Solar System bodies and constrained/generated exoworlds.
4. Chronos Bridge — export committed Worldline state into a game/runtime-neutral interchange contract suitable for a later Unreal/Cesium runtime.

## Free-first provider architecture
Worldline owns canonical identity/state. Render/data providers are replaceable adapters.

### Surface providers
- `procedural-worldgen` — always available; offline fallback.
- `open-earth-maplibre` — free-first Earth provider using OpenFreeMap/OpenStreetMap-based vector tiles and 3D building extrusion.
- `local-new-bedford` — static/versioned city package generated from public datasets.
- `google-photorealistic` — optional adapter only when configured.

### Terrain providers
- `mapzen-terrain` — public terrain tile source.
- `copernicus-dem` — global DEM source where available.
- `usgs-3dep` — U.S. lidar/elevation source.
- `massgis-elevation` — Massachusetts high-detail source.
- `procedural-terrain` — guaranteed fallback.

### Imagery providers
- `massgis-aerial` — priority New Bedford imagery when locally packaged or safely accessed.
- `public-imagery-package` — local static raster/PMTiles package built from public datasets.
- `procedural-surface` — fallback.

Provider identifiers must never become branch/world identity. Canonical world state uses stable spatial references and Worldline entity IDs.

## Earth runtime behavior
### Boot invariant
Worldline must show a functioning world even when all network requests fail.

Provider resolution:
1. If the selected real-Earth package is locally available, use it.
2. Else if configured free remote provider is reachable, use it.
3. Else fall back to procedural WorldGen.

The UI must expose compact provider badges:
- Surface
- Terrain
- Data
- Epistemic class
- Model fidelity

A fallback provider may never present itself as observed geometry.

### Global free Earth mode
MapLibre/OpenFreeMap provides:
- planet-to-city navigation;
- OSM road/building geometry;
- 3D building extrusion from height/levels where present;
- spatial labels and orientation;
- a clean integration point for Worldline simulation overlays.

The existing Three.js/R3F runtime remains for procedural worlds and Chronos-style local visualization. v0.2 may use both runtimes behind a unified shell rather than forcing one renderer to do every job.

## New Bedford World #001
New Bedford becomes the first data-backed Earth proving ground.

### Required source families
- municipal/state boundary and coastline;
- roads and transportation network;
- parcels;
- building footprints;
- elevation/lidar-derived products;
- current and historical aerial imagery metadata;
- census/aggregate demographic observations;
- land-use/zoning/public-facility layers where lawful and useful.

No personally identifying ownership data is required for the public/default experience.

### Provenance contract
Every imported source record contains:
- `sourceId`
- `publisher`
- `datasetName`
- `sourceUrl`
- `retrievedAt`
- `validFrom`
- `validTo`
- `spatialReference`
- `license`
- `checksum`
- `coverage`
- `resolution`
- `epistemicClass`
- `transformationChain`

Derived/reconstructed entities retain links to their source records and transformation steps.

### Epistemic rendering
Truth Lens rules:
- OBSERVED: solid/sharp treatment.
- RECONSTRUCTED: subtle hatch/secondary edge.
- GENERATED: softer/translucent procedural treatment.
- SIMULATED: luminous temporal overlay.
- SPECULATIVE: diffuse/explicitly hypothetical treatment.

No historical frame may imply that geometry was directly observed at a date when only nearest-time or reconstructed evidence exists.

## Historical Earth and Temporal Parallax
v0.2 supports real-history-aware temporal views.

At minimum the New Bedford package must be able to represent:
- source snapshot time;
- nearest observation time;
- reconstruction time;
- simulation time.

Temporal Parallax can mix observed/reconstructed/simulated slices, but each slice must carry provenance and epistemic status.

## Data ingestion and static packaging
The first v0.2 ingestion path is build-time/static rather than database-first.

Repository shape:
```
data/new-bedford/
  manifest.json
  sources/
  normalized/
  snapshots/
  provenance/
  tiles/
```

Pipeline:
`SOURCE → DOWNLOAD/FETCH → CHECKSUM → LICENSE/METADATA → NORMALIZE → VALIDATE → VERSIONED SNAPSHOT → ENTITY RESOLUTION → DERIVED PRODUCTS → WORLDLINE PACKAGE`

Live APIs never mutate canonical history directly. They produce candidate source snapshots that are validated before promotion.

The web app consumes compact static artifacts compatible with GitHub Pages. PMTiles/GeoJSON/compact JSON are preferred where practical.

## Benchmarks: 4DWorldBench + Omni-WorldBench
Benchmarks are adapters and evidence, not constitutional truth.

### 4DWorldBench adapter
Expose a local evaluation contract capable of exporting compatible render/evaluation bundles for:
- perceptual quality;
- condition-to-4D alignment;
- physical realism;
- 4D consistency.

v0.2 does not claim benchmark scores unless the actual benchmark pipeline has been executed against a compatible artifact.

### Omni-WorldBench adapter
Expose deterministic interaction/state-transition traces suitable for evaluating:
- action-conditioned world updates;
- intermediate state evolution;
- final state correctness;
- temporal consistency.

### Benchmark ledger
Every benchmark run records:
- benchmark name/version;
- artifact/model/code version;
- seed/state;
- input scenario;
- evaluator configuration;
- result;
- pass/fail thresholds where applicable;
- held-out status;
- verifier identity.

A candidate cannot change the evaluator used to decide its own promotion.

## Cosmos v0.2
Extraterrestrial worlds move from metadata-only cards toward explicit planetary-state models.

### Planetary state contract
A world may include:
- radius;
- mass/gravity;
- rotation period;
- orbital period;
- atmosphere composition/pressure;
- temperature range;
- radiation context;
- illumination/host-star state;
- terrain/elevation source status;
- surface material model;
- resource/habitability fields;
- light-time metadata;
- reference-frame metadata.

Observed bodies must separate measured identity from rendered/generated local surface detail.

### World families
Observed exoplanets are represented as constrained candidate families rather than a single authoritative surface when major properties are unknown.

## Recursive Research Engine v0.2
The B+ constitutional model remains mandatory.

### Outer immutable constitution
The recursive system cannot autonomously rewrite:
1. epistemic/truth semantics;
2. reproducibility requirements;
3. independent verification requirement;
4. candidate-test immutability;
5. external-action/production authority;
6. auditability/lineage requirements.

### Inner recursive loop
The real v0.2 loop is:
`OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE/REJECT → MONITOR → REALITY WAKE → REOPEN`

### Concrete v0.2 loops
1. Data update loop — detect changes/conflicts between New Bedford source snapshots.
2. Rendering loop — compare safe renderer/LOD/performance candidates.
3. Simulation loop — compare branch/model candidates against frozen tests.
4. Benchmark loop — run compatible benchmark adapters and store immutable receipts.

### Candidate classes
- LOW_RISK_RENDERING
- DATA_NORMALIZATION
- SIMULATION_PARAMETER
- MODEL_VARIANT
- BENCHMARK_CANDIDATE
- ARCHITECTURAL
- POLICY

Only explicitly reversible, machine-verifiable low-risk candidates may auto-promote. Architectural/policy/scientific-claim changes require approval even when they score well.

### Independent verification
Candidate generation and candidate verification must be represented as separate identities/components. A candidate must include:
- ancestry;
- hypothesis;
- changed inputs/code/model;
- frozen evaluation contract;
- result;
- verifier receipt;
- promotion decision;
- rollback reference.

## Reality Wake v0.2
Accepted new observations can trigger deterministic re-evaluation of affected scenario families.

The UI must describe this as:
`The set of futures consistent with current evidence changed.`

Never:
`The future changed.`

## Chronos runtime bridge
v0.2 does not embed Unreal in the web app. It defines an interchange package that future Unreal/Cesium tooling can consume.

### Export package
- world identity;
- spatial reference;
- selected time/snapshot;
- branch ancestry;
- worldline events;
- object/entity IDs;
- provider-independent geometry references;
- model/evidence labels;
- deterministic seeds/state;
- replay commitment.

### Chronos prototype in web
Keep the luminous worldline/Temporal Parallax concept in the browser as an interaction demonstrator. Do not present fictional gameplay abilities as verified physics.

## UI changes
Primary navigation remains:
- World
- Time
- Futures
- Compare
- Data
- Library

Add:
- Source/Provider status compact strip;
- Truth Lens toggle;
- Benchmark Lab surface under Laboratory/Mechanics;
- Recursive Research surface showing active cycle, candidates, verifier receipts, and promotion decisions;
- Cosmos planetary-state inspector.

The 3D/map viewport remains dominant and data panels remain contextual rather than dashboard-first.

## Failure handling
- Network/provider failure: preserve app and fall back.
- Source package missing: show explicit unavailable state; never substitute fake real-city data.
- Schema/version mismatch: quarantine source/candidate; preserve last accepted snapshot.
- Benchmark unavailable: mark adapter unavailable; do not fabricate score.
- Recursive verifier failure: block promotion.
- Provenance missing: treat imported datum as invalid for canonical Earth state.

## Security / privacy / policy
- No secrets in client source.
- No paid provider required for default boot.
- Preserve attribution for open providers/datasets.
- Do not redistribute datasets beyond their permitted terms.
- Avoid sensitive real-person information in the public/default simulation.
- No autonomous external publication or irreversible infrastructure action from the recursive engine.

## Testing strategy
Required automated coverage:
- provider fallback and provider-status semantics;
- canonical state provider independence;
- Truth Lens/epistemic label invariants;
- New Bedford manifest validation;
- checksum/provenance validation;
- historical snapshot gap handling;
- branch/replay determinism;
- benchmark-receipt immutability;
- recursive candidate/test immutability;
- independent verifier requirement;
- Cosmos measured-vs-rendered distinction;
- production build without credentials.

Optional credentialed smoke tests are separate from mandatory CI.

## Implementation phases
### Phase A — Free Earth shell
- add MapLibre dependency;
- add OpenFreeMap-based Earth provider;
- implement provider registry/status/fallback;
- preserve procedural world as offline fallback.

### Phase B — New Bedford package
- add source/provenance schemas;
- ingest a small legally safe real New Bedford dataset package from public government sources;
- render real coastline/roads/buildings/parcels where practical;
- expose Truth Lens/source details.

### Phase C — Historical/temporal data
- add multiple source snapshot metadata/time states;
- connect Temporal Parallax to real/reconstructed/simulated source states.

### Phase D — Benchmark Lab
- add benchmark receipt types and local adapter/export surfaces for 4DWorldBench and Omni-WorldBench;
- do not claim scores unless executed.

### Phase E — Recursive Research Engine
- generalize v0.1 recursive demo into candidate classes, frozen evaluation contracts, verifier receipts, update/conflict loop, and model worldlines.

### Phase F — Cosmos depth
- add explicit planetary state/observed-vs-rendered fields and richer world-family behavior.

### Phase G — Chronos bridge
- export provider-independent committed state bundle for future Unreal/Cesium runtime.

### Phase H — release hardening
- CI typecheck/tests/build;
- no-credential production smoke path;
- PR review;
- merge;
- GitHub Pages deployment verification.

## v0.2 production acceptance
v0.2 is accepted when all of the following are true:
1. App boots and remains useful with no credentials and no provider network access.
2. Open Earth provider can display a real geographic Earth view when network access is available.
3. Provider state is visible and provider failure cannot alter canonical simulation state.
4. New Bedford World #001 uses a real versioned public-data package for at least a meaningful subset of geographic layers.
5. Every New Bedford canonical datum in that package has provenance metadata and epistemic classification.
6. Generated/reconstructed visuals cannot be mislabeled as observed.
7. Temporal Parallax can combine source-time and simulated-time states without erasing provenance.
8. Benchmark adapters/export receipts exist without fabricated benchmark scores.
9. Recursive engine can ingest a synthetic source update, detect a conflict, create multiple candidates, reject at least one, verify another independently, and block any candidate that changes its deciding test.
10. Low-risk auto-promotion remains bounded and reversible.
11. Architectural/policy/scientific-claim changes remain gated.
12. Cosmos objects distinguish observed physical state from generated surface rendering.
13. Chronos export bundle is deterministic and provider-independent.
14. Full CI/typecheck/tests/build pass on exact release head.
15. Production GitHub Pages deployment completes successfully.

## Non-goals
- No claim of fully photogrammetric global Earth.
- No requirement for Google/Cesium credentials.
- No claim that benchmark compatibility equals benchmark success.
- No unrestricted recursive self-modification.
- No fully validated city digital twin or real-time municipal operational authority.
- No claim that rendered exoplanet surfaces are observed unless directly supported by data.
- No Unreal shipping build in v0.2.

## Final principle
Worldline v0.2 should prove that a high-dimensional, recursively improving simulation environment can remain visually ambitious, evidence-aware, provider-independent, and deployable for free. Open data and open renderers form the default substrate; paid photorealistic services become optional accelerators rather than architectural dependencies.
