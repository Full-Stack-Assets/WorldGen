# Worldline v0.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployable free-first Worldline v0.2 with an open Earth provider, evidence-backed New Bedford package/provenance, benchmark receipts, deeper Cosmos state, a stronger constitutional recursive loop, and deterministic Chronos export while preserving credential-free operation.

**Architecture:** Extend the existing React/Three.js Worldline shell with a second geographic renderer boundary for MapLibre/OpenFreeMap, not a wholesale renderer rewrite. Keep canonical simulation state provider-independent. Add static source manifests/provenance, benchmark/export contracts, and recursive research receipts as pure TypeScript modules with focused tests before wiring UI surfaces.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, Three.js/R3F, MapLibre GL JS, OpenFreeMap/OpenStreetMap vector tiles, Vitest, static JSON/GeoJSON data packages, GitHub Pages.

## Global Constraints

- Canonical repository: `Full-Stack-Assets/WorldGen`.
- Work only on `codex/worldline-v0.2` until release verification.
- No paid credential may be required for app boot or production acceptance.
- Existing procedural WorldGen renderer remains the guaranteed offline fallback.
- Canonical world/branch identity must never depend on external tile/provider IDs.
- Preserve epistemic classes: `OBSERVED`, `RECONSTRUCTED`, `SIMULATED`, `GENERATED`, `SPECULATIVE`.
- Provider fallback may never make generated/reconstructed geometry look semantically observed.
- Every canonical New Bedford datum must have provenance metadata and epistemic classification.
- No fabricated benchmark scores.
- Recursive candidates cannot alter the deciding test/evaluator used for their own promotion.
- Architectural/policy/scientific-claim candidates remain gated.
- Chronos export must be deterministic and provider-independent.
- No sensitive real-person data in the public/default city package.

---

## Task 1: Provider Registry and Free-Earth Contract

**Files:**
- Create: `src/worldline/providers.ts`
- Create: `src/worldline/__tests__/providers.test.ts`
- Modify: `src/worldline/types.ts`

**Interfaces:**
- Produces `SurfaceProviderKind`, `ProviderStatus`, `ProviderRegistry`, `createProviderRegistry()`, `resolveSurfaceProvider()`.
- Later UI uses the same registry to render provider badges and choose Earth vs procedural rendering.

- [ ] **Step 1: Add failing provider tests**

```ts
import { describe, expect, it } from 'vitest';
import { createProviderRegistry, resolveSurfaceProvider } from '../providers';

describe('provider registry', () => {
  it('always includes procedural fallback', () => {
    const registry = createProviderRegistry();
    expect(registry.providers['procedural-worldgen'].available).toBe(true);
  });

  it('falls back without changing semantic world identity', () => {
    const registry = createProviderRegistry({ networkAvailable: false });
    const resolved = resolveSurfaceProvider(registry, 'open-earth-maplibre');
    expect(resolved.id).toBe('procedural-worldgen');
    expect(resolved.epistemicRendering).toBe('GENERATED');
  });
});
```

- [ ] **Step 2: Run focused tests**

Run: `npm test -- src/worldline/__tests__/providers.test.ts`
Expected: FAIL because `providers.ts` does not exist.

- [ ] **Step 3: Implement the provider contracts**

```ts
export type SurfaceProviderKind =
  | 'procedural-worldgen'
  | 'open-earth-maplibre'
  | 'local-new-bedford'
  | 'google-photorealistic';

export interface ProviderStatus {
  id: SurfaceProviderKind;
  label: string;
  available: boolean;
  requiresNetwork: boolean;
  epistemicRendering: 'OBSERVED' | 'RECONSTRUCTED' | 'GENERATED';
  attribution?: string;
}
```

`resolveSurfaceProvider()` returns the requested available provider or `procedural-worldgen` without mutating canonical state.

- [ ] **Step 4: Verify tests and typecheck**

Run: `npm test -- src/worldline/__tests__/providers.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/worldline/providers.ts src/worldline/types.ts src/worldline/__tests__/providers.test.ts
git commit -m "feat: add free-first provider registry"
```

---

## Task 2: MapLibre/OpenFreeMap Earth Surface

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/components/worldline/OpenEarthView.tsx`
- Create: `src/components/worldline/__tests__/OpenEarthView.test.tsx`
- Modify: `src/components/worldline/WorldlineShell.tsx`
- Modify: `src/components/worldline/worldline.css`

**Interfaces:**
- Consumes `ProviderRegistry` and `WorldRecord`.
- Produces `OpenEarthView({ center, zoom, onReady, onFailure })`.
- Shell switches to MapLibre only for real-Earth/open-Earth worlds; procedural worlds remain R3F.

- [ ] **Step 1: Add MapLibre dependency**

Run: `npm install maplibre-gl@^5`
Expected: package and lockfile updated.

- [ ] **Step 2: Add a component smoke test**

```tsx
import { describe, expect, it } from 'vitest';
import { OpenEarthView } from '../OpenEarthView';

describe('OpenEarthView', () => {
  it('exports a renderable Earth view component', () => {
    expect(typeof OpenEarthView).toBe('function');
  });
});
```

- [ ] **Step 3: Implement MapLibre with OpenFreeMap style and 3D buildings**

Use `maplibre-gl` with style URL `https://tiles.openfreemap.org/styles/liberty` and New Bedford default center `[-70.9342, 41.6362]`. After style load, add a fill-extrusion layer from the style's building source/source-layer only when available. Attribution must remain visible.

```ts
const map = new maplibregl.Map({
  container,
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center,
  zoom,
  pitch: 62,
  bearing: -18,
  attributionControl: true,
});
```

On network/style error call `onFailure()` so the shell can preserve the same canonical world while switching renderer/provider status to procedural fallback.

- [ ] **Step 4: Wire shell provider switching**

For `new-bedford-001` and Earth worlds, default to the open Earth renderer. For generated/cosmos procedural worlds, preserve `WorldScene3D`. Do not replace canonical `activeWorld` when a rendering provider fails.

- [ ] **Step 5: Verify tests, typecheck, build**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS without any credentials.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/worldline
git commit -m "feat: add OpenFreeMap Earth renderer"
```

---

## Task 3: New Bedford Static Provenance Package

**Files:**
- Create: `src/worldline/provenance.ts`
- Create: `src/worldline/__tests__/provenance.test.ts`
- Create: `public/data/new-bedford/manifest.json`
- Create: `public/data/new-bedford/geometry.geojson`
- Create: `public/data/new-bedford/snapshots.json`
- Modify: `src/worldline/fixtures.ts`

**Interfaces:**
- Produces `SourceRecord`, `WorldDataManifest`, `validateManifest()`, `validateProvenanceRecord()`.
- Browser fetches package metadata as static assets; missing package returns explicit unavailable state.

- [ ] **Step 1: Add failing manifest tests**

```ts
import { describe, expect, it } from 'vitest';
import { validateManifest } from '../provenance';

describe('New Bedford provenance', () => {
  it('rejects sources without publisher, URL, checksum, and epistemic class', () => {
    expect(() => validateManifest({ worldId: 'new-bedford-001', sources: [{}] })).toThrow();
  });
});
```

- [ ] **Step 2: Implement strict provenance types and validator**

```ts
export interface SourceRecord {
  sourceId: string;
  publisher: string;
  datasetName: string;
  sourceUrl: string;
  retrievedAt: string;
  validFrom: string | null;
  validTo: string | null;
  spatialReference: string;
  license: string;
  checksum: string;
  coverage: string;
  resolution: string;
  epistemicClass: 'OBSERVED' | 'RECONSTRUCTED';
  transformationChain: string[];
}
```

Reject canonical sources missing any required field.

- [ ] **Step 3: Add a small legally safe real New Bedford package**

Package source metadata from public MassGIS/USGS datasets only. `geometry.geojson` contains a small deterministic proving-ground subset such as municipal/coastline/public geographic features, not owner/person records. `snapshots.json` contains source-time metadata and observed/reconstructed state markers, not fabricated city measurements.

- [ ] **Step 4: Make New Bedford fixture advertise real package availability**

Change its provider label from "real-data adapter pending" to the precise package state and retain `RECONSTRUCTED` unless all displayed geometry for a view is directly observed.

- [ ] **Step 5: Verify**

Run: `npm test -- src/worldline/__tests__/provenance.test.ts && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/worldline public/data/new-bedford
git commit -m "feat: add versioned New Bedford provenance package"
```

---

## Task 4: Truth Lens and Historical Source-Time UI

**Files:**
- Create: `src/components/worldline/TruthLens.tsx`
- Create: `src/components/worldline/ProviderStatusStrip.tsx`
- Create: `src/components/worldline/SourceInspector.tsx`
- Modify: `src/components/worldline/WorldlineShell.tsx`
- Modify: `src/components/worldline/TimeNavigator.tsx`
- Modify: `src/components/worldline/worldline.css`

**Interfaces:**
- Consumes provider registry and manifest/snapshot metadata.
- Produces truth-lens toggle and source-time status without mutating simulation state.

- [ ] **Step 1: Add UI contract tests**

```tsx
import { describe, expect, it } from 'vitest';
import { epistemicVisualClass } from '../TruthLens';

describe('Truth Lens', () => {
  it('keeps observed and generated visuals distinguishable', () => {
    expect(epistemicVisualClass('OBSERVED')).not.toBe(epistemicVisualClass('GENERATED'));
  });
});
```

- [ ] **Step 2: Implement Truth Lens mapping**

```ts
export function epistemicVisualClass(value: EpistemicClass) {
  return `wl-truth-${value.toLowerCase()}`;
}
```

CSS must visually differentiate all five classes without hiding attribution.

- [ ] **Step 3: Add provider/source strip**

Render Surface, Terrain/Data package state, Epistemic class, Model fidelity, and source snapshot year. Provider failures display `Fallback active` rather than changing world identity.

- [ ] **Step 4: Connect Time Navigator to source-time metadata**

Time UI distinguishes `Observation`, `Nearest observation`, `Reconstruction`, and `Simulation` slices. Do not manufacture intermediate observed dates.

- [ ] **Step 5: Verify and commit**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS.

```bash
git add src/components/worldline
git commit -m "feat: add provenance and truth lens UI"
```

---

## Task 5: Benchmark Lab and Immutable Receipts

**Files:**
- Create: `src/worldline/benchmarks.ts`
- Create: `src/worldline/__tests__/benchmarks.test.ts`
- Create: `src/components/worldline/BenchmarkLab.tsx`
- Modify: `src/components/worldline/MechanicsPanel.tsx`

**Interfaces:**
- Produces `BenchmarkReceipt`, `create4DWorldBenchExport()`, `createOmniWorldBenchTrace()`, `recordBenchmarkReceipt()`.
- No function invents scores.

- [ ] **Step 1: Add failing receipt tests**

```ts
import { describe, expect, it } from 'vitest';
import { createBenchmarkReceipt } from '../benchmarks';

describe('benchmark receipts', () => {
  it('allows unavailable without inventing a score', () => {
    const receipt = createBenchmarkReceipt({ benchmark: '4DWorldBench', status: 'NOT_RUN' });
    expect(receipt.score).toBeNull();
  });
});
```

- [ ] **Step 2: Implement benchmark/export contracts**

`4DWorldBench` export contains world/snapshot/render-sequence metadata. `Omni-WorldBench` trace contains ordered action/state transitions. Receipt status union is `NOT_RUN | COMPLETED | FAILED | INCOMPATIBLE` and score stays `null` unless caller supplies an actual executed result.

- [ ] **Step 3: Add Benchmark Lab UI**

Display compatibility/export readiness and immutable receipts. Label adapters `Not executed` unless real results exist.

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS.

```bash
git add src/worldline/benchmarks.ts src/worldline/__tests__/benchmarks.test.ts src/components/worldline
git commit -m "feat: add benchmark lab and receipts"
```

---

## Task 6: Recursive Research Engine v0.2

**Files:**
- Modify: `src/worldline/recursive.ts`
- Modify: `src/worldline/__tests__/recursive.test.ts`
- Create: `src/worldline/researchLoop.ts`
- Create: `src/worldline/__tests__/researchLoop.test.ts`
- Modify: `src/components/worldline/RecursiveLoopPanel.tsx`

**Interfaces:**
- Produces `runDataUpdateCycle()`, `ResearchCycle`, `VerifierReceipt`.
- Uses a frozen evaluation contract created before candidate generation.

- [ ] **Step 1: Add conflict-loop tests**

```ts
import { describe, expect, it } from 'vitest';
import { runDataUpdateCycle } from '../researchLoop';

describe('recursive research loop', () => {
  it('detects conflict, rejects one candidate, and verifies another independently', () => {
    const cycle = runDataUpdateCycle({ previousValue: 10, incomingValue: 14 });
    expect(cycle.stageHistory).toContain('DETECT');
    expect(cycle.candidates.some(c => c.status === 'REJECTED')).toBe(true);
    expect(cycle.verifier.generatorId).not.toBe(cycle.verifier.verifierId);
  });

  it('blocks a candidate that changes its deciding evaluator', () => {
    const cycle = runDataUpdateCycle({ previousValue: 10, incomingValue: 14, mutateEvaluator: true });
    expect(cycle.promotion.status).toBe('BLOCKED');
  });
});
```

- [ ] **Step 2: Implement full stage history**

Cycle stages must be exactly:
`OBSERVE, DETECT, EXPLAIN, CHALLENGE, EXPERIMENT, BUILD, EXECUTE, COMPARE, VERIFY, PROMOTE_REJECT, MONITOR, REALITY_WAKE, REOPEN`.

- [ ] **Step 3: Preserve B+ gates**

Auto-promotion allowed only for `LOW_RISK_RENDERING` and `DATA_NORMALIZATION` candidates when reversible, evaluator unchanged, verifier independent, and all checks pass. `ARCHITECTURAL` and `POLICY` always require approval.

- [ ] **Step 4: Upgrade UI**

Show current stage, candidate ancestry, frozen evaluator ID, verifier ID, promotion decision, rollback reference, and Reality Wake message.

- [ ] **Step 5: Verify and commit**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS.

```bash
git add src/worldline src/components/worldline/RecursiveLoopPanel.tsx
git commit -m "feat: expand constitutional recursive research loop"
```

---

## Task 7: Cosmos v0.2 Planetary State

**Files:**
- Modify: `src/worldline/types.ts`
- Modify: `src/worldline/fixtures.ts`
- Create: `src/worldline/__tests__/cosmos.test.ts`
- Create: `src/components/worldline/PlanetaryStatePanel.tsx`
- Modify: `src/components/worldline/DataPanel.tsx`

**Interfaces:**
- Extends `PlanetaryState` with radius, rotation/orbital periods, pressure, source status, reference frame.
- Observed physical fields and rendered surface provenance remain separate.

- [ ] **Step 1: Add measured-vs-rendered tests**

```ts
import { describe, expect, it } from 'vitest';
import { WORLD_CATALOG } from '../fixtures';

describe('Cosmos v0.2', () => {
  it('does not treat generated Mars surface as observed geometry', () => {
    const mars = WORLD_CATALOG.find(w => w.id === 'mars')!;
    expect(mars.epistemicClass).toBe('OBSERVED');
    expect(mars.surfaceEpistemicClass).not.toBe('OBSERVED');
  });
});
```

- [ ] **Step 2: Extend planetary state schema**

Add `radiusKm`, `rotationPeriodHours`, `orbitalPeriodDays`, `surfacePressure`, `referenceFrame`, `surfaceEpistemicClass`, `physicalStateSources`.

- [ ] **Step 3: Update Cosmos fixtures/UI**

Mars/Europa physical identity remains observed; procedural local visual surface is generated/reconstructed. Exoworld candidate remains constrained/speculative.

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS.

```bash
git add src/worldline src/components/worldline
git commit -m "feat: deepen Cosmos planetary state"
```

---

## Task 8: Deterministic Chronos Export

**Files:**
- Create: `src/worldline/chronos.ts`
- Create: `src/worldline/__tests__/chronos.test.ts`
- Create: `src/components/worldline/ChronosExportPanel.tsx`
- Modify: `src/components/worldline/LibraryPanel.tsx`

**Interfaces:**
- Produces `createChronosExport(state): ChronosExportBundle` and `serializeChronosExport(bundle): string`.

- [ ] **Step 1: Add deterministic export test**

```ts
import { describe, expect, it } from 'vitest';
import { createInitialWorldlineState } from '../state';
import { createChronosExport, serializeChronosExport } from '../chronos';

describe('Chronos export', () => {
  it('is deterministic and provider-independent', () => {
    const state = createInitialWorldlineState();
    expect(serializeChronosExport(createChronosExport(state))).toBe(
      serializeChronosExport(createChronosExport(state)),
    );
    expect(serializeChronosExport(createChronosExport(state))).not.toContain('openfreemap');
  });
});
```

- [ ] **Step 2: Implement canonical export**

Sort branch IDs, events, metrics, and object IDs before JSON serialization. Include world ID, spatial reference, selected time, branch ancestry, events, evidence/fidelity labels, deterministic seed, and replay commitments. Exclude active renderer/provider IDs.

- [ ] **Step 3: Add export UI**

Allow download of `worldline-chronos-v0.2.json` and state clearly that this is an interchange package, not a shipping Unreal build.

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS.

```bash
git add src/worldline/chronos.ts src/worldline/__tests__/chronos.test.ts src/components/worldline
git commit -m "feat: add deterministic Chronos export"
```

---

## Task 9: Release Documentation and Full Gate

**Files:**
- Modify: `README.md`
- Modify: `docs/WORLDLINE_RUNTIME.md`
- Create: `docs/WORLDLINE_V0.2.md`

**Interfaces:**
- Documents provider matrix, attribution, evidence boundaries, benchmark status, recursive authority, and release gates.

- [ ] **Step 1: Update documentation with exact implemented status**

Document free default stack, fallback behavior, data provenance, benchmark adapters as adapters only, Cosmos distinction, and Chronos interchange scope. Do not claim Google/Cesium/Earth Engine/Unreal integration unless actually implemented.

- [ ] **Step 2: Run fresh full verification**

Run: `npm ci && npm run typecheck && npm test && npm run build`
Expected: all commands exit 0.

- [ ] **Step 3: Compare branch against main**

Review every changed file and confirm no secrets, fabricated metrics, unsupported observed-world claims, or provider IDs in canonical state.

- [ ] **Step 4: Commit docs**

```bash
git add README.md docs
git commit -m "docs: prepare Worldline v0.2 release"
```

- [ ] **Step 5: Open PR and run exact-head CI**

Create a draft PR from `codex/worldline-v0.2` to `main`. Hold merge until exact head passes typecheck, full tests, and production build.

- [ ] **Step 6: Final promotion gate**

When the exact PR head is green and review finds no Critical/Important issue, merge with expected-head protection. Then verify `main` CI and GitHub Pages deployment both complete successfully before declaring v0.2 released.
