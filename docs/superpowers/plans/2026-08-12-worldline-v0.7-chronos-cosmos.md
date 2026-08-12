# Worldline v0.7 Chronos + Cosmos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small deterministic playable Chronos worldline experience and expand Cosmos into a richer multi-world catalog without weakening Worldline's evidence boundaries.

**Architecture:** Keep gameplay state separate from canonical simulation state. Implement a pure 2D Chronos recording/replay kernel, then project it through a lightweight React/SVG arena. Expand `WorldRecord`/`PlanetaryState` with optional physical/rendering metadata and add Moon, Venus, Titan, plus explicit exoworld-family variants.

**Tech Stack:** React 19, TypeScript 5.7, SVG/CSS, Vitest, existing Worldline state/export/runtime.

## Global Constraints
- Chronos abilities are explicitly fictional gameplay mechanics inspired by spacetime/worldline concepts.
- Echo replays exact stored samples; it is not an AI companion.
- Gameplay state must not mutate canonical Worldline branch state.
- Reset is deterministic.
- Observed celestial identity must remain separate from generated/reconstructed visual surface state.
- No Unreal dependency in v0.7.

---

### Task 1: Chronos gameplay kernel

**Files:**
- Create: `src/worldline/chronosGameplay.ts`
- Create: `src/worldline/__tests__/chronosGameplay.test.ts`

**Interfaces:**
- `ChronosPoint { x, y, t }`
- `ChronosAnchor { id, sampleIndex }`
- `ChronosEcho { id, samples }`
- `ChronosGameplayState { position, samples, anchor, echo, convergenceCount }`
- `createChronosGameplayState()`
- `moveChronos(state, dx, dy)`
- `anchorChronos(state)`
- `createChronosEcho(state)`
- `echoPointAt(echo, index)`
- `detectChronosConvergence(current, echoPoint, threshold)`
- `resetChronos()`

TDD cases: immutable movement, anchor boundary, exact echo sample replay, deterministic convergence, deterministic reset.

### Task 2: Browser Chronos arena

**Files:**
- Create: `src/components/worldline/ChronosArena.tsx`
- Create: `src/components/worldline/worldline-v07.css`
- Modify: `src/components/worldline/WorldlineShell.tsx`

Behavior:
- Secondary `CHRONOS` control opens the arena without changing the six canonical primary surfaces.
- Arrow/WASD buttons or keyboard move a player node in a bounded 2D arena and record samples.
- Anchor captures the start of the future Echo segment.
- Create Echo replays the exact post-anchor path as a luminous duplicate.
- Current path + Echo use distinct solid/translucent rendering.
- Convergence pulse appears when deterministic threshold is met.
- Reset returns the fixed initial state.
- Persistent copy: “Fictional gameplay mechanic inspired by worldline/spacetime concepts.”

### Task 3: Cosmos contract and catalog

**Files:**
- Modify: `src/worldline/types.ts`
- Modify: `src/worldline/fixtures.ts`
- Modify: `src/components/worldline/PlanetaryStatePanel.tsx`
- Test: `src/worldline/__tests__/cosmos.test.ts`

Add optional planetary fields:
- `massEarths`
- `terrainSourceStatus`
- `surfaceRenderingClass`
- `referenceFrame` remains supported

Catalog target:
- WorldGen Prime
- New Bedford / Earth
- Moon
- Mars
- Venus
- Europa
- Titan
- three explicit speculative exoworld variants sharing one family id

Tests prove observed bodies may use generated surfaces without becoming GENERATED identities, and exoworld variants remain SPECULATIVE.

### Task 4: Chronos interchange update

**Files:**
- Modify: `src/worldline/chronos.ts`
- Modify: `src/worldline/__tests__/chronos.test.ts`

- Bump interchange schema to `worldline-chronos-v0.7`.
- Include surface-rendering class and optional planetary reference fields.
- Preserve deterministic provider-independent serialization.

### Task 5: v0.7 release gate

**Files:**
- Create: `docs/WORLDLINE_V0.7.md`
- Modify: `README.md`

Acceptance:
1. Chronos movement/anchor/echo/convergence/reset is deterministic.
2. Echo replay equals recorded samples exactly.
3. Chronos UI is explicitly fictionalized and does not mutate canonical simulation state.
4. Catalog contains Earth/New Bedford, Moon, Mars, Venus, Europa, Titan, generated world, and three exoworld variants.
5. Celestial identity and rendered-surface class remain separate.
6. Chronos export is deterministic and schema-versioned.
7. Exact-head CI, main CI, and Pages deploy pass.