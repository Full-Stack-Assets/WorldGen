import type { EarthRuntimeStatus } from '../../worldline/earthRuntime';
import type { ProviderStatus } from '../../worldline/providers';
import type { WorldlineState } from '../../worldline/types';

export function ProviderStatusStrip({
  state,
  provider,
  runtimeStatus,
}: {
  state: WorldlineState;
  provider: ProviderStatus;
  runtimeStatus: EarthRuntimeStatus;
}) {
  return (
    <div className="wl-provider-strip glass-panel" aria-label="Worldline provider status">
      <span><b>SURFACE</b>{provider.label}</span>
      <span><b>HEALTH</b>{runtimeStatus.health}</span>
      <span><b>WORLD</b>{state.activeWorld.epistemicClass}</span>
      <span><b>SURFACE CLASS</b>{state.activeWorld.surfaceEpistemicClass ?? provider.epistemicRendering}</span>
      <span><b>FIDELITY</b>{state.activeWorld.fidelity}</span>
      {runtimeStatus.failureReason && <span className="wl-provider-warning"><b>FALLBACK</b>{runtimeStatus.failureReason}</span>}
    </div>
  );
}
