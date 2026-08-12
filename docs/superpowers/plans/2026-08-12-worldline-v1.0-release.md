# Worldline v1.0 Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the deployed v0.7 system into the first cohesive Worldline 1.0 product by adding a readable Future Landscape, a fast cinematic first-contact sequence, explicit release/version state, and accessibility/reduced-motion hardening.

**Architecture:** Preserve every existing v0.7 subsystem. Add three small pure modules: `futureLandscape.ts` for deterministic branch projection, `release.ts` for semantic release identity, and `firstContact.ts` for first-load/reduced-motion policy. Add thin React projections for those modules and finish with release docs, zero-credential verification, production deploy, and a GitHub v1.0.0 release/tag.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, SVG/CSS, Vitest, existing Three.js/R3F/Open Earth/Discovery/Chronos/Cosmos stack.

## Global Constraints
- Version is exactly `1.0.0`.
- Release codename is `Worldline One`.
- No paid credential or backend becomes mandatory.
- Procedural mode must remain functional without network access.
- Future Landscape is a deterministic projection of branch metrics, never a calibrated probability map.
- First Contact is immediately skippable and bypassed under reduced motion.
- First Contact must not block the underlying world generator or canonical state construction.
- Existing v0.1 through v0.7 tests remain green.
- v1.0 release/tag is created only after the exact merge commit passes `main` CI and GitHub Pages deployment.

---

### Task 1: Deterministic Future Landscape

**Files:**
- Create: `src/worldline/futureLandscape.ts`
- Create: `src/worldline/__tests__/futureLandscape.test.ts`
- Create: `src/components/worldline/FutureLandscape.tsx`
- Modify: `src/components/worldline/FutureNavigator.tsx`
- Create/Modify: `src/components/worldline/worldline-v10.css`

**Interfaces:**
- `FutureLandscapePoint { branchId, x, y, divergence, familyId }`.
- `projectFutureLandscape(branches)` returns deterministic normalized coordinates in `[0,100]`.
- Coordinates derive only from committed branch snapshot metric vectors sorted by metric key.
- Divergence is normalized distance from root/baseline vector.
- No random numbers.

**TDD:**
- Same branches project identically across repeated calls.
- Input order does not change projection.
- Root/baseline has zero divergence.
- Diverged branch has positive divergence.
- Output coordinates remain bounded.

**UI:**
- Render SVG landscape when `selectFutureRepresentation` returns `FAMILIES`, `LANDSCAPE`, or `CONTINENTS`.
- Preserve existing branch list and exact selection.
- Each landscape point selects the exact branch ID.
- Copy says `Scenario geometry · not probability`.

### Task 2: First Contact policy and cinematic

**Files:**
- Create: `src/worldline/firstContact.ts`
- Create: `src/worldline/__tests__/firstContact.test.ts`
- Create: `src/components/worldline/FirstContact.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/worldline/worldline-v10.css`

**Interfaces:**
- `FIRST_CONTACT_DURATION_MS = 1400`.
- `shouldShowFirstContact({ reducedMotion, seen })`.
- `FIRST_CONTACT_STORAGE_KEY = 'worldline.first-contact.v1'`.

**TDD:**
- reduced motion always bypasses cinematic.
- prior seen state bypasses cinematic.
- fresh normal-motion session displays it.
- duration remains <= 1500ms.

**UI:**
- Overlay is presentation-only; App/world generator constructs immediately beneath it.
- Start with black/deep background, one luminous point/line, then several faint trajectories, then resolve to `WORLDLINE / WORLDLINE ONE`.
- `Skip` visible from frame one.
- Auto-dismiss after 1400ms and persist seen flag.
- Do not persist seen flag when reduced-motion bypass happens solely because of system preference.
- Include a replay control under Mechanics or World tools so the sequence is not permanently inaccessible.

### Task 3: Release manifest and visible status

**Files:**
- Create: `src/worldline/release.ts`
- Create: `src/worldline/__tests__/release.test.ts`
- Create: `src/components/worldline/ReleaseStatus.tsx`
- Modify: `src/components/worldline/MechanicsPanel.tsx`

**Interfaces:**
- `WORLDLINE_RELEASE` immutable object:
  - version `1.0.0`
  - codename `Worldline One`
  - worldStateSchema `worldline-state-v1`
  - researchLedgerSchema `worldline-research-ledger-v0.5`
  - chronosSchema `worldline-chronos-v0.7`
  - providerClasses `procedural-worldgen`, `open-earth-maplibre`, `local-new-bedford`
  - evidenceBoundary short string.
- `getBuildCommit()` reads optional `VITE_GIT_SHA` and returns `development` when absent.

**TDD:**
- version/codename exact.
- provider classes contain no paid-required provider.
- evidence-boundary text rejects forecast/oracle framing.
- absent build SHA has deterministic fallback.

### Task 4: Accessibility and reduced-motion hardening

**Files:**
- Modify: `src/components/worldline/worldline.css`
- Modify: `src/components/worldline/worldline-v02.css`
- Modify: `src/components/worldline/worldline-v05.css`
- Modify: `src/components/worldline/worldline-v07.css`
- Modify: `src/components/worldline/worldline-v10.css`
- Modify selected controls/components only when semantics are missing.

**Acceptance:**
- Visible `:focus-visible` treatment for Worldline buttons/inputs/selects.
- `prefers-reduced-motion` removes non-essential transitions/animations and First Contact is bypassed by policy.
- Mobile text/controls remain readable at 375px width.
- Epistemic/candidate statuses use text labels in addition to color.
- Chronos SVG has accessible role/label and all gameplay functions have buttons/keyboard equivalents.

### Task 5: Zero-credential release smoke contract

**Files:**
- Create: `src/worldline/__tests__/releaseSmoke.test.ts`
- Modify: `docs/WORLDLINE_RUNTIME.md`

**Tests:**
- initial state is `worldgen-prime` and GENERATED/FIELD.
- provider registry resolves procedural fallback when network unavailable.
- release manifest has no required paid provider.
- branch replay remains deterministic.
- research ledger empty-state works without storage/backend.
- Chronos gameplay initializes without provider state.

### Task 6: v1.0 docs and final production gate

**Files:**
- Create: `docs/WORLDLINE_V1.0.md`
- Modify: `README.md`

**Release gate:**
1. Exact feature head: type-check, full Vitest suite, production build.
2. Review PR metadata/diff and merge only exact green head.
3. Verify merged commit `main` CI.
4. Verify GitHub Pages build + deploy for exact merge commit.
5. HTTP-fetch the public production page if the environment permits; if it does not, record that limitation rather than inventing a smoke result.
6. Create GitHub release/tag `v1.0.0` pointing at the exact deployed merge commit.
7. Verify release/tag target.

## v1.0 acceptance
1. The product remains fully usable in procedural mode with no paid credentials.
2. First Contact creates visual identity without blocking control for more than 1.4 seconds and respects reduced motion.
3. Future Landscape makes multi-branch divergence readable while preserving exact branch ancestry and avoiding probability claims.
4. Earth Native source/provenance/twin-time semantics remain intact.
5. Discovery Engine ledger, Model Worldline, frozen evaluator, independent verifier, Reality Wake, and reopen semantics remain intact.
6. Chronos Anchor/Echo/Convergence remains deterministic and explicitly fictionalized.
7. Cosmos identity vs rendered-surface evidence semantics remain intact.
8. Release status visibly identifies `Worldline 1.0.0 · Worldline One` and schema boundaries.
9. Full CI and production deploy pass for the exact release commit.
10. GitHub tag/release `v1.0.0` points to that deployed commit.