# WorldGen FORGE v5.0 Design

**Status:** Locked for autonomous implementation  
**Date:** 2026-08-13  
**Canonical product:** WorldGen  
**Vertical slice:** New Bedford Waterfront Mutation Lab  
**BuildGraph decision:** `EXTEND_EXISTING`

## Product statement

WorldGen FORGE v5.0 turns the existing cinematic Earth explorer into a spatial creation instrument. A user may pause the Space-to-New-Bedford flagship flight, enter FORGE, select the waterfront concept parcel, describe a transformation, compare three materially different visual directions, preview them as spatial ghosts, scrub between present and transformed states, direct a cinematic reveal, and export the result.

The world is the interface. The build must not revert to a dashboard-first layout.

## Visual-first mandate

The release is evaluated primarily by visible experience:

- continuous globe-to-site camera movement;
- a dominant full-screen world surface;
- atmospheric Earth rendering and satellite imagery;
- a luminous spatial selection language;
- coherent generated architectural massing;
- translucent ghost previews;
- a continuous present-to-future scrubber;
- elegant spatial controls that disappear when not needed;
- procedural traffic and harbor motion;
- cinematic reveal and export;
- strong mobile behavior.

The following remain explicitly deprioritized unless required by the visible experience:

- new causality architecture;
- causal graphs;
- deeper counterfactual logic;
- elaborate economic models;
- generalized deterministic simulation infrastructure;
- evidence-taxonomy dashboards;
- unrelated backend abstractions;
- separate Worldline product expansion.

## Existing assets to reuse

FORGE extends the current implementation rather than replacing it:

- `OpenEarthView` remains the canonical Earth surface.
- MapLibre remains the map, globe, coordinate, tile, and camera owner.
- The existing eleven-stage `FLAGSHIP_STAGES` manifest remains the opening journey.
- Existing New Bedford coverage geometry remains the first editable location.
- Existing satellite, building extrusion, fog, cloud, grain, and procedural-life layers remain in service.
- Existing browser-native WebM capture remains the cinematic export path.
- Existing provider fallback behavior remains intact.
- Existing BuildGraph reuse rules govern every new variant, component, prompt, scene directive, and camera path.

A second map SDK, second globe, parallel application, or replacement visual shell is out of scope.

## Core experience

### 1. Enter FORGE

A persistent but compact `FORGE` control appears with the cinematic controls. Selecting it exits active camera playback without discarding the current view, moves to the waterfront parcel if necessary, and activates spatial selection.

### 2. Select the site

The New Bedford waterfront parcel is represented by a luminous boundary and a low translucent surface. The parcel may be selected through the FORGE control or directly from its map layer. Selection must be visible at neighborhood, street, parcel, and building scales.

### 3. Describe the transformation

A compact prompt capsule appears near the lower edge of the viewport. It contains:

- a free-text visual direction;
- three one-tap prompt seeds;
- a `Generate directions` action;
- a disclosure that results are visual concepts, not approved or constructed projects.

The default prompt is:

> Transform this waterfront into a bioluminescent mixed-use harbor district. Preserve the historic brick warehouses, add elevated gardens, autonomous ferries, and a dramatic blue-hour atmosphere.

The local application produces deterministic visual variants from known presets so FORGE remains usable without an AI service. The published Outside Agent produces structured visual-director briefs from arbitrary prompts.

### 4. Compare three variants

The first release includes three reusable, visually distinct directions:

#### Harbor Commons

A warm civic waterfront with timber, glass, green roofs, public terraces, and restrained height. Historic industrial geometry remains legible.

#### Tidal Works

A high-contrast industrial future with steel, cyan lighting, adaptive piers, ferry infrastructure, and retained warehouse massing.

#### Lumen Quay

A bolder blue-hour concept with luminous façades, elevated gardens, bioluminescent public space, and a theatrical harbor edge.

Each variant owns:

- display name;
- concise visual thesis;
- palette;
- building geometry and heights;
- public-realm path;
- vegetation positions;
- glow intensity;
- camera reveal path;
- reusable asset count;
- concept classification.

### 5. Ghost preview

Selecting a direction previews it above the existing parcel with reduced opacity and heightened edge glow. Ghost mode must let the user read both the present city and the proposal simultaneously.

### 6. Reality scrubber

A continuous slider controls transformation progress from `Present 0%` to `Concept 100%`. It drives:

- future building extrusion height;
- future building opacity;
- public-realm line opacity and width;
- vegetation radius and opacity;
- parcel surface treatment;
- atmosphere tint;
- UI percentage readout.

The transition must feel spatial rather than swapping between two screenshots.

### 7. Director mode

The `Direct reveal` action runs a short variant-specific camera sequence:

1. close parcel orbit;
2. building-scale hold;
3. transformation rise;
4. waterfront pullback;
5. final variant title frame.

The sequence uses the existing MapLibre camera and does not mount another renderer.

### 8. Export

FORGE supports:

- cinematic WebM capture;
- PNG still capture where browser canvas export is available;
- JSON scene package containing prompt, variant, transformation amount, camera view, concept classification, and BuildGraph reuse metadata.

The application must report browser limitations honestly and must not claim MP4 when only WebM is produced.

## Interaction states

FORGE has six explicit states:

1. `closed` — flagship/explore behavior remains unchanged.
2. `selecting` — parcel selection is emphasized.
3. `prompting` — prompt capsule is open.
4. `comparing` — variant ribbon and ghost previews are available.
5. `editing` — reality scrubber and variant controls are active.
6. `directing` — UI collapses while the reveal camera runs.

State transitions must be reversible. Escape exits `directing` first, then closes FORGE if pressed again.

## Component boundaries

### `forgeModel.ts`

Pure reusable domain model. Defines variants, prompt seeds, state transitions, scene-package serialization, and deterministic prompt matching.

### `forgeGeometry.ts`

Produces GeoJSON for the selected variant and transformation amount. All features are marked `VISUAL_CONCEPT`.

### `forgeMapLayers.ts`

Owns MapLibre sources, layers, paint updates, parcel hit testing, and transformation application.

### `useForgeController.ts`

Owns React state, variant selection, prompt submission, scrubber amount, director sequence, still/scene export, and coordination with the flagship flight.

### `ForgeControls.tsx`

Owns the spatial control surface only. It contains no MapLibre logic.

### `forge.css`

Owns FORGE visual language, responsive behavior, transitions, reduced-motion behavior, and elegant UI disappearance.

`OpenEarthView` composes these units and passes the shared map reference.

## Map data and visual truth

Every new geometry feature must include:

```json
{
  "classification": "VISUAL_CONCEPT",
  "variantId": "lumen-quay",
  "assetOrigin": "FORGE_V5_PRESET"
}
```

The UI must display `VISUAL CONCEPT` while FORGE is active. It must never describe these variants as approved, built, measured, predicted, or planned developments.

## Outside Agent contract

A public web agent named **WorldGen Visual Director** will convert natural-language intent into a structured visual brief. It must prioritize visible quality over analysis, retrieve/reuse before proposing generation, create three meaningfully different variants, preserve explicitly named landmarks, maintain believable scale, and identify all output as visual concept work.

Required output sections:

- reuse decision;
- preserved elements;
- three variant briefs;
- geometry directives;
- materials and lighting;
- environmental motion;
- camera shot list;
- transition plan;
- concept disclosure.

The agent does not claim to alter the live application directly and does not produce policy, causal, economic, or forecast analysis unless explicitly asked.

## Figma artifact

Create **WorldGen Spatial UI System v5.0** with editable frames for:

- flagship-to-FORGE handoff;
- selected parcel;
- prompt capsule;
- three-direction ribbon;
- ghost mode;
- reality scrubber;
- director mode;
- mobile FORGE controls;
- loading, unsupported export, and provider-fallback states.

The design follows the existing dark spatial language and preserves a world-dominant canvas.

## Performance constraints

- One MapLibre instance.
- No second globe.
- No new heavyweight renderer dependency.
- Variant geometry remains bounded.
- Transformation updates use paint/source changes rather than React remounts.
- Procedural life remains capped and throttled.
- Mobile uses fewer decorative particles and shorter director durations.
- Reduced-motion mode disables autoplay and compresses transitions.
- All loops and listeners stop on unmount or hidden-document state.

## Accessibility

- All controls have visible labels or accessible names.
- Keyboard users can enter FORGE, switch variants, change the scrubber, direct, export, and exit.
- Status changes use polite live regions.
- Controls maintain readable contrast over changing imagery.
- Reduced-motion preferences are honored.
- Touch targets are at least 40 CSS pixels on mobile.

## Release identity

- Product name: `WorldGen FORGE`
- Version: `5.0.0`
- Vertical slice: `New Bedford Waterfront Mutation Lab`
- Default direction: `Lumen Quay`
- Default transformation amount after generation: `68%`
- Default ghost opacity: `46%`

## Acceptance criteria

1. WorldGen opens on the existing Space-to-New-Bedford flagship sequence.
2. The user can enter FORGE from the flagship surface.
3. The waterfront concept parcel becomes visibly selectable.
4. The default visual prompt is present and editable.
5. Prompt submission exposes three distinct variants.
6. Harbor Commons, Tidal Works, and Lumen Quay visibly differ in color, geometry, height, and public realm.
7. Ghost mode overlays a direction without obscuring the present city.
8. The reality scrubber continuously changes geometry and atmosphere from 0% to 100%.
9. Director mode performs a variant-specific cinematic reveal.
10. WebM export remains available and truthful.
11. PNG still and JSON scene-package exports produce visible, downloadable outcomes when supported.
12. All FORGE geometry is classified `VISUAL_CONCEPT`.
13. Existing flagship playback, pause, stage selection, Explore, and provider fallback continue working.
14. Mobile controls remain usable at 375 × 667.
15. Reduced-motion mode avoids autoplay and nonessential animated noise.
16. Type-check, full tests, and production build pass.
17. A published Outside Agent returns a structured three-variant visual brief.
18. An editable Figma artifact documents the v5.0 spatial UI system.
19. New reusable outputs are registered in BuildGraph documentation.
20. A live v5.0 preview is independently tested before being presented as complete.
