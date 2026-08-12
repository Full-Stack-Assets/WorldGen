import { describe, expect, it } from 'vitest';
import { createProviderRegistry, requestedProviderForWorld, resolveSurfaceProvider } from '../providers';

describe('provider registry', () => {
  it('always includes the procedural fallback', () => {
    const registry = createProviderRegistry({ networkAvailable: false });
    expect(registry.providers['procedural-worldgen'].available).toBe(true);
  });

  it('falls back without changing semantic provider classification', () => {
    const registry = createProviderRegistry({ networkAvailable: false });
    const resolved = resolveSurfaceProvider(registry, 'open-earth-maplibre');
    expect(resolved.id).toBe('procedural-worldgen');
    expect(resolved.epistemicRendering).toBe('GENERATED');
  });

  it('prefers Open Earth for New Bedford while keeping generated worlds procedural', () => {
    expect(requestedProviderForWorld('new-bedford-001')).toBe('open-earth-maplibre');
    expect(requestedProviderForWorld('worldgen-prime')).toBe('procedural-worldgen');
  });
});
