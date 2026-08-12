import type { EpistemicClass } from './types';

export type SurfaceProviderKind =
  | 'procedural-worldgen'
  | 'open-earth-maplibre'
  | 'local-new-bedford'
  | 'google-photorealistic';

export interface ProviderStatus {
  id: SurfaceProviderKind;
  label: string;
  available: boolean;
  requiresNetwork: boolean;
  epistemicRendering: Extract<EpistemicClass, 'OBSERVED' | 'RECONSTRUCTED' | 'GENERATED'>;
  attribution?: string;
  note?: string;
}

export interface ProviderRegistry {
  providers: Record<SurfaceProviderKind, ProviderStatus>;
  requested: SurfaceProviderKind;
}

export function createProviderRegistry(input: {
  networkAvailable?: boolean;
  localNewBedfordAvailable?: boolean;
  googleConfigured?: boolean;
  requested?: SurfaceProviderKind;
} = {}): ProviderRegistry {
  const networkAvailable = input.networkAvailable ?? (typeof navigator === 'undefined' ? true : navigator.onLine);
  const providers: Record<SurfaceProviderKind, ProviderStatus> = {
    'procedural-worldgen': {
      id: 'procedural-worldgen',
      label: 'Procedural WorldGen',
      available: true,
      requiresNetwork: false,
      epistemicRendering: 'GENERATED',
      note: 'Credential-free offline fallback.',
    },
    'open-earth-maplibre': {
      id: 'open-earth-maplibre',
      label: 'Open Earth · OpenFreeMap',
      available: networkAvailable,
      requiresNetwork: true,
      epistemicRendering: 'RECONSTRUCTED',
      attribution: 'OpenFreeMap © OpenMapTiles · Data © OpenStreetMap contributors',
      note: 'Real geography with OSM-derived vector geometry; not photogrammetric observation.',
    },
    'local-new-bedford': {
      id: 'local-new-bedford',
      label: 'New Bedford public-data package',
      available: input.localNewBedfordAvailable ?? true,
      requiresNetwork: false,
      epistemicRendering: 'RECONSTRUCTED',
      attribution: 'MassGIS / City of New Bedford source metadata',
      note: 'Versioned local package; individual layers retain their own epistemic classes.',
    },
    'google-photorealistic': {
      id: 'google-photorealistic',
      label: 'Google Photorealistic 3D Tiles',
      available: Boolean(networkAvailable && input.googleConfigured),
      requiresNetwork: true,
      epistemicRendering: 'RECONSTRUCTED',
      note: 'Optional credentialed adapter; never required for Worldline boot.',
    },
  };
  return { providers, requested: input.requested ?? 'open-earth-maplibre' };
}

export function resolveSurfaceProvider(
  registry: ProviderRegistry,
  requested: SurfaceProviderKind = registry.requested,
): ProviderStatus {
  const candidate = registry.providers[requested];
  if (candidate.available) return candidate;
  return registry.providers['procedural-worldgen'];
}

export function requestedProviderForWorld(worldId: string): SurfaceProviderKind {
  if (worldId === 'new-bedford-001') return 'open-earth-maplibre';
  return 'procedural-worldgen';
}
