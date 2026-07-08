# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

WorldGen is a client-only React + TypeScript + Vite app that generates procedural 3D fantasy worlds from a seed and renders them with Three.js (via React Three Fiber). There is no backend; optional AI lore comes straight from the browser via the Gemini API.

## Commands

```bash
npm install
npm run dev            # Vite dev server on http://localhost:5173
npm run build          # tsc (type-check, noEmit) then vite build → dist/
npm run preview        # serve the production build on port 4173
npm run typecheck      # tsc --noEmit only
npm test               # Vitest (run mode) over src/**/*.test.ts
npm run test:watch     # Vitest watch mode
npm run test:coverage  # Vitest with v8 coverage
npm test -- worldgen   # run a single suite by filename substring
```

Tests use **Vitest** (jsdom env) and live next to the code they cover as `src/**/*.test.ts`; they target the pure `src/lib` core and are excluded from the production `tsc` build (`tsconfig.json` `exclude`). No linter is configured. Verification gates: `npm run typecheck`, `npm test`, and `npm run build` (strict `tsc` with `noUnusedLocals`/`noUnusedParameters`, so unused code fails).

## Deployment

CI (`.github/workflows/ci.yml`) runs type-check + tests + build on every PR and push to `main`. Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml` (which also runs `npm test` before building). The site is served from a subpath, so the deploy builds with `VITE_BASE=/WorldGen/`; `vite.config.ts` reads that env var (default `/`). Any code that constructs URLs must respect `import.meta.env.BASE_URL` (see `src/lib/share.ts`).

## Architecture

Data flows one way: **config → pure generation → WorldData → rendering/UI**.

1. **State hub — `src/hooks/useWorldGenerator.ts`**: the single owner of app state (config, world, selected region, lore). Every config change calls `generateWorldAsync` and applies the result guarded by a monotonic request token (only the latest regenerate wins). On mount it derives the initial seed/config from URL params and picks grid size by viewport (128 mobile / 192 desktop, overriding `DEFAULT_CONFIG`'s 256).

2. **Generation core — `src/lib/worldgen.ts` + `src/lib/noise.ts`**: `generateWorld(config)` is pure and fully deterministic per seed. Pipeline: fBm Perlin noise for elevation/moisture/temperature (moisture and temperature use seed offsets +1000/+2000) → latitude-adjusted temperature → `determineBiome` thresholds → `carveRivers` (downhill walk from high sources) → `carveLakes` → `placeSettlements` (suitability scoring, min-distance spacing). Output is `WorldData` with a row-major `cells[y][x]` grid. Keep this module free of React/Three imports. Generation runs off the main thread via `src/lib/worldgen.worker.ts`, fronted by `src/lib/worldGenService.ts` (`generateWorldAsync`), which transparently falls back to synchronous generation if Web Workers are unavailable or error — determinism is identical either way.

3. **Types — `src/types/world.ts`**: all shared domain types (`WorldConfig`, `WorldData`, `WorldCell`, `Biome`, `Settlement`, `WorldLore`, …). The 15 `Biome` values are keyed throughout `src/lib/colors.ts` (colors + labels) and `src/lib/biomeCodex.ts`; adding a biome means updating all of those plus `determineBiome`.

4. **3D rendering — `src/components/three/`**: `WorldScene3D` sets up the Canvas, sky/clouds/stars, lighting, orbit camera, and postprocessing (bloom, vignette, chromatic aberration). `src/lib/terrainMesh.ts` converts the cell grid into a single vertex-colored `PlaneGeometry` (elevation displaced by `HEIGHT_SCALE`, underwater vertices darkened) and provides `worldPointToGrid` for click-picking — the inverse mapping used when a raycast hit selects a region. **Keep the scene self-contained — no runtime fetches of external assets.** drei's `<Cloud>` was replaced by `ProceduralClouds` (a runtime-generated canvas texture) precisely because `<Cloud>` fetches a texture from a CDN and throws (crashing the whole Canvas) when offline or the host is blocked.

5. **AI lore — `src/lib/gemini.ts` + `src/lib/apiKey.ts`**: calls `gemini-2.0-flash`, prompting for JSON. The API key comes from localStorage (set via the in-app AI Lore panel) or `VITE_GEMINI_API_KEY`. Every AI function catches all errors and returns deterministic fallback content — lore generation must never throw or leave the UI stuck loading.

6. **HUD/UI — `src/components/*.tsx` + `src/styles/index.css`**: 2D panels overlaid on the fullscreen canvas (`App.tsx` composes them). Styling is a single plain-CSS file with glass-morphism panel classes; no CSS framework. The 3D scene is wrapped in `ErrorBoundary` (`src/components/ErrorBoundary.tsx`) so a WebGL/render throw shows a recoverable panel instead of a blank screen while the HUD stays usable; a second boundary wraps the whole app in `main.tsx`.

7. **Monetization — `src/lib/monetization.ts`, `src/lib/pro.ts`, `src/lib/affiliates.ts`**: every channel (donations, AdSense, Pro tier, affiliates) is gated behind `VITE_*` env vars read at build time. With nothing configured, no monetization UI renders and no third-party scripts load — keep it that way when adding channels. **Pro** (`pro.ts` + `useProStatus`) is a license-gated tier verified client-side against Gumroad's license API, persisted in localStorage, broadcast via a `worldgen-pro-change` event / `useSyncExternalStore`. Pro gates are strictly additive (ad-free, High/Ultra grid sizes, heightmap/biome-map PNG exports) — never degrade the free tier to upsell.

## Conventions

- **Seeds are the contract.** Worlds must be reproducible: same seed + config → identical world. Seeds display as base36 strings (`seedToString`/`parseSeed` round-trip); share URLs encode `seed`, `scale`, `sea`, `oct` (`src/lib/share.ts`). Don't use `Math.random()` inside generation — use `createRng(seed + offset)` from `src/lib/noise.ts`.
- Derived seed offsets are load-bearing (+1000 moisture, +2000 temperature, +5000 lakes, +9000 settlements); changing them changes every existing shared world.
- Grid coordinates are `cells[y][x]` (row-major) everywhere.
