import { describe, expect, it } from 'vitest';
import { createInitialWorldlineState } from '../state';

const modules = import.meta.glob('../*.ts', { eager: true }) as Record<string, Record<string, any>>;
const worldpack = modules['../worldpack.ts'];
const studio = modules['../studioProjects.ts'];

describe('Worldpack interchange', () => {
  it('round-trips a project through the v2 schema without sharing references', () => {
    expect(worldpack).toBeDefined();
    expect(studio).toBeDefined();
    if (!worldpack || !studio) return;

    const project = studio.createWorldProject(createInitialWorldlineState(), { title: 'Portable', now: '2026-08-12T20:00:00.000Z', sequence: 9 });
    const pack = worldpack.createWorldpack(project, { exportedAt: '2026-08-12T21:00:00.000Z', provenance: { source: 'local-safe' } });
    expect(pack.schema).toBe('worldline-worldpack-v2');
    const parsed = worldpack.parseWorldpack(worldpack.serializeWorldpack(pack));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.worldpack.project).toEqual(project);
    expect(parsed.worldpack.project).not.toBe(project);
  });

  it('rejects malformed payloads and recursively excludes credential-shaped keys', () => {
    expect(worldpack).toBeDefined();
    expect(studio).toBeDefined();
    if (!worldpack || !studio) return;

    const project = studio.createWorldProject(createInitialWorldlineState(), { title: 'Sanitized', now: '2026-08-12T20:00:00.000Z', sequence: 10 });
    const pack = worldpack.createWorldpack(project, {
      exportedAt: '2026-08-12T21:00:00.000Z',
      provenance: { apiToken: 'secret-value', nested: { providerKey: 'abc', safe: 'keep' } },
    });
    const text = worldpack.serializeWorldpack(pack);
    expect(text).not.toContain('secret-value');
    expect(text).not.toContain('"apiToken"');
    expect(text).not.toContain('"providerKey"');
    expect(text).toContain('"safe":"keep"');
    expect(worldpack.parseWorldpack('{bad').ok).toBe(false);
    expect(worldpack.parseWorldpack(JSON.stringify({ ...pack, schema: 'worldline-worldpack-v1' })).ok).toBe(false);
    expect(worldpack.describeWorldpackPortability(pack)).toEqual({
      schema: 'worldline-worldpack-v2',
      offlineCapable: true,
      credentialSanitized: true,
      rendererAgnostic: true,
    });
  });
});
