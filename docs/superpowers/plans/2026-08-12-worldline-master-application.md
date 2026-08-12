# Worldline Master Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing WorldGen React/Three.js application into the first deployable Worldline master application with canonical world state, 3D-first navigation, temporal/future exploration, extraterrestrial worlds, and a bounded recursive improvement loop.

**Architecture:** Preserve the current procedural Three.js renderer as the credential-free world provider and wrap it in a provider-independent Worldline state/runtime. Add focused modules for state, branching, time, world catalogs, recursive candidates, and UI surfaces. The first release proves the architecture with deterministic in-browser simulation and candidate evaluation; external Google/Cesium and benchmark services remain adapters, not launch blockers.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, Three.js 0.185, React Three Fiber, Drei, Vitest, existing PWA tooling.

## Global Constraints

- Canonical repository: `Full-Stack-Assets/WorldGen`.
- Work only on isolated feature branch until final promotion gate.
- The app must launch without Google credentials.
- Existing procedural WorldGen rendering remains the default/fallback provider.
- Human-facing geometry is 3D space + time; possibility/uncertainty/memory/etc. are lenses.
- Preserve explicit epistemic classes: `OBSERVED`, `RECONSTRUCTED`, `SIMULATED`, `GENERATED`, `SPECULATIVE`.
- Preserve explicit fidelity labels: `FIELD`, `COHORT`, `MICROSIM`, `AGENT`, `INTERACTING_AGENT`, `COGNITIVE_AGENT`, `EXPERIENTIAL_MODEL`.
- A renderer or lens may never mutate committed simulation state.
- Recursive candidates cannot modify the deciding acceptance test.
- Auto-promotion is limited to reversible, machine-verifiable candidate kinds allowed by policy.
- Architecture/scientific-claim/data-policy/authority changes remain gated.
- Do not imply generated/simulated worlds are observed or calibrated predictions.
- Do not add sensitive real-person criminal-investigation content.

---

## File Structure

### Create
- `src/worldline/types.ts` — canonical domain types.
- `src/worldline/fixtures.ts` — deterministic starter world, timelines, branches, and cosmos catalog.
- `src/worldline/state.ts` — immutable state construction, branch creation, replay, comparison.
- `src/worldline/futures.ts` — future-family representation selection and summaries.
- `src/worldline/recursive.ts` — B+ candidate lifecycle, evaluator, verifier, promotion policy, lineage.
- `src/worldline/__tests__/state.test.ts` — deterministic state/branch/replay/epistemic tests.
- `src/worldline/__tests__/futures.test.ts` — branch-scale representation tests.
- `src/worldline/__tests__/recursive.test.ts` — candidate test immutability/promotion tests.
- `src/components/worldline/WorldlineShell.tsx` — master navigation and layout.
- `src/components/worldline/WorldlineHUD.tsx` — active world/time/fidelity/epistemic badges.
- `src/components/worldline/TimeNavigator.tsx` — playback/slice/parallax controls.
- `src/components/worldline/FutureNavigator.tsx` — branch/family/continent-scale browser.
- `src/components/worldline/ComparePanel.tsx` — deterministic branch comparison.
- `src/components/worldline/DataPanel.tsx` — context metrics and evidence state.
- `src/components/worldline/LibraryPanel.tsx` — Earth/cosmos/generated world catalog.
- `src/components/worldline/MechanicsPanel.tsx` — lineage, branch ancestry, evidence, recursive loop.
- `src/components/worldline/TemporalParallax.tsx` — in-scene temporal ghost overlays.
- `src/components/worldline/WorldlineTrail.tsx` — Chronos-inspired player/camera worldline prototype.
- `src/components/worldline/RecursiveLoopPanel.tsx` — visible recursive loop and candidate outcomes.
- `src/components/worldline/worldline.css` — master visual system.
- `src/components/worldline/__tests__/WorldlineShell.test.tsx` — navigation/safety smoke tests.
- `src/components/worldline/__tests__/RecursiveLoopPanel.test.tsx` — recursive UI behavior tests.
- `docs/WORLDLINE_RUNTIME.md` — runtime/evidence/adapter/deployment contract.

### Modify
- `src/App.tsx` — mount `WorldlineShell` while preserving existing generation pipeline.
- `src/components/three/WorldScene3D.tsx` — accept optional temporal/worldline overlay props without changing generation semantics.
- `src/styles/global.css` or existing app stylesheet — ensure full-viewport master shell integration.
- `README.md` — rename/document Worldline master application and evidence boundaries.

---

### Task 1: Canonical world-state and replay kernel

**Files:**
- Create: `src/worldline/types.ts`
- Create: `src/worldline/fixtures.ts`
- Create: `src/worldline/state.ts`
- Test: `src/worldline/__tests__/state.test.ts`

**Interfaces:**
- Produces: `WorldlineState`, `WorldRecord`, `WorldSnapshot`, `WorldlineEvent`, `BranchRecord`, `EpistemicClass`, `ModelFidelity`.
- Produces: `createInitialWorldlineState()`, `commitSnapshot()`, `createBranch()`, `replayBranch()`, `compareSnapshots()`.
- Later tasks consume these exact names.

- [ ] **Step 1: Write failing state tests**

```ts
import { describe, expect, it } from 'vitest';
import { createInitialWorldlineState, createBranch, replayBranch } from '../state';

describe('Worldline state', () => {
  it('starts on the procedural generated world with explicit epistemic and fidelity labels', () => {
    const state = createInitialWorldlineState();
    expect(state.activeWorld.epistemicClass).toBe('GENERATED');
    expect(state.activeWorld.fidelity).toBe('FIELD');
  });

  it('replays a deterministic branch to identical committed state', () => {
    const state = createInitialWorldlineState();
    const branched = createBranch(state, { label: 'reinvention', atYear: 2030 });
    expect(replayBranch(branched, branched.activeBranchId)).toEqual(
      replayBranch(branched, branched.activeBranchId),
    );
  });

  it('never mutates a parent branch when creating a child', () => {
    const state = createInitialWorldlineState();
    const before = JSON.stringify(state.branches[state.activeBranchId]);
    createBranch(state, { label: 'alternate', atYear: 2032 });
    expect(JSON.stringify(state.branches[state.activeBranchId])).toBe(before);
  });
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `npm test -- src/worldline/__tests__/state.test.ts`
Expected: FAIL because `../state` does not exist.

- [ ] **Step 3: Implement canonical types and immutable state functions**

Define exact unions:

```ts
export type EpistemicClass = 'OBSERVED' | 'RECONSTRUCTED' | 'SIMULATED' | 'GENERATED' | 'SPECULATIVE';
export type ModelFidelity = 'FIELD' | 'COHORT' | 'MICROSIM' | 'AGENT' | 'INTERACTING_AGENT' | 'COGNITIVE_AGENT' | 'EXPERIENTIAL_MODEL';
```

Use `structuredClone`/pure object copies; no function may mutate an input state. Fixture IDs and seeds are fixed strings so reloads are reproducible.

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- src/worldline/__tests__/state.test.ts`
Expected: PASS.

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/worldline
 git commit -m "feat: add canonical Worldline state kernel"
```

---

### Task 2: Future representation and temporal modes

**Files:**
- Create: `src/worldline/futures.ts`
- Test: `src/worldline/__tests__/futures.test.ts`

**Interfaces:**
- Consumes: `BranchRecord` from `types.ts`.
- Produces: `FutureRepresentation = 'DIRECT' | 'WORLDLINES' | 'FAMILIES' | 'LANDSCAPE' | 'CONTINENTS'`.
- Produces: `selectFutureRepresentation(branchCount: number): FutureRepresentation`.
- Produces: `clusterFutureFamilies(branches: BranchRecord[]): FutureFamily[]`.

- [ ] **Step 1: Write failing branch-scale tests**

```ts
import { describe, expect, it } from 'vitest';
import { selectFutureRepresentation } from '../futures';

describe('future representation', () => {
  it.each([
    [2, 'DIRECT'],
    [4, 'WORLDLINES'],
    [25, 'FAMILIES'],
    [500, 'LANDSCAPE'],
    [10001, 'CONTINENTS'],
  ])('maps %i branches to %s', (count, expected) => {
    expect(selectFutureRepresentation(count)).toBe(expected);
  });
});
```

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/worldline/__tests__/futures.test.ts`
Expected: FAIL because implementation is missing.

- [ ] **Step 3: Implement thresholds and deterministic clustering**

Thresholds are fixed by the approved design: `<=2`, `<=4`, `<=50`, `<=10000`, otherwise continents. Family clustering uses deterministic metric-signature bucketing; it is a visualization grouping, never a probability claim.

- [ ] **Step 4: Verify focused tests and typecheck**

Run: `npm test -- src/worldline/__tests__/futures.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/worldline/futures.ts src/worldline/__tests__/futures.test.ts
 git commit -m "feat: add scalable future representations"
```

---

### Task 3: B+ constitutional recursive engine

**Files:**
- Create: `src/worldline/recursive.ts`
- Test: `src/worldline/__tests__/recursive.test.ts`

**Interfaces:**
- Consumes: canonical state IDs and lineage references.
- Produces: `RecursiveStage`, `CandidateKind`, `CandidateStatus`, `RecursiveCandidate`, `EvaluationContract`, `PromotionDecision`.
- Produces: `detectRegression()`, `generateCandidates()`, `evaluateCandidate()`, `verifyCandidate()`, `decidePromotion()`, `runRecursiveCycle()`.

- [ ] **Step 1: Write failing constitutional tests**

```ts
import { describe, expect, it } from 'vitest';
import { runRecursiveCycle } from '../recursive';

describe('constitutional recursive autonomy', () => {
  it('rejects a failing candidate and records lineage', () => {
    const result = runRecursiveCycle({ baselineScore: 1, observedScore: 0.7 });
    expect(result.candidates.some((c) => c.status === 'REJECTED')).toBe(true);
    expect(result.lineage.length).toBeGreaterThan(0);
  });

  it('does not allow a candidate to replace its deciding test', () => {
    const result = runRecursiveCycle({ baselineScore: 1, observedScore: 0.7 });
    expect(result.evaluationContract.id).toBe(result.verification.evaluationContractId);
  });

  it('gates architectural candidates even when their score improves', () => {
    const result = runRecursiveCycle({ baselineScore: 1, observedScore: 0.7, forceArchitecturalCandidate: true });
    expect(result.promotion.status).toBe('REQUIRES_APPROVAL');
  });
});
```

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/worldline/__tests__/recursive.test.ts`
Expected: FAIL because recursive engine is missing.

- [ ] **Step 3: Implement deterministic candidate cycle**

The first release uses a local deterministic demonstration, not an LLM dependency. A regression creates at least two candidates: a reversible tuning candidate and a constitutional/architectural candidate. Candidate evaluation is pure and uses a frozen `EvaluationContract` created before candidate generation. The verifier receives the candidate output plus the frozen contract and cannot accept a modified contract ID.

- [ ] **Step 4: Verify recursive tests and typecheck**

Run: `npm test -- src/worldline/__tests__/recursive.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/worldline/recursive.ts src/worldline/__tests__/recursive.test.ts
 git commit -m "feat: add constitutional recursive loop"
```

---

### Task 4: Master Worldline shell and navigation

**Files:**
- Create: `src/components/worldline/WorldlineShell.tsx`
- Create: `src/components/worldline/WorldlineHUD.tsx`
- Create: `src/components/worldline/TimeNavigator.tsx`
- Create: `src/components/worldline/FutureNavigator.tsx`
- Create: `src/components/worldline/ComparePanel.tsx`
- Create: `src/components/worldline/DataPanel.tsx`
- Create: `src/components/worldline/LibraryPanel.tsx`
- Create: `src/components/worldline/MechanicsPanel.tsx`
- Create: `src/components/worldline/worldline.css`
- Test: `src/components/worldline/__tests__/WorldlineShell.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: existing `WorldScene3D`, current generated world data/config, canonical Worldline state functions.
- Produces: six primary surfaces `WORLD`, `TIME`, `FUTURES`, `COMPARE`, `DATA`, `LIBRARY`; `MECHANICS` is secondary.

- [ ] **Step 1: Write failing shell safety tests**

Use `react-dom/client` with jsdom or the repo's existing test pattern. Assert navigation labels exist and the default HUD displays `GENERATED` and `FIELD`. Assert no text claims “prediction probability”.

- [ ] **Step 2: Verify test failure**

Run: `npm test -- src/components/worldline/__tests__/WorldlineShell.test.tsx`
Expected: FAIL because shell is missing.

- [ ] **Step 3: Implement shell around existing 3D scene**

Keep the world viewport as the dominant region. Do not delete generation controls; move existing controls into World/Data/Library surfaces as appropriate. Use local React state for active surface, selected world, selected year, selected branch, and Mechanics visibility.

- [ ] **Step 4: Implement HUD epistemic/fidelity badges**

HUD must show world name, current year, branch label, epistemic class, fidelity label, and provider label. Generated worlds must remain labeled `GENERATED`.

- [ ] **Step 5: Verify tests, typecheck, build**

Run: `npm test -- src/components/worldline/__tests__/WorldlineShell.test.tsx && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/worldline
 git commit -m "feat: add Worldline master exploration shell"
```

---

### Task 5: Temporal Parallax, Worldline trail, and Compare experience

**Files:**
- Create: `src/components/worldline/TemporalParallax.tsx`
- Create: `src/components/worldline/WorldlineTrail.tsx`
- Modify: `src/components/three/WorldScene3D.tsx`
- Modify: `src/components/worldline/TimeNavigator.tsx`
- Modify: `src/components/worldline/ComparePanel.tsx`

**Interfaces:**
- `WorldScene3D` gains optional props only: `temporalSnapshots`, `showWorldlineTrail`, `activeTimeMode`.
- Existing callers remain valid because all new props are optional.

- [ ] **Step 1: Add failing pure helper tests for temporal offsets**

Test a helper that maps three selected years to stable parallax offsets while preserving chronological order.

- [ ] **Step 2: Implement temporal ghost overlays**

Render no more than three default parallax states simultaneously. Use low-opacity geometry/markers and clear labels. Do not clone expensive terrain three times; the first version uses lightweight overlay meshes/markers tied to committed snapshots.

- [ ] **Step 3: Implement Chronos-inspired trail prototype**

Create a bounded luminous line/ribbon from recent camera/player sample positions. The trail is experiential visualization only and must not mutate simulation state.

- [ ] **Step 4: Verify tests, typecheck, build**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/worldline src/components/three/WorldScene3D.tsx
 git commit -m "feat: add temporal parallax and worldline trail"
```

---

### Task 6: Cosmos library and planetary-state layer

**Files:**
- Modify: `src/worldline/fixtures.ts`
- Modify: `src/components/worldline/LibraryPanel.tsx`
- Modify: `src/components/worldline/DataPanel.tsx`
- Modify: `src/components/worldline/WorldlineHUD.tsx`
- Test: extend `src/worldline/__tests__/state.test.ts`

**Interfaces:**
- Add deterministic starter worlds: procedural Earth-like generated world, New Bedford placeholder record marked `RECONSTRUCTED`/provider-unavailable until real data adapter exists, Mars `OBSERVED` metadata shell, Europa `OBSERVED` metadata shell, and one `SPECULATIVE` generated exoworld family.
- World metadata supports gravity, atmosphere label, temperature range label, radiation label, light-time label, and habitability categories without a single aggregate score.

- [ ] **Step 1: Add failing epistemic cosmos tests**

Assert Mars and Europa are never labeled `GENERATED`, and the synthetic exoworld is never labeled `OBSERVED`.

- [ ] **Step 2: Implement catalog and library switching**

Switching worlds updates canonical metadata and HUD. If a real geometry provider is unavailable, render with the procedural fallback while displaying provider/fidelity status.

- [ ] **Step 3: Implement Planetary State cards**

Show gravity, atmosphere, temperature, radiation, illumination/light-time, and four habitability categories as descriptive states. No authoritative percentage.

- [ ] **Step 4: Verify**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/worldline src/components/worldline
 git commit -m "feat: add Worldline Cosmos catalog"
```

---

### Task 7: Recursive loop visualization and self-improvement demo

**Files:**
- Create: `src/components/worldline/RecursiveLoopPanel.tsx`
- Test: `src/components/worldline/__tests__/RecursiveLoopPanel.test.tsx`
- Modify: `src/components/worldline/MechanicsPanel.tsx`

**Interfaces:**
- Consumes: `runRecursiveCycle()`.
- Displays stages: `OBSERVE → DETECT → EXPLAIN → CHALLENGE → EXPERIMENT → BUILD → EXECUTE → COMPARE → VERIFY → PROMOTE/REJECT → MONITOR → REALITY_WAKE → REOPEN`.

- [ ] **Step 1: Write failing UI tests**

Assert a synthetic regression produces at least two visible candidate records, one rejected result, and a gated architectural candidate. Assert the frozen evaluation-contract ID is displayed once as the deciding contract.

- [ ] **Step 2: Implement panel**

Provide a “Run verified recursive cycle” action that executes deterministic local candidates. Show candidate ancestry, score delta, verifier outcome, and promotion result. Use explicit labels `AUTO_PROMOTABLE`, `REJECTED`, and `REQUIRES_APPROVAL`.

- [ ] **Step 3: Verify UI and core tests**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/worldline
 git commit -m "feat: visualize recursive discovery loop"
```

---

### Task 8: Documentation, acceptance suite, and release gate

**Files:**
- Create: `docs/WORLDLINE_RUNTIME.md`
- Modify: `README.md`
- Modify/add CI tests only if the existing workflow does not already run `npm test`, `npm run typecheck`, and `npm run build`.

**Interfaces:**
- Documents provider-independent state, truth labels, recursive constitution, fallback behavior, and future Cesium/Google/benchmark adapter points.

- [ ] **Step 1: Document exact evidence boundaries**

State explicitly that the launch app is a deterministic simulation/visualization prototype; Cosmos physical metadata is illustrative unless tied to sourced data adapters; generated futures are not calibrated probabilities; the recursive loop is a bounded local demonstration, not unrestricted self-modification.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all PASS.

- [ ] **Step 3: Inspect generated build size and obvious runtime failures**

Run: `npm run preview` and perform smoke checks for initial load, six navigation surfaces, year change, branch creation, compare, Cosmos world switch, and recursive cycle.

- [ ] **Step 4: Commit documentation/release changes**

```bash
git add README.md docs .github
 git commit -m "docs: finalize Worldline runtime and release gates"
```

- [ ] **Step 5: Open/update draft PR and inspect CI**

PR body must list exact automated evidence and any external gates that remain (for example Google API credentials/terms).

- [ ] **Step 6: Deploy preview**

Deploy the credential-free build through the available deployment connector. Do not add Render or Vercel. Record the preview URL and deployment status.

- [ ] **Step 7: Smoke test deployed preview**

Verify the deployed app loads without credentials and exposes World, Time, Futures, Compare, Data, Library, Mechanics, Cosmos switching, and one recursive-cycle demonstration.

- [ ] **Step 8: Final promotion gate**

Merge only when repository CI, build/typecheck/tests, preview smoke test, epistemic-label tests, and recursive constitutional tests are all green. External Google/Cesium credentials are an optional adapter gate and do not block the credential-free v0.1 release.
