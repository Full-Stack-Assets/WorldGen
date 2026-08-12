import type { EpistemicClass } from './types';

export interface SourceRecord {
  sourceId: string;
  publisher: string;
  datasetName: string;
  sourceUrl: string;
  retrievedAt: string;
  validFrom: string | null;
  validTo: string | null;
  spatialReference: string;
  license: string;
  checksum: string;
  coverage: string;
  resolution: string;
  epistemicClass: Extract<EpistemicClass, 'OBSERVED' | 'RECONSTRUCTED'>;
  transformationChain: string[];
}

export interface SourceSnapshot {
  id: string;
  year: number;
  label: string;
  sourceIds: string[];
  epistemicClass: EpistemicClass;
  note: string;
}

export interface WorldDataManifest {
  schemaVersion: 'worldline-source-manifest-v0.2';
  worldId: string;
  packageVersion: string;
  generatedAt: string;
  sources: SourceRecord[];
  snapshots: SourceSnapshot[];
}

function requireText(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`Missing provenance field: ${field}`);
}

export function validateProvenanceRecord(value: unknown): SourceRecord {
  if (!value || typeof value !== 'object') throw new Error('Invalid provenance record');
  const record = value as Partial<SourceRecord>;
  requireText(record.sourceId, 'sourceId');
  requireText(record.publisher, 'publisher');
  requireText(record.datasetName, 'datasetName');
  requireText(record.sourceUrl, 'sourceUrl');
  requireText(record.retrievedAt, 'retrievedAt');
  requireText(record.spatialReference, 'spatialReference');
  requireText(record.license, 'license');
  requireText(record.checksum, 'checksum');
  requireText(record.coverage, 'coverage');
  requireText(record.resolution, 'resolution');
  if (record.epistemicClass !== 'OBSERVED' && record.epistemicClass !== 'RECONSTRUCTED') {
    throw new Error('Canonical source provenance must be OBSERVED or RECONSTRUCTED');
  }
  if (!Array.isArray(record.transformationChain)) throw new Error('Missing provenance field: transformationChain');
  return record as SourceRecord;
}

export function validateManifest(value: unknown): WorldDataManifest {
  if (!value || typeof value !== 'object') throw new Error('Invalid world data manifest');
  const manifest = value as Partial<WorldDataManifest>;
  if (manifest.schemaVersion !== 'worldline-source-manifest-v0.2') throw new Error('Unsupported provenance schema');
  requireText(manifest.worldId, 'worldId');
  requireText(manifest.packageVersion, 'packageVersion');
  requireText(manifest.generatedAt, 'generatedAt');
  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) throw new Error('Manifest requires at least one source');
  manifest.sources.forEach(validateProvenanceRecord);
  if (!Array.isArray(manifest.snapshots)) throw new Error('Manifest requires snapshots');
  return manifest as WorldDataManifest;
}

export async function loadNewBedfordManifest(): Promise<WorldDataManifest> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/new-bedford/manifest.json`);
  if (!response.ok) throw new Error(`New Bedford package unavailable (${response.status})`);
  return validateManifest(await response.json());
}
