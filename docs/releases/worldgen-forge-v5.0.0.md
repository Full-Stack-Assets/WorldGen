# WorldGen FORGE 5.0.0 Release Notes

**Release date:** 2026-08-13  
**Vertical slice:** New Bedford Waterfront Mutation Lab  
**BuildGraph decision:** `EXTEND_EXISTING`

## Release statement

WorldGen 5.0 turns the existing cinematic Earth surface into an editable visual environment. A user can descend from space to New Bedford, enter FORGE, select the waterfront, describe a transformation, compare three spatial directions, ghost-preview the chosen concept, scrub between present and transformed states, run a five-shot Director reveal, and export the result.

The release is visual-first. It does not add a new causal architecture, causal graph, generalized simulation framework, economic model, or unrelated backend abstraction.

## New visual workflow

```text
Flagship flight
→ Enter FORGE
→ Select waterfront parcel
→ Describe visual direction
→ Compare three variants
→ Ghost-preview concept
→ Scrub present ↔ transformed
→ Director reveal
→ Export still / scene / WebM
```

## Included directions

### Harbor Commons

A low-rise civic harbor direction built around preserved brick, timber terraces, gardens, and public waterfront rooms.

### Tidal Works

A maritime-industrial direction built around steel structures, ferry infrastructure, working piers, and cyan navigation light.

### Lumen Quay

A luminous blue-hour direction built around elevated gardens, crystalline bridges, autonomous ferries, and bioluminescent public space.

## New components

- `forgeModel.ts`: domain and variant contract
- `forgeGeometry.ts`: continuous conceptual geometry
- `forgeMapLayers.ts`: shared MapLibre scene adapter
- `ForgeControls.tsx`: spatial editing controls
- `forge.css`: responsive visual system
- `useForgeController.ts`: workflow and Director orchestration
- `forgeExports.ts`: PNG and scene-package export

## Preserved capabilities

- The original eleven-stage flagship journey
- Play, Pause, Replay, Explore, and stage navigation
- Globe and Mercator provider fallback
- One canonical MapLibre instance
- Existing New Bedford geometry and satellite layers
- Procedural environmental life
- Mobile and reduced-motion behavior
- Browser-native WebM capture
- Broader Worldline project surfaces outside the cinematic layer

## Visual and evidence boundary

Every new geometric feature is classified as `VISUAL_CONCEPT`. FORGE directions are generated design studies. They are not represented as approved developments, constructed conditions, measurements, forecasts, observations, or facts.

## External release artifacts

- Editable Figma system: `WorldGen Spatial UI System v5.0`
- Outside Agent: `WorldGen Visual Director`
- Independent visual preview: built and tested separately from the canonical repository before release promotion

## Verification

The release gate requires:

```bash
npm run typecheck
npm test
npm run build
```

Required visual checks include:

- only one Earth map container;
- visible `Enter FORGE` control;
- all three variants available;
- continuous transformation at 0%, 68%, and 100%;
- concept labels in every active mode;
- Director reveal uses five ordered shots;
- PNG and scene-package filenames remain stable;
- mobile controls use at least 40px touch targets;
- reduced-motion removes nonessential animation;
- no new causality or unrelated backend code enters the release.

## Known platform boundary

The repository’s GitHub Pages configuration may remain controlled by its legacy publishing-source setting until a repository administrator changes that setting. This does not change the canonical source, test evidence, or independent release preview, but it can prevent the custom Pages domain from displaying the latest artifact.
