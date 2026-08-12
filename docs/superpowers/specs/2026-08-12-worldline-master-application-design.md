# Worldline Master Application Design

## Status
Approved design basis for the Worldline master application. This specification consolidates the approved Earth-first visualization architecture, extraterrestrial expansion, Chronos experiential layer, provider-independent simulation core, benchmark strategy, and B+ constitutional recursive autonomy.

## Product thesis
Worldline is a high-dimensional simulation and exploration system presented through a stable human-facing grammar: **3D space + navigable time**, with additional dimensions exposed only as context-sensitive lenses. The model may contain possibility, uncertainty, memory, model disagreement, reachability, attention, provenance, branch ancestry, and other latent state, but the interface must not turn those dimensions into competing geometric axes by default.

The product has four integrated modes over one canonical world state:

1. **Observatory** — understand worlds, navigate history, compare futures, inspect data.
2. **Laboratory** — run interventions, experiments, ensembles, and scientific or synthetic simulations.
3. **Chronos Paradigm** — inhabit selected worlds as a game-like 4D spacetime experience using worldlines, anchors, echoes, convergence, temporal slicing, and reachability mechanics.
4. **Cosmos** — extend the same interaction grammar from Earth to the Solar System, observed exoworlds, reconstructed worlds, generated worlds, habitats, and synthetic civilizations.

## Canonical repository and donor policy
`Full-Stack-Assets/WorldGen` is the canonical integration repository.

Existing projects are donors rather than co-equal runtimes:
- WorldGen: current primary 3D procedural rendering runtime.
- Ripple City / New Bedford v2.5: city, municipal, scenario, GIS, governance, and real-world data donor.
- Worldline OS M0-M1: deterministic state, event, replay, branching, and ledger contract donor.
- TESSERACT 4D: visual and interaction concept donor.
- BOS suite: shader, LoD, XR, and scientific experiment donor.
- First Synthetic Century: synthetic-history donor after correctness gates.
- Trustscape: abstract deterministic evidence/debugging projection retained as a diagnostic mode, not the main experience.

No donor may silently override the canonical state contract or truth taxonomy.

## Human-facing navigation grammar
Primary visible navigation:

- **World**
- **Time**
- **Futures**
- **Compare**
- **Data**
- **Library**

Secondary inspector:

- **Mechanics** — evidence, assumptions, provenance, model version, transition receipts, uncertainty decomposition, branch ancestry, verification lineage.

The main viewport should be visually dominant. The target is approximately 70–85% of the primary screen during exploration.

## Ontological zoom
Zoom changes both geometry and semantic/model resolution.

Spatial hierarchy:

`Cosmos → Galaxy → Stellar System → Planet/Moon/Habitat → Region → City/Settlement → Neighborhood → Parcel/Structure → Household/Population → Person/Organism/Machine → Event`

Model hierarchy:

`Cosmic → Planetary → Regional → City/Mesoscopic → Neighborhood/Microsimulation → Household/Selective Agent → Individual/Behavioral Agent → Event/Exact Transition`

A model-resolution badge must make the active fidelity explicit. A large record count must never imply interacting-agent realism.

Recommended fidelity labels:
- FIELD
- COHORT
- MICROSIM
- AGENT
- INTERACTING AGENT
- COGNITIVE AGENT
- EXPERIENTIAL MODEL

## World classes and epistemic status
Worldline must visibly distinguish:

- **Observed World** — primarily measured data.
- **Reconstructed World** — evidence plus model-assisted reconstruction.
- **Constrained Exoworld** — observed astronomical constraints plus explicitly inferred candidate properties.
- **Generated World** — synthetic, procedurally generated world.
- **Civilization World** — synthetic social or settlement simulation.
- **Scientific World** — controlled experiment or scientific model.
- **Creative/Fantasy World** — intentionally unconstrained fictional world.

Truth-state semantics must remain explicit:

`OBSERVED → RECONSTRUCTED → SIMULATED → GENERATED → SPECULATIVE`

No visualization may silently transform one class into another.

## Earth substrate
Worldline owns canonical world state and adapters. External visual/data providers are replaceable.

Initial provider design:
- Earth geometry adapter: Google Photorealistic 3D Tiles via Cesium where credentials and terms permit.
- Earth data adapter: Google Earth Engine and public datasets where credentials/terms permit.
- Fallback geometry adapter: current WorldGen procedural terrain and public/open geospatial data.

Provider identifiers must not become canonical state identifiers. Worldline state must survive provider replacement.

## Extraterrestrial layer: Worldline Cosmos
Worldline Cosmos extends the architecture beyond Earth while preserving the same space/time/future grammar.

World-specific state can include gravity, atmosphere, pressure, temperature, radiation, illumination, chemistry, terrain, resources, orbital state, and habitability dimensions.

New lenses:
- **Planetary State**
- **Light-Time**
- **Reference Frame**
- **Habitability Landscape**

Habitability must not collapse into a single authoritative score. Distinguish at minimum microbial habitability, complex-life habitability, unprotected human habitability, and technologically supported settlement viability.

Observed exoplanets must render candidate world families rather than a single falsely authoritative surface when major properties are unknown.

## Time system
Worldline supports four primary temporal modes:

1. **Playback** — cinematic evolution of one worldline.
2. **Temporal Parallax** — selected past/present/future states coexist spatially as offset layers.
3. **Time Slice** — exact inspection of one instant.
4. **Time Volume** — local analytical 3D representation of change through time.

Past committed state is visually distinct from reachable or speculative future state.

For Chronos:
- past worldline = solid/committed;
- present = highest-intensity focal state;
- reachable future = translucent;
- increasingly speculative future = increasingly diffuse;
- impossible future = absent rather than merely dim.

## Future representation
Branch rendering scales with ensemble size:

- 1–2 worlds: overlay or split view.
- 3–4 worlds: individually trackable worldlines.
- 5–50 worlds: Future Families.
- 50–10,000 worlds: density landscapes / envelopes.
- 10,000+: Future Continents, archetypes, outliers, and search.

Future Continents are a visual clustering metaphor over a discrete possibility space. The implementation must not claim a continuous manifold unless a mathematically justified continuous representation is explicitly implemented.

Related primitives:
- **Minimum-Change Worldline**
- **Reversibility Horizon**
- **Influence Envelope**
- **Response Landscape**
- **Residual Field**
- **Historical Hysteresis / Memory Geology**

## Reality Wake and Twin Timelines
Worldline maintains:

- **Reality Time** — what actually occurred.
- **Knowledge Time** — what a model believed at a given historical point.

A new observation can trigger a **Reality Wake**: candidate worlds and model families are reweighted or eliminated according to explicit evidence rules. The interface must say that the set of futures consistent with current evidence changed, not that “the future changed.”

Models themselves have worldlines. Every promoted model must retain ancestry to prior versions, experiments, anomalies, observations, and validation results.

## Anti-Oracular uncertainty
Uncertainty remains inspectable without dominating the default experience.

Recommended semantic treatments:
- strong evidence: sharp geometry;
- moderate uncertainty: subtle softness or instability;
- competing models: layered/double-edge alternatives;
- sparse evidence: local fog/transparency;
- missing observation: explicit unmodeled hole;
- model disagreement: split/interference treatment;
- falsified prediction: fracture or branch collapse.

Every uncertainty treatment must be queryable and traceable to underlying evidence or model status.

## Chronos Paradigm experience layer
Chronos consumes the same committed state, replay, branch, and time contracts as Observatory/Laboratory.

Signature mechanics:
- **Worldline Anchor** — save an actionable temporal segment.
- **Echo** — replay an exact recorded segment; not an AI companion.
- **Convergence** — valid temporal trajectories intersect for gameplay effect.
- **Divergence** — expose a small number of readable future choices.
- **Temporal Shear** — expose nearby temporal states of local objects/geometry.
- **Worldline Sever** — adversarial loss of access to prior anchored states.

Scientific inspiration must be distinguished from fictional gameplay abilities. Real light cones can inform reachability visualization; fictional mechanics must not be presented as textbook relativity.

Visual spectacle must use dynamic range rather than constant maximal intensity:

`QUIET → TENSION → ACTION → CONVERGENCE → RUPTURE → SILENCE`

Gameplay VFX must communicate mechanics, not obscure them.

## Canonical world-state architecture
Worldline owns a provider-independent committed state contract containing at minimum:

- world identity and epistemic class;
- spatial reference;
- current simulation time;
- deterministic seed/random-stream state where applicable;
- entities and geometry references;
- metrics and environmental fields;
- model-fidelity level;
- observation/evidence references;
- uncertainty/model-disagreement state;
- branch ancestry;
- event ledger;
- replay commitment;
- dataset/model/code version lineage.

Visualization is always a projection of committed state. Changing a renderer, lens, camera, provider, or visual encoding must not change the underlying simulation.

## Recursive system: B+ Constitutional Recursive Autonomy
Worldline uses a controlled recursive loop rather than unrestricted self-modification.

### Outer constitutional layer
The following are protected from autonomous rewrite:

1. Evidence semantics and truth-state taxonomy.
2. Reproducibility and lineage requirements.
3. Independent verification requirement.
4. Test immutability during candidate evaluation.
5. External-action and production-authority boundaries.
6. Auditability of every recursive mutation.

### Inner recursive discovery sandbox
Maximum recursive experimentation is permitted inside isolated candidate branches/workspaces. The system may autonomously generate and modify:

- hypotheses;
- models;
- algorithms;
- simulations;
- internal agents;
- experimental tools;
- representations;
- evaluators as candidates;
- benchmark candidates;
- visualization strategies;
- rendering optimizations;
- gameplay balance candidates;
- search and experiment-selection policies.

A candidate may propose new tests or evaluators, but it cannot change the test used to decide its own promotion.

### Recursive loop
The default loop is:

`OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE/REJECT → MONITOR → REALITY WAKE → REOPEN → repeat`

Operational behavior:
- detect anomalies, failures, disagreement, novelty, benchmark regressions, player-behavior issues, or scientific evidence changes;
- spawn competing mechanistic hypotheses;
- use adversarial falsification;
- select the next test by expected information gain when possible;
- build candidates in isolation;
- run deterministic replay, benchmarks, held-out tests, and invariant checks;
- use a verifier independent from the candidate generator;
- automatically reject failures and store lessons;
- automatically promote only low-risk changes explicitly permitted by promotion policy;
- route architectural, scientific-claim, data-policy, production, or authority changes to a gated approval path;
- continue monitoring promoted candidates against new observations or usage data;
- reopen prior conclusions when later evidence contradicts them.

Every model/code/evaluator/dataset lineage is itself a navigable Worldline.

## Validation strategy
Validation is layered rather than benchmark-only.

Required categories:
- deterministic replay and seed/state tests;
- branch isolation and ancestry tests;
- state serialization/commitment tests;
- provider-independence tests;
- semantic truth-state tests;
- temporal consistency tests;
- visual-regression checks;
- interaction-state transition tests;
- performance budgets;
- held-out evaluation sets;
- independent verifier runs.

External benchmark adapters:
- 4DWorldBench-compatible evaluation for world fidelity/4D consistency where applicable;
- Omni-WorldBench-compatible evaluation for interaction/state-transition quality where applicable.

Benchmarks are evidence, not constitutional truth. The recursive system cannot improve a candidate by silently changing its deciding benchmark.

## Deployment shape
Phase 1 is a web application in the current React/TypeScript/Vite repository.

Recommended runtime split over time:
- **Worldline Web**: React + current Three.js/R3F runtime, adding CesiumJS/provider adapters where permitted.
- **Worldline Experience / Chronos**: later high-fidelity runtime may use Unreal Engine + Cesium for Unreal, sharing canonical state contracts rather than duplicating simulation semantics.

The web application must remain functional without Google credentials using the procedural fallback provider.

## Implementation phases
### Phase 0 — Foundation and constitutional kernel
- define canonical world-state types;
- define epistemic classes and model-fidelity labels;
- implement deterministic branch/replay interfaces;
- implement recursive-loop candidate/promotion contracts;
- add tests before feature work.

### Phase 1 — Master shell and visual runtime
- convert WorldGen shell to World/Time/Futures/Compare/Data/Library navigation;
- keep 3D viewport dominant;
- add world-provider adapter boundary;
- preserve existing procedural world as fallback.

### Phase 2 — Time and possibility
- add Time Slice and Temporal Parallax prototype;
- add branch/future representation scaling;
- implement Future Families and prototype Future Continents;
- implement compare overlays and Difference Lens.

### Phase 3 — Real-Earth adapter
- integrate Cesium/Google 3D Tiles only when credentials/terms are available;
- add provider-independent observed-data overlays;
- implement New Bedford as World #001 using explicit observed/simulated separation.

### Phase 4 — Cosmos
- add Solar System/planet world catalog;
- implement planetary-state metadata and visual adaptation;
- add generated exoworld families and uncertainty-aware candidate rendering;
- add light-time/reference-frame analytical lenses.

### Phase 5 — Recursive engine
- implement anomaly queue, hypothesis candidates, experiment selection, isolated candidate execution, verifier, promotion policy, and lineage ledger;
- initially restrict automatic promotion to reversible machine-verifiable changes;
- expose Model Worldlines in the UI.

### Phase 6 — Chronos prototype
- implement playable worldline trail, Anchor, deterministic Echo, Convergence, limited Divergence preview, and time-slice interaction in a controlled scene;
- retain explicit “scientific visualization vs fictional mechanic” labeling in developer/Mechanics views.

### Phase 7 — Benchmarks and hardening
- add 4D/interaction benchmark adapters where technically compatible;
- add held-out regression suites;
- validate performance, replay, branch isolation, epistemic labeling, and provider fallback.

### Phase 8 — Deployment and promotion
- deploy preview from the isolated feature branch;
- run smoke, interaction, visual, and recursive-loop acceptance tests;
- open PR, inspect CI, and resolve regressions;
- only promote to main/production after all automated gates are green and any externally required credential/OAuth/terms gate is satisfied.

## Acceptance criteria
The first production-capable master application is accepted when:

1. Opening the app immediately presents a functioning 3D world without requiring Google credentials.
2. The user can move through at least World, Time, Futures, Compare, Data, and Library surfaces without leaving the application shell.
3. One deterministic world can be replayed exactly from committed state.
4. At least one branch can be created, compared, and traced to its parent state.
5. Temporal Parallax can display at least three committed/simulated temporal states while preserving spatial context.
6. Future visualization automatically changes representation when branch count exceeds direct-line readability thresholds.
7. Epistemic class and model-fidelity level are visible/queryable.
8. A generated or simulated world cannot be mislabeled as observed through the UI state contract.
9. The recursive engine can detect a synthetic regression, generate at least two candidate responses, run isolated evaluation, reject a failing candidate, and record the lineage.
10. The candidate under evaluation cannot modify the deciding acceptance test.
11. A low-risk reversible candidate may auto-promote only when all configured machine-verifiable gates pass.
12. Architectural/scientific-claim/authority policy changes remain gated.
13. The procedural provider remains a working fallback if external map credentials are absent.
14. CI/typecheck/tests/build pass on the feature head.
15. A deployable preview passes smoke testing before merge or production promotion.

## Non-goals for the first release
- Do not claim that a 100,000-record fixture represents 100,000 realistic interacting citizens.
- Do not claim mathematical manifold/fiber-bundle/geodesic structure unless formally implemented.
- Do not represent simulated futures as calibrated probabilities without empirical calibration.
- Do not implement unrestricted constitutional self-modification.
- Do not make Google or any external tile/data provider the canonical database.
- Do not require Unreal Engine for the first web release.
- Do not place sensitive real-person criminal-investigation material into the public/default world experience.

## Final principle
Worldline should maximize the amount of possibility a human can correctly understand, not the amount of simulated information the GPU can draw. The system may recursively improve how it models, tests, renders, and experiments, but it must preserve immutable truth semantics, independent verification, reproducibility, lineage, and external-action boundaries.
