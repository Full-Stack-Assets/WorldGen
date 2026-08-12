import type { ProviderStatus, SurfaceProviderKind } from './providers';

export type ProviderHealth = 'READY' | 'DEGRADED' | 'UNAVAILABLE' | 'FALLBACK';

export interface EarthRuntimeStatus {
  requestedProviderId: SurfaceProviderKind;
  activeProviderId: SurfaceProviderKind;
  health: ProviderHealth;
  failureReason: string | null;
  lastHealthyProviderId: SurfaceProviderKind;
}

export function createEarthRuntimeStatus(
  requestedProviderId: SurfaceProviderKind,
  resolvedProvider: ProviderStatus,
  failureReason: string | null = null,
): EarthRuntimeStatus {
  const requestedActive = resolvedProvider.id === requestedProviderId;
  return {
    requestedProviderId,
    activeProviderId: resolvedProvider.id,
    health: requestedActive ? (failureReason ? 'DEGRADED' : 'READY') : 'FALLBACK',
    failureReason,
    lastHealthyProviderId: resolvedProvider.id,
  };
}

export function markProviderFailure(status: EarthRuntimeStatus, reason: string): EarthRuntimeStatus {
  return {
    ...status,
    activeProviderId: 'procedural-worldgen',
    health: 'FALLBACK',
    failureReason: reason,
  };
}

export function markProviderRecovery(status: EarthRuntimeStatus, resolvedProvider: ProviderStatus): EarthRuntimeStatus {
  if (!resolvedProvider.available) {
    return {
      ...status,
      health: status.activeProviderId === 'procedural-worldgen' ? 'FALLBACK' : 'UNAVAILABLE',
      failureReason: status.failureReason ?? `${resolvedProvider.label} is unavailable.`,
    };
  }
  return {
    ...status,
    activeProviderId: resolvedProvider.id,
    health: resolvedProvider.id === status.requestedProviderId ? 'READY' : 'FALLBACK',
    failureReason: null,
    lastHealthyProviderId: resolvedProvider.id,
  };
}
