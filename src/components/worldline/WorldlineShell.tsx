import { useState, type ReactNode } from 'react';
import { createBranch, selectBranch, selectWorld, selectYear } from '../../worldline/state';
import type { TimeMode, WorldlineState } from '../../worldline/types';
import { ComparePanel } from './ComparePanel';
import { DataPanel } from './DataPanel';
import { FutureNavigator } from './FutureNavigator';
import { LibraryPanel } from './LibraryPanel';
import { MechanicsPanel } from './MechanicsPanel';
import { TimeNavigator } from './TimeNavigator';
import { WorldlineHUD } from './WorldlineHUD';
import './worldline.css';

export const NAV_ITEMS = ['WORLD', 'TIME', 'FUTURES', 'COMPARE', 'DATA', 'LIBRARY'] as const;
export type WorldlineSurface = typeof NAV_ITEMS[number];

export function WorldlineShell({
  state,
  onStateChange,
  scene,
  worldTools,
}: {
  state: WorldlineState;
  onStateChange: (next: WorldlineState) => void;
  scene: ReactNode;
  worldTools: ReactNode;
}) {
  const [surface, setSurface] = useState<WorldlineSurface>('WORLD');
  const [mechanicsOpen, setMechanicsOpen] = useState(false);

  const setTimeMode = (mode: TimeMode) => onStateChange({ ...state, timeMode: mode });
  const branchCount = Object.keys(state.branches).length;

  return (
    <main className="wl-app">
      <div className="wl-scene">{scene}</div>
      <div className={`wl-atmosphere wl-atmosphere-${state.activeWorld.kind.toLowerCase()}`} aria-hidden="true" />
      <div className="wl-interface">
        <WorldlineHUD state={state} />
        <nav className="wl-nav glass-panel" aria-label="Worldline primary navigation">
          {NAV_ITEMS.map((item) => <button type="button" key={item} className={surface === item ? 'active' : ''} onClick={() => setSurface(item)}>{item}</button>)}
          <button type="button" className={mechanicsOpen ? 'active mechanics' : 'mechanics'} onClick={() => setMechanicsOpen((value) => !value)}>MECHANICS</button>
        </nav>

        <div className="wl-surface" data-surface={surface}>
          {surface === 'WORLD' && <section className="wl-panel wl-world-tools glass-panel"><div className="wl-panel-kicker">WORLD</div><h2>World Controls</h2>{worldTools}</section>}
          {surface === 'TIME' && <TimeNavigator state={state} onYear={(year) => onStateChange(selectYear(state, year))} onMode={setTimeMode} />}
          {surface === 'FUTURES' && <FutureNavigator state={state} onCreateBranch={() => onStateChange(createBranch(state, { label: `Future ${branchCount}`, atYear: state.selectedYear }))} onSelectBranch={(branchId) => onStateChange(selectBranch(state, branchId))} />}
          {surface === 'COMPARE' && <ComparePanel state={state} />}
          {surface === 'DATA' && <DataPanel state={state} />}
          {surface === 'LIBRARY' && <LibraryPanel worlds={state.worlds} activeWorldId={state.activeWorld.id} onSelectWorld={(worldId) => onStateChange(selectWorld(state, worldId))} />}
        </div>

        {mechanicsOpen && <aside className="wl-mechanics-drawer"><MechanicsPanel state={state} /></aside>}

        <div className="wl-time-ribbon glass-panel">
          <span>PAST</span><i /><strong>{state.selectedYear}</strong><i /><span>FUTURE</span>
          <em>{state.timeMode === 'PARALLAX' ? 'Temporal Parallax active' : state.timeMode}</em>
        </div>
      </div>
    </main>
  );
}
