import type { ProviderRegistry, SurfaceProviderKind } from './providers';

export interface EarthAdapterDescriptor {
  id: SurfaceProviderKind;
  label: string;
  credentialRequired: boolean;
  canonical: boolean;
  epistemicRendering: string;
  available: boolean;
  note: string;
}

/** Provider IDs never become canonical world IDs. Adapters are swappable projections. */
export function listEarthAdapters(registry: ProviderRegistry): EarthAdapterDescriptor[] {
  return Object.values(registry.providers).map((provider) => ({
    id: provider.id,
    label: provider.label,
    credentialRequired: provider.id === 'google-photorealistic',
    canonical: false,
    epistemicRendering: provider.epistemicRendering,
    available: provider.available,
    note: provider.note ?? '',
  }));
}

export function adapterDoesNotOwnIdentity(worldId: string, adapterId: SurfaceProviderKind): boolean {
  return worldId !== adapterId;
}
