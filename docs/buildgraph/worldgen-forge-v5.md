# BuildGraph Registration: WorldGen FORGE v5.0

## Decision

**`EXTEND_EXISTING`**

WorldGen FORGE extends the canonical `Full-Stack-Assets/WorldGen` product and the existing New Bedford flagship sequence. It does not introduce a replacement application, second globe, second MapLibre instance, or alternate product identity.

## Parent assets reused

| Parent asset | Decision | FORGE use |
|---|---|---|
| `OpenEarthView.tsx` | EXTEND | Canonical visual surface and React composition boundary |
| `createFlagshipMap.ts` | EXTEND | Single MapLibre instance and visual-layer lifecycle |
| `flagshipSequence.ts` | REUSE | Space-to-New-Bedford journey and parcel camera target |
| `useFlagshipFlight.ts` | REUSE | Play, pause, stage navigation, Explore, and WebM behavior |
| `flagship-sequence.css` | REUSE | Atmosphere, cinematic typography, and spatial overlay grammar |
| `flagshipConceptLayers.ts` | REUSE | Existing concept-layer and MapLibre adapter pattern |
| `maplibreRuntime.ts` | EXTEND | Shared camera, canvas, feature-query, and paint boundary |
| `cinematicCapture.ts` | REUSE | Browser-native cinematic capture |
| New Bedford geometry package | REUSE | Geographic context and waterfront identity |

## Registered reusable outputs

| Output | Path | Purpose |
|---|---|---|
| FORGE domain contract | `src/components/worldline/forgeModel.ts` | Modes, variants, prompts, director paths, scene-package schema |
| Variant geometry generator | `src/components/worldline/forgeGeometry.ts` | Bounded conceptual GeoJSON with continuous transformation |
| MapLibre scene adapter | `src/components/worldline/forgeMapLayers.ts` | Six idempotent visual layers over the canonical map |
| Spatial control system | `src/components/worldline/ForgeControls.tsx` | Select, describe, compare, ghost, scrub, direct, and export |
| FORGE visual tokens | `src/components/worldline/forge.css` | Prompt capsule, direction ribbon, scrubber, mobile sheet, disclosure badge |
| FORGE controller | `src/components/worldline/useForgeController.ts` | Visual workflow state, scene application, Director reveal, lifecycle coordination |
| Export contract | `src/components/worldline/forgeExports.ts` | PNG still and reusable conceptual scene package |
| Visual Director agent | Outside Agent `a0049df1-81e7-46f7-93cb-6a00797e9eb4` | Structured three-direction visual briefs |
| Spatial UI design file | Figma `D1Eu0jOYEqfKw8ch8XhJlO` | Editable release frames and interface tokens |

## Invariants

1. Retrieve and compare before generating a new asset.
2. Every FORGE geometry feature carries `classification: 'VISUAL_CONCEPT'`.
3. Concepts never become observed, approved, constructed, measured, predicted, or factual conditions.
4. The existing globe, camera system, New Bedford data, and visual primitives remain the baseline.
5. New variants reuse common geometry functions, layer IDs, interaction components, and export contracts.
6. New outputs must be registered before another implementation recreates them.
7. Similarity is not deletion authority. Alternatives and forks retain their provenance until reviewed.

## Similarity and duplicate policy

Before adding a globe control, direction ribbon, scene layer, camera path, export function, prompt preset, or generated waterfront asset, compare it against the registered paths above.

Decision order:

1. `REUSE_EXISTING`
2. `EXTEND_EXISTING`
3. `MERGE_WITH_EXISTING`
4. `FORK_EXISTING`
5. `REFACTOR_EXISTING`
6. `CREATE_NEW` only with a written incompatibility reason

## Verification evidence

- Domain model: `src/components/worldline/__tests__/forgeModel.test.ts`
- Geometry: `src/components/worldline/__tests__/forgeGeometry.test.ts`
- Map layers: `src/components/worldline/__tests__/forgeMapLayers.test.ts`
- Spatial controls: `src/components/worldline/__tests__/ForgeControls.test.tsx`
- Exports: `src/components/worldline/__tests__/forgeExports.test.ts`
- Canonical composition: `src/components/worldline/__tests__/OpenEarthView.test.tsx`
- Task-level green CI: workflow run `31748778125`
- Integrated v5 green CI: workflow run `31749353973`
- Release review surface: PR `#23`, branch `feat/worldgen-forge-v5-continuation`

## Version

- Product: `WorldGen FORGE`
- Release: `5.0.0`
- Vertical slice: `New Bedford Waterfront Mutation Lab`
- Classification: `VISUAL_CONCEPT`
