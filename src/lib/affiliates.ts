// Affiliate / recommended-tools program.
//
// This is off unless VITE_AFFILIATE_ENABLED === 'true'. To run a real program:
//   1. Join the relevant affiliate programs (Amazon Associates, asset stores,
//      SaaS referral programs, etc.).
//   2. Replace each `url` below with YOUR tagged affiliate link.
//   3. Set VITE_AFFILIATE_ENABLED=true at build time.
// An FTC-style disclosure is always shown alongside these links.

export interface AffiliatePartner {
  id: string;
  name: string;
  description: string;
  url: string;
}

// Editable starter list — replace URLs with your own affiliate links.
export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  {
    id: 'proc-gen-book',
    name: 'Procedural Generation Books',
    description: 'Deep-dive references on noise, terrain, and world simulation.',
    url: 'https://www.amazon.com/s?k=procedural+generation',
  },
  {
    id: 'game-assets',
    name: 'Game Art & Asset Packs',
    description: 'Drop-in 3D models, textures, and tilesets for your own worlds.',
    url: 'https://www.humblebundle.com/software',
  },
  {
    id: 'gamedev-tools',
    name: 'Game Engines & Tools',
    description: 'Import a WorldGen JSON export straight into your engine of choice.',
    url: 'https://godotengine.org/',
  },
];

export function affiliatesEnabled(): boolean {
  return import.meta.env.VITE_AFFILIATE_ENABLED === 'true' && AFFILIATE_PARTNERS.length > 0;
}
