# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Worldline Studio** is the product; **WorldGen** is the canonical rendering/runtime repository that hosts it. The app is primarily a client React + TypeScript + Vite experience that navigates evidence-aware worlds through time, branching futures, and Studio projects. Procedural fantasy worlds are generated from a seed and rendered with Three.js (React Three Fiber). Optional AI lore uses the Gemini API from the browser. An optional Node service (`server.mjs`) fronts Studio persistence via a Supabase RPC gateway for production (nowfable.com).

Human-facing grammar: **3D space + navigable time**. Epistemic classes (`OBSERVED`, `RECONSTRUCTED`, `SIMULATED`, `GENERATED`, `SPECULATIVE`) stay explicit — generated/simulated state must never masquerade as observed reality.

## Commands

```bash
npm install
npm run dev            # Vite dev server on http://localhost:5173
npm run build          # tsc (type-check, noEmit) then vite build → dist/
npm run preview        # serve the production build on port 4173
npm start              # Node dist server + Studio /api gateway (after build)
npm run typecheck      # tsc --noEmit only
npm test               # Vitest (run mode) over src/**/*.test.ts
npm run test:watch     # Vitest watch mode
npm run test:coverage  # Vitest with v8 coverage
npm test -- worldgen   # run a single suite by filename substring
```

Tests use **Vitest** (jsdom env) and live next to the code they cover as `src/**/*.test.ts`; they target the pure `src/lib` / `src/worldline` core and are excluded from the production `tsc` build (`tsconfig.json` `exclude`). No linter is configured. Verification gates: `npm run typecheck`, `npm test`, and `npm run build` (strict `tsc` with `noUnusedLocals`/`noUnusedParameters`, so unused code fails).

## Deployment

CI (`.github/workflows/ci.yml`) runs type-check + tests + build on every PR and push to `main`. Canonical production is the Node service at nowfable.com; GitHub Pages remains a static fallback. Pages builds use `VITE_BASE=/WorldGen/`; `vite.config.ts` reads that env var (default `/`). Any code that constructs URLs must respect `import.meta.env.BASE_URL` (see `src/lib/share.ts`).

## Architecture

Data flows one way for procedural worlds: **config → pure generation → WorldData → rendering/UI**. Worldline state (`src/worldline/`) owns identity, branches, time, and epistemic class; renderers (WorldGen R3F, Open Earth MapLibre, FORGE) are projections and must not mutate canonical identity/branches.

1. **State hub — `src/hooks/useWorldGenerator.ts`**: owner of procedural config/world/selected region/lore. Config changes call `generateWorldAsync` guarded by a monotonic request token. Discrete changes regenerate via `updateConfig`; slider drags use `updateConfigLive` + debounce. Applied worlds push to `src/lib/history.ts`. Initial seed/config come from share URL params (full terrain/climate round-trip) with viewport grid size (128 mobile / 192 desktop).

2. **Generation core — `src/lib/worldgen.ts` + `src/lib/noise.ts`**: pure deterministic `generateWorld(config)`. Pipeline: fBm Perlin elevation/moisture/temperature (offsets +1000/+2000) → latitude temperature → biomes → rivers → lakes (+5000) → settlements (+9000). Worker via `worldGenService` / `worldgen.worker.ts` with sync fallback.

3. **Types — `src/types/world.ts`**: WorldGen domain types. Worldline domain types live in `src/worldline/types.ts`.

4. **3D rendering — `src/components/three/`**: R3F Canvas for Generated Worlds. Keep the scene self-contained — no CDN texture fetches. Open Earth uses MapLibre in `src/components/worldline/OpenEarthView.tsx` with procedural fallback.

5. **Worldline Studio — `src/components/worldline/` + `src/worldline/`**: Shell surfaces WORLD / TIME / FUTURES / COMPARE / DATA / LIBRARY, plus Truth Lens, Mechanics, Chronos, Studio projects, FORGE waterfront mutation on New Bedford, Discovery Engine / World Model Lab.

6. **AI lore — `src/lib/gemini.ts` + `src/lib/apiKey.ts`**: optional; always falls back deterministically. Never required for Earth / Studio / Chronos paths.

7. **HUD/UI — `App.tsx`**: composes `WorldlineShell` + scene + legacy WorldGen tools under WORLD + First Contact. Glass-morphism CSS in `src/styles/index.css` and `worldline*.css`. ErrorBoundaries wrap WebGL and the app root.

8. **Monetization — `src/lib/monetization.ts`, `src/lib/pro.ts`, `src/lib/affiliates.ts`**: all `VITE_*`-gated; unset env → no UI / no third-party scripts. Pro gates are additive only.

9. **PWA — `vite-plugin-pwa`**: Worldline-branded manifest; precache shell; update prompt via `PWAUpdatePrompt`.

## Conventions

- **Seeds are the contract.** Same seed + config → identical world. Share URLs encode the full config set in `src/lib/share.ts`. Don't use `Math.random()` inside generation — use `createRng(seed + offset)` from `src/lib/noise.ts`.
- Derived seed offsets are load-bearing (+1000 moisture, +2000 temperature, +5000 lakes, +9000 settlements).
- Grid coordinates are `cells[y][x]` (row-major) everywhere.
- Evidence boundary: visual/model capability claims may never outrun executed evidence on the active Worldline state.
