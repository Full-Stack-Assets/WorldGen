# WorldGen FORGE v5.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing WorldGen flagship Earth experience into the New Bedford Waterfront Mutation Lab, where users can select the waterfront parcel, prompt three visual directions, ghost-preview them, scrub between present and transformed states, direct a cinematic reveal, and export the result.

**Architecture:** Keep one MapLibre instance and preserve the current flagship camera system. Add pure FORGE domain and geometry modules, a focused MapLibre layer adapter, a React controller, and a spatial control surface. Outside Agent and Figma are parallel release artifacts, while the canonical source remains in `Full-Stack-Assets/WorldGen`.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, Vitest 2, MapLibre GL JS 5 loaded through the existing runtime boundary, browser MediaRecorder/canvas APIs, Figma Plugin API, Outside Agent web channel.

## Global Constraints

- Product name is `WorldGen FORGE` and release version is `5.0.0`.
- Vertical slice is `New Bedford Waterfront Mutation Lab`.
- Extend the existing `OpenEarthView`; do not create another app, globe, or map SDK.
- Keep one MapLibre instance.
- Do not add a heavyweight renderer dependency.
- Preserve the existing eleven-stage Space-to-New-Bedford flagship flight.
- Preserve existing Play, Pause, Replay, stage selection, Explore, provider fallback, mobile behavior, reduced-motion behavior, and WebM capture.
- All generated geometry must carry `classification: 'VISUAL_CONCEPT'`.
- Default direction is `lumen-quay`.
- Default transformation after generation is `0.68`.
- Default ghost opacity is `0.46`.
- No new causality, counterfactual, economic-model, generalized-simulation, evidence-dashboard, unrelated backend, or separate Worldline work.
- Test-first changes are required for every code task.
- Do not claim MP4 export.
- Final verification requires `npm run typecheck`, `npm test`, and `npm run build`.

---

### Task 1: FORGE domain model and scene-package contract

**Files:**
- Create: `src/components/worldline/forgeModel.ts`
- Create: `src/components/worldline/__tests__/forgeModel.test.ts`

**Interfaces:**
- Produces: `ForgeMode`, `ForgeVariantId`, `ForgeVariant`, `ForgeState`, `FORGE_VARIANTS`, `FORGE_PROMPT_SEEDS`, `DEFAULT_FORGE_PROMPT`, `createInitialForgeState`, `matchForgePrompt`, `serializeForgeScenePackage`.
- Consumes: no browser or MapLibre globals.

- [ ] **Step 1: Write the failing model tests**

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FORGE_PROMPT,
  FORGE_VARIANTS,
  createInitialForgeState,
  matchForgePrompt,
  serializeForgeScenePackage,
} from '../forgeModel';

describe('WorldGen FORGE model', () => {
  it('starts closed with the locked v5 defaults', () => {
    const state = createInitialForgeState();
    expect(state.mode).toBe('closed');
    expect(state.variantId).toBe('lumen-quay');
    expect(state.transformation).toBe(0.68);
    expect(state.ghostOpacity).toBe(0.46);
    expect(state.prompt).toBe(DEFAULT_FORGE_PROMPT);
  });

  it('exposes three materially distinct directions', () => {
    expect(FORGE_VARIANTS.map((variant) => variant.id)).toEqual([
      'harbor-commons',
      'tidal-works',
      'lumen-quay',
    ]);
    expect(new Set(FORGE_VARIANTS.map((variant) => variant.palette.accent)).size).toBe(3);
    expect(new Set(FORGE_VARIANTS.map((variant) => variant.maxHeight)).size).toBe(3);
  });

  it('matches visual language to a deterministic direction', () => {
    expect(matchForgePrompt('historic timber terraces and green roofs')).toBe('harbor-commons');
    expect(matchForgePrompt('industrial steel ferry piers and cyan lighting')).toBe('tidal-works');
    expect(matchForgePrompt('bioluminescent elevated gardens at blue hour')).toBe('lumen-quay');
  });

  it('serializes an explicitly conceptual scene package', () => {
    const json = serializeForgeScenePackage({
      ...createInitialForgeState(),
      mode: 'editing',
    }, { center: [-70.9217, 41.6349], zoom: 17.4, pitch: 72, bearing: -40 });
    const scene = JSON.parse(json);
    expect(scene.product).toBe('WorldGen FORGE');
    expect(scene.version).toBe('5.0.0');
    expect(scene.classification).toBe('VISUAL_CONCEPT');
    expect(scene.location.id).toBe('new-bedford-waterfront');
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/worldline/__tests__/forgeModel.test.ts`  
Expected: FAIL because `forgeModel.ts` does not exist.

- [ ] **Step 3: Implement the domain model**

Define:

```ts
export type ForgeMode = 'closed' | 'selecting' | 'prompting' | 'comparing' | 'editing' | 'directing';
export type ForgeVariantId = 'harbor-commons' | 'tidal-works' | 'lumen-quay';
```

Each `ForgeVariant` must include `id`, `name`, `thesis`, `palette`, `maxHeight`, `glow`, `assetReuseCount`, `keywords`, and a five-shot `directorPath`. Use exact defaults from Global Constraints. `matchForgePrompt` scores keyword matches and falls back to `lumen-quay`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/components/worldline/__tests__/forgeModel.test.ts`  
Expected: four passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/worldline/forgeModel.ts src/components/worldline/__tests__/forgeModel.test.ts
git commit -m "feat: add WorldGen FORGE domain model"
```

---

### Task 2: Variant geometry generator

**Files:**
- Create: `src/components/worldline/forgeGeometry.ts`
- Create: `src/components/worldline/__tests__/forgeGeometry.test.ts`

**Interfaces:**
- Consumes: `ForgeVariantId`, `FORGE_VARIANTS` from `forgeModel.ts`.
- Produces: `ForgeFeatureCollection`, `createForgeGeometry(variantId, transformation)`, `FORGE_PARCEL_RING`.

- [ ] **Step 1: Write failing geometry tests**

```ts
import { describe, expect, it } from 'vitest';
import { createForgeGeometry } from '../forgeGeometry';

describe('FORGE geometry', () => {
  it('marks every feature as a visual concept', () => {
    const geometry = createForgeGeometry('lumen-quay', 0.68);
    expect(geometry.features.length).toBeGreaterThan(8);
    expect(geometry.features.every((feature) => feature.properties.classification === 'VISUAL_CONCEPT')).toBe(true);
  });

  it('scales building heights continuously with transformation', () => {
    const present = createForgeGeometry('tidal-works', 0);
    const future = createForgeGeometry('tidal-works', 1);
    const height = (collection: typeof present) => collection.features
      .filter((feature) => feature.properties.kind === 'forge-building')
      .reduce((sum, feature) => sum + (feature.properties.height ?? 0), 0);
    expect(height(present)).toBe(0);
    expect(height(future)).toBeGreaterThan(80);
  });

  it('produces visibly different direction geometry', () => {
    const commons = JSON.stringify(createForgeGeometry('harbor-commons', 1));
    const works = JSON.stringify(createForgeGeometry('tidal-works', 1));
    const lumen = JSON.stringify(createForgeGeometry('lumen-quay', 1));
    expect(commons).not.toBe(works);
    expect(works).not.toBe(lumen);
    expect(lumen).not.toBe(commons);
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/worldline/__tests__/forgeGeometry.test.ts`  
Expected: FAIL because `forgeGeometry.ts` does not exist.

- [ ] **Step 3: Implement geometry generation**

Create bounded GeoJSON for:

- parcel polygon;
- parcel surface polygon;
- 3–5 building polygons depending on variant;
- public-realm line;
- 5–8 vegetation points;
- 2 harbor-light points;
- 1 selection centroid.

Every feature properties object must include:

```ts
{
  classification: 'VISUAL_CONCEPT',
  variantId,
  assetOrigin: 'FORGE_V5_PRESET',
  kind,
}
```

Building height is `baseHeight * clamp(transformation, 0, 1)`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/components/worldline/__tests__/forgeGeometry.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/components/worldline/forgeGeometry.ts src/components/worldline/__tests__/forgeGeometry.test.ts
git commit -m "feat: generate reusable FORGE variant geometry"
```

---

### Task 3: MapLibre FORGE layers and transformation adapter

**Files:**
- Create: `src/components/worldline/forgeMapLayers.ts`
- Modify: `src/components/worldline/maplibreRuntime.ts`
- Create: `src/components/worldline/__tests__/forgeMapLayers.test.ts`

**Interfaces:**
- Consumes: `MapLibreMap`, `GeoJSONSourceLike`, `createForgeGeometry`, `ForgeVariantId`.
- Produces: `addForgeLayers(map)`, `applyForgeScene(map, input)`, `setForgeVisibility(map, visible)`, `setForgeSelection(map, selected)`.

- [ ] **Step 1: Write failing adapter tests with a fake map**

Create a minimal fake implementing `getSource`, `addSource`, `getLayer`, `addLayer`, and `setPaintProperty`. Assert:

- one source is added;
- six named layers are added once;
- `applyForgeScene` calls `setData` with the requested variant;
- transformation 0 hides building/public-realm/tree layers;
- transformation 1 applies the selected variant palette;
- repeated `addForgeLayers` calls are idempotent.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/worldline/__tests__/forgeMapLayers.test.ts`.

- [ ] **Step 3: Extend the runtime type**

Add optional methods used by exports and interaction:

```ts
getCenter?: () => { lng: number; lat: number };
getZoom?: () => number;
getPitch?: () => number;
getBearing?: () => number;
queryRenderedFeatures?: (point: unknown, options?: unknown) => unknown[];
```

- [ ] **Step 4: Implement the six visual layers**

Use stable IDs:

- `worldgen-forge-parcel-surface`
- `worldgen-forge-parcel-line`
- `worldgen-forge-buildings`
- `worldgen-forge-public-realm`
- `worldgen-forge-vegetation`
- `worldgen-forge-harbor-glow`

`applyForgeScene` updates the GeoJSON source and paint properties from the chosen palette, transformation, ghost opacity, and selected state without remounting the map.

- [ ] **Step 5: Verify GREEN and existing tests**

Run:

```bash
npm test -- src/components/worldline/__tests__/forgeMapLayers.test.ts
npm test -- src/components/worldline/__tests__/OpenEarthView.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/components/worldline/forgeMapLayers.ts src/components/worldline/maplibreRuntime.ts src/components/worldline/__tests__/forgeMapLayers.test.ts
git commit -m "feat: add MapLibre FORGE transformation layers"
```

---

### Task 4: Spatial FORGE controls

**Files:**
- Create: `src/components/worldline/ForgeControls.tsx`
- Create: `src/components/worldline/__tests__/ForgeControls.test.tsx`
- Create: `src/components/worldline/forge.css`

**Interfaces:**
- Consumes: `ForgeState`, `FORGE_VARIANTS`, `FORGE_PROMPT_SEEDS`.
- Produces: `ForgeControls` component and callbacks `onOpen`, `onClose`, `onSelectParcel`, `onPromptChange`, `onGenerate`, `onSelectVariant`, `onToggleGhost`, `onTransformationChange`, `onDirect`, `onExportStill`, `onExportScene`.

- [ ] **Step 1: Write failing static-render tests**

Test:

- closed state contains `Enter FORGE`;
- prompting state renders editable default prompt and `Generate directions`;
- comparing state contains all three direction names;
- editing state contains a range input labeled `Reality transformation` and percentage text;
- every active FORGE state contains `VISUAL CONCEPT`;
- mobile-compatible labels exist for Director, still export, and scene export.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/worldline/__tests__/ForgeControls.test.tsx`.

- [ ] **Step 3: Implement the control surface**

Use a small upper-right FORGE trigger and a lower floating prompt/variant dock. Avoid cards larger than one-third of the viewport. Variant controls are a horizontal ribbon. The scrubber remains visible in editing mode. Use semantic buttons, labels, and `aria-live="polite"`.

- [ ] **Step 4: Implement `forge.css`**

Include:

- selection pulse;
- glass prompt capsule;
- direction ribbon;
- ghost-toggle treatment;
- reality scrubber;
- collapsed Director HUD;
- mobile bottom-sheet behavior;
- reduced-motion overrides;
- 40px mobile touch targets.

- [ ] **Step 5: Verify GREEN**

Run component tests and production type-check.

- [ ] **Step 6: Commit**

```bash
git add src/components/worldline/ForgeControls.tsx src/components/worldline/forge.css src/components/worldline/__tests__/ForgeControls.test.tsx
git commit -m "feat: add spatial FORGE control surface"
```

---

### Task 5: FORGE controller, director mode, and exports

**Files:**
- Create: `src/components/worldline/useForgeController.ts`
- Create: `src/components/worldline/forgeExports.ts`
- Create: `src/components/worldline/__tests__/forgeExports.test.ts`

**Interfaces:**
- Consumes: shared `MapLibreMap` ref, `ForgeState`, `FORGE_VARIANTS`, `applyForgeScene`, `moveToStage` camera shape.
- Produces: `ForgeController`, `downloadForgeStill`, `downloadForgeScenePackage`.

- [ ] **Step 1: Write failing export tests**

Test pure filename, scene-package, and unsupported-canvas behavior. The JSON filename must be `worldgen-forge-new-bedford.scene.json`; PNG filename must be `worldgen-forge-new-bedford.png`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/worldline/__tests__/forgeExports.test.ts`.

- [ ] **Step 3: Implement export utilities**

`downloadForgeStill` uses `canvas.toBlob` and throws a readable error when unavailable. `downloadForgeScenePackage` serializes through `serializeForgeScenePackage`, creates a Blob, clicks a temporary anchor, and revokes the URL.

- [ ] **Step 4: Implement the controller**

The controller must:

- open at `selecting` and move to the parcel stage;
- transition to `prompting` after parcel selection;
- choose the best local preset through `matchForgePrompt` on generate;
- expose all three variants in `comparing`;
- enter `editing` on variant selection;
- apply every variant/transformation/ghost change through `applyForgeScene`;
- run the variant's five-shot director path through MapLibre `easeTo`/`flyTo`;
- set `mode: 'directing'` during the reveal;
- stop on Escape, hidden document, or unmount;
- coordinate with the flagship flight by pausing it when FORGE opens;
- restore free exploration when FORGE closes.

- [ ] **Step 5: Verify GREEN**

Run export tests, type-check, and existing flagship tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/worldline/useForgeController.ts src/components/worldline/forgeExports.ts src/components/worldline/__tests__/forgeExports.test.ts
git commit -m "feat: direct and export FORGE transformations"
```

---

### Task 6: Integrate FORGE into the canonical Earth view

**Files:**
- Modify: `src/components/worldline/OpenEarthView.tsx`
- Modify: `src/components/worldline/useMountedEarthMap.ts`
- Modify: `src/components/worldline/createFlagshipMap.ts`
- Modify: `src/components/worldline/FlagshipControlsLayer.tsx`
- Modify: `src/components/worldline/__tests__/OpenEarthView.test.tsx`

**Interfaces:**
- Composes the existing flagship journey and the new `ForgeController` over one map reference.

- [ ] **Step 1: Extend the existing integration test**

Static render must contain:

- `WorldGen flagship cinematic sequence`;
- `Enter FORGE`;
- no second map container;
- no dashboard copy in the cinematic surface.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/worldline/__tests__/OpenEarthView.test.tsx`.

- [ ] **Step 3: Add FORGE layers during map load**

Call `addForgeLayers(map)` after base, flagship concept, and scene-motion layers are configured.

- [ ] **Step 4: Compose controller and controls**

In `OpenEarthView`, instantiate `useForgeController(mapRef, journey, reducedMotion, compact)`, render `<ForgeControls ... />`, and pass `forgeOpen={forge.mode !== 'closed'}` into the flagship layer so its control density reduces while editing.

- [ ] **Step 5: Verify GREEN and regressions**

Run:

```bash
npm test -- src/components/worldline/__tests__/OpenEarthView.test.tsx
npm test -- src/components/worldline/__tests__/FlagshipSequenceControls.test.tsx
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/components/worldline/OpenEarthView.tsx src/components/worldline/useMountedEarthMap.ts src/components/worldline/createFlagshipMap.ts src/components/worldline/FlagshipControlsLayer.tsx src/components/worldline/__tests__/OpenEarthView.test.tsx
git commit -m "feat: integrate FORGE into the flagship Earth surface"
```

---

### Task 7: Release identity, BuildGraph registration, and documentation

**Files:**
- Modify: `package.json`
- Modify: `index.html`
- Modify: `README.md`
- Create: `docs/buildgraph/worldgen-forge-v5.md`
- Create: `docs/releases/worldgen-forge-v5.0.0.md`

**Interfaces:**
- Produces the release identity and reuse ledger.

- [ ] **Step 1: Set release metadata**

Set package version to `5.0.0`. Update the browser title and metadata to `WorldGen FORGE 5.0 · Shape Possible Worlds` while avoiding causal or simulation-first copy.

- [ ] **Step 2: Document the user workflow**

README must explain:

1. Play the flagship flight.
2. Enter FORGE.
3. Select the waterfront parcel.
4. Describe a visual transformation.
5. Compare three directions.
6. Ghost-preview and scrub reality.
7. Direct and export the reveal.

- [ ] **Step 3: Register reusable outputs**

The BuildGraph document must record `EXTEND_EXISTING`, parent assets, new source paths, tests, version, concept classification, and verification run identifiers.

- [ ] **Step 4: Commit**

```bash
git add package.json index.html README.md docs/buildgraph/worldgen-forge-v5.md docs/releases/worldgen-forge-v5.0.0.md
git commit -m "docs: register and release WorldGen FORGE 5.0"
```

---

### Task 8: Build and publish WorldGen Visual Director

**External artifact:** Outside Agent

**Interfaces:**
- Produces a public web agent and public link.
- The agent consumes visual intent and returns structured visual-director briefs.

- [ ] **Step 1: Create a conversational web agent**

Name: `WorldGen Visual Director`.

Purpose:

> Convert a user's selected location, preservation constraints, visual direction, atmosphere, and desired scale into three materially different WorldGen FORGE visual concept briefs with reuse decisions, geometry, materials, lighting, environmental motion, camera shots, transitions, and a clear concept disclosure.

- [ ] **Step 2: Record source requirements**

Include the creator-approved FORGE product statement, visual-first mandate, three-variant requirement, retrieval-before-generation rule, and concept-disclosure rule.

- [ ] **Step 3: Configure durable behavior intents**

Create `must` intents for visual-first output, three meaningful variants, preserve/reuse constraints, believable scale, structured output, and concept disclosure. Add examples for each.

- [ ] **Step 4: Simulate and review**

Run `simulateBuildSummary`, `tryAgent`, and `reviewAgent`. Resolve all blockers and dead wiring.

- [ ] **Step 5: Run quality and publish**

Run `runQualitySuite` with one trial for smoke coverage, then publish. Set a clean slug if available.

---

### Task 9: Create the editable Figma v5 spatial UI system

**External artifact:** Figma design file

**Interfaces:**
- Produces an editable design URL and frames matching the release states.

- [ ] **Step 1: Create `WorldGen Spatial UI System v5.0`**

Use the authenticated Starter team plan. Create a design file in drafts/team space.

- [ ] **Step 2: Build the editable frames**

Create desktop frames for flagship handoff, parcel selection, prompt capsule, variant comparison, ghost mode, reality scrubber, and director mode; create one 375 × 667 mobile frame.

- [ ] **Step 3: Add component/tokens page**

Include color tokens, glass treatments, typography, 40px touch targets, variant pills, prompt capsule, scrubber, status label, and concept-disclosure badge.

- [ ] **Step 4: Capture the live v5 preview into the file**

Use the final tested preview URL as the pixel-reference page after deployment.

---

### Task 10: Independent preview deployment and final verification

**External artifact:** AppDeploy v5 preview

**Files:**
- Reconcile the preview's `src/main.ts` and `tests/tests.txt` only.

**Interfaces:**
- Produces a live URL with terminal `ready` status and passing E2E tests.

- [ ] **Step 1: Update the existing flagship preview**

Add the FORGE trigger, parcel selection, prompt capsule, three direction ribbon, ghost mode, transformation scrubber, director reveal, still/scene/WebM exports, and v5 copy.

- [ ] **Step 2: Reconcile four user-visible tests**

Exactly one test is `[sanity]`:

1. complete FORGE workflow from entry to Lumen Quay reveal;
2. switch Harbor Commons to Tidal Works and verify visible direction change;
3. mobile pause/close/reopen behavior;
4. export a scene package and verify visible completion status.

- [ ] **Step 3: Deploy and poll to terminal state**

Do not present the URL while status is `deploying` or `deployed_and_testing`. If E2E fails, inspect QA run details and automatically repair up to three rounds.

- [ ] **Step 4: Run canonical repository verification**

Run through GitHub Actions on the feature branch:

```bash
npm run typecheck
npm test
npm run build
```

All three must exit 0.

- [ ] **Step 5: Open a PR and perform final review**

The PR must list the visual acceptance criteria, Outside Agent URL, Figma URL, preview URL, BuildGraph decision, test evidence, and known limitations. Do not merge if any required verification is red.

## Plan self-review

- Every design acceptance criterion maps to Tasks 1–10.
- No task introduces a second globe, new causal architecture, or unrelated backend work.
- All default values match the locked design.
- All new code units have one clear responsibility.
- All code tasks begin with a failing test and end with a focused commit.
- No `TBD`, `TODO`, or placeholder implementation remains.
