# Worldline Runtime

Worldline is the master visual simulation application built on the WorldGen rendering runtime.

## Runtime contract

The application separates committed simulation state from presentation. `src/worldline/` owns world identity, epistemic class, model fidelity, branch ancestry, snapshots, future representation thresholds, and recursive candidate policy. React/Three.js components project that state; changing a lens, camera, renderer, or provider must not mutate committed state.

## Visible modes

Primary surfaces are World, Time, Futures, Compare, Data, and Library. Mechanics is the secondary evidence/lineage inspector. Temporal modes are Playback, Time Slice, Temporal Parallax, and Time Volume.

## World and truth classes

Epistemic classes are `OBSERVED`, `RECONSTRUCTED`, `SIMULATED`, `GENERATED`, and `SPECULATIVE`. Model-fidelity labels are `FIELD`, `COHORT`, `MICROSIM`, `AGENT`, `INTERACTING_AGENT`, `COGNITIVE_AGENT`, and `EXPERIENTIAL_MODEL`.

The procedural renderer is a visual fallback and does not change a world's epistemic class. Mars can therefore remain `OBSERVED` while using procedural fallback geometry that is explicitly labeled as such. An exoworld generated from hypothetical constraints remains `SPECULATIVE`.

## Deterministic state and branching

The launch fixture contains a deterministic root worldline with committed snapshots and metric state. `createBranch` creates an isolated child from the nearest prior committed snapshot without mutating the parent. `replayBranch` returns the committed branch history. `compareSnapshots` computes a Difference Lens without changing either input.

## Future representation

The interface scales branch representation by count:

- 1–2: direct comparison
- 3–4: individual worldlines
- 5–50: Future Families
- 51–10,000: Future Landscape
- 10,001+: Future Continents

These are visualization groupings over discrete scenario state, not calibrated probability surfaces.

## Worldline Cosmos

The launch catalog includes a generated WorldGen world, New Bedford World #001 as a reconstructed real-city shell with real-data adapter pending, Mars and Europa as observed planetary identities with procedural visual fallback, and a speculative generated exoworld family. Planetary State exposes gravity, atmosphere, temperature, radiation, illumination, light-time, and multiple habitability dimensions without collapsing them into one authoritative score.

## Recursive engine

The B+ constitutional loop is implemented as a deterministic local demonstration:

`OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE/REJECT → MONITOR → REALITY WAKE → REOPEN`

A frozen evaluation contract is created before candidate generation. Candidate evaluation and independent verification reference that immutable contract ID. Low-risk reversible machine-verifiable candidates can be marked auto-promotable; architectural candidates remain approval-gated. The candidate generator cannot replace the test deciding its own promotion.

This is a bounded demonstration of recursive improvement policy, not unrestricted self-modification.

## External provider adapters

The launch application requires no Google credentials. The intended Earth adapter boundary supports future Cesium/Google Photorealistic 3D Tiles and Earth Engine integrations where credentials and terms permit. External provider IDs must never become canonical Worldline state IDs.

4DWorldBench and Omni-WorldBench are treated as future evaluation adapters, not rendering or simulation engines.

## Deployment

The repository is a React 19 / TypeScript / Vite application. CI runs dependency installation, type-check, tests, and build. Production deployment uses the existing GitHub Pages workflow from `main`, with `VITE_BASE=/WorldGen/`. The credential-free procedural provider is the required production fallback.

## Evidence boundary

The current release is a deterministic visualization/simulation prototype. It does not claim calibrated future probabilities, scientific forecasting accuracy, realistic interacting populations, formal manifold geometry, validated extraterrestrial habitability, or unrestricted autonomous research authority. Visual fidelity must not outrun epistemic fidelity.
