import type { BranchRecord, WorldRecord, WorldSnapshot } from './types';

export const WORLD_CATALOG: WorldRecord[] = [
  {
    id: 'worldgen-prime',
    name: 'WorldGen Prime',
    kind: 'GENERATED',
    epistemicClass: 'GENERATED',
    fidelity: 'FIELD',
    provider: 'Procedural WorldGen',
    description: 'Credential-free procedural world and fallback rendering substrate.',
    planetary: {
      gravityG: 1,
      atmosphere: 'Generated Earth-like atmosphere',
      temperature: 'Temperate synthetic range',
      radiation: 'Synthetic baseline',
      illumination: 'Single-star day/night cycle',
      lightTime: 'Local simulation',
      habitability: {
        microbial: 'Generated scenario',
        complexLife: 'Generated scenario',
        unprotectedHuman: 'Generated scenario',
        supportedSettlement: 'Generated scenario',
      },
    },
  },
  {
    id: 'new-bedford-001',
    name: 'New Bedford · World #001',
    kind: 'EARTH',
    epistemicClass: 'RECONSTRUCTED',
    fidelity: 'COHORT',
    provider: 'Procedural fallback · real-data adapter pending',
    description: 'Real-city proving ground. Visual geometry falls back to the procedural provider until a licensed geospatial adapter is configured.',
    planetary: {
      gravityG: 1,
      atmosphere: 'Earth',
      temperature: 'Earth local climate adapter pending',
      radiation: 'Earth surface baseline',
      illumination: 'Solar',
      lightTime: 'Local',
      habitability: {
        microbial: 'Observed terrestrial environment',
        complexLife: 'Observed terrestrial environment',
        unprotectedHuman: 'Generally viable; local conditions vary',
        supportedSettlement: 'Established urban settlement',
      },
    },
  },
  {
    id: 'mars',
    name: 'Mars',
    kind: 'SOLAR_SYSTEM',
    epistemicClass: 'OBSERVED',
    fidelity: 'FIELD',
    provider: 'Worldline planetary metadata · procedural visual fallback',
    description: 'Observed planetary identity with explicitly simplified local visualization.',
    planetary: {
      gravityG: 0.38,
      atmosphere: 'Thin CO₂-dominated atmosphere',
      temperature: 'Cold, highly variable',
      radiation: 'Elevated relative to Earth surface',
      illumination: 'Solar · reduced intensity',
      lightTime: 'Minutes from Earth; varies by orbit',
      habitability: {
        microbial: 'Unknown / research question',
        complexLife: 'Not established',
        unprotectedHuman: 'Not viable',
        supportedSettlement: 'Requires substantial life support',
      },
    },
  },
  {
    id: 'europa',
    name: 'Europa',
    kind: 'SOLAR_SYSTEM',
    epistemicClass: 'OBSERVED',
    fidelity: 'FIELD',
    provider: 'Worldline planetary metadata · procedural visual fallback',
    description: 'Observed Jovian moon identity with candidate subsurface-world scenarios separated from observation.',
    planetary: {
      gravityG: 0.134,
      atmosphere: 'Extremely tenuous oxygen atmosphere',
      temperature: 'Cryogenic surface',
      radiation: 'Very high surface radiation',
      illumination: 'Solar · Jupiter system',
      lightTime: 'Tens of minutes from Earth; varies by orbit',
      habitability: {
        microbial: 'Candidate subsurface habitability; unconfirmed',
        complexLife: 'Unknown',
        unprotectedHuman: 'Not viable',
        supportedSettlement: 'Highly demanding',
      },
    },
  },
  {
    id: 'exoworld-a',
    name: 'Asterion Candidate Family',
    kind: 'EXOWORLD',
    epistemicClass: 'SPECULATIVE',
    fidelity: 'FIELD',
    provider: 'Procedural exoworld family',
    description: 'Synthetic constrained-world family used to demonstrate uncertainty-aware extraterrestrial exploration.',
    planetary: {
      gravityG: 0.92,
      atmosphere: 'Candidate families: thin / temperate / dense',
      temperature: 'Model-family dependent',
      radiation: 'Model-family dependent',
      illumination: 'K-type host-star scenario',
      lightTime: 'Interstellar observation only',
      habitability: {
        microbial: 'Scenario dependent',
        complexLife: 'Scenario dependent',
        unprotectedHuman: 'Unknown',
        supportedSettlement: 'Unknown',
      },
    },
  },
];

function snapshot(id: string, branchId: string, year: number, metrics: Record<string, number>, eventIds: string[] = []): WorldSnapshot {
  const metricText = Object.entries(metrics).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}:${value}`).join('|');
  return {
    id,
    worldId: 'worldgen-prime',
    branchId,
    year,
    metrics,
    eventIds,
    commitment: `${branchId}:${year}:${metricText}`,
  };
}

export const ROOT_BRANCH: BranchRecord = {
  id: 'branch-root',
  label: 'Baseline',
  parentId: null,
  forkYear: 2026,
  seed: 424242,
  events: [
    { id: 'event-2030', year: 2030, type: 'transition', label: 'Urban systems adjustment', delta: { vitality: 2, resilience: 1 } },
    { id: 'event-2035', year: 2035, type: 'transition', label: 'Infrastructure renewal', delta: { vitality: 3, resilience: 4 } },
  ],
  snapshots: [
    snapshot('snap-2026-root', 'branch-root', 2026, { vitality: 72, resilience: 64, affordability: 58, population: 184000 }),
    snapshot('snap-2030-root', 'branch-root', 2030, { vitality: 74, resilience: 65, affordability: 57, population: 185200 }, ['event-2030']),
    snapshot('snap-2035-root', 'branch-root', 2035, { vitality: 77, resilience: 69, affordability: 56, population: 187400 }, ['event-2035']),
    snapshot('snap-2040-root', 'branch-root', 2040, { vitality: 79, resilience: 71, affordability: 55, population: 189100 }),
  ],
};
