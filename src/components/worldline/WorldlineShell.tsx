import { useState, type ReactNode } from 'react';
import { createBranch, selectBranch, selectWorld, selectYear } from '../../worldline/state';
import type { EarthRuntimeStatus } from '../../worldline/earthRuntime';
import type { ProviderStatus } from '../../worldline/providers';
import type { TimeMode, WorldlineState } from '../../worldline/types';
import { ChronosArena } from './ChronosArena';
import { ComparePanel } from './ComparePanel';
import { DataPanel } from './DataPanel';
import { FutureNavigator } from './FutureNavigator';
import { LibraryPanel } from './LibraryPanel';
import { MechanicsPanel } from './MechanicsPanel';
import { ProviderStatusStrip } from './ProviderStatusStrip';
import { TimeNavigator } from './TimeNavigator';
import { TruthLens, epistemicVisualClass } from './TruthLens';
import { WorldlineHUD } from './WorldlineHUD';
import './worldline.css';
import './worldline-v02.css';
import './worldline-v05.css';
import './worldline-v07.css';

export const NAV_ITEMS = ['WORLD', 'TIME', 'FUTURES', 'COMPARE', 'DATA', 'LIBRARY'] as const;
export type WorldlineSurface = typeof NAV_ITEMS[number];

export function WorldlineShell({
  state,
  onStateChange,
  scene,
  worldTools,
  providerStatus,
  earthRuntime,
}: {
  state: WorldlineState;
  onStateChange: (next: WorldlineState) => void;
  scene: ReactNode;
  worldTools: ReactNode;
  providerStatus: ProviderStatus;
  earthRuntime: EarthRuntimeStatus;
}) {
  const [surface, setSurface] = useState<WorldlineSurface>('WORLD');
  const [mechanicsOpen, setMechanicsOpen] = useState(false);
  const [truthLens, setTruthLens] = useState(false);
  const [chronosOpen, setChronosOpen] = useState(false);

  const setTimeMode = (mode: TimeMode) => onStateChange({ ...state, timeMode: mode });
  const branchCount = Object.keys(state.branches).length;
  const truthClass = epistemicVisualClass(state.activeWorld.surfaceEpistemicClass ?? state.activeWorld.epistemicClass);

  return (
    <main className={`wl-app ${truthLens ? `wl-truth-active ${truthClass}` : ''}`}>
      <div className="wl-scene">{scene}</div>
      <div className={`wl-atmosphere wl-atmosphere-${state.activeWorld.kind.toLowerCase()}`} aria-hidden="true" />
      <div className="wl-interface">
        <WorldlineHUD state={state} />
        <ProviderStatusStrip state={state} provider={providerStatus} runtimeStatus={earthRuntime} />
        <nav className="wl-nav glass-panel" aria-label="Worldline primary navigation">
          {NAV_ITEMS.map((item) => <button type="button" key={item} className={surface === item ? 'active' : ''} onClick={() => setSurface(item)}>{item}</button>)}
          <TruthLens active={truthLens} onToggle={() => setTruthLens((value) => !value)} />
          <button type="button" className={chronosOpen ? 'active wl-chronos-toggle' : 'wl-chronos-toggle'} onClick={() => setChronosOpen((value) => !value)}>CHRONOS</button>
          <button type="button" className={mechanicsOpen ? 'active mechanics' : 'mechanics'} onClick={() => setMechanicsOpen((value) => !value)}>MECHANICS</button>
        </nav>

        <div className="wl-surface" data-surface={surface}>
          {surface === 'WORLD' && <section className="wl-panel wl-world-tools glass-panel"><div className="wl-panel-kicker">WORLD</div><h2>World Controls</h2>{worldTools}</section>}
          {surface === 'TIME' && <TimeNavigator state={state} onYear={(year) => onStateChange(selectYear(state, year))} onMode={setTimeMode} />}
          {surface === 'FUTURES' && <FutureNavigator state={state} onCreateBranch={() => onStateChange(createBranch(state, { label: `Future ${branchCount}`, atYear: state.selectedYear }))} onSelectBranch={(branchId) => onStateChange(selectBranch(state, branchId))} />}
          {surface === 'COMPARE' && <ComparePanel state={state} />}
          {surface === 'DATA' && <DataPanel state={state} />}
          {surface === 'LIBRARY' && <LibraryPanel state={state} onSelectWorld={(worldId) => onStateChange(selectWorld(state, worldId))} />}
        </div>

        {mechanicsOpen && <aside className="wl-mechanics-drawer"><MechanicsPanel state={state} /></aside>}
        {chronosOpen && <ChronosArena onClose={() => setChronosOpen(false)} />}

        <div className="wl-time-ribbon glass-panel">
          <span>PAST</span><i /><strong>{state.selectedYear}</strong><i /><span>FUTURE</span>
          <em>{state.timeMode === 'PARALLAX' ? 'Temporal Parallax active' : state.timeMode}</em>
        </div>
      </div>
    </main>
  );
}
