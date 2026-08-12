# Worldline v0.2 Release Notes

## Release objective

Worldline v0.2 advances the v0.1 visual simulation shell into a free-first Earth and recursive-research release while preserving the credential-free procedural runtime.

## Implemented in v0.2

### Free-first Earth
- Open Earth mode for New Bedford using runtime-loaded MapLibre with the OpenFreeMap Liberty style.
- OSM/OpenMapTiles-derived 3D building extrusion when the building source is available.
- Visible provider state and automatic procedural fallback when the initial Open Earth surface cannot be established.
- External map/tile provider identifiers remain outside canonical simulation state.

### New Bedford World #001
- Versioned static provenance package under `public/data/new-bedford/`.
- Source records for City of New Bedford and MassGIS public data programs.
- Source-time metadata for a 2023 parcel-service baseline, 2025 aerial imagery source, and 2026 reconstructed Worldline view.
- Derived service-coverage geometry only; no owner/address/person-level parcel records are published by the Worldline package.
- Source/provenance inspector and Truth Lens.

### Time and epistemics
- Observation, nearest-observation, reconstruction, and simulation time are shown separately.
- Open Earth Temporal Parallax renders labeled time planes rather than silently implying continuous observed history.
- Worlds without an attached simulation model do not reuse WorldGen future metrics.

### Benchmark Lab
- Deterministic 4DWorldBench-compatible render/export contract.
- Deterministic Omni-WorldBench-compatible state-transition trace contract.
- Immutable benchmark receipts with no score unless an external benchmark was actually completed.

### Recursive Research Engine
- Concrete source-update conflict cycle.
- Frozen evaluator created before candidate generation.
- Separate candidate-generator and independent-verifier identities.
- Rejected control candidates, rollback references, evaluator-drift blocking, and constitutional promotion policy.
- Auto-promotion limited to reversible low-risk rendering/data-normalization candidates; architecture/policy/model changes remain gated.

### Cosmos
- Extended planetary-state contract including radius, rotation/orbit periods, pressure, reference frame, and source-state metadata.
- Explicit separation between an observed celestial body's physical identity and a generated/reconstructed rendered surface.

### Chronos Bridge
- Deterministic provider-independent `worldline-chronos-v0.2` export.
- Includes world identity, spatial reference, selected time, branches, events, seeds, evidence/fidelity labels, and replay commitment.
- Does not claim to be a shipping Unreal build.

## Intentional implementation deviation

The approved implementation plan originally proposed adding `maplibre-gl` as an npm dependency. The execution environment could not establish external package-network access for a new dependency, while the existing lockfile/build needed to stay reproducible. v0.2 therefore loads pinned MapLibre `5.7.1` from a public CDN only when Open Earth is selected. The bundle itself retains no new npm dependency, and failure of that network path falls back to the procedural renderer.

This is a bounded v0.2 solution, not a long-term requirement. Self-hosted/vendored MapLibre and tile assets remain the preferred path for a future fully offline real-Earth runtime.

## Not claimed by v0.2

- Global photogrammetric Earth.
- A fully validated New Bedford digital twin.
- Full MassGIS imagery/parcel/building redistribution.
- Executed 4DWorldBench or Omni-WorldBench scores.
- Google Photorealistic 3D Tiles, Earth Engine, or Cesium as required dependencies.
- A shipping Unreal/Chronos runtime.
- Calibrated future probabilities.
- Unrestricted autonomous self-modification.

## Production gate

A v0.2 release is only complete when the exact release head passes repository type-check, full tests, and production build, then the merged `main` head independently passes CI and completes the GitHub Pages deployment.
