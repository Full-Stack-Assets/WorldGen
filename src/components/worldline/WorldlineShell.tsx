import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { EarthRuntimeStatus } from '../../worldline/earthRuntime';
import { runExperiment } from '../../worldline/experiments';
import { createIntervention, type InterventionInput } from '../../worldline/interventions';
import type { ProviderStatus } from '../../worldline/providers';
import { deleteRemoteProject, listRemoteProjects, syncRemoteProject } from '../../worldline/remoteStudio';
import { createBranch, selectBranch, selectWorld, selectYear } from '../../worldline/state';
import { createWorldProject, type WorldProject } from '../../worldline/studioProjects';
import { createStudioProjectStore } from '../../worldline/studioStorage';
import type { TimeMode, WorldlineState, WorldSnapshot } from '../../worldline/types';
import { createWorldpack, parseWorldpack, serializeWorldpack } from '../../worldline/worldpack';
import { ChronosArena } from './ChronosArena';
import { ComparePanel } from './ComparePanel';
import { DataPanel } from './DataPanel';
import { FutureNavigator } from './FutureNavigator';
import { LibraryPanel } from './LibraryPanel';
import { MechanicsPanel } from './MechanicsPanel';
import { ProviderStatusStrip } from './ProviderStatusStrip';
import { StudioProjectBar } from './StudioProjectBar';
import { TimeNavigator } from './TimeNavigator';
import { TruthLens, epistemicVisualClass } from './TruthLens';
import { WorldlineHUD } from './WorldlineHUD';
import './worldline.css';
import './worldline-v02.css';
import './worldline-v05.css';
import './worldline-v07.css';
import './worldline-v10.css';
import './worldline-v20.css';
import './worldline-v21.css';
import './worldline-future.css';

export const NAV_ITEMS = ['WORLD', 'TIME', 'FUTURES', 'COMPARE', 'DATA', 'LIBRARY'] as const;
export type WorldlineSurface = typeof NAV_ITEMS[number];

function timestamp(): string {
  return new Date().toISOString();
}

function projectTitle(state: WorldlineState): string {
  return `${state.activeWorld.name} Studio`;
}

function latestSnapshotAtOrBefore(state: WorldlineState): WorldSnapshot | null {
  const branch = state.branches[state.activeBranchId];
  if (!branch) return null;
  const eligible = branch.snapshots
    .filter((snapshot) => snapshot.year <= state.selectedYear)
    .sort((a, b) => a.year - b.year);
  return eligible.at(-1) ?? null;
}

function mergeProjects(local: WorldProject[], remote: WorldProject[]): WorldProject[] {
  const merged = new Map<string, WorldProject>();
  for (const project of [...local, ...remote]) {
    const current = merged.get(project.id);
    if (!current || project.updatedAt > current.updatedAt) merged.set(project.id, structuredClone(project));
  }
  return [...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
}

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
  const projectSequence = useRef(1);
  const studioStore = useMemo(() => {
    try {
      return typeof window !== 'undefined' ? createStudioProjectStore(window.localStorage) : null;
    } catch {
      return null;
    }
  }, []);
  const [surface, setSurface] = useState<WorldlineSurface>('WORLD');
  const [mechanicsOpen, setMechanicsOpen] = useState(false);
  const [truthLens, setTruthLens] = useState(false);
  const [chronosOpen, setChronosOpen] = useState(false);
  const [exploreFocus, setExploreFocus] = useState(false);
  const [project, setProject] = useState<WorldProject>(() => createWorldProject(state, {
    title: projectTitle(state),
    now: timestamp(),
    sequence: 0,
  }));
  const [savedProjects, setSavedProjects] = useState<WorldProject[]>([]);
  const [saved, setSaved] = useState(false);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [studioNotice, setStudioNotice] = useState<string | null>(null);

  const refreshProjects = async () => {
    let local: WorldProject[] = [];
    if (studioStore) {
      try {
        local = studioStore.list();
      } catch {
        setStudioNotice('Local cache is unavailable. Remote Studio persistence remains available.');
      }
    }
    try {
      const remote = await listRemoteProjects();
      setSavedProjects(mergeProjects(local, remote));
    } catch {
      setSavedProjects(local);
      if (local.length > 0) setStudioNotice('Remote persistence is temporarily unavailable. Local cache remains active.');
    }
  };

  useEffect(() => {
    void refreshProjects();
  }, [studioStore]);

  const materializeProject = (nextState: WorldlineState = state): WorldProject => ({
    ...project,
    state: structuredClone(nextState),
    interventions: structuredClone(project.interventions),
    experiments: structuredClone(project.experiments),
    preferences: { primarySurface: surface, truthLens },
  });

  const applyStateChange = (next: WorldlineState) => {
    onStateChange(next);
    setProject((current) => ({ ...current, state: structuredClone(next) }));
    setSaved(false);
  };

  const changeSurface = (next: WorldlineSurface) => {
    setSurface(next);
    setProject((current) => ({ ...current, preferences: { ...current.preferences, primarySurface: next } }));
    setSaved(false);
  };

  const toggleTruthLens = () => {
    const next = !truthLens;
    setTruthLens(next);
    setProject((current) => ({ ...current, preferences: { ...current.preferences, truthLens: next } }));
    setSaved(false);
  };

  const setTimeMode = (mode: TimeMode) => applyStateChange({ ...state, timeMode: mode });
  const branchCount = Object.keys(state.branches).length;
  const truthClass = epistemicVisualClass(state.activeWorld.surfaceEpistemicClass ?? state.activeWorld.epistemicClass);

  const newProject = () => {
    const next = createWorldProject(state, {
      title: projectTitle(state),
      now: timestamp(),
      sequence: projectSequence.current++,
    });
    setProject(next);
    setSurface('WORLD');
    setTruthLens(false);
    setSelectedExperimentId(null);
    setSaved(false);
    setStudioNotice('New Studio project created. Save to persist it locally and remotely.');
  };

  const saveProject = async () => {
    const next = { ...materializeProject(), updatedAt: timestamp() };
    let localSaved = false;
    if (studioStore) {
      try {
        studioStore.save(next);
        localSaved = true;
      } catch {
        localSaved = false;
      }
    }
    try {
      await syncRemoteProject(next);
      setProject(next);
      setSaved(true);
      await refreshProjects();
      setStudioNotice(localSaved ? 'Project saved to production database and local cache.' : 'Project saved to production database.');
    } catch {
      setProject(next);
      setSaved(localSaved);
      await refreshProjects();
      setStudioNotice(localSaved ? 'Remote save failed; project is preserved in the local cache.' : 'Project could not be persisted. Export remains available.');
    }
  };

  const exportProject = () => {
    const packed = createWorldpack(materializeProject(), {
      exportedAt: timestamp(),
      provenance: {
        application: 'Worldline Studio',
        provider: providerStatus.id,
        worldId: state.activeWorld.id,
      },
    });
    const text = serializeWorldpack(packed);
    if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
      setStudioNotice('Worldpack serialization succeeded; browser download is unavailable in this environment.');
      return;
    }
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'worldline'}.worldpack.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStudioNotice('Credential-sanitized Worldpack exported.');
  };

  const importProject = async (file: File) => {
    try {
      const parsed = parseWorldpack(await file.text());
      if (!parsed.ok) {
        setStudioNotice(parsed.error);
        return;
      }
      const imported = parsed.worldpack.project;
      setProject(imported);
      onStateChange(structuredClone(imported.state));
      setSurface(imported.preferences.primarySurface);
      setTruthLens(imported.preferences.truthLens);
      setSelectedExperimentId(imported.experiments.at(-1)?.id ?? null);
      setSaved(false);
      setStudioNotice('Worldpack imported into memory. Save to persist it to the production database.');
    } catch {
      setStudioNotice('Worldpack import failed without changing the current project.');
    }
  };

  const loadProject = (projectId: string) => {
    const loaded = studioStore?.load(projectId) ?? savedProjects.find((item) => item.id === projectId) ?? null;
    if (!loaded) {
      setStudioNotice('Saved project could not be loaded.');
      return;
    }
    setProject(structuredClone(loaded));
    onStateChange(structuredClone(loaded.state));
    setSurface(loaded.preferences.primarySurface);
    setTruthLens(loaded.preferences.truthLens);
    setSelectedExperimentId(loaded.experiments.at(-1)?.id ?? null);
    setSaved(true);
    setStudioNotice('Persisted Studio project loaded.');
  };

  const deleteProject = async () => {
    if (studioStore) studioStore.delete(project.id);
    try {
      await deleteRemoteProject(project.id);
      setStudioNotice('Project removed from production database and local cache.');
    } catch {
      setStudioNotice('Local cache entry removed; remote deletion could not be confirmed.');
    }
    await refreshProjects();
    newProject();
  };

  const addIntervention = (input: InterventionInput) => {
    try {
      const intervention = createIntervention(input);
      setProject((current) => ({
        ...current,
        interventions: [...current.interventions.filter((item) => item.id !== intervention.id), intervention]
          .sort((a, b) => a.id.localeCompare(b.id)),
      }));
      setSaved(false);
      setStudioNotice('Scenario input added. It remains explicitly simulated.');
    } catch (error) {
      setStudioNotice(error instanceof Error ? error.message : 'Intervention could not be created.');
    }
  };

  const runStudioExperiment = () => {
    if (state.activeWorld.id !== 'worldgen-prime') {
      setStudioNotice('No simulation model is attached to this world. Experiment execution is disabled.');
      return;
    }
    const baseline = latestSnapshotAtOrBefore(state);
    const branch = state.branches[state.activeBranchId];
    if (!baseline || !branch) {
      setStudioNotice('No committed baseline snapshot is available at this time.');
      return;
    }
    const matchingInterventions = project.interventions.filter((item) => item.worldId === state.activeWorld.id && item.branchId === state.activeBranchId);
    const experiment = runExperiment({
      projectId: project.id,
      worldId: state.activeWorld.id,
      branchId: state.activeBranchId,
      year: state.selectedYear,
      seed: branch.seed,
      baselineMetrics: baseline.metrics,
      interventions: matchingInterventions,
      now: timestamp(),
    });
    setProject((current) => ({ ...current, experiments: [...current.experiments, experiment] }));
    setSelectedExperimentId(experiment.id);
    setSaved(false);
    setStudioNotice(`Experiment committed from ${baseline.year} baseline. Scenario result is not a calibrated forecast.`);
  };

  return (
    <main className={`wl-app ${truthLens ? `wl-truth-active ${truthClass}` : ''} ${exploreFocus ? 'wl-explore-focus' : ''}`}>
      <div className="wl-scene">{scene}</div>
      <div className={`wl-atmosphere wl-atmosphere-${state.activeWorld.kind.toLowerCase()}`} aria-hidden="true" />
      <div className="wl-interface">
        <WorldlineHUD state={state} project={project} />
        <StudioProjectBar
          project={project}
          projects={savedProjects}
          saved={saved}
          onNew={newProject}
          onSave={() => void saveProject()}
          onExport={exportProject}
          onImport={(file) => void importProject(file)}
          onLoad={loadProject}
          onDelete={savedProjects.some((item) => item.id === project.id) ? () => void deleteProject() : undefined}
        />
        <ProviderStatusStrip state={state} provider={providerStatus} runtimeStatus={earthRuntime} />
        <nav className="wl-nav glass-panel" aria-label="Worldline primary navigation">
          {NAV_ITEMS.map((item) => <button type="button" key={item} className={surface === item ? 'active' : ''} onClick={() => changeSurface(item)}>{item}</button>)}
          <TruthLens
            active={truthLens}
            onToggle={toggleTruthLens}
            inspectedClass={state.activeWorld.surfaceEpistemicClass ?? state.activeWorld.epistemicClass}
            inspectedLabel={state.activeWorld.name}
          />
          <button type="button" className={exploreFocus ? 'active' : ''} onClick={() => setExploreFocus((value) => !value)}>
            {exploreFocus ? 'Show chrome' : 'Focus world'}
          </button>
          <button type="button" className={chronosOpen ? 'active wl-chronos-toggle' : 'wl-chronos-toggle'} onClick={() => setChronosOpen((value) => !value)}>CHRONOS</button>
          <button type="button" className={mechanicsOpen ? 'active mechanics' : 'mechanics'} onClick={() => setMechanicsOpen((value) => !value)}>MECHANICS</button>
        </nav>

        <div className="wl-surface" data-surface={surface}>
          {surface === 'WORLD' && <section className="wl-panel wl-world-tools glass-panel"><div className="wl-panel-kicker">WORLD</div><h2>World Controls</h2>{worldTools}{studioNotice && <p className="wl-studio-notice" role="status">{studioNotice}</p>}</section>}
          {surface === 'TIME' && <TimeNavigator state={state} onYear={(year) => applyStateChange(selectYear(state, year))} onMode={setTimeMode} />}
          {surface === 'FUTURES' && <FutureNavigator
            state={state}
            interventions={project.interventions}
            experiments={project.experiments}
            onCreateBranch={() => applyStateChange(createBranch(state, { label: `Future ${branchCount}`, atYear: state.selectedYear }))}
            onSelectBranch={(branchId) => applyStateChange(selectBranch(state, branchId))}
            onAddIntervention={addIntervention}
            onRunExperiment={runStudioExperiment}
          />}
          {surface === 'COMPARE' && <ComparePanel state={state} experiments={project.experiments} selectedExperimentId={selectedExperimentId} onSelectExperiment={setSelectedExperimentId} />}
          {surface === 'DATA' && <DataPanel state={state} />}
          {surface === 'LIBRARY' && <LibraryPanel state={state} onSelectWorld={(worldId) => applyStateChange(selectWorld(state, worldId))} />}
        </div>

        {mechanicsOpen && <aside className="wl-mechanics-drawer"><MechanicsPanel state={state} project={project} /></aside>}
        {chronosOpen && <ChronosArena onClose={() => setChronosOpen(false)} />}

        <div className="wl-time-ribbon glass-panel">
          <span>PAST</span><i /><strong>{state.selectedYear}</strong><i /><span>FUTURE</span>
          <em>{state.timeMode === 'PARALLAX' ? 'Temporal Parallax active' : state.timeMode}</em>
        </div>
      </div>
    </main>
  );
}
