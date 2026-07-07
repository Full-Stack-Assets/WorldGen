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

## Export

- **Scene PNG** — download a screenshot of the current 3D view
- **World JSON** — download the full generated world (config, cells, biomes, rivers, lakes, settlements) for use in game engines, map tools, or VTTs

## Monetization (optional, for self-hosters)

All channels are off by default — with no env vars set, no monetization UI renders and no third-party scripts load. Set any of these at build time to activate:

| Env var | Activates |
|---------|-----------|
| `VITE_SUPPORT_KOFI` | Ko-fi donation button (full URL) |
| `VITE_SUPPORT_GITHUB_SPONSORS` | GitHub Sponsors button (full URL) |
| `VITE_SUPPORT_PATREON` | Patreon button (full URL) |
| `VITE_PRO_PRODUCT_URL` | "Get WorldGen Pro" checkout link (Gumroad / Lemon Squeezy product URL) |
| `VITE_GUMROAD_PRODUCT_ID` | In-app license-key unlock for Pro (Gumroad license verification) |
| `VITE_ADSENSE_CLIENT` + `VITE_ADSENSE_SLOT` | Google AdSense unit (hidden for Pro users) |
| `VITE_AFFILIATE_ENABLED` | Recommended-tools panel with affiliate links |

For AdSense you must also commit an `ads.txt` to `public/` containing your publisher line (e.g. `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`) and have the site approved in your AdSense account. For GitHub Pages deploys, add these as repository Actions secrets/vars and pass them as `env` in `.github/workflows/deploy.yml`'s build step.

### WorldGen Pro

Pro is a real, license-gated upgrade tier:

- **Ad-free** — configured AdSense units are hidden for Pro users
- **Ultra-detail worlds** — unlocks High (256²) and Ultra (320²) grid resolutions
- **Premium exports** — full-resolution heightmap PNG and top-down biome-map PNG

Set up: create a product on [Gumroad](https://gumroad.com) with license keys enabled, then set `VITE_PRO_PRODUCT_URL` (the checkout link) and `VITE_GUMROAD_PRODUCT_ID` (the product id). Buyers paste their license key into the Pro panel; it's verified against Gumroad's license API and cached in the browser. Because this is a static client-only app, the gate is a good-faith unlock rather than hard DRM — everything Pro adds is additive and never degrades the free experience.

### Affiliate program

Set `VITE_AFFILIATE_ENABLED=true` to show a "Recommended Tools" panel, then edit `src/lib/affiliates.ts` to replace the starter links with your own tagged affiliate URLs (Amazon Associates, asset stores, engine referral programs, etc.). An FTC-style disclosure is always shown, and links use `rel="sponsored"`.

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
