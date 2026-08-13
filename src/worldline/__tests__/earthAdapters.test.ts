import { describe, expect, it } from 'vitest';
import { adapterDoesNotOwnIdentity, listEarthAdapters } from '../earthAdapters';
import { createProviderRegistry } from '../providers';

describe('Earth adapters', () => {
  it('lists free-first adapters and keeps credentialed photoreal optional', () => {
    const registry = createProviderRegistry({ networkAvailable: true, googleConfigured: false });
    const adapters = listEarthAdapters(registry);
    expect(adapters.find((item) => item.id === 'open-earth-maplibre')?.credentialRequired).toBe(false);
    expect(adapters.find((item) => item.id === 'google-photorealistic')?.available).toBe(false);
    expect(adapters.every((item) => item.canonical === false)).toBe(true);
  });

  it('never treats a provider id as a world identity', () => {
    expect(adapterDoesNotOwnIdentity('new-bedford-001', 'open-earth-maplibre')).toBe(true);
    expect(adapterDoesNotOwnIdentity('open-earth-maplibre', 'open-earth-maplibre')).toBe(false);
  });
});
