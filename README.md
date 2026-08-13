# WorldGen FORGE 5.0

**Shape possible worlds directly inside the world.**

WorldGen FORGE is a visual-first spatial creation environment. It begins with a continuous cinematic journey from space to New Bedford, then lets the user select the waterfront, describe a visual transformation, compare three materially different directions, ghost-preview the proposal over the existing scene, scrub between present and transformed states, direct a reveal, and export the result.

The world is the interface. Buildings are selectable objects. Parcels are canvases. Camera movement is navigation. Lighting, materials, geometry, atmosphere, and environmental motion are editable visual parameters rather than dashboard rows.

## WorldGen FORGE workflow

1. **Play the flagship flight**  
   Travel continuously through Space → Earth → North America → Massachusetts → New Bedford → Waterfront District → Street → Parcel → Building → Close Exterior → Transformed Future View.

2. **Enter FORGE**  
   Pause the cinematic surface without creating a second globe or replacing the current renderer.

3. **Select the waterfront parcel**  
   The New Bedford study area is isolated with a restrained spatial halo.

4. **Describe a visual transformation**  
   Start from the built-in blue-hour waterfront brief or write a new direction.

5. **Compare three directions**  
   - **Harbor Commons**: preserved brick, timber terraces, gardens, and civic harbor rooms.
   - **Tidal Works**: steel, ferry infrastructure, fabrication character, and cyan maritime light.
   - **Lumen Quay**: elevated gardens, crystalline bridges, autonomous ferries, and bioluminescent atmosphere.

6. **Ghost-preview and scrub reality**  
   Keep the current city visible while proposed geometry materializes, then drag continuously from the present condition to the full visual concept.

7. **Direct and export**  
   Run the chosen five-shot Director path, export the current frame as PNG, export a reusable `.scene.json` package, or use the flagship WebM capture.

## Product principles

### Visual quality first

WorldGen prioritizes atmosphere, spatial continuity, material coherence, environmental movement, cinematic camera behavior, and a dramatically simpler interface. New causal architecture, causal graphs, generalized simulation infrastructure, elaborate economic models, and unrelated backend abstractions are outside the FORGE 5.0 release.

### One Earth surface

FORGE extends the existing `OpenEarthView` and shares its MapLibre instance, coordinate system, depth ordering, camera, provider fallback, and New Bedford geometry. It does not mount a second map, create a replacement application, or require a paid geospatial provider for the mandatory path.

### Retrieve before generating

BuildGraph-style preflight is compulsory. Existing globe code, scene geometry, materials, camera stages, visual effects, UI primitives, prompts, export paths, and tests are reused or extended before new assets are created.

### Honest concept boundaries

Every FORGE geometry feature is classified as `VISUAL_CONCEPT`. A generated direction is not presented as approved, constructed, measured, predicted, observed, or factual. Exported scene packages carry the same disclosure.

## Architecture

```text
WorldGen FORGE
├── OpenEarthView              one canonical Earth surface
├── FlagshipSequence          cinematic Space-to-New-Bedford journey
├── ForgeModel                variants, prompts, camera paths, scene schema
├── ForgeGeometry             bounded conceptual GeoJSON
├── ForgeMapLayers            shared MapLibre visual-layer adapter
├── ForgeControls             spatial selection and editing grammar
├── useForgeController        workflow, Director mode, lifecycle, exports
├── forgeExports              PNG and reusable scene package
└── BuildGraph record         provenance and no-repeat-work enforcement
```

## Free-first visual stack

- React 19 and TypeScript
- MapLibre GL JS globe projection
- OpenFreeMap / OpenStreetMap-derived geography
- EOX Sentinel-2 cloudless imagery where available
- Existing Three.js procedural fallback
- CSS atmosphere, glass controls, grain, vignette, and mobile spatial UI
- Browser-native PNG and WebM capture

External imagery is best-effort. Provider failure changes presentation only and must not corrupt the current project or concept state.

## Source layout

```text
src/components/worldline/
├── OpenEarthView.tsx
├── flagshipSequence.ts
├── ForgeControls.tsx
├── forge.css
├── forgeModel.ts
├── forgeGeometry.ts
├── forgeMapLayers.ts
├── useForgeController.ts
├── forgeExports.ts
└── __tests__/
    ├── flagshipSequence.test.ts
    ├── ForgeControls.test.tsx
    ├── forgeModel.test.ts
    ├── forgeGeometry.test.ts
    ├── forgeMapLayers.test.ts
    ├── forgeExports.test.ts
    └── OpenEarthView.test.tsx
```

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

For the production-style Node service:

```bash
npm run build
npm start
```

## Verification

```bash
npm run typecheck
npm test
npm run build
```

The pull-request gate runs the same type-check, full-test, and production-build sequence.

## BuildGraph

The release reuse ledger is stored at [`docs/buildgraph/worldgen-forge-v5.md`](docs/buildgraph/worldgen-forge-v5.md). The governing decision is `EXTEND_EXISTING`.

Before adding a globe control, transformation variant, scene layer, camera path, prompt preset, export utility, or New Bedford asset, compare it against the registered v5 outputs. Default to `REUSE_EXISTING` or `EXTEND_EXISTING`. `CREATE_NEW` requires a written incompatibility reason.

## Existing Worldline capabilities

The repository still contains the broader Worldline environment, including procedural worlds, time navigation, scenario branches, comparison surfaces, evidence labels, persistent projects, research history, Chronos, and planetary worlds. FORGE does not delete those capabilities. It changes the product’s primary emphasis to cinematic world exploration and direct spatial authorship.

## Evidence boundary

WorldGen FORGE is not a municipal approval system, a calibrated forecast, or a claim about what will be constructed. Visual quality may never outrun the classification and provenance attached to the active scene.

## License

MIT
