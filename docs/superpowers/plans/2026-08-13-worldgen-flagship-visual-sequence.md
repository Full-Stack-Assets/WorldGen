# WorldGen Flagship Visual Sequence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved Space-to-New-Bedford cinematic sequence inside the existing WorldGen map surface, with atmosphere, procedural life, a visual future reveal, minimal controls, and browser-native WebM capture.

**Architecture:** Extend `OpenEarthView` and keep one MapLibre instance. Put reusable choreography, concept geometry, procedural-life, and capture-selection logic in a pure TypeScript module with tests. Add a focused React control overlay and a CSS-only cinematic presentation layer. `WorldlineShell` receives only a boolean cinematic state contract so existing application behavior remains intact outside the flight.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, Vitest 2, MapLibre GL JS 5 loaded through the existing CDN boundary, browser `MediaRecorder` and `HTMLCanvasElement.captureStream`.

## Global Constraints

- Extend `Full-Stack-Assets/WorldGen`; do not create a replacement repository or app.
- Reuse `OpenEarthView`, `WorldlineShell`, existing New Bedford data, and existing provider fallback behavior.
- Do not add a second renderer or heavyweight map dependency.
- Do not introduce causality, counterfactual, economic-model, generalized-simulation, or unrelated backend work.
- Label all new parcel and future geometry as visual concept content.
- Preserve reduced-motion and mobile behavior.
- Do not claim MP4 export; export WebM only when supported.
- Final verification requires `npm run typecheck`, `npm test`, and `npm run build` in CI.

---

### Task 1: Define and test the reusable visual-sequence contract

**Files:**
- Create: `src/components/worldline/flagshipSequence.ts`
- Create: `src/components/worldline/__tests__/flagshipSequence.test.ts`

**Interfaces:**
- Produces: `FlagshipStage`, `FLAGSHIP_STAGES`, `stageDuration`, `createFlagshipConceptGeoJSON`, `createProceduralLifeFrame`, `preferredCaptureMimeType`.
- Consumes: no application state and no browser globals except the explicit MIME support callback.

- [ ] **Step 1: Write the failing stage-order test**

```ts
import { describe, expect, it } from 'vitest';
import {
  FLAGSHIP_STAGES,
  createFlagshipConceptGeoJSON,
  createProceduralLifeFrame,
  preferredCaptureMimeType,
  stageDuration,
} from '../flagshipSequence';

describe('flagship visual sequence', () => {
  it('preserves the approved eleven-stage journey', () => {
    expect(FLAGSHIP_STAGES.map((stage) => stage.id)).toEqual([
      'space', 'earth', 'north-america', 'massachusetts', 'new-bedford',
      'neighborhood', 'street', 'parcel', 'building', 'close-exterior', 'future-view',
    ]);
  });

  it('compresses motion without removing stages for reduced-motion users', () => {
    expect(stageDuration(FLAGSHIP_STAGES[4], true)).toBeLessThan(stageDuration(FLAGSHIP_STAGES[4], false));
    expect(stageDuration(FLAGSHIP_STAGES[4], true)).toBeGreaterThan(0);
  });

  it('returns bounded, explicitly conceptual future geometry', () => {
    const collection = createFlagshipConceptGeoJSON();
    expect(collection.features.length).toBeGreaterThan(3);
    expect(collection.features.every((feature) => feature.properties?.classification === 'VISUAL_CONCEPT')).toBe(true);
  });

  it('creates a bounded procedural-life frame', () => {
    const frame = createProceduralLifeFrame(0.25, false);
    expect(frame.features.length).toBeGreaterThan(2);
    expect(frame.features.length).toBeLessThanOrEqual(18);
  });

  it('selects the first supported WebM capture format', () => {
    const supported = (mime: string) => mime.includes('vp8');
    expect(preferredCaptureMimeType(supported)).toContain('vp8');
    expect(preferredCaptureMimeType(() => false)).toBeNull();
  });
});
```

- [ ] **Step 2: Verify RED in the draft pull request CI**

Run: GitHub Actions `CI / Type-check, test, build` for the test-only commit.  
Expected: FAIL because `../flagshipSequence` does not exist.

- [ ] **Step 3: Implement the minimal pure TypeScript module**

Define the eleven immutable camera stages, concept GeoJSON with `classification: 'VISUAL_CONCEPT'`, bounded moving points, reduced-motion duration compression, and MIME selection in `flagshipSequence.ts`.

- [ ] **Step 4: Verify GREEN**

Run: GitHub Actions `CI / Type-check, test, build`.  
Expected: all Task 1 tests pass and the existing suite remains green.

- [ ] **Step 5: Commit**

Commit message: `feat: add flagship camera and concept-scene contract`

---

### Task 2: Build the cinematic control and capture surface

**Files:**
- Create: `src/components/worldline/FlagshipSequenceControls.tsx`
- Create: `src/components/worldline/__tests__/FlagshipSequenceControls.test.tsx`

**Interfaces:**
- Consumes: `stages`, `activeStageIndex`, `playing`, `exporting`, `status`, and callbacks `onPlay`, `onPause`, `onExit`, `onExport`, `onSelectStage`.
- Produces: an accessible compact overlay with progress, stage copy, controls, and status messaging.

- [ ] **Step 1: Write failing rendering and interaction tests**

Render the control component, assert the active stage title and progress label, click Play/Pause/Explore/Export, and assert callbacks fire. Assert future stages are disabled until `completedStageIndex` reaches them.

- [ ] **Step 2: Verify RED**

Run: PR CI.  
Expected: FAIL because `FlagshipSequenceControls` does not exist.

- [ ] **Step 3: Implement the minimal accessible component**

Use semantic buttons, `aria-live="polite"` for stage/status copy, `aria-pressed` for active progress markers, and no map logic inside the component.

- [ ] **Step 4: Verify GREEN**

Run: PR CI.  
Expected: control tests and existing tests pass.

- [ ] **Step 5: Commit**

Commit message: `feat: add cinematic sequence controls`

---

### Task 3: Integrate atmosphere, continuous camera travel, life, transformation, and export

**Files:**
- Modify: `src/components/worldline/OpenEarthView.tsx`
- Create: `src/components/worldline/flagship-sequence.css`
- Modify: `src/components/worldline/__tests__/OpenEarthView.test.tsx`

**Interfaces:**
- `OpenEarthView` adds optional callbacks `onCinematicStateChange?: (active: boolean) => void` and `autoplayFlagship?: boolean`.
- Reuses `FLAGSHIP_STAGES`, `createFlagshipConceptGeoJSON`, `createProceduralLifeFrame`, and `preferredCaptureMimeType`.
- Owns exactly one map instance and one animation lifecycle.

- [ ] **Step 1: Extend tests before production code**

Assert `OpenEarthView` exports the sequence manifest through the imported contract, preserves globe projection fallback, and exposes a renderable component with the new optional props at compile time.

- [ ] **Step 2: Verify RED**

Run: PR CI.  
Expected: FAIL because the new integration contract is absent.

- [ ] **Step 3: Extend the local MapLibre type boundary**

Add typed `flyTo`, `easeTo`, `stop`, `getCanvas`, `setFog`, `setPaintProperty`, `once`, `resize`, and GeoJSON `setData` support without importing a second MapLibre package.

- [ ] **Step 4: Configure the visual stage**

Initialize at the Space camera. On map load, set globe projection, atmosphere/fog where available, enhance building extrusion paint, add New Bedford coverage, add the concept and procedural-life sources, add concept layers with initial opacity zero, and start the bounded life loop.

- [ ] **Step 5: Implement camera sequencing**

Advance only after the map emits `moveend`. Use `flyTo` for stages 0-8 and `easeTo` for stages 9-10. Update active stage state before movement, reveal concept layers at `future-view`, and stop cleanly on pause, exit, unmount, Escape, or hidden-document state.

- [ ] **Step 6: Implement honest browser capture**

Use `getCanvas().captureStream(30)` and `MediaRecorder` with `preferredCaptureMimeType`. Start recording, replay the sequence, stop after the final movement, create a WebM Blob, download it as `worldgen-new-bedford-flagship.webm`, and surface unsupported or failed capture through component status.

- [ ] **Step 7: Add cinematic CSS**

Implement spatial background, atmosphere vignette, subtle grain, letterbox, stage typography, compact controls, responsive layout, and reduced-motion overrides. Do not add dashboard cards.

- [ ] **Step 8: Verify GREEN**

Run: PR CI.  
Expected: type-check, tests, and build pass.

- [ ] **Step 9: Commit**

Commit message: `feat: build New Bedford flagship cinematic flight`

---

### Task 4: Make WorldGen open on the flagship and dissolve the shell UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/worldline/WorldlineShell.tsx`
- Modify: `src/components/worldline/__tests__/WorldlineShell.test.tsx` or the closest existing shell test.

**Interfaces:**
- `WorldlineShell` adds `cinematicActive?: boolean` and applies `wl-cinematic-active` at the root.
- `App` initializes its active view to `new-bedford-001`, tracks cinematic activity, passes the state to both `OpenEarthView` and `WorldlineShell`, and keeps the existing provider fallback path.

- [ ] **Step 1: Write failing shell-state test**

Render `WorldlineShell` with `cinematicActive` and assert the root has `wl-cinematic-active`; render without it and assert the class is absent.

- [ ] **Step 2: Verify RED**

Run: PR CI.  
Expected: FAIL because the prop and class contract are absent.

- [ ] **Step 3: Implement the shell contract and App wiring**

Initialize App state with `selectWorld(createInitialWorldlineState(), 'new-bedford-001')`. Pass `onCinematicStateChange={setCinematicActive}` to `OpenEarthView` and `cinematicActive={cinematicActive}` to `WorldlineShell`. Add CSS rules that fade `.wl-interface` and disable its pointer events while leaving `.wl-flagship-ui` visible.

- [ ] **Step 4: Verify GREEN**

Run: PR CI.  
Expected: all tests, type-check, and build pass.

- [ ] **Step 5: Commit**

Commit message: `feat: make the flagship flight WorldGen's visual entry`

---

### Task 5: Verify, review, and register the reusable visual assets

**Files:**
- Create: `docs/buildgraph/worldgen-flagship-visual-sequence.md`
- Update: `README.md`

**Interfaces:**
- Produces: BuildGraph registration record, usage instructions, performance notes, and honest capture/browser limitations.

- [ ] **Step 1: Register the reuse decision and produced assets**

Record `EXTEND_EXISTING`, source files reused, new reusable outputs, exact branch/PR, and verification evidence. Mark future geometry as `VISUAL_CONCEPT`.

- [ ] **Step 2: Update README usage**

Document Play, Pause, Explore, Export, Escape, reduced-motion behavior, and that WebM capture depends on browser support.

- [ ] **Step 3: Run full fresh verification**

Run in PR CI:

```bash
npm run typecheck
npm test
npm run build
```

Expected: exit code 0 for every command and zero failed tests.

- [ ] **Step 4: Review the final diff against all twelve acceptance criteria**

Inspect every changed file and confirm no new causality, simulation, unrelated backend, parallel-globe, or unverified imagery work entered the branch.

- [ ] **Step 5: Mark the draft PR ready only after verification evidence is visible**

Use the final CI run as the completion evidence.
