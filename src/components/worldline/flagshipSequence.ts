export type FlagshipStageId =
  | 'space'
  | 'earth'
  | 'north-america'
  | 'massachusetts'
  | 'new-bedford'
  | 'neighborhood'
  | 'street'
  | 'parcel'
  | 'building'
  | 'close-exterior'
  | 'future-view';

export interface FlagshipStage {
  id: FlagshipStageId;
  title: string;
  subtitle: string;
  center: readonly [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  durationMs: number;
  curve: number;
  speed: number;
  transition: 'fly' | 'ease';
}

export const FLAGSHIP_STAGES: readonly FlagshipStage[] = [
  {
    id: 'space',
    title: 'Space',
    subtitle: 'One continuous descent begins.',
    center: [-48, 28],
    zoom: 0.15,
    pitch: 0,
    bearing: 0,
    durationMs: 2200,
    curve: 1.1,
    speed: 0.72,
    transition: 'fly',
  },
  {
    id: 'earth',
    title: 'Earth',
    subtitle: 'Atmosphere, ocean, and continent resolve into view.',
    center: [-63, 35],
    zoom: 1.2,
    pitch: 12,
    bearing: -8,
    durationMs: 2600,
    curve: 1.18,
    speed: 0.7,
    transition: 'fly',
  },
  {
    id: 'north-america',
    title: 'North America',
    subtitle: 'The camera crosses from planetary scale to lived geography.',
    center: [-91, 40],
    zoom: 2.6,
    pitch: 22,
    bearing: -12,
    durationMs: 3000,
    curve: 1.25,
    speed: 0.66,
    transition: 'fly',
  },
  {
    id: 'massachusetts',
    title: 'Massachusetts',
    subtitle: 'The Atlantic coast becomes the navigation spine.',
    center: [-71.45, 42.08],
    zoom: 6.15,
    pitch: 38,
    bearing: -20,
    durationMs: 3300,
    curve: 1.32,
    speed: 0.64,
    transition: 'fly',
  },
  {
    id: 'new-bedford',
    title: 'New Bedford',
    subtitle: 'The working harbor and historic city arrive together.',
    center: [-70.9342, 41.6362],
    zoom: 11.35,
    pitch: 50,
    bearing: -22,
    durationMs: 3600,
    curve: 1.38,
    speed: 0.61,
    transition: 'fly',
  },
  {
    id: 'neighborhood',
    title: 'Waterfront District',
    subtitle: 'Blocks, piers, streets, and public space gain depth.',
    center: [-70.9258, 41.6358],
    zoom: 14.2,
    pitch: 61,
    bearing: -28,
    durationMs: 3100,
    curve: 1.35,
    speed: 0.58,
    transition: 'fly',
  },
  {
    id: 'street',
    title: 'Street',
    subtitle: 'The city becomes architectural rather than cartographic.',
    center: [-70.9227, 41.63525],
    zoom: 16.45,
    pitch: 70,
    bearing: -34,
    durationMs: 2800,
    curve: 1.3,
    speed: 0.54,
    transition: 'fly',
  },
  {
    id: 'parcel',
    title: 'Concept Parcel',
    subtitle: 'A visual study area is isolated without claiming an approved project.',
    center: [-70.92172, 41.63494],
    zoom: 17.65,
    pitch: 73,
    bearing: -40,
    durationMs: 2500,
    curve: 1.24,
    speed: 0.5,
    transition: 'fly',
  },
  {
    id: 'building',
    title: 'Building Scale',
    subtitle: 'Massing, roofline, and public edge take over the frame.',
    center: [-70.92142, 41.63478],
    zoom: 18.65,
    pitch: 76,
    bearing: -48,
    durationMs: 2300,
    curve: 1.2,
    speed: 0.48,
    transition: 'fly',
  },
  {
    id: 'close-exterior',
    title: 'Close Exterior',
    subtitle: 'The final approach holds on human-scale detail.',
    center: [-70.92127, 41.63468],
    zoom: 19.25,
    pitch: 79,
    bearing: -57,
    durationMs: 2100,
    curve: 1.1,
    speed: 0.45,
    transition: 'ease',
  },
  {
    id: 'future-view',
    title: 'Transformed Future View',
    subtitle: 'A clearly labeled concept emerges, then returns to its city context.',
    center: [-70.9262, 41.6355],
    zoom: 14.55,
    pitch: 63,
    bearing: -24,
    durationMs: 4200,
    curve: 1.42,
    speed: 0.56,
    transition: 'ease',
  },
] as const;

export function stageDuration(stage: FlagshipStage, reducedMotion: boolean): number {
  return reducedMotion ? Math.max(420, Math.round(stage.durationMs * 0.18)) : stage.durationMs;
}

type Position = [number, number];

type FlagshipGeometry =
  | { type: 'Point'; coordinates: Position }
  | { type: 'LineString'; coordinates: Position[] }
  | { type: 'Polygon'; coordinates: Position[][] };

export interface FlagshipFeature {
  type: 'Feature';
  id: string;
  properties: {
    classification: 'VISUAL_CONCEPT';
    kind: 'parcel' | 'future-building' | 'public-realm' | 'future-tree';
    height?: number;
    base?: number;
    phase?: number;
  };
  geometry: FlagshipGeometry;
}

export interface FlagshipFeatureCollection {
  type: 'FeatureCollection';
  features: FlagshipFeature[];
}

const parcelRing: Position[] = [
  [-70.92208, 41.63455],
  [-70.92142, 41.63447],
  [-70.92118, 41.63494],
  [-70.92186, 41.63503],
  [-70.92208, 41.63455],
];

function buildingRing(west: number, south: number, width: number, depth: number): Position[] {
  return [
    [west, south],
    [west + width, south],
    [west + width, south + depth],
    [west, south + depth],
    [west, south],
  ];
}

export function createFlagshipConceptGeoJSON(): FlagshipFeatureCollection {
  const features: FlagshipFeature[] = [
    {
      type: 'Feature',
      id: 'flagship-concept-parcel',
      properties: { classification: 'VISUAL_CONCEPT', kind: 'parcel' },
      geometry: { type: 'Polygon', coordinates: [parcelRing] },
    },
    {
      type: 'Feature',
      id: 'flagship-future-building-a',
      properties: { classification: 'VISUAL_CONCEPT', kind: 'future-building', height: 32, base: 0, phase: 0 },
      geometry: { type: 'Polygon', coordinates: [[...buildingRing(-70.92193, 41.6346, 0.00026, 0.00025)]] },
    },
    {
      type: 'Feature',
      id: 'flagship-future-building-b',
      properties: { classification: 'VISUAL_CONCEPT', kind: 'future-building', height: 24, base: 0, phase: 0.18 },
      geometry: { type: 'Polygon', coordinates: [[...buildingRing(-70.9216, 41.63458, 0.00022, 0.00031)]] },
    },
    {
      type: 'Feature',
      id: 'flagship-future-building-c',
      properties: { classification: 'VISUAL_CONCEPT', kind: 'future-building', height: 18, base: 0, phase: 0.34 },
      geometry: { type: 'Polygon', coordinates: [[...buildingRing(-70.92182, 41.63491, 0.00032, 0.00008)]] },
    },
    {
      type: 'Feature',
      id: 'flagship-public-realm',
      properties: { classification: 'VISUAL_CONCEPT', kind: 'public-realm' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-70.92201, 41.63458],
          [-70.92178, 41.63473],
          [-70.92153, 41.63486],
          [-70.92127, 41.6349],
        ],
      },
    },
    ...[
      [-70.92192, 41.63482],
      [-70.92172, 41.63497],
      [-70.92145, 41.63491],
      [-70.9213, 41.63473],
    ].map<FlagshipFeature>((coordinates, index) => ({
      type: 'Feature',
      id: `flagship-future-tree-${index}`,
      properties: { classification: 'VISUAL_CONCEPT', kind: 'future-tree', phase: index / 4 },
      geometry: { type: 'Point', coordinates: coordinates as Position },
    })),
  ];

  return { type: 'FeatureCollection', features };
}

export interface ProceduralLifeFeature {
  type: 'Feature';
  id: string;
  properties: {
    kind: 'vehicle' | 'harbor' | 'pedestrian';
    heading: number;
  };
  geometry: { type: 'Point'; coordinates: Position };
}

export interface ProceduralLifeCollection {
  type: 'FeatureCollection';
  features: ProceduralLifeFeature[];
}

const lifeRoutes: readonly (readonly Position[])[] = [
  [[-70.944, 41.638], [-70.934, 41.636], [-70.922, 41.634], [-70.913, 41.632]],
  [[-70.931, 41.648], [-70.928, 41.64], [-70.924, 41.632], [-70.919, 41.624]],
  [[-70.918, 41.629], [-70.911, 41.632], [-70.905, 41.636], [-70.899, 41.642]],
  [[-70.926, 41.636], [-70.921, 41.636], [-70.918, 41.635], [-70.915, 41.633]],
];

function normalizedPhase(value: number): number {
  return ((value % 1) + 1) % 1;
}

function pointOnRoute(route: readonly Position[], progress: number): { point: Position; heading: number } {
  const bounded = normalizedPhase(progress);
  const scaled = bounded * (route.length - 1);
  const index = Math.min(route.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const from = route[index];
  const to = route[index + 1];
  const point: Position = [
    from[0] + (to[0] - from[0]) * local,
    from[1] + (to[1] - from[1]) * local,
  ];
  const heading = (Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI;
  return { point, heading };
}

export function createProceduralLifeFrame(phase: number, compact: boolean): ProceduralLifeCollection {
  const count = compact ? 7 : 14;
  const features = Array.from({ length: count }, (_, index): ProceduralLifeFeature => {
    const route = lifeRoutes[index % lifeRoutes.length];
    const { point, heading } = pointOnRoute(route, phase + index / count);
    const kind = index % 5 === 0 ? 'harbor' : index % 3 === 0 ? 'pedestrian' : 'vehicle';
    return {
      type: 'Feature',
      id: `worldgen-life-${index}`,
      properties: { kind, heading },
      geometry: { type: 'Point', coordinates: point },
    };
  });
  return { type: 'FeatureCollection', features };
}

const captureMimeTypes = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
] as const;

export function preferredCaptureMimeType(
  isSupported: (mimeType: string) => boolean,
): string | null {
  return captureMimeTypes.find((mimeType) => isSupported(mimeType)) ?? null;
}
