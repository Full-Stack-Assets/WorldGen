export type ForgeMode =
  | 'closed'
  | 'selecting'
  | 'prompting'
  | 'comparing'
  | 'editing'
  | 'directing';

export type ForgeVariantId = 'harbor-commons' | 'tidal-works' | 'lumen-quay';

export interface ForgePalette {
  surface: string;
  structure: string;
  accent: string;
  vegetation: string;
  glow: string;
}

export interface ForgeDirectorShot {
  id: string;
  label: string;
  center: readonly [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  durationMs: number;
  transition: 'fly' | 'ease';
}

export interface ForgeVariant {
  id: ForgeVariantId;
  name: string;
  thesis: string;
  palette: ForgePalette;
  maxHeight: number;
  glow: number;
  assetReuseCount: number;
  keywords: readonly string[];
  directorPath: readonly ForgeDirectorShot[];
}

export interface ForgeState {
  mode: ForgeMode;
  variantId: ForgeVariantId;
  prompt: string;
  transformation: number;
  ghostOpacity: number;
  ghostVisible: boolean;
  parcelSelected: boolean;
  generated: boolean;
  status: string | null;
}

export interface ForgeCameraState {
  center: readonly [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

export const DEFAULT_FORGE_PROMPT =
  'Transform this waterfront into a bioluminescent mixed-use harbor district. Preserve the historic brick warehouses, add elevated gardens, autonomous ferries, and a dramatic blue-hour atmosphere.';

export const FORGE_PROMPT_SEEDS = [
  'Preserve the historic brick warehouses and weave timber terraces, green roofs, and a public harbor garden between them.',
  'Turn the working waterfront into an expressive industrial district with exposed steel, ferry piers, luminous infrastructure, and hard-working public space.',
  'Create a bioluminescent mixed-use harbor district with elevated gardens, glass bridges, autonomous ferries, and a cinematic blue-hour atmosphere.',
] as const;

const directorPath = (
  prefix: string,
  bearingShift: number,
  closeZoom: number,
): readonly ForgeDirectorShot[] => [
  {
    id: `${prefix}-establishing`,
    label: 'Harbor context',
    center: [-70.9262, 41.6355],
    zoom: 14.45,
    pitch: 58,
    bearing: -24 + bearingShift,
    durationMs: 2600,
    transition: 'fly',
  },
  {
    id: `${prefix}-approach`,
    label: 'Waterfront approach',
    center: [-70.9232, 41.6352],
    zoom: 16.05,
    pitch: 68,
    bearing: -34 + bearingShift,
    durationMs: 2200,
    transition: 'fly',
  },
  {
    id: `${prefix}-parcel`,
    label: 'Parcel reveal',
    center: [-70.92172, 41.63484],
    zoom: 17.55,
    pitch: 73,
    bearing: -42 + bearingShift,
    durationMs: 1900,
    transition: 'ease',
  },
  {
    id: `${prefix}-detail`,
    label: 'Human-scale detail',
    center: [-70.92142, 41.63473],
    zoom: closeZoom,
    pitch: 78,
    bearing: -54 + bearingShift,
    durationMs: 1850,
    transition: 'ease',
  },
  {
    id: `${prefix}-finale`,
    label: 'District finale',
    center: [-70.9254, 41.6354],
    zoom: 14.85,
    pitch: 62,
    bearing: -20 + bearingShift,
    durationMs: 3000,
    transition: 'ease',
  },
];

export const FORGE_VARIANTS: readonly ForgeVariant[] = [
  {
    id: 'harbor-commons',
    name: 'Harbor Commons',
    thesis:
      'A warm, civic waterfront that preserves brick and timber character while stitching gardens, terraces, and public rooms into the working harbor.',
    palette: {
      surface: '#294642',
      structure: '#B77A58',
      accent: '#F0C979',
      vegetation: '#72C89A',
      glow: '#FFD79A',
    },
    maxHeight: 24,
    glow: 0.42,
    assetReuseCount: 18,
    keywords: [
      'historic',
      'brick',
      'timber',
      'terrace',
      'commons',
      'garden',
      'green roof',
      'green roofs',
      'warm',
      'civic',
    ],
    directorPath: directorPath('harbor-commons', 8, 18.75),
  },
  {
    id: 'tidal-works',
    name: 'Tidal Works',
    thesis:
      'A muscular maritime district where exposed steel, ferry infrastructure, working piers, and luminous public systems celebrate New Bedford’s industrial edge.',
    palette: {
      surface: '#122B36',
      structure: '#6D8290',
      accent: '#2DE1F2',
      vegetation: '#4EA889',
      glow: '#55F2FF',
    },
    maxHeight: 38,
    glow: 0.66,
    assetReuseCount: 14,
    keywords: [
      'industrial',
      'steel',
      'ferry',
      'ferries',
      'pier',
      'piers',
      'working',
      'infrastructure',
      'cyan',
      'maritime',
    ],
    directorPath: directorPath('tidal-works', -6, 19.05),
  },
  {
    id: 'lumen-quay',
    name: 'Lumen Quay',
    thesis:
      'A cinematic blue-hour harbor where elevated gardens, crystalline bridges, autonomous ferries, and bioluminescent public space form a luminous new waterfront silhouette.',
    palette: {
      surface: '#111D36',
      structure: '#9BB6D8',
      accent: '#9B7CFF',
      vegetation: '#5FE3B1',
      glow: '#63DFFF',
    },
    maxHeight: 52,
    glow: 0.92,
    assetReuseCount: 12,
    keywords: [
      'bioluminescent',
      'luminous',
      'lumen',
      'elevated',
      'garden',
      'gardens',
      'blue hour',
      'blue-hour',
      'autonomous',
      'glass bridge',
      'crystalline',
    ],
    directorPath: directorPath('lumen-quay', 0, 19.25),
  },
] as const;

export function forgeVariant(variantId: ForgeVariantId): ForgeVariant {
  return FORGE_VARIANTS.find((variant) => variant.id === variantId) ?? FORGE_VARIANTS[2];
}

export function createInitialForgeState(): ForgeState {
  return {
    mode: 'closed',
    variantId: 'lumen-quay',
    prompt: DEFAULT_FORGE_PROMPT,
    transformation: 0.68,
    ghostOpacity: 0.46,
    ghostVisible: true,
    parcelSelected: false,
    generated: false,
    status: null,
  };
}

export function matchForgePrompt(prompt: string): ForgeVariantId {
  const normalized = prompt.toLowerCase();
  let best: ForgeVariantId = 'lumen-quay';
  let bestScore = 0;

  for (const variant of FORGE_VARIANTS) {
    const score = variant.keywords.reduce(
      (total, keyword) => total + (normalized.includes(keyword) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      best = variant.id;
      bestScore = score;
    }
  }

  return best;
}

export function serializeForgeScenePackage(
  state: ForgeState,
  camera: ForgeCameraState,
): string {
  const variant = forgeVariant(state.variantId);
  return JSON.stringify(
    {
      product: 'WorldGen FORGE',
      version: '5.0.0',
      classification: 'VISUAL_CONCEPT',
      location: {
        id: 'new-bedford-waterfront',
        name: 'New Bedford Waterfront Mutation Lab',
        center: [-70.9217, 41.6349],
      },
      forge: {
        mode: state.mode,
        prompt: state.prompt,
        variantId: variant.id,
        variantName: variant.name,
        transformation: state.transformation,
        ghostOpacity: state.ghostOpacity,
        ghostVisible: state.ghostVisible,
        assetReuseCount: variant.assetReuseCount,
      },
      camera: {
        center: [...camera.center],
        zoom: camera.zoom,
        pitch: camera.pitch,
        bearing: camera.bearing,
      },
      disclosure:
        'This package contains generated visual concept geometry. It is not an approved, constructed, measured, predicted, or factual condition.',
    },
    null,
    2,
  );
}
