# Worldline v1.0 Design

## Status
Standing user authorization permits autonomous execution through v1.0. This document defines the release target that follows the merged v0.2 baseline.

## Product thesis
Worldline v1.0 is a visual simulation operating environment for exploring worlds through **3D space + navigable time**, with possibility, evidence, uncertainty, memory, model disagreement, and recursive research exposed as lenses rather than extra geometric axes.

The release must remain useful without paid credentials or a backend. Network providers can improve fidelity but cannot determine whether the application boots, whether committed simulation state can be replayed, or whether evidence provenance remains available.

## v1.0 release trains

### v0.3 — Earth Native
Goal: make the real-Earth path feel like a first-class Worldline mode rather than an adapter demo.

Deliverables:
- provider health/fallback state that survives render errors;
- a packaged New Bedford source catalog and local geometry envelope;
- local source snapshot timeline distinct from simulation time;
- Truth Lens and source inspection integrated into the Earth workflow;
- free Open Earth network path plus guaranteed procedural fallback;
- terrain/source metadata surfaced without implying unavailable high-resolution terrain is locally rendered.

### v0.5 — Discovery Engine
Goal: turn the recursive-loop demonstration into a usable, inspectable research workflow.

Deliverables:
- durable local research ledger;
- anomaly records, competing hypotheses, experiments, verifier receipts, promotion decisions, and reopening events;
- separate generator and verifier identities;
- immutable evaluation-contract references;
- deterministic synthetic data-update conflict experiment;
- Reality Wake that updates candidate/future consistency without rewriting history;
- Model Worldline view showing how model/candidate states evolved.

### v0.7 — Chronos + Cosmos
Goal: make Worldline experiential, not only analytical.

Deliverables:
- browser Chronos slice with anchors, recorded worldline segments, exact deterministic echoes, convergence visualization, and reset;
- explicit fictional-mechanic labeling in Mechanics;
- richer planetary-state contract and expanded world catalog;
- observed identity separated from rendered/generated surface detail;
- Light-Time and reference-frame fields;
- constrained exoworld family variants rather than one authoritative invented planet;
- deterministic Chronos interchange export remains provider-independent.

### v1.0 — Release Experience and Hardening
Goal: produce a coherent public product rather than a collection of experiments.

Deliverables:
- cinematic but fast first-contact sequence;
- visual hierarchy that keeps the world dominant;
- responsive/mobile navigation and reduced-motion mode;
- Future Landscape visualization for branch families and divergence;
- application status/release manifest and evidence-boundary copy;
- zero-credential smoke path;
- deterministic replay, branch isolation, provider fallback, provenance, research-loop, Chronos, Cosmos, and release tests;
- exact-head CI and GitHub Pages deployment gate;
- v1.0 release tag only after production deployment succeeds.

## Human-facing navigation
Primary navigation remains stable:
- World
- Time
- Futures
- Compare
- Data
- Library

Secondary surfaces:
- Mechanics
- Truth Lens
- Research
- Chronos

Research and Chronos may be opened from Mechanics/World/Futures instead of adding permanent top-level navigation if screen density would reduce clarity.

## Earth Native architecture

### Provider classes
Worldline keeps provider identity separate from world identity.

Surface-provider states:
- `READY`
- `DEGRADED`
- `UNAVAILABLE`
- `FALLBACK`

Surface providers:
- `procedural-worldgen` — always available.
- `open-earth-maplibre` — free network Earth provider using OpenFreeMap/OpenStreetMap data.
- `local-new-bedford` — local static Worldline package for source geometry/metadata.
- optional credentialed providers remain outside the v1.0 acceptance gate.

Terrain metadata providers:
- Mapzen/AWS terrain metadata reference;
- USGS 3DEP metadata reference;
- MassGIS elevation/lidar metadata reference;
- procedural terrain fallback.

v1.0 does not claim that these terrain datasets are rendered unless the corresponding renderer path actually consumes them.

### New Bedford package
The public package remains intentionally privacy-minimized.

Required local artifacts:
- source manifest;
- source-snapshot timeline;
- derived geographic coverage geometry;
- source-status summary;
- transformation lineage;
- no personally identifying parcel ownership layer.

New Bedford’s local package is evidence metadata and selected safe geometry, not a claim of a full city digital twin.

## Twin timelines
Worldline distinguishes:
- `Reality/source time`: when observations are valid or were captured.
- `Simulation time`: the time coordinate of the active simulated worldline.

For New Bedford, Time surfaces show both when appropriate. A user can inspect historical source snapshots without silently moving the simulation branch, and can run simulated futures without rewriting source history.

## Future Landscape
Branch trees remain authoritative for ancestry. Large/family-level exploration uses a landscape metaphor.

v1.0 implements a deterministic 2D/SVG or canvas landscape derived from branch metric vectors:
- x-axis: first normalized branch feature projection;
- y-axis: second normalized branch feature projection;
- elevation/intensity: distance from baseline / divergence;
- cluster labels: deterministic Future Families;
- no probability language unless calibrated probabilities are actually available.

The visual must support selecting a family/branch and returning to exact ancestry.

## Discovery Engine

### Research objects
- `ObservationRecord`
- `AnomalyRecord`
- `HypothesisRecord`
- `ExperimentRecord`
- `EvaluationContract`
- `VerificationReceipt`
- `PromotionDecision`
- `RealityWakeRecord`
- `ResearchLedger`

Every object gets a deterministic ID derived from stable inputs or a monotonic local sequence. The browser ledger persists in localStorage and is exportable/importable as JSON.

### Recursive loop
`OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE/REJECT → MONITOR → REALITY WAKE → REOPEN`

v1.0 includes at least one end-to-end reproducible scenario:
1. load accepted New Bedford source snapshot A;
2. ingest synthetic source snapshot B containing one safe geometry/data conflict;
3. detect conflict;
4. spawn at least two reconciliation hypotheses;
5. execute frozen evaluation contract;
6. reject one candidate;
7. independently verify one candidate;
8. auto-promote only if candidate class is reversible and machine-verifiable;
9. generate Reality Wake receipt;
10. preserve source snapshot A unchanged;
11. allow reopening when later evidence contradicts the promoted reconciliation.

### Constitutional boundaries
The system may not autonomously rewrite:
- truth/epistemic semantics;
- independent-verifier requirement;
- test immutability;
- external-action authority;
- public scientific claims;
- audit/lineage requirements.

## Model Worldline
The Research surface visualizes model/candidate evolution as a small directed lineage graph or timeline. It is not a general-purpose graph database.

Required user questions it should answer:
- What observation started this change?
- Which candidate was promoted?
- Which candidate failed and why?
- Which frozen test decided the promotion?
- Which verifier signed the decision?
- Was the result later reopened?

## Chronos browser slice
The v1.0 browser Chronos prototype intentionally remains small and deterministic.

### Mechanics
- **Anchor**: capture the current recorded path segment boundary.
- **Record**: player/cursor movement appends spatial samples against a local time index.
- **Echo**: replay an exact stored segment as a luminous temporal duplicate.
- **Convergence**: detect when current path and echo enter a fixed spatial threshold at corresponding playback time and show a visual pulse.
- **Reset**: restore the fixed initial state.

The prototype can use pointer/keyboard movement in a bounded arena or a lightweight overlay rather than introducing a full game engine.

### Evidence labeling
Chronos UI must say these are **fictional gameplay mechanics inspired by spacetime/worldline concepts**. The mechanics are not presented as experimentally verified relativistic abilities.

## Cosmos v1.0
Planetary state expands to include optional:
- radiusKm;
- massEarths;
- gravityG;
- rotationPeriodHours;
- orbitalPeriodDays;
- atmosphere;
- pressureContext;
- temperature;
- radiation;
- illumination;
- terrainSourceStatus;
- surfaceRenderingClass;
- lightTime;
- referenceFrame;
- habitability dimensions.

Catalog target:
- Earth / New Bedford
- Moon
- Mars
- Venus
- Europa
- Titan
- generated WorldGen world
- at least one constrained exoworld family with three explicit variants.

Observed worlds may have `OBSERVED` identity while their local rendered geometry is `GENERATED` or `RECONSTRUCTED`. Both labels must be visible.

## Benchmark Lab
v1.0 keeps external benchmark integrations evidence-honest.

The app can:
- export 4DWorldBench-compatible evaluation manifests where practical;
- export Omni-WorldBench-style interaction traces where practical;
- maintain immutable benchmark receipts;
- run internal deterministic smoke metrics.

It must not show an external benchmark score unless that benchmark was actually executed.

## First Contact
A first-load sequence should create immediate visual identity without delaying control.

Target behavior:
1. app background is visible immediately;
2. WORLDLINE mark and a single luminous worldline appear;
3. line expands into a small field of possible trajectories;
4. interface resolves into the active world within roughly 1.5 seconds;
5. user can skip instantly;
6. reduced-motion preference bypasses animation.

The sequence must not block the world generator longer than existing boot behavior.

## Performance and resilience
- no paid credential required;
- no backend required;
- no network required for procedural mode;
- Open Earth network failure must be recoverable;
- local package parsing must fail closed with visible unavailable state;
- research-ledger corruption must preserve last parseable export and allow reset;
- visualization layers must not mutate committed simulation state;
- avoid adding large dependencies unless a feature cannot be implemented safely with the existing stack.

## Accessibility
- keyboard focusable primary controls;
- visible focus states;
- reduced-motion support;
- minimum readable text sizing on mobile;
- no color-only distinction for epistemic classes or candidate status;
- semantic labels for map/Chronos canvases and control groups.

## Versioning
Add a release manifest containing:
- semantic version;
- release codename;
- canonical schema versions;
- build commit placeholder resolved at build/runtime where possible;
- evidence-boundary statement;
- supported provider classes.

v1.0 release tag must point to the same commit that passes production deployment.

## Test strategy
Required focused suites:
- Earth provider resolution and fallback;
- New Bedford manifest/provenance validation;
- twin-timeline behavior;
- Future Landscape deterministic projection;
- research-ledger round-trip and corruption handling;
- recursive conflict experiment and verifier separation;
- Reality Wake preservation of prior source state;
- Cosmos identity vs surface-rendering semantics;
- Chronos anchor/echo deterministic replay and convergence;
- release manifest/version semantics;
- existing v0.1/v0.2 replay/branch/truth tests remain green.

## Release gates
Each release train must pass:
1. type-check;
2. full Vitest suite;
3. production build;
4. PR review/status inspection;
5. merge to main;
6. main CI;
7. GitHub Pages build + deploy.

v1.0 is not closed until the production deploy for the exact release commit succeeds.

## Non-goals
- no full scientific digital twin claim;
- no calibrated prediction claim;
- no global photogrammetric Earth guarantee;
- no autonomous external publication;
- no unrestricted self-modification;
- no human whole-brain emulation;
- no full Unreal shipping game;
- no sensitive real-person investigative content;
- no fabricated external benchmark scores.

## Final principle
Worldline v1.0 should feel like one product: **observe a world, move through its evidence and time, branch it, compare futures, inspect uncertainty, run a bounded recursive research cycle, travel beyond Earth, and step into a small playable worldline experience without losing the distinction between what is observed, reconstructed, simulated, generated, and speculative.**