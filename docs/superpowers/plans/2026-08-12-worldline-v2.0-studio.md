# Worldline v2.0 Studio Implementation Plan

> **Goal:** Ship Worldline 2.0 as a persistent, provider-neutral visual simulation studio with durable projects, explicit interventions, deterministic experiment sessions, Future Family comparison, portable Worldpacks, and a verified release manifest.

> **Architecture:** Extend the existing deterministic `src/worldline` domain with a v2 project envelope and pure functions. Keep persistence, experiment execution, and interchange independent from rendering/providers. Integrate Studio controls into the existing `WorldlineShell` without changing the primary navigation or allowing projection state to mutate canonical world state.

> **Tech Stack:** React 19, TypeScript, Vite, Vitest, existing React Three Fiber/Three.js renderer, browser localStorage, GitHub Actions.

> **Global Constraints:** Test-first for production behavior; no backend requirement; no paid credential requirement; no host-specific application semantics; no secrets in Worldpacks; no probability language for scenario geometry; existing v1.0 tests must remain green; visual changes never mutate committed simulation state.

## Task 1: Establish v2.0 release identity

**Files:**
- Modify: `src/worldline/release.ts`
- Modify: `src/worldline/__tests__/release.test.ts`
- Modify: `package.json`
- Create: `docs/WORLDLINE_V2.0.md`

**RED:** Extend release tests to require `2.0.0`, `Worldline Studio`, `worldline-project-v2`, `worldline-worldpack-v2`, and `worldline-experiment-v2`. Run focused test and confirm assertion failure against current v1.0 release object.

**GREEN:** Add the new immutable release fields and update package version. Preserve the existing world-state, research-ledger, and Chronos schema declarations for backward readability.

**VERIFY:** `npm test -- src/worldline/__tests__/release.test.ts`, then type-check.

**Commit:** `feat: establish Worldline Studio release identity`

## Task 2: Add Studio project domain

**Files:**
- Create: `src/worldline/studioProjects.ts`
- Create: `src/worldline/__tests__/studioProjects.test.ts`

**Contract:**
```ts
export type StudioSurface = 'WORLD' | 'TIME' | 'FUTURES' | 'COMPARE' | 'DATA' | 'LIBRARY';

export interface WorldProject {
  schema: 'worldline-project-v2';
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  state: WorldlineState;
  interventions: Intervention[];
  experiments: ExperimentSession[];
  preferences: { primarySurface: StudioSurface; truthLens: boolean };
}
```

**RED behaviors:**
- deterministic project ID for identical stable inputs;
- create operation deep-copies incoming state;
- serialized project parses round-trip;
- malformed or wrong-schema payload returns a typed failure instead of throwing;
- update timestamp changes only when save payload changes.

**GREEN:** Implement pure creation/serialization/parser helpers. Do not touch browser storage yet.

**Commit:** `feat: add versioned Studio project domain`

## Task 3: Add bounded local project store

**Files:**
- Create: `src/worldline/studioStorage.ts`
- Create: `src/worldline/__tests__/studioStorage.test.ts`

**RED behaviors:**
- save and load by ID;
- list projects sorted by `updatedAt` descending, then ID;
- delete removes only the requested project;
- one corrupt record does not erase valid records;
- storage index is bounded to 24 projects and evicts oldest deterministically;
- no mutation of caller-owned project objects.

**GREEN:** Implement a `StorageLike` adapter over localStorage-compatible get/set/remove calls so tests use an in-memory implementation without DOM coupling.

**Commit:** `feat: persist Studio projects safely`

## Task 4: Add intervention domain

**Files:**
- Create: `src/worldline/interventions.ts`
- Create: `src/worldline/__tests__/interventions.test.ts`

**Contract:**
```ts
export type InterventionCategory =
  | 'housing'
  | 'mobility'
  | 'climate-resilience'
  | 'energy'
  | 'land-use'
  | 'public-realm'
  | 'custom';

export interface Intervention {
  id: string;
  worldId: string;
  branchId: string;
  label: string;
  category: InterventionCategory;
  startYear: number;
  durationYears: number | null;
  magnitude: number;
  metricEffects: Record<string, number>;
  notes: string;
  epistemicClass: 'SIMULATED' | 'GENERATED' | 'SPECULATIVE';
}
```

**RED behaviors:**
- rejects `OBSERVED` semantics;
- stable intervention ID is payload-derived;
- inactive before start and after finite duration;
- active interventions combine in stable ID order;
- application returns a new metric record and never mutates baseline.

**GREEN:** Implement validation, activation, sorting, and pure metric-effect application.

**Commit:** `feat: add deterministic intervention layer`

## Task 5: Add deterministic experiment sessions

**Files:**
- Create: `src/worldline/experiments.ts`
- Create: `src/worldline/__tests__/experiments.test.ts`
- Reuse: `src/worldline/interventions.ts`

**Contract:**
```ts
export interface ExperimentSession {
  schema: 'worldline-experiment-v2';
  id: string;
  projectId: string;
  worldId: string;
  branchId: string;
  year: number;
  seed: number;
  inputFingerprint: string;
  interventionIds: string[];
  baselineMetrics: Record<string, number>;
  resultMetrics: Record<string, number>;
  createdAt: string;
}
```

**RED behaviors:**
- same committed inputs produce same fingerprint and result metrics;
- intervention input order does not change output;
- different seed changes session ID/fingerprint commitment but never injects non-deterministic randomness;
- prior branch/source state is not mutated;
- session records ordered intervention IDs.

**GREEN:** Use stable JSON canonicalization + deterministic integer hash. The built-in experiment runner applies intervention effects plus a bounded deterministic seed perturbation only to metrics explicitly present in the baseline.

**Commit:** `feat: add reproducible Studio experiments`

## Task 6: Add Future Family projection

**Files:**
- Create: `src/worldline/futureFamilies.ts`
- Create: `src/worldline/__tests__/futureFamilies.test.ts`
- Modify: `src/components/worldline/FutureLandscape.tsx`

**RED behaviors:**
- family assignment independent of input order;
- family key depends on stable normalized result geometry, not branch array position;
- centroid is deterministic;
- singleton family supported;
- no probability field exists in family output.

**GREEN:** Derive families from first two sorted metric dimensions plus divergence band. Add neutral family labels to Future Landscape annotations.

**Commit:** `feat: add deterministic Future Families`

## Task 7: Add Worldpack interchange

**Files:**
- Create: `src/worldline/worldpack.ts`
- Create: `src/worldline/__tests__/worldpack.test.ts`

**RED behaviors:**
- project round-trip preserves state/interventions/experiments;
- wrong schema rejected;
- malformed JSON rejected without throwing;
- recursively strips keys matching token/key/secret credential patterns;
- imported payload cannot mutate the source object;
- export schema is `worldline-worldpack-v2`.

**GREEN:** Implement pure export/serialize/parse/import functions. Keep provider identifiers but remove credentials/cache internals.

**Commit:** `feat: add portable Worldpack interchange`

## Task 8: Integrate Studio controls into React shell

**Files:**
- Modify: `src/components/worldline/WorldlineShell.tsx`
- Modify: `src/components/worldline/WorldlineHUD.tsx`
- Modify: `src/components/worldline/FutureNavigator.tsx`
- Modify: `src/components/worldline/ComparePanel.tsx`
- Create: `src/components/worldline/StudioProjectBar.tsx`
- Create: `src/components/worldline/InterventionComposer.tsx`
- Create: `src/components/worldline/ExperimentHistory.tsx`
- Create: `src/components/worldline/__tests__/StudioProjectBar.test.tsx`
- Modify: `src/components/worldline/__tests__/WorldlineShell.test.tsx`
- Create: `src/components/worldline/worldline-v20.css`

**RED behaviors:**
- shell renders current project title/status;
- create/save/export actions are keyboard buttons with accessible names;
- Futures surface exposes Intervention Composer and Run Experiment;
- Compare can display baseline vs selected experiment metric deltas;
- shell retains existing primary navigation and Truth/Chronos/Mechanics controls.

**GREEN:** Add local project state at the shell boundary using pure domain/storage modules. Keep scene/provider props unchanged.

**Commit:** `feat: integrate Worldline Studio workflow`

## Task 9: Update Mechanics, documentation, and release smoke contract

**Files:**
- Modify: `src/components/worldline/MechanicsPanel.tsx`
- Modify: `src/worldline/__tests__/releaseSmoke.test.ts`
- Modify: `README.md`
- Modify: `docs/WORLDLINE_RUNTIME.md`
- Complete: `docs/WORLDLINE_V2.0.md`

**RED behaviors:**
- smoke path creates a project, applies one intervention, runs an experiment, exports/imports a Worldpack, and confirms deterministic result equality with no network or credential dependency;
- release manifest exposes all v2 schemas.

**GREEN:** Add release documentation and schema visibility without claiming external benchmark execution or calibrated forecasting.

**Commit:** `docs: complete Worldline Studio release surface`

## Task 10: Full verification and release PR

**Verification sequence:**
1. `npm run typecheck`
2. `npm test`
3. `npm run build`
4. inspect diff for provider-specific application semantics, secrets, probability claims, and state mutation hazards;
5. open PR `Worldline v2.0: Worldline Studio`;
6. wait for exact-head CI;
7. inspect failed job logs if any and fix root causes using RED/GREEN cycles;
8. merge only after CI is green;
9. verify `main` CI and production deployment path;
10. create `v2.0.0` tag/release only after exact release commit is verified.

**Final acceptance:**
- v1.0 functionality remains available;
- new Studio project lifecycle works without network access;
- interventions cannot masquerade as observed evidence;
- experiments rerun deterministically;
- Future Families never imply probability;
- Worldpack export contains no credentials;
- visual projections do not mutate committed world state;
- full CI is green on the release commit.
