# Worldline v2.0 Design

## Status
Standing user authorization permits autonomous execution through v2.0. The repository-wide platform cleanup continues in parallel and is no longer a release blocker for this branch. New v2.0 work must remain provider-neutral and must not introduce host-specific application semantics.

## Product thesis
Worldline v2.0 turns Worldline One into **Worldline Studio**: a persistent visual simulation workspace where a user can open a world, move through time, define interventions, run deterministic experiment sessions, compare future families, inspect evidence, and package the result as a portable Worldpack.

The human-facing grammar remains **3D space + navigable time**. Possibility, uncertainty, source lineage, model disagreement, memory, and branch ancestry stay contextual lenses rather than literal extra axes.

## Release identity
- Version: `2.0.0`
- Codename: `Worldline Studio`
- World-state schema remains backward-readable from `worldline-state-v1` and exports a new project envelope `worldline-project-v2`.
- Worldpack schema: `worldline-worldpack-v2`.
- Experiment-session schema: `worldline-experiment-v2`.

## v2.0 release trains

### M1 — Studio Projects
Goal: make a Worldline session durable and explicit.

Deliverables:
- `WorldProject` document with deterministic ID, title, created/updated timestamps, active world, active branch, selected year, experiment sessions, interventions, and view preferences;
- browser-local project store with list/create/load/save/delete;
- versioned JSON serialization with corruption-safe parsing;
- v1 state import into a v2 project without mutating the original snapshot;
- visible project identity in the shell.

### M2 — Intervention Composer
Goal: let a user declare what changes in a branch without editing canonical evidence.

Deliverables:
- typed interventions with target world/region, start year, duration, category, magnitude, metric effects, notes, and epistemic class;
- deterministic application into a derived branch experiment context;
- no direct mutation of observed source snapshots;
- intervention editor embedded in Futures;
- branch receipts that record intervention IDs and deterministic seed commitments.

Initial categories:
- housing
- mobility
- climate-resilience
- energy
- land-use
- public-realm
- custom

Intervention effects are scenario inputs, not calibrated policy forecasts.

### M3 — Experiment Sessions
Goal: make repeatable simulation runs first-class objects.

Deliverables:
- `ExperimentSession` containing project ID, branch ID, world ID, simulation year, intervention set, seed, input-state fingerprint, result metric vector, and run receipt;
- deterministic rerun from the same committed inputs;
- run history visible from Futures and Compare;
- no result is labeled probability unless an external calibrated model supplies one.

### M4 — Future Families + Compare Studio
Goal: make many branches readable without turning the interface into a spreadsheet.

Deliverables:
- deterministic family assignment from normalized committed metric vectors;
- selected branch, baseline branch, and family-centroid comparison;
- difference cards for metric deltas;
- compact Future Landscape annotations for family, divergence, and intervention count;
- exact branch ancestry remains authoritative.

### M5 — Worldpacks
Goal: make projects portable across browsers and providers.

Deliverables:
- export one project plus referenced branches, interventions, experiment receipts, provenance summaries, and optional safe local geometry as a `Worldpack` JSON object;
- import validates schema and rejects malformed/corrupt payloads without replacing current state;
- no provider access tokens, secrets, personally identifying records, or cache internals are exported;
- world/provider identifiers remain descriptive, not canonical truth.

### M6 — Resilience + Release Experience
Goal: make Studio trustworthy under degraded conditions.

Deliverables:
- project store survives parse failures by preserving the last valid in-memory project;
- procedural world remains a guaranteed boot path;
- network Earth degradation never mutates committed simulation/project state;
- reduced-motion and keyboard behavior remain intact;
- release manifest and Mechanics expose v2.0 schemas and evidence boundary;
- production build remains backend-optional.

## Core architecture

### Canonical layers
1. **Committed World State**: existing deterministic world/branch/time state.
2. **Studio Project Envelope**: durable user workspace referencing committed state.
3. **Intervention Layer**: explicit scenario inputs applied only to derived experiment context.
4. **Experiment Layer**: deterministic run receipts and result vectors.
5. **Projection Layer**: Future Landscape, Compare Studio, Truth Lens, and other views.
6. **Provider Layer**: render/data providers remain replaceable and non-canonical.

Changing a visualization must never change committed state. Changing a provider must never rewrite a project or experiment receipt.

## WorldProject contract

```ts
interface WorldProject {
  schema: 'worldline-project-v2';
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  state: WorldlineState;
  interventions: Intervention[];
  experiments: ExperimentSession[];
  preferences: {
    primarySurface: 'WORLD' | 'TIME' | 'FUTURES' | 'COMPARE' | 'DATA' | 'LIBRARY';
    truthLens: boolean;
  };
}
```

IDs are deterministic from stable creation inputs plus a monotonic local sequence. JSON persistence is explicit and versioned.

## Intervention semantics
An intervention is a declared scenario input. It must include `epistemicClass: 'SIMULATED' | 'GENERATED' | 'SPECULATIVE'` and cannot be `OBSERVED`.

Metric effects are represented as a stable record keyed by existing branch metric names. Magnitudes are scenario parameters, not empirical effect estimates unless accompanied by an external evidence receipt.

Application rules:
- only active in or after `startYear`;
- duration may be finite or open-ended;
- multiple interventions combine deterministically in stable ID order;
- result vectors are clamped only where the metric contract explicitly defines bounds;
- source/evidence snapshots remain unchanged.

## Experiment determinism
The input fingerprint is computed from:
- world ID;
- branch ancestry;
- selected year;
- ordered intervention payloads;
- committed seed;
- source snapshot identifier where applicable.

The same fingerprint and seed must produce the same result vector. Experiment UI may decorate results, but decorative randomness cannot enter the committed receipt.

## Future Families
Family assignment is deterministic and purely geometric over normalized result vectors. It is a navigation aid, not a statistical cluster confidence claim.

For v2.0:
- family key is derived from the sign/quadrant pattern of the first two stable projected dimensions plus a divergence band;
- family centroid is arithmetic over member vectors;
- family labels are neutral (`Family A`, `Family B`, ...);
- no probability or likelihood language.

## Worldpack contract
A Worldpack contains:
- schema/version;
- project metadata;
- project state;
- interventions;
- experiment receipts;
- branch ancestry referenced by the project;
- provenance summary;
- optional safe local geometry payload;
- export timestamp.

It excludes:
- API keys;
- provider tokens;
- browser storage internals;
- private source documents;
- sensitive real-person investigative content;
- unverified external benchmark scores.

## Studio UX
The world remains visually dominant. Studio adds a compact project strip rather than a dashboard wall.

Primary navigation remains:
- WORLD
- TIME
- FUTURES
- COMPARE
- DATA
- LIBRARY

Additions:
- project name/status in HUD;
- `NEW`, `SAVE`, `EXPORT` project actions in WORLD;
- Intervention Composer inside FUTURES;
- experiment run/history controls inside FUTURES;
- Compare Studio shows baseline/selected/family metrics;
- Mechanics shows project/worldpack/experiment schema versions.

## Accessibility
- all project, intervention, run, import/export actions keyboard reachable;
- dialogs/panels use semantic labels;
- no color-only family/status distinction;
- reduced-motion mode keeps all information available without motion;
- destructive project deletion requires an explicit local confirmation action.

## Performance constraints
- no new large rendering dependency for v2.0;
- project serialization is synchronous only for small metadata/state payloads;
- local persistence operations remain bounded;
- experiment execution for the built-in deterministic model completes synchronously without network access;
- visualization projections must be memoizable from committed inputs.

## Evidence boundary
Worldline Studio remains an exploration and simulation environment, not a calibrated oracle. Observed, reconstructed, simulated, generated, and speculative states remain visibly distinct. Interventions and experiment outputs are scenario mechanics unless connected to separately verified models and evidence receipts.

## Test strategy
Required focused suites:
- release identity and schema versions;
- project create/save/load/delete and corruption handling;
- v1 state import without mutation;
- intervention validation and deterministic ordering;
- experiment fingerprint and deterministic rerun;
- future-family assignment independent of input ordering;
- Worldpack round-trip and secret exclusion;
- shell integration for project identity and Studio controls;
- existing v1.0 suites remain green.

## Release gates
The v2.0 branch may proceed while repository cleanup is incomplete. v2.0 itself must pass:
1. focused RED/GREEN TDD cycles for each new behavior;
2. full type-check;
3. full Vitest suite;
4. production build;
5. PR CI on the exact head;
6. merge to `main` only after exact-head checks are green;
7. main CI and existing production deployment path;
8. `v2.0.0` release/tag only after the release commit is verified.

The parallel provider-cleanup program remains independent and must not be falsely reported complete because v2.0 ships.

## Non-goals
- no full municipal digital-twin claim;
- no calibrated policy-effect claim;
- no probability labels for branch geometry;
- no backend requirement;
- no provider lock-in;
- no unrestricted self-modification;
- no full game-engine port in the web release;
- no sensitive real-person investigative content.

## Final principle
Worldline v2.0 should feel like a studio rather than a demo: **open a world, preserve the project, declare an intervention, run it reproducibly, navigate the resulting futures, compare them against a baseline, inspect why they differ, and carry the whole experiment with you as a portable Worldpack.**
