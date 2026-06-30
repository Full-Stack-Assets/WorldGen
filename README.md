# WorldGen

**Procedural 3D worlds with cinematic quality — infinite stories.**

WorldGen transforms seeds into fully explorable 3D planets with terrain, oceans, settlements, rivers, lakes, and AI-powered lore. Built with Three.js for real-time rendering with sky, clouds, bloom, and atmospheric fog.

**Live site:** [https://full-stack-assets.github.io/WorldGen/](https://full-stack-assets.github.io/WorldGen/)

## Features

### 3D Engine
- Real-time 3D terrain mesh with vertex-colored biomes and elevation displacement
- Cinematic sky, volumetric clouds, stars, and atmospheric fog
- Reflective ocean plane with animated emissive water
- Bloom, vignette, and chromatic aberration post-processing
- Orbit camera with shadows and contact shadows
- Glowing settlement markers (capitals, cities, towns, villages)
- Animated selection rings on explored regions

### World Generation
- 8 world presets: Classic, Archipelago, Pangaea, Desert, Frozen, Volcanic, Eden, Alien
- 15 biomes including lakes and rivers
- Procedural settlements placed by suitability scoring
- Seed-based reproducible worlds with shareable URLs

### AI & Lore
- Region exploration with names, descriptions, lore, and quest hooks
- World Chronicle: mythology, factions, historical eras
- Gemini API support with in-app key configuration
- Rich fallback content when offline

### UI
- Fullscreen 3D viewport with glass-morphism HUD overlays
- Atlas dashboard with biome distribution and settlement list
- Biome Codex encyclopedia
- Mobile-optimized collapsible panels

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### AI Lore

Paste your Gemini API key in the **AI Lore** panel, or set `VITE_GEMINI_API_KEY` in `.env`.

Get a free key: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

## Controls

| Action | Input |
|--------|-------|
| Orbit camera | Drag |
| Zoom | Scroll / pinch |
| Explore region | Click terrain |
| Toggle panels | World / Region buttons |

## Share a World

```
https://full-stack-assets.github.io/WorldGen/?seed=7HD2P7
```

## Tech Stack

- React 19 + TypeScript + Vite
- Three.js + React Three Fiber + Drei
- Postprocessing (bloom, vignette)
- Custom Perlin noise procedural engine
- Google Gemini API (optional)

## Deploy

GitHub Pages deploys automatically on push to `main` via GitHub Actions.

```bash
npm run build
```

## License

MIT
