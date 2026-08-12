import type { ProviderStatus } from '../../worldline/providers';
import type { WorldlineState } from '../../worldline/types';

export function ProviderStatusStrip({ state, provider, fallbackActive }: { state: WorldlineState; provider: ProviderStatus; fallbackActive: boolean }) {
  return (
    <div className="wl-provider-strip glass-panel" aria-label="Worldline provider status">
      <span><b>SURFACE</b>{provider.label}{fallbackActive ? ' · fallback active' : ''}</span>
      <span><b>WORLD</b>{state.activeWorld.epistemicClass}</span>
      <span><b>SURFACE CLASS</b>{state.activeWorld.surfaceEpistemicClass ?? provider.epistemicRendering}</span>
      <span><b>FIDELITY</b>{state.activeWorld.fidelity}</span>
    </div>
  );
}
