# Worldline 4D — Temporal Reality Studio v1

Status: internal implementation candidate. Production deployment, canonical mechanism promotion, municipal use, HIL/physical actuation, commercial release, and merge remain Human Authority actions.

## Product boundary

Worldline is a governed computational reality system, not a visual prediction oracle. Canonical state, mechanism execution, verification, rendering, harness optimization, and real-world evidence remain separate contracts. A model may propose a transition or harness; it cannot declare the proposal true, mutate canonical state from the sandbox, alter its evaluator, expand its authority, or convert simulation into observation.

## Implemented sequence

| Step | Implementation | Verification |
|---|---|---|
| 1 | Canonical JSON hardening, xoshiro128** PRNG, content-addressed RunGraph, store snapshot/export, deterministic branch identity | Donor parity vectors, 10,000 seed cases, replay/tamper/fork tests |
| 2 | `worldline-causalbench-v1`, C0–C10, separate visual and causal scores | Missing dimensions become `INCOMPATIBLE`; evidence required |
| 3 | `MechanismSpec` and `WorldTransitionProposal` | Deterministic identity, declared read/write/effects/evidence/uncertainty |
| 4 | Data-only transition sandbox | No `eval`, no canonical revision handle, no write authority, explicit budgets |
| 5 | Invariant, replay, paired-intervention, failure-preservation, and counterexample suites | Retained counterexamples block admission |
| 6 | Frozen independent `MechanismVerifier` | Producer/verifier identity collision rejected |
| 7 | Append-only `MechanismRegistry` | Human approval contract, event chain, retirement and rollback without deletion |
| 8 | Read-only `RenderProjection` and cinematic Temporal Reality Studio | Provider isolation, unchanged state/ancestry/ledger hashes, UI tests |
| 9 | `HarnessSpec` and `HarnessEvolutionLab` | Frozen evaluator, held-out uplift, cost/latency/token gates, authority non-expansion, lineage |
| 10 | Bounded JIT harness proposal generator | Task/model holdout exclusion, fixed comparison matrix, repeated seeds, internal-only labels |
| 11 | Micro/meso/macro causal mappings | Do-set interventions, cross-scale equivalence, regime scope, no unrelated drift, explicit identifiability |
| 12 | Synthetic, robotic-simulator, and New Bedford paths | Complete chain receipts; physical evidence precedence; municipal scenario-not-prediction boundary |

## Repository reconciliation

| Source | Reused principle | Boundary |
|---|---|---|
| `Temporal-Drift/CausalCityPrototype` | Canonical serialization, explicit PRNG, Snapstates, receipt-chain and RunGraph patterns | Donor only; Temporal Drift remains a consumer |
| Canon | Authority, evidence, preflight, revenue and Human Authority gates | Sole authority plane |
| Po | Checkpoints, approval, persistence, verifier, budgets | Harness donor, not a competing control plane |
| COO Engine / HostGraph | Cost-aware routing and resource constraints | Donor only |
| SelfLLM | Champion retention and rollback concepts | No weight-level recursive self-training is wired into Worldline |

Base WorldGen commit: `a26e8ab52e42f5907a2ecebb4046642dc7ff0f5f`.

Temporal Drift source commit: `11351c5331f46ceea85983b32a321424e13f838e`.

CausalCity donor verification reported 77 tests, 10,000 seed expansions, 1,000 forks, and 1,000 shadow cases before extraction work began.

## New Bedford decision-support contract

The local map artifact is one reconstructed source-service coverage extent in EPSG:4326—not a parcel layer, city boundary, calibrated thematic surface, or photogrammetric twin. The UI and data package preserve:

- source time: 2023–2026 source package;
- simulation time: 2026–2046 scenario horizon;
- `RECONSTRUCTED` and `SIMULATED` labels;
- two bounded, expert-review-required sensitivity interventions;
- back-test and sensitivity calibration status as `NOT_RUN`;
- the product claim “scenario analysis, not prediction.”

The interactive coverage overlay should use a categorical reconstructed legend. It must not use an unnormalized count choropleth. Web Mercator is acceptable at city scale for display; the source geometry remains EPSG:4326.

## Verification result

- 93 test files, 288 tests: pass.
- 10,000 deterministic seed expansions: pass.
- strict TypeScript typecheck: pass.
- production Vite/PWA build: pass.
- New Bedford source/schema/CRS/geometry/privacy/claim-boundary validation: pass.
- whitespace/error-marker check with `git diff --check`: pass.

These results verify an internal software path. They are not a completed CausalBench benchmark result, a scientific causal-identification claim, HIL/physical validation, municipal expert approval, customer proof, or authorization to deploy.

## Next authority gates

1. Independent code review and source-branch merge approval.
2. External/held-out CausalBench evaluation with immutable evaluator receipts.
3. Expert review, calibrated sensitivity analysis, and back-testing before a New Bedford pilot.
4. Simulator safety review, then HIL approval, before any physical adapter.
5. Revenue gate completion before customer-facing commercial release.

Rollback is source-control based: revert the implementation commit or continue from the recorded base commit. Mechanism and harness registries are append-only; use retirement/rollback events rather than destructive deletion.
