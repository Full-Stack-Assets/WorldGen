# WorldGen Flagship Visual Sequence Design

**Status:** Approved for implementation  
**Date:** 2026-08-13  
**Decision:** Extend the existing WorldGen repository and `OpenEarthView`. Do not create a replacement application or a second globe implementation.

## Product objective

WorldGen must open as a visually exceptional spatial experience rather than a dashboard. The immediate benchmark is one continuous, replayable camera journey:

`Space -> Earth -> North America -> Massachusetts -> New Bedford -> Neighborhood -> Street -> Parcel -> Building -> Close exterior -> Transformed future pullback`

The sequence prioritizes visual fidelity, spatial continuity, atmosphere, environmental motion, restrained controls, and cinematic capture. Work on new causal architecture, causal graphs, counterfactual engines, economic models, generalized simulation infrastructure, evidence-taxonomy interfaces, unrelated backend abstractions, and separate Worldline expansion is frozen for this release.

## BuildGraph preflight

**Decision:** `EXTEND_EXISTING`

Reuse:

- `OpenEarthView.tsx` as the canonical globe and map renderer.
- Existing MapLibre globe projection and OpenFreeMap vector geography.
- Existing New Bedford coverage GeoJSON and building extrusion layer.
- Existing `WorldlineShell` scene mount, project state, responsive behavior, and reduced-motion conventions.
- Existing world catalog, New Bedford metadata, and provider fallback behavior.

Reject:

- A new map SDK or parallel globe component.
- Dashboard-heavy interaction patterns as the cinematic surface.
- New simulation or causality work unrelated to visible quality.
- Unverified third-party imagery copied into the repository.

## Camera choreography

The canonical sequence contains eleven ordered stages:

1. Space
2. Earth
3. North America
4. Massachusetts
5. New Bedford
6. Neighborhood
7. Street
8. Parcel
9. Building
10. Close exterior
11. Future view

Each stage defines center, zoom, pitch, bearing, duration, curve, speed, title, and subtitle. Long transitions use `flyTo`; close-range transitions use `easeTo`. Movement completion advances the timeline so the map is never remounted between stages.

## Visual layers

- globe atmosphere and sky treatment;
- enhanced existing building extrusions;
- synthetic concept parcel boundary;
- future-building extrusions with animated opacity;
- future public-realm and vegetation accents;
- bounded moving vehicle and harbor-life GeoJSON features;
- filmic vignette, grain, letterbox, stage titles, and progress treatment in CSS.

Synthetic layers are explicitly named as concept layers and are not presented as existing parcels, approved development, measured buildings, or forecasts.

## Interaction

- Play starts or restarts the flagship flight.
- Pause stops the current animation.
- Explore exits cinematic mode while preserving the camera.
- Export records the renderer canvas when `captureStream` and `MediaRecorder` are supported.
- Completed stages become selectable from the progress rail.
- Escape exits cinematic mode.
- Reduced-motion users receive no autoplay, short eased transitions, and no grain animation.

During flight, the full Worldline interface fades and becomes non-interactive. Only the stage title, progress, and compact cinematic controls remain.

## Export contract

Canvas capture uses browser-native APIs and downloads WebM using the best supported VP9 or VP8 MIME type. Unsupported capture produces an honest message. The application must not claim MP4 when the browser cannot provide it.

## Performance constraints

- No new heavyweight renderer dependency.
- One MapLibre instance.
- Procedural-life updates target 12 frames per second.
- Dynamic sources remain bounded.
- Decorative overlays are CSS-only and pointer-transparent.
- Animation stops on unmount and while the document is hidden.
- Mobile uses shorter durations and fewer moving features.

## Acceptance criteria

1. The stage manifest exactly matches the approved journey.
2. Play, pause, replay, exit, and completed-stage selection work.
3. Camera travel is continuous without map remounts.
4. Atmosphere is visible at low zoom and recedes near street scale.
5. Existing building extrusions remain visible during close stages.
6. Procedural vehicles and harbor-life points move without a second renderer.
7. Future concept layers appear only during the transformation stage.
8. The heavy interface disappears during cinematic mode.
9. Reduced-motion mode disables autoplay and compresses transitions.
10. Export downloads WebM when supported and reports unsupported capture truthfully.
11. Existing provider fallback behavior remains intact.
12. Type-check, test, and production build pass in CI.

## Reusable outputs to register

- `FLAGSHIP_STAGES` camera manifest;
- `FlagshipSequenceControls` control surface;
- `createFlagshipConceptGeoJSON` concept-scene generator;
- `createProceduralLifeFrame` bounded animation generator;
- browser canvas-capture utilities;
- `wl-cinematic-active` shell state contract;
- flagship visual acceptance tests.
