import type { EpistemicClass } from './types';

export interface SourceTimelineEntry {
  id: string;
  year: number;
  label: string;
  sourceIds: string[];
  epistemicClass: EpistemicClass;
  note: string;
}

export interface NearestSourceSnapshot {
  entry: SourceTimelineEntry;
  exact: boolean;
  distanceYears: number;
}

const NEW_BEDFORD_SOURCE_TIMELINE: SourceTimelineEntry[] = [
  {
    id: 'nb-source-2023',
    year: 2023,
    label: 'City parcel geometry service baseline',
    sourceIds: ['nb-city-parcels-nonconforming-2025'],
    epistemicClass: 'OBSERVED',
    note: 'Source service metadata describes parcel geometry/attributes as updated January 2023.',
  },
  {
    id: 'nb-source-2025-aerial',
    year: 2025,
    label: 'MassGIS aerial observation',
    sourceIds: ['massgis-aerial-2025'],
    epistemicClass: 'OBSERVED',
    note: 'Aerial source metadata only; imagery bytes are not redistributed by Worldline.',
  },
  {
    id: 'nb-reconstruction-2026',
    year: 2026,
    label: 'Worldline reconstructed view',
    sourceIds: ['nb-city-parcels-nonconforming-2025', 'massgis-parcels-2026', 'massgis-buildings-2026', 'massgis-aerial-2025'],
    epistemicClass: 'RECONSTRUCTED',
    note: 'Open geography plus public-source metadata; not every rendered object is directly observed in 2026.',
  },
];

export function getSourceTimelineForWorld(worldId: string): SourceTimelineEntry[] {
  return worldId === 'new-bedford-001' ? structuredClone(NEW_BEDFORD_SOURCE_TIMELINE) : [];
}

export function nearestSourceSnapshot(entries: SourceTimelineEntry[], year: number): NearestSourceSnapshot | null {
  if (entries.length === 0) return null;
  const entry = [...entries].sort((a, b) => {
    const distance = Math.abs(a.year - year) - Math.abs(b.year - year);
    if (distance !== 0) return distance;
    return a.year - b.year;
  })[0];
  return {
    entry: structuredClone(entry),
    exact: entry.year === year,
    distanceYears: Math.abs(entry.year - year),
  };
}
