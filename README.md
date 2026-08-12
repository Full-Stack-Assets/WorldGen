# WorldGen / Worldline

**WorldGen is now the canonical visual runtime for the Worldline master application.**

Worldline wraps the procedural 3D engine in a provider-independent state, time, branching, Cosmos, comparison, and recursive-evaluation layer. The default experience is 3D space + navigable time with World, Time, Futures, Compare, Data, and Library surfaces plus an optional Mechanics inspector. The launch build remains credential-free; future Google/Cesium and benchmark integrations are adapters rather than hard dependencies.

The current release includes deterministic branch/replay contracts, Temporal Parallax markers, a Chronos-inspired worldline trail, scalable future representations, Earth/extraterrestrial world classes, explicit epistemic/fidelity labels, and a bounded B+ recursive loop whose deciding evaluation contract cannot be changed by the candidate it evaluates.

See [`docs/WORLDLINE_RUNTIME.md`](docs/WORLDLINE_RUNTIME.md) for the runtime and evidence contract.

**Procedural 3D worlds with cinematic quality — infinite stories.**

WorldGen transforms seeds into fully explorable 3D planets with terrain, oceans, settlements, rivers, lakes, and AI-powered lore. Built with Three.js for real-time rendering with sky, clouds, bloom, and atmospheric fog.

**Live site:** [https://full-stack-assets.github.io/WorldGen/](https://full-stack-assets.github.io/WorldGen/)

## Worldline surfaces

- **World** — procedural generation and spatial exploration.
- **Time** — Playback, Time Slice, Temporal Parallax, and Time Volume controls.
- **Futures** — branches that scale into Future Families, landscapes, and Future Continents.
- **Compare** — committed-snapshot Difference Lens.
- **Data** — world metrics plus Planetary State and multi-part Habitability Landscape.
- **Library** — Earth, New Bedford World #001, Mars, Europa, and generated exoworld families.
- **Mechanics** — epistemic status, model fidelity, lineage, branch ancestry, and the constitutional recursive loop.

Generated and simulated states are not presented as calibrated predictions. Observed, reconstructed, simulated, generated, and speculative content remain explicitly labeled.

## Features

### 3D Engine
- Real-time 3D terrain mesh with vertex-colored biomes and elevation displacement
- Cinematic sky, volumetric clouds, stars, and atmospheric fog
- Reflective ocean plane with animated emissive water
- Bloom, vignette, and chromatic aberration post-processing
- Orbit camera with shadows and contact shadows
- Glowing settlement markers (capitals, cities, towns, villages)
- Animated selection rings on explored regions
- Worldline trail and Temporal Parallax overlay markers

### World Generation
- 8 world presets: Classic, Archipelago, Pangaea, Desert, Frozen, Volcanic, Eden, Alien
- 15 biomes including lakes and rivers
- Procedural settlements placed by suitability scoring
- Seed-based reproducible worlds with shareable URLs

### Worldline simulation layer
- Canonical world state with immutable branch creation and replay
- Explicit epistemic and model-fidelity labels
- Deterministic future-family representation thresholds
- Difference Lens across committed snapshots
- Worldline Cosmos catalog with provider fallback semantics
- B+ constitutional recursive evaluation demonstration with frozen deciding contracts

### AI & Lore
- Region exploration with names, descriptions, lore, and quest hooks
- World Chronicle: mythology, factions, historical eras
- Gemini API support with in-app key configuration
- Rich fallback content when offline

### UI
- Fullscreen 3D viewport with glass-morphism HUD overlays
- Atlas dashboard with biome distribution, settlement list, and a clickable 2D minimap
- Recent-worlds history to revisit past seeds
- Biome Codex encyclopedia
- Mobile-optimized panels

### Progressive Web App
- Installable and works fully offline — the app shell is precached and the 3D scene fetches no external assets at runtime
- In-app prompt when a new version is available

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Development

```bash
npm test        # run the Vitest suite
npm run build   # type-check + production build
```

World generation runs in a **Web Worker** (`src/lib/worldgen.worker.ts`) so large grids never block the UI, with an automatic synchronous fallback. Slider changes are debounced so dragging regenerates only the settled value. The core generation/config logic is covered by Vitest tests (`src/**/*.test.ts`), and CI type-checks, tests, and builds every PR.

The app is a **PWA** via `vite-plugin-pwa` (`npm run preview` to exercise the service worker locally). Regenerating icons: `public/icon-*.png` are rendered from `public/favicon.svg`.

### AI Lore

Paste your Gemini API key in the **AI Lore** panel, or set `VITE_GEMINI_API_KEY` in `.env`.

Get a free key: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

## Controls

| Action | Input |
|--------|-------|
| Orbit camera | Drag |
| Zoom | Scroll / pinch |
| Explore region | Click terrain |
| Change Worldline surface | World / Time / Futures / Compare / Data / Library |
| Inspect evidence/lineage | Mechanics |

## Share a World

```
https://full-stack-assets.github.io/WorldGen/?seed=7HD2P7
```

## Export

- **Scene PNG** — download a screenshot of the current 3D view
- **World JSON** — download the full generated world (config, cells, biomes, rivers, lakes, settlements) for use in game engines, map tools, or VTTs

## Monetization (optional, for self-hosters)

All channels are off by default — with no env vars set, no monetization UI renders and no third-party scripts load. Existing environment switches remain supported even though the master Worldline shell does not foreground monetization controls.

| Env var | Activates |
|---------|-----------|
| `VITE_SUPPORT_KOFI` | Ko-fi donation button (full URL) |
| `VITE_SUPPORT_GITHUB_SPONSORS` | GitHub Sponsors button (full URL) |
| `VITE_SUPPORT_PATREON` | Patreon button (full URL) |
| `VITE_PRO_PRODUCT_URL` | WorldGen Pro checkout link |
| `VITE_GUMROAD_PRODUCT_ID` | In-app license-key unlock for Pro |
| `VITE_ADSENSE_CLIENT` + `VITE_ADSENSE_SLOT` | Google AdSense unit |
| `VITE_AFFILIATE_ENABLED` | Recommended-tools panel with affiliate links |

## Tech Stack

- React 19 + TypeScript + Vite
- Three.js + React Three Fiber + Drei
- Postprocessing (bloom, vignette, chromatic aberration)
- Custom Perlin noise procedural engine
- Vitest deterministic state/branch/recursive verification
- Google Gemini API (optional lore feature)

## Deploy

GitHub Pages deploys automatically on push to `main` via GitHub Actions. The production build uses the procedural provider by default and does not require Google geospatial credentials.

```bash
npm run build
```

## Evidence boundary

The current application is a deterministic visualization and simulation prototype. It does not claim calibrated future probabilities, forecasting accuracy, realistic interacting human populations, formal manifold geometry, validated extraterrestrial habitability, or unrestricted self-modification. External Earth/cosmos providers and 4D benchmark suites are future adapters with their own validation and licensing requirements.

## License

MIT
