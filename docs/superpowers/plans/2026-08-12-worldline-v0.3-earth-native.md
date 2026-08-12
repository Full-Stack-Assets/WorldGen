# Worldline v0.3 Earth Native Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the v0.2 Open Earth/New Bedford adapter path into a first-class evidence-aware Earth mode with explicit provider health, twin timelines, deterministic local source packages, and failure-safe fallback.

**Architecture:** Preserve the existing v0.2 provider registry and OpenEarthView. Add a focused Earth runtime module that owns provider health state and a source-timeline module that reads the local New Bedford package without mutating simulation state. Wire the resulting status into WorldlineShell, TimeNavigator, Data/Mechanics surfaces, and focused tests.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, existing Three.js/R3F runtime, runtime-loaded MapLibre/OpenFreeMap adapter, Vitest, static JSON/GeoJSON package.

## Global Constraints
- No paid credential required.
- No backend required.
- Procedural WorldGen remains guaranteed fallback.
- Source time and simulation time remain independent.
- Missing real-world data renders as unavailable, never fabricated.
- Renderer/provider state may not mutate committed branch/snapshot state.
- New Bedford package remains privacy-minimized and excludes ownership PII.
- Existing v0.1/v0.2 tests must remain green.

---

### Task 1: Provider-health runtime

**Files:**
- Create: `src/worldline/earthRuntime.ts`
- Test: `src/worldline/__tests__/earthRuntime.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/worldline/ProviderStatusStrip.tsx`

**Interfaces:**
- Produces: `ProviderHealth = 'READY' | 'DEGRADED' | 'UNAVAILABLE' | 'FALLBACK'`.
- Produces: `createEarthRuntimeStatus(requestedProviderId, resolvedProvider, failureReason?)`.
- Produces: `markProviderFailure(status, reason)` and `markProviderRecovery(status)` as pure functions.

- [ ] Write tests proving initial ready state, failure-to-fallback transition, recovery, and no canonical state mutation.
- [ ] Implement pure Earth runtime helpers.
- [ ] Wire OpenEarthView failure/retry into the status object without changing WorldlineState.
- [ ] Show provider health and failure reason in ProviderStatusStrip.
- [ ] Run focused tests, typecheck, full tests, build.

### Task 2: New Bedford source timeline

**Files:**
- Create: `src/worldline/sourceTimeline.ts`
- Test: `src/worldline/__tests__/sourceTimeline.test.ts`
- Modify: `src/worldline/provenance.ts`
- Modify: `src/components/worldline/TimeNavigator.tsx`

**Interfaces:**
- Produces: `SourceTimelineEntry` with `id`, `year`, `label`, `epistemicClass`, `sourceIds`, `note`.
- Produces: `getSourceTimelineForWorld(worldId)`.
- Produces: `nearestSourceSnapshot(entries, year)`.

- [ ] Add deterministic local New Bedford timeline constants matching `public/data/new-bedford/manifest.json`.
- [ ] Test nearest source selection and explicit gap semantics.
- [ ] Show `SOURCE TIME` and `SIMULATION TIME` rows when New Bedford is active.
- [ ] Ensure changing the source-time selector does not change `WorldlineState.selectedYear` unless user explicitly chooses the simulation timeline control.
- [ ] Run focused and full verification.

### Task 3: Evidence-aware Earth Data surface

**Files:**
- Create: `src/components/worldline/EarthDataPanel.tsx`
- Test: `src/components/worldline/__tests__/EarthDataPanel.test.tsx`
- Modify: `src/components/worldline/DataPanel.tsx`
- Modify: `src/components/worldline/MechanicsPanel.tsx`

**Interfaces:**
- Consumes source catalog/timeline from provenance/sourceTimeline.
- Shows current source snapshot, reconstruction status, local package version, and provider status.

- [ ] Test that New Bedford Data surface does not show WorldGen simulation metrics as city observations.
- [ ] Render source snapshot cards with OBSERVED/RECONSTRUCTED labels.
- [ ] Render explicit `No attached real-time municipal feed` state.
- [ ] Link Mechanics source inspector to the active source snapshot.
- [ ] Run focused and full verification.

### Task 4: Open Earth usability and globe mode

**Files:**
- Modify: `src/components/worldline/OpenEarthView.tsx`
- Modify: `src/components/worldline/worldline-v02.css`
- Test: `src/components/worldline/__tests__/OpenEarthView.test.tsx`

**Interfaces:**
- Add optional `projectionMode: 'mercator' | 'globe'` prop, defaulting to globe where supported.
- Add provider-local retry/error overlay that remains subordinate to App fallback.

- [ ] Extend test coverage for the semantic `Open Earth geographic view` and fallback message.
- [ ] Configure globe projection when the loaded MapLibre API supports it, otherwise retain current projection.
- [ ] Add a compact `FREE EARTH` badge and attribution reminder.
- [ ] Ensure reduced-motion and touch navigation remain functional.
- [ ] Run focused and full verification.

### Task 5: v0.3 release documentation and gate

**Files:**
- Create: `docs/WORLDLINE_V0.3.md`
- Modify: `README.md`

- [ ] Document provider-health states, source/simulation twin timelines, New Bedford evidence boundary, and fallback behavior.
- [ ] Run exact-head CI.
- [ ] Review PR diff/status.
- [ ] Merge only the exact green head.
- [ ] Verify main CI.
- [ ] Verify GitHub Pages build and deploy.

## v0.3 acceptance
1. New Bedford opens with a first-class Earth workflow when the free network provider is reachable.
2. Network/provider failure visibly transitions to procedural fallback without changing canonical world/branch state.
3. Source time and simulation time are separately visible and independently controlled.
4. Data surface never presents WorldGen branch metrics as observed New Bedford facts.
5. Local source package/version/provenance is inspectable.
6. Full typecheck/tests/build pass.
7. Main Pages deploy completes successfully.