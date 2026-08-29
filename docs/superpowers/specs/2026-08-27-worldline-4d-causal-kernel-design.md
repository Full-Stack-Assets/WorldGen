# Worldline 4D Causal Kernel Design

Date: 2026-08-27  
Status: Human-approved architecture, pending written-spec review  
Repository: `Full-Stack-Assets/WorldGen`

## 1. Purpose

Worldline / 4D Causal World Model must preserve a deterministic, versioned, causally auditable canonical world state while allowing AI coding agents to propose executable transition mechanisms and generative models to render canonical states.

The central authority rule is:

> AI coding agents may propose causal mechanisms. Generative models may render canonical states. Neither may directly mutate canonical truth.

Worldline therefore adopts the useful separation demonstrated by Code World Model between executable state and visual realization, while strengthening the trust boundary: the coding agent is not the authority that decides canonical truth. A trusted deterministic kernel validates and admits transitions. JIT-Agent further motivates treating the harness around a coding agent as a provenance-bearing artifact because changing the harness can materially change behavior even when foundation-model weights stay fixed.

This design extends the existing Worldline invariant that committed simulation/world state is separate from presentation and that renderers must not mutate canonical state.

## 2. Scope

This design covers:

- authoritative canonical world-state representation;
- immutable revision and causal lineage semantics;
- typed AI-generated transition-mechanism proposals;
- deterministic transition execution;
- validation and promotion gates;
- explicit model/harness/tool provenance;
- renderer isolation and render receipts;
- migration from the current `WorldlineState` shape;
- append-only persistence requirements;
- deterministic replay and adverse-test requirements.

This design does not claim:

- a general physical simulator;
- autonomous scientific truth discovery;
- that generated code or video is evidence of observed reality;
- that 4DWorldBench or any perceptual benchmark can decide canonical truth;
- unrestricted self-modification;
- production database migration or deployment authority.

“4D” in this design means an explicitly time-indexed, spatial world model with persistent causal consequences across revisions. It is not a claim of relativistic manifold simulation.

## 3. Existing baseline

Worldline already provides several correct foundations:

- `src/worldline/state.ts` separates pure state functions from React rendering;
- branches fork deterministically from committed snapshots and do not mutate parents;
- `src/worldline/promotionPolicy.ts` separates low-risk auto-promotion from human-gated architecture, policy, model, benchmark, authority, and scientific-claim changes;
- `src/worldline/worldModelRegistry.ts` distinguishes reference readiness from executed evidence;
- `docs/WORLDLINE_RUNTIME.md` explicitly states that changing camera, lens, provider, map style, renderer, or presentation must not mutate canonical state;
- generator and verifier identities are already conceptually separated in the research loop.

The material gap is mechanical enforcement. Today `commitSnapshot(state, snapshot)` can accept a caller-supplied snapshot and replace the snapshot for the same branch/year without requiring a transition proposal, mechanism identity, validation receipt, deterministic replay proof, or promotion decision. `WorldlineState` also mixes domain state with session/presentation selection fields.

## 4. Constitutional invariants

The causal kernel MUST enforce all of the following.

1. **Append-only authority.** Canonical history is never rewritten. Corrections create superseding revisions or branches.
2. **Single admitted path.** No public API may directly insert or replace canonical state. Canonical mutation occurs only through the transition-admission gate.
3. **Deterministic commitment.** The same base revision, mechanism version, normalized inputs, seed, and kernel version must produce the same candidate-state digest.
4. **Explicit ancestry.** Every non-genesis canonical revision names exactly one parent revision in v1. Merge revisions are out of scope for v1.
5. **Causal auditability.** Every accepted revision references the transition receipt that explains why it exists.
6. **Proposal is not authority.** AI-generated code, Transition IR, harnesses, renderings, inferred events, and extracted facts remain candidate or derived artifacts until admitted by policy.
7. **Verifier independence.** The proposal producer cannot alter the evaluator or verifier used to admit its own transition.
8. **Epistemic monotonicity.** Generated or simulated artifacts cannot self-upgrade to `OBSERVED`. `RECONSTRUCTED` and `OBSERVED` states require evidence-specific intake rules and provenance.
9. **Renderer isolation.** A renderer receives immutable state or a derived projection and has no canonical write capability.
10. **Harness provenance.** Changing the agent harness, memory program, tool registry, or runtime configuration changes the identity of the proposal-producing system.
11. **Fail closed.** Missing provenance, stale base revisions, undeclared writes, non-deterministic replay, receipt tampering, or policy ambiguity block admission.
12. **Benchmark separation.** Perceptual or world-model benchmark success may validate rendering quality or alignment but cannot by itself promote canonical causal truth.

## 5. Authority model

The system is divided into five roles.

### 5.1 Canonical Kernel

The Canonical Kernel is the only component authorized to admit a new canonical revision. It owns canonical serialization, hashing, transition validation, deterministic execution, replay verification, promotion-policy evaluation, and revision creation.

### 5.2 Proposal Producer

A Proposal Producer may be a human-authored module, coding agent, JIT-generated harness plus model, imported model artifact, or other bounded generator. It may emit a `TransitionMechanismArtifact` and `TransitionProposal`. It receives no canonical write handle.

### 5.3 Independent Verifier

The verifier re-executes admitted candidates from the immutable base revision and verifies state digest equality, policy conformance, declared read/write boundaries, and required invariants. The verifier configuration is frozen before candidate evaluation.

### 5.4 Projection Adapter

A Projection Adapter deterministically converts a canonical revision into a renderer-friendly proxy such as scene constraints, entity transforms, temporal anchors, masks, graph structure, or other provider-neutral representation. It does not create new canonical facts.

### 5.5 Renderer

A renderer may be procedural, conventional 3D, or generative video/image/world-model infrastructure. It consumes a `RenderEnvelope` and returns a derived visual artifact plus `RenderReceipt`. It cannot promote state.

## 6. Canonical state versus session state

Current `WorldlineState` combines durable world data with view/session selections. The new architecture splits them.

### `CanonicalWorldState`

Contains durable world-domain data only, initially compatible with the existing `worldline-state-v1` world/branch/snapshot model:

- worlds;
- branches;
- committed snapshots;
- durable world events and causal references.

It does not contain:

- active world selection;
- active branch selection;
- selected UI year;
- camera/lens/provider selection;
- `TimeMode` view selection;
- renderer configuration.

### `WorldlineSessionState`

Contains presentation and interaction state including active world, active branch, selected year, time-mode view, camera, provider, renderer, and UI preferences. Updating session state never creates a canonical revision.

This makes the state/render separation structural instead of conventional.

## 7. Canonical revision model

Introduce schema `worldline-canonical-revision-v1`.

A revision contains:

```ts
interface CanonicalRevision {
  schema: 'worldline-canonical-revision-v1';
  revisionId: string;
  parentRevisionId: string | null;
  worldId: string;
  branchId: string;
  sequence: number;
  simulationTime: number;
  stateSchema: string;
  stateHash: `sha256:${string}`;
  transitionReceiptCoreHash: `sha256:${string}` | null;
  epistemicClass: EpistemicClass;
  kernelVersion: string;
}
```

`revisionId` is derived from the canonical hash of all deterministic revision fields except `revisionId` itself.

Genesis revisions have `parentRevisionId = null` and `transitionReceiptCoreHash = null`.

The authoritative store persists revision manifests and materialized canonical states by content hash. Revisions are append-only.

## 8. Canonical serialization and hashing

Worldline uses SHA-256 over RFC 8785 JSON Canonicalization Scheme compatible JSON.

Canonical payload rules:

- object keys are canonically ordered;
- arrays preserve semantic order unless the schema explicitly declares a collection set-like and sorted by a stable ID;
- `undefined`, functions, symbols, `NaN`, positive/negative infinity, and implementation-specific object types are rejected;
- negative zero normalizes to zero;
- dates are represented as explicit schema strings, never native `Date` objects;
- wall-clock timestamps, log formatting, telemetry IDs, and storage locations are excluded from deterministic state hashes;
- human-readable receipt envelopes may contain `recordedAt`, but canonical revisions reference the deterministic `receiptCoreHash`, not the non-deterministic envelope hash.

All canonical digests use the form `sha256:<lowercase hex>`.

## 9. Transition mechanism artifact

Introduce schema `worldline-transition-mechanism-v1`.

A mechanism is a versioned executable contract, not a state mutation. It contains:

- mechanism ID and content digest;
- producer identity;
- source type: `HUMAN_AUTHORED`, `AGENT_GENERATED`, or `IMPORTED`;
- executor kind, initially `TRANSITION_IR_V1`;
- declared state schema compatibility;
- declared read set;
- declared write set;
- input schema;
- epistemic ceiling;
- deterministic seed policy;
- invariant suite references;
- risk class;
- promotion status: `CANDIDATE`, `APPROVED_EXECUTABLE`, `RETIRED`, or `REJECTED`;
- approval receipt when promoted.

An agent-generated mechanism MUST begin as `CANDIDATE` and cannot promote itself. Human Authority promotes a mechanism version after review and validation. A later generated or repaired version is a new candidate with a new digest.

## 10. Transition IR v1

Arbitrary AI-generated TypeScript, JavaScript, Python, shell, or dynamic `eval` is not admitted into the canonical executor in v1.

The proposal producer emits a typed, data-only Transition IR. This is the narrow waist of the architecture.

Transition IR v1 supports only deterministic operations over approved paths:

- `SET`;
- `INCREMENT`;
- `APPEND_UNIQUE`;
- `TOMBSTONE`;
- `ASSERT` preconditions;
- `LINK_CAUSE` for explicit causal references.

Every operation contains a JSON Pointer target path. The target must be inside the mechanism's declared write set. Reads used by expressions must be inside its declared read set.

V1 expressions are intentionally limited to:

- literals;
- canonical input references;
- approved state-path references;
- addition, subtraction, multiplication, division;
- minimum/maximum;
- fixed-scale rounding;
- deterministic comparisons;
- boolean composition.

V1 forbids network calls, wall clock, filesystem access, environment access, hidden mutable memory, system randomness, arbitrary code execution, transcendental platform-dependent math, or unbounded iteration.

Where randomness is required, the proposal supplies an explicit seed and the kernel uses a versioned deterministic PRNG implementation. PRNG algorithm identity is part of the mechanism digest and kernel version.

## 11. Transition proposal

Introduce schema `worldline-transition-proposal-v1`.

A proposal binds a mechanism to a precise base revision:

```ts
interface TransitionProposal {
  schema: 'worldline-transition-proposal-v1';
  proposalId: string;
  baseRevisionId: string;
  mechanismId: string;
  normalizedInputs: unknown;
  inputHash: `sha256:${string}`;
  seed: string | null;
  producerId: string;
  causalClaims: CausalReference[];
}
```

The kernel rejects stale proposals if the requested branch head no longer equals `baseRevisionId`, unless the caller explicitly creates a new branch from that historical revision.

## 12. Proposal-producer and harness provenance

Introduce a stable `ProducerIdentity` that commits to the full system generating the proposal.

For a conventional coding agent this includes:

- foundation model provider/model/version where available;
- system/developer prompt bundle digest;
- harness implementation digest;
- memory snapshot/program digest;
- tool registry and tool-schema digest;
- skill registry digest;
- sandbox/runtime version;
- decoding and relevant runtime parameters.

For a JIT-generated harness it additionally includes:

- harness-generator model identity;
- generated harness artifact digest;
- harness repair/evolution lineage;
- archive or experience-memory snapshot digest used to synthesize the harness.

A harness change therefore produces a new `producerId` even when the same foundation model is used.

Producer identity provides attribution, not authority.

## 13. Validation and transition-admission pipeline

Every proposed transition runs through the following fixed sequence:

```text
Canonical Revision Rn
  -> Proposal schema validation
  -> Mechanism status validation
  -> Base-revision freshness check
  -> Read/write-set validation
  -> Epistemic policy validation
  -> Deterministic IR execution
  -> Candidate-state canonicalization
  -> Candidate state hash
  -> Invariant suite
  -> Independent deterministic replay
  -> Candidate hash equality check
  -> Promotion-policy evaluation
  -> CanonicalTransitionReceipt
  -> Accepted Canonical Revision Rn+1 OR rejection
```

No stage may be skipped by a proposal producer or renderer.

## 14. Transition receipt

Introduce schema `worldline-transition-receipt-v1` with a deterministic core and non-deterministic envelope.

The deterministic core records:

- base revision ID and state hash;
- mechanism ID and mechanism hash;
- proposal ID and input hash;
- producer ID;
- kernel version;
- PRNG identity and seed when used;
- declared read/write sets;
- each gate result;
- invariant results;
- candidate state hash;
- independent replay state hash;
- verifier identity/config digest;
- decision: `ACCEPTED`, `REJECTED`, or `HUMAN_REQUIRED`;
- required Human Authority approval reference when applicable.

The envelope may add `recordedAt`, storage identifiers, CI run URLs, and human-readable notes. Envelope metadata does not affect deterministic replay.

An accepted canonical revision references the receipt core hash.

## 15. Epistemic admission policy

Existing Worldline epistemic classes remain:

- `OBSERVED`;
- `RECONSTRUCTED`;
- `SIMULATED`;
- `GENERATED`;
- `SPECULATIVE`.

Mechanisms declare an epistemic ceiling.

Rules:

- general coding-agent and generative-model mechanisms may create only `SIMULATED`, `GENERATED`, or `SPECULATIVE` consequences;
- renderer output is always derived and cannot itself become `OBSERVED` or `RECONSTRUCTED`;
- `OBSERVED` admission requires a dedicated evidence-ingest mechanism, source provenance, evidence integrity checks, and the project evidence policy;
- `RECONSTRUCTED` admission requires explicit derivation from admitted evidence and must preserve source-to-reconstruction lineage;
- a weaker epistemic input cannot be relabeled as stronger truth without an authorized evidence process;
- world identity epistemic class and rendered-surface epistemic class remain separate.

## 16. Promotion policy

Existing `promotionPolicy.ts` remains the constitutional starting point but gains causal-kernel semantics.

### Mechanism promotion

Every newly generated transition-mechanism version is human-gated before it may become `APPROVED_EXECUTABLE`.

### Execution promotion

Once a mechanism is approved, individual executions may auto-admit only when:

- the mechanism policy explicitly permits automatic execution;
- the transition stays inside its declared write set;
- all machine-verifiable invariants pass;
- independent replay matches;
- the epistemic ceiling is respected;
- the execution risk is inside the approved class;
- no policy requires Human Authority for the specific transition.

High-risk state changes, scientific-claim changes, authority changes, model-policy changes, and any transition whose policy evaluation is ambiguous return `HUMAN_REQUIRED`.

System-level reversibility is achieved through immutable history and branching from earlier revisions, never by deleting or rewriting the prior accepted revision.

## 17. Renderer boundary

Introduce schema `worldline-render-envelope-v1`.

A `RenderEnvelope` contains:

- source canonical revision ID and state hash;
- immutable canonical-state projection;
- deterministic proxy representation digest when a projection adapter is used;
- spatial constraints;
- temporal constraints;
- epistemic labels;
- rendering intent;
- renderer/provider policy;
- optional deterministic render seed where the provider supports one.

The renderer receives no transition-admission capability, database write credential, or canonical-state mutation endpoint.

Introduce schema `worldline-render-receipt-v1` containing:

- source revision ID/hash;
- projection/proxy digest;
- renderer/model identity and version;
- prompt/configuration digest;
- render seed where available;
- output artifact digest/locator;
- render-time provenance;
- benchmark/evaluation receipts when actually executed.

A render is a view of a canonical state, not a canonical state.

If a render suggests a new fact, that fact must re-enter the system as a separate evidence or transition proposal and pass the normal admission pipeline. No renderer-feedback shortcut exists.

## 18. Projection adapters and Code World Model compatibility

Worldline adopts the architectural lesson from Code World Model without delegating truth authority to the coding agent.

The compatible flow is:

```text
Canonical revision
  -> deterministic projection adapter
  -> proxy/spatiotemporal constraints
  -> generative renderer
  -> visual observation artifact
```

The proxy is a deterministic derived artifact tied to the source state hash. It can carry frame-level spatial and temporal constraints without becoming a second hidden canonical graph.

Future Code World Model, Genie, Cosmos, MiniMax, or other adapters can integrate at the proposal and rendering boundaries without replacing the canonical kernel.

## 19. 4D causality representation

Each accepted transition may record `CausalReference` edges linking consequences to prior admitted entities, events, evidence, actions, interventions, or revisions.

A causal reference contains:

- source type and stable ID;
- source revision ID;
- relation type such as `TRIGGERED_BY`, `CONSTRAINED_BY`, `DERIVED_FROM`, `COUNTERFACTUAL_TO`, or `EVIDENCED_BY`;
- optional mechanism-local explanation code;
- provenance digest.

Causal references are claims made by the approved mechanism and validated structurally. They do not automatically establish scientific causation. The UI and exports must distinguish system causal lineage from empirically validated causal claims.

## 20. Persistence model

The canonical store is append-only and content-addressed.

Logical collections:

- canonical revisions;
- materialized canonical states by hash;
- transition mechanism artifacts;
- transition proposals;
- transition receipt cores;
- human-approval receipts;
- render receipts;
- derived render artifacts.

Production persistence eventually requires dedicated append-only RPC operations rather than the existing generic project-state synchronization contract. Database migration, production RPC changes, credential changes, and deployment remain separate Human Authority-gated Work Items.

The first implementation may run the causal kernel entirely as pure TypeScript over in-memory fixtures while preserving the final persistence interfaces.

## 21. Migration from current Worldline

Migration is incremental.

### Stage A: Pure causal kernel

Add canonical serialization, revision types, mechanism/proposal/receipt types, Transition IR, validator, deterministic executor, and replay verifier without changing production storage.

### Stage B: State/session split

Introduce `CanonicalWorldState` and `WorldlineSessionState`. Move `activeWorld`, `activeBranchId`, `selectedYear`, and `timeMode` behavior into session state. Preserve adapters so current UI behavior continues while canonical domain state becomes explicit.

### Stage C: Close direct-commit path

Deprecate `commitSnapshot(state, snapshot)` as a canonical-authority API. Internal tests may retain fixture helpers, but application code must admit durable changes through the causal kernel.

`createBranch` becomes either:

- an approved built-in causal mechanism; or
- a wrapper that emits an approved branch-creation Transition Proposal.

Read-only functions such as replay and snapshot comparison remain pure projections.

### Stage D: Renderer envelopes

Route procedural and future generative renderers through immutable `RenderEnvelope` inputs and persist `RenderReceipt` evidence separately.

### Stage E: Durable append-only persistence

Add production revision/receipt storage and migrate Studio project persistence only after a dedicated database design, migration verification, rollback plan, and Human Authority approval.

## 22. Public API boundary

The causal-kernel package exposes only:

- genesis creation;
- canonical read/materialization;
- mechanism registration/read;
- proposal construction;
- proposal validation;
- candidate execution;
- replay verification;
- admission decision;
- revision read/replay;
- renderer-envelope construction.

There is no public `setCanonicalState`, `replaceCanonicalState`, `commitSnapshotUnchecked`, or equivalent bypass.

Compile-time `readonly` types are defense in depth only. Runtime validation and API capability separation provide the actual authority boundary.

## 23. Fail-closed conditions

Admission must reject or return `HUMAN_REQUIRED` when any of the following occurs:

- unknown or retired mechanism;
- agent-generated mechanism not explicitly promoted;
- stale base revision;
- malformed canonical JSON;
- undeclared read or write target;
- missing producer identity;
- missing verifier identity;
- proposal producer and verifier resolve to the same forbidden identity/configuration;
- invariant failure;
- replay hash mismatch;
- epistemic uplift violation;
- receipt-core hash mismatch;
- unknown kernel version;
- unsupported PRNG version;
- invalid causal reference;
- ambiguous promotion policy;
- attempt by renderer or projection adapter to invoke canonical admission.

Rejected proposals and failed receipts remain auditable evidence but do not create canonical revisions.

## 24. Threat model

The design specifically defends against:

- prompt-injected coding agents attempting unauthorized writes;
- agent-generated code escaping into arbitrary runtime execution;
- self-promoting mechanisms;
- hidden harness changes altering behavior without provenance;
- renderers hallucinating facts and feeding them back as truth;
- stale proposal races;
- state tampering or receipt substitution;
- non-deterministic replay;
- policy laundering where a generated artifact is relabeled as observed evidence;
- benchmark laundering where adapter readiness or render quality is treated as causal validity.

The kernel does not assume the proposal producer or renderer is trustworthy.

## 25. Verification requirements

Implementation is not complete until automated tests demonstrate all of the following:

1. identical genesis input produces identical canonical state and revision hashes;
2. identical approved mechanism + base revision + inputs + seed produces identical candidate hashes;
3. changing any mechanism content changes its digest;
4. changing the JIT/harness artifact changes `producerId`;
5. parent revisions and states remain byte-for-byte/hash identical after child admission;
6. stale-base proposals fail closed;
7. undeclared writes fail closed;
8. an unapproved agent-generated mechanism cannot execute canonically;
9. independent replay mismatch blocks admission;
10. receipt-core tampering is detected;
11. generated/simulated artifacts cannot self-promote to `OBSERVED`;
12. renderer output cannot mutate canonical state;
13. selecting world/year/branch/time view does not change the canonical revision hash;
14. accepted transitions preserve complete revision -> receipt -> mechanism -> producer lineage;
15. 4DWorldBench/world-model evaluation receipts remain orthogonal to canonical admission;
16. existing Worldline deterministic branch/replay tests continue to pass or are replaced by stronger causal-kernel equivalents;
17. repository typecheck, tests, and production build pass after implementation.

## 26. Acceptance criteria

This design is implemented when:

- Worldline has one mechanically enforced canonical mutation path;
- canonical revisions are immutable, content-addressed, and replayable;
- all accepted transitions have deterministic causal receipts;
- AI coding agents can contribute new mechanism candidates without acquiring authority;
- dynamically generated or repaired harnesses are fully attributable;
- approved mechanisms can execute within bounded policy without weakening Human Authority gates;
- renderers operate strictly downstream of canonical state;
- session/view changes are structurally separated from canonical world truth;
- current Worldline epistemic distinctions survive the migration;
- production persistence remains unchanged until its separately approved migration Work Item.

## 27. Research mapping

### Code World Model: Coding Agent as World Brain

Useful architectural signal: persistent causal state can be represented explicitly and executable logic can be separated from generative visual realization.

Worldline adoption: preserve the state/render separation and proxy-render interface.

Worldline rejection: the coding agent itself is not canonical authority. Its output is a candidate mechanism subject to deterministic execution, independent replay, provenance, and admission gates.

Primary paper index observed 2026-08-27: `https://huggingface.co/papers/2608.25927`

### JIT-Agent: Scaling Harness Intelligence via Just-in-Time Harness Evolution

Useful architectural signal: the software harness around a foundation model can itself be generated, repaired, transferred, and optimized, materially changing task performance.

Worldline adoption: producer identity includes harness, memory, skills, tools, runtime, and generator lineage so the proposal-producing system is attributable as a whole.

Worldline rejection: harness intelligence grants no additional authority. Generated harnesses remain subject to the same capability and transition boundaries.

Primary paper index observed 2026-08-27: `https://huggingface.co/papers/2608.25593`

## 28. Governing conclusion

Worldline's trusted center is not the coding model and not the renderer.

The trusted center is the deterministic causal kernel plus its versioned validation and Human Authority policy.

The desired division of labor is therefore:

```text
AI agent       -> proposes what could happen
Trusted kernel -> decides what canonically happened
Renderer       -> depicts what the admitted state looks like
Verifier       -> proves the transition can be replayed and attributed
Canon          -> preserves the governing rules, evidence, approvals, lineage, and receipts
```

That division allows Worldline to absorb stronger coding agents, generated harnesses, world models, and rendering systems without allowing any of them to silently become the source of truth.
