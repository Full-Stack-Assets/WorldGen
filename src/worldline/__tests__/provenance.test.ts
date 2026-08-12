import { describe, expect, it } from 'vitest';
import { validateManifest, validateProvenanceRecord } from '../provenance';

describe('New Bedford provenance', () => {
  it('rejects source records without required provenance fields', () => {
    expect(() => validateProvenanceRecord({ sourceId: 'x' })).toThrow();
  });

  it('rejects generated content as canonical source evidence', () => {
    expect(() => validateProvenanceRecord({
      sourceId: 'x', publisher: 'x', datasetName: 'x', sourceUrl: 'https://example.com', retrievedAt: '2026-08-12',
      validFrom: null, validTo: null, spatialReference: 'EPSG:4326', license: 'test', checksum: 'sha256:x', coverage: 'test',
      resolution: 'test', epistemicClass: 'GENERATED', transformationChain: [],
    })).toThrow();
  });

  it('accepts a complete v0.2 manifest', () => {
    const manifest = validateManifest({
      schemaVersion: 'worldline-source-manifest-v0.2',
      worldId: 'new-bedford-001',
      packageVersion: '2026-08-12.1',
      generatedAt: '2026-08-12T18:00:00Z',
      sources: [{
        sourceId: 'source-1', publisher: 'MassGIS', datasetName: 'Dataset', sourceUrl: 'https://mass.gov', retrievedAt: '2026-08-12',
        validFrom: null, validTo: null, spatialReference: 'EPSG:26986', license: 'Public source; attribution required', checksum: 'sha256:abc',
        coverage: 'New Bedford', resolution: 'service metadata', epistemicClass: 'OBSERVED', transformationChain: [],
      }],
      snapshots: [],
    });
    expect(manifest.worldId).toBe('new-bedford-001');
  });
});
