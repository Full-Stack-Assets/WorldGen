import { forgeVariant, type ForgeVariantId } from './forgeModel';

export type ForgePosition = [number, number];

export type ForgeGeometry =
  | { type: 'Point'; coordinates: ForgePosition }
  | { type: 'LineString'; coordinates: ForgePosition[] }
  | { type: 'Polygon'; coordinates: ForgePosition[][] };

export type ForgeFeatureKind =
  | 'forge-parcel'
  | 'forge-surface'
  | 'forge-building'
  | 'forge-public-realm'
  | 'forge-vegetation'
  | 'forge-harbor-glow'
  | 'forge-selection-centroid';

export interface ForgeFeatureProperties {
  classification: 'VISUAL_CONCEPT';
  variantId: ForgeVariantId;
  assetOrigin: 'FORGE_V5_PRESET';
  kind: ForgeFeatureKind;
  height?: number;
  base?: number;
  phase?: number;
  radius?: number;
  surfaceColor?: string;
  structureColor?: string;
  accentColor?: string;
  vegetationColor?: string;
  glowColor?: string;
}

export interface ForgeFeature {
  type: 'Feature';
  id: string;
  properties: ForgeFeatureProperties;
  geometry: ForgeGeometry;
}

export interface ForgeFeatureCollection {
  type: 'FeatureCollection';
  features: ForgeFeature[];
}

export const FORGE_PARCEL_RING: ForgePosition[] = [
  [-70.92208, 41.63455],
  [-70.92142, 41.63447],
  [-70.92118, 41.63494],
  [-70.92186, 41.63503],
  [-70.92208, 41.63455],
];

interface BuildingTemplate {
  west: number;
  south: number;
  width: number;
  depth: number;
  heightFactor: number;
}

const BUILDINGS: Record<ForgeVariantId, readonly BuildingTemplate[]> = {
  'harbor-commons': [
    { west: -70.92196, south: 41.63459, width: 0.00021, depth: 0.00023, heightFactor: 0.72 },
    { west: -70.92168, south: 41.63457, width: 0.00018, depth: 0.00027, heightFactor: 0.88 },
    { west: -70.92188, south: 41.63488, width: 0.00034, depth: 0.00008, heightFactor: 0.54 },
  ],
  'tidal-works': [
    { west: -70.92199, south: 41.63457, width: 0.00018, depth: 0.00028, heightFactor: 0.78 },
    { west: -70.92176, south: 41.63455, width: 0.00016, depth: 0.00033, heightFactor: 1 },
    { west: -70.92155, south: 41.63457, width: 0.00017, depth: 0.00029, heightFactor: 0.84 },
    { west: -70.92194, south: 41.6349, width: 0.00046, depth: 0.000065, heightFactor: 0.64 },
  ],
  'lumen-quay': [
    { west: -70.92198, south: 41.63458, width: 0.00016, depth: 0.00028, heightFactor: 0.62 },
    { west: -70.92178, south: 41.63455, width: 0.00015, depth: 0.00034, heightFactor: 0.82 },
    { west: -70.92159, south: 41.63456, width: 0.00014, depth: 0.00031, heightFactor: 1 },
    { west: -70.92142, south: 41.6346, width: 0.00013, depth: 0.00025, heightFactor: 0.74 },
    { west: -70.92191, south: 41.63491, width: 0.00041, depth: 0.000055, heightFactor: 0.46 },
  ],
};

const VEGETATION: Record<ForgeVariantId, readonly ForgePosition[]> = {
  'harbor-commons': [
    [-70.92196, 41.63482],
    [-70.92182, 41.63496],
    [-70.92168, 41.63491],
    [-70.92152, 41.63494],
    [-70.92134, 41.63478],
    [-70.92147, 41.63462],
    [-70.92175, 41.63468],
    [-70.92191, 41.63462],
  ],
  'tidal-works': [
    [-70.92196, 41.63483],
    [-70.92175, 41.63495],
    [-70.92152, 41.63494],
    [-70.92132, 41.63476],
    [-70.92188, 41.63461],
  ],
  'lumen-quay': [
    [-70.92198, 41.63483],
    [-70.92184, 41.63497],
    [-70.92168, 41.63493],
    [-70.92153, 41.63496],
    [-70.92134, 41.63483],
    [-70.92131, 41.63467],
    [-70.92158, 41.63463],
  ],
};

const PUBLIC_REALM: Record<ForgeVariantId, ForgePosition[]> = {
  'harbor-commons': [
    [-70.92201, 41.63459],
    [-70.92187, 41.63474],
    [-70.92167, 41.63487],
    [-70.92143, 41.63491],
    [-70.92125, 41.63482],
  ],
  'tidal-works': [
    [-70.922, 41.63461],
    [-70.92176, 41.63469],
    [-70.92152, 41.63472],
    [-70.92126, 41.63478],
  ],
  'lumen-quay': [
    [-70.922, 41.63458],
    [-70.92184, 41.63472],
    [-70.92163, 41.63484],
    [-70.92141, 41.63489],
    [-70.92123, 41.63481],
  ],
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function rectangle(template: BuildingTemplate): ForgePosition[] {
  return [
    [template.west, template.south],
    [template.west + template.width, template.south],
    [template.west + template.width, template.south + template.depth],
    [template.west, template.south + template.depth],
    [template.west, template.south],
  ];
}

export function createForgeGeometry(
  variantId: ForgeVariantId,
  transformation: number,
): ForgeFeatureCollection {
  const amount = clamp01(transformation);
  const variant = forgeVariant(variantId);
  const shared = {
    classification: 'VISUAL_CONCEPT' as const,
    variantId,
    assetOrigin: 'FORGE_V5_PRESET' as const,
    surfaceColor: variant.palette.surface,
    structureColor: variant.palette.structure,
    accentColor: variant.palette.accent,
    vegetationColor: variant.palette.vegetation,
    glowColor: variant.palette.glow,
  };

  const features: ForgeFeature[] = [
    {
      type: 'Feature',
      id: `forge-${variantId}-parcel`,
      properties: { ...shared, kind: 'forge-parcel' },
      geometry: { type: 'Polygon', coordinates: [FORGE_PARCEL_RING] },
    },
    {
      type: 'Feature',
      id: `forge-${variantId}-surface`,
      properties: { ...shared, kind: 'forge-surface', phase: amount },
      geometry: { type: 'Polygon', coordinates: [FORGE_PARCEL_RING] },
    },
    ...BUILDINGS[variantId].map<ForgeFeature>((template, index) => ({
      type: 'Feature',
      id: `forge-${variantId}-building-${index}`,
      properties: {
        ...shared,
        kind: 'forge-building',
        height: Math.round(variant.maxHeight * template.heightFactor * amount * 10) / 10,
        base: 0,
        phase: index / BUILDINGS[variantId].length,
      },
      geometry: { type: 'Polygon', coordinates: [rectangle(template)] },
    })),
    {
      type: 'Feature',
      id: `forge-${variantId}-public-realm`,
      properties: { ...shared, kind: 'forge-public-realm', phase: amount },
      geometry: { type: 'LineString', coordinates: PUBLIC_REALM[variantId] },
    },
    ...VEGETATION[variantId].map<ForgeFeature>((coordinates, index) => ({
      type: 'Feature',
      id: `forge-${variantId}-vegetation-${index}`,
      properties: {
        ...shared,
        kind: 'forge-vegetation',
        phase: index / VEGETATION[variantId].length,
        radius: 3 + amount * 5,
      },
      geometry: { type: 'Point', coordinates },
    })),
    ...([
      [-70.92127, 41.63458],
      [-70.92121, 41.6349],
    ] as ForgePosition[]).map<ForgeFeature>((coordinates, index) => ({
      type: 'Feature',
      id: `forge-${variantId}-harbor-glow-${index}`,
      properties: {
        ...shared,
        kind: 'forge-harbor-glow',
        phase: index * 0.5,
        radius: 5 + variant.glow * 12,
      },
      geometry: { type: 'Point', coordinates },
    })),
    {
      type: 'Feature',
      id: `forge-${variantId}-selection-centroid`,
      properties: { ...shared, kind: 'forge-selection-centroid', radius: 10 },
      geometry: { type: 'Point', coordinates: [-70.92165, 41.63476] },
    },
  ];

  return { type: 'FeatureCollection', features };
}
