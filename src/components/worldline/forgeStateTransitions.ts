import type { ForgeState } from './forgeModel';

export function enterForgeState(current: ForgeState): ForgeState {
  return {
    ...current,
    mode: 'selecting',
    transformation: 0.68,
    ghostOpacity: 0.46,
    ghostVisible: true,
    parcelSelected: false,
    generated: false,
    status: 'Select the illuminated waterfront parcel.',
  };
}
