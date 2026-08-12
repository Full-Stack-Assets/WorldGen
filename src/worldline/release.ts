export const WORLDLINE_RELEASE = Object.freeze({
  version: '1.0.0',
  codename: 'Worldline One',
  worldStateSchema: 'worldline-state-v1',
  researchLedgerSchema: 'worldline-research-ledger-v0.5',
  chronosSchema: 'worldline-chronos-v0.7',
  providerClasses: ['procedural-worldgen', 'open-earth-maplibre', 'local-new-bedford'] as const,
  evidenceBoundary: 'Worldline 1.0 is not a calibrated forecast or oracle. Observed, reconstructed, simulated, generated, and speculative states remain explicitly distinct.',
});

export function getBuildCommit(value: string | undefined = import.meta.env.VITE_GIT_SHA): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'development';
}
