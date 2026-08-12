import { describe, expect, it } from 'vitest';
import { createProviderRegistry, resolveSurfaceProvider } from '../providers';
import { createEarthRuntimeStatus, markProviderFailure, markProviderRecovery } from '../earthRuntime';

describe('Earth runtime provider health', () => {
  it('starts ready when the requested Open Earth provider resolves', () => {
    const registry = createProviderRegistry({ networkAvailable: true, requested: 'open-earth-maplibre' });
    const resolved = resolveSurfaceProvider(registry, 'open-earth-maplibre');
    const status = createEarthRuntimeStatus('open-earth-maplibre', resolved);
    expect(status.health).toBe('READY');
    expect(status.activeProviderId).toBe('open-earth-maplibre');
    expect(status.failureReason).toBeNull();
  });

  it('moves to fallback without mutating its prior value', () => {
    const registry = createProviderRegistry({ networkAvailable: true, requested: 'open-earth-maplibre' });
    const resolved = resolveSurfaceProvider(registry, 'open-earth-maplibre');
    const status = createEarthRuntimeStatus('open-earth-maplibre', resolved);
    const before = JSON.stringify(status);
    const failed = markProviderFailure(status, 'tile network failed');
    expect(JSON.stringify(status)).toBe(before);
    expect(failed.health).toBe('FALLBACK');
    expect(failed.activeProviderId).toBe('procedural-worldgen');
    expect(failed.failureReason).toBe('tile network failed');
  });

  it('can recover the requested provider after a retry', () => {
    const registry = createProviderRegistry({ networkAvailable: true, requested: 'open-earth-maplibre' });
    const resolved = resolveSurfaceProvider(registry, 'open-earth-maplibre');
    const failed = markProviderFailure(createEarthRuntimeStatus('open-earth-maplibre', resolved), 'failed');
    const recovered = markProviderRecovery(failed, resolved);
    expect(recovered.health).toBe('READY');
    expect(recovered.activeProviderId).toBe('open-earth-maplibre');
    expect(recovered.failureReason).toBeNull();
  });
});