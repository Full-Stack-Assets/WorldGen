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
| Clean entry transition | `src/components/worldline/forgeStateTransitions.ts` | Resets stale concept state before a new parcel-selection workflow |
| Variant geometry generator | `src/components/worldline/forgeGeometry.ts` | Bounded conceptual GeoJSON with continuous transformation |
| MapLibre scene adapter | `src/components/worldline/forgeMapLayers.ts` | Six idempotent visual layers over the canonical map |
| Spatial control system | `src/components/worldline/ForgeControls.tsx` | Select, describe, compare, ghost, scrub, direct, and export |
| FORGE visual tokens | `src/components/worldline/forge.css` | Prompt capsule, direction ribbon, scrubber, mobile sheet, disclosure badge |
| FORGE controller | `src/components/worldline/useForgeControllerV5.ts` | Visual workflow state, clean re-entry, scene application, Director reveal, lifecycle coordination |
| Export contract | `src/components/worldline/forgeExports.ts` | PNG still and reusable conceptual scene package |
| Visual Director agent | Outside Agent `a0049df1-81e7-46f7-93cb-6a00797e9eb4` | Structured three-direction visual briefs |
| Spatial UI design file | Figma `D1Eu0jOYEqfKw8ch8XhJlO` | Editable release frames and interface tokens |
| Independent preview | AppDeploy `worldgen-flagship-preview-t5q7or` | Live visual proof and browser-level workflow QA |

## Invariants

1. Retrieve and compare before generating a new asset.
2. Every FORGE geometry feature carries `classification: 'VISUAL_CONCEPT'`.
3. Concepts never become observed, approved, constructed, measured, predicted, or factual conditions.
4. The existing globe, camera system, New Bedford data, and visual primitives remain the baseline.
5. New variants reuse common geometry functions, layer IDs, interaction components, and export contracts.
6. New outputs must be registered before another implementation recreates them.
7. Similarity is not deletion authority. Alternatives and forks retain their provenance until reviewed.
8. Re-entering FORGE resets stale generated geometry before parcel selection begins.

## Similarity and duplicate policy

Before adding a globe control, direction ribbon, scene layer, camera path, export function, prompt preset, or generated waterfront asset, compare it against the registered paths above.

Decision order:

1. `REUSE_EXISTING`
2. `EXTEND_EXISTING`
3. `MERGE_WITH_EXISTING`
4. `FORK_EXISTING`
5. `REFACTOR_EXISTING`
6. `CREATE_NEW` only with a written incompatibility reason

The superseded `useForgeController.ts` implementation was removed after `useForgeControllerV5.ts` became canonical. No duplicate controller remains on the final branch.

## Verification evidence

### Canonical repository

- Domain model and clean re-entry: `src/components/worldline/__tests__/forgeModel.test.ts`
- Geometry: `src/components/worldline/__tests__/forgeGeometry.test.ts`
- Map layers and close-state visibility: `src/components/worldline/__tests__/forgeMapLayers.test.ts`
- Spatial controls: `src/components/worldline/__tests__/ForgeControls.test.tsx`
- Exports: `src/components/worldline/__tests__/forgeExports.test.ts`
- Canonical composition: `src/components/worldline/__tests__/OpenEarthView.test.tsx`
- Final release branch: `feat/worldgen-forge-v5-final`
- Final verified commit before this ledger update: `7ced2a2025e527eccf3cdb27d200271e6967251f`
- Final verification workflow: `31753461090`
- Result: provider guard, backend boundary, type-check, full test suite, and production build all passed

### Independent visual preview

- Live preview: `https://worldgen-flagship-preview-t5q7or.v2.appdeploy.ai/`
- QA group: `04760b9165f51b8c`
- Passed browser workflows: material variant switching, clean close/reopen, and scene-package download with the stable filename and visible success state
- The long Director workflow was skipped by the external QA worker after its 300-second execution ceiling before producing a trace; it was not recorded as a runtime failure. The canonical Director path remains covered by deterministic source tests and the final production build.

### Figma

- File: `WorldGen Spatial UI System v5.0`
- Key: `D1Eu0jOYEqfKw8ch8XhJlO`
- Contents: seven desktop release states, one 375×667 mobile state, and eight reusable components/tokens

### Outside Agent

- Agent: `WorldGen Visual Director`
- ID: `a0049df1-81e7-46f7-93cb-6a00797e9eb4`
- Configured with the three-variant, reuse-first, fixed-structure, visual-only, and concept-disclosure contracts
- Live adversarial drive produced one response containing exactly three structured directions and explicit reuse decisions
- Publication remains blocked by the connected creator wallet’s zero-credit state; the agent is configured and verified but not represented as publicly published

## Version

- Product: `WorldGen FORGE`
- Release: `5.0.0`
- Vertical slice: `New Bedford Waterfront Mutation Lab`
- Classification: `VISUAL_CONCEPT`
