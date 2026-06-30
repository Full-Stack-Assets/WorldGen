# WorldGen

**Procedural worlds, infinite stories.**

WorldGen is an interactive procedural world generator that creates unique terrain maps with diverse biomes, rivers, and climate systems. Click anywhere on the map to explore regions, and optionally power the experience with Gemini AI for rich world lore and naming.

![WorldGen](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## Features

- **Procedural terrain** — Fractal noise-based elevation with configurable scale, octaves, and sea level
- **13 biomes** — Oceans, beaches, forests, deserts, mountains, snow, volcanic regions, and more
- **River carving** — Realistic river networks flow from highlands to the sea
- **Interactive map** — Zoom, pan, and click to inspect any region
- **Seed sharing** — Every world is reproducible from its seed
- **PNG export** — Save your generated maps
- **AI lore** *(optional)* — Gemini-powered world names, region descriptions, and hidden history

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to start generating worlds.

### AI Lore (Optional)

Copy `.env.example` to `.env` and add your Gemini API key:

```bash
cp .env.example .env
# Edit .env and set VITE_GEMINI_API_KEY
```

Without an API key, WorldGen uses built-in fallback lore so the full experience still works.

## Controls

| Action | Input |
|--------|-------|
| Explore region | Click on the map |
| Zoom | Scroll wheel |
| Pan | Shift + drag (or Alt + drag) |
| New world | Click **New** in the seed panel |
| Export | Click **Export PNG** |

## Terrain Parameters

- **Scale** — Controls landmass size and detail
- **Octaves** — Number of noise layers (more = finer detail)
- **Sea Level** — How much of the world is ocean
- **Persistence** — How much each octave contributes
- **Moisture / Temperature** — Climate noise scales

## Tech Stack

- React 19 + TypeScript
- Vite
- Custom Perlin noise engine
- Google Gemini API (optional)

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run preview  # Preview production build
```

## License

MIT
