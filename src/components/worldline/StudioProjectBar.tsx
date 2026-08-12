import type { ChangeEvent } from 'react';
import type { WorldProject } from '../../worldline/studioProjects';

export function StudioProjectBar({
  project,
  projects = [],
  saved,
  onNew,
  onSave,
  onExport,
  onImport,
  onLoad,
  onDelete,
}: {
  project: WorldProject;
  projects?: WorldProject[];
  saved: boolean;
  onNew: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport?: (file: File) => void;
  onLoad?: (projectId: string) => void;
  onDelete?: () => void;
}) {
  const importFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImport) onImport(file);
    event.target.value = '';
  };

  return (
    <section className="wl-studio-project-bar glass-panel" aria-label="Worldline Studio project">
      <div className="wl-studio-project-identity">
        <span className="wl-panel-kicker">WORLDLINE STUDIO</span>
        <strong>{project.title}</strong>
        <small>{saved ? 'Saved locally' : 'Unsaved changes'} · {project.id}</small>
      </div>
      {projects.length > 0 && onLoad && (
        <label className="wl-studio-project-picker">
          <span>Projects</span>
          <select aria-label="Load Studio project" value={projects.some((item) => item.id === project.id) ? project.id : ''} onChange={(event) => event.target.value && onLoad(event.target.value)}>
            <option value="">Current unsaved project</option>
            {projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
      )}
      <div className="wl-studio-project-actions" role="group" aria-label="Studio project actions">
        <button type="button" className="wl-secondary" aria-label="Create new Studio project" onClick={onNew}>NEW</button>
        <button type="button" className="wl-secondary" aria-label="Save Studio project" onClick={onSave}>SAVE</button>
        {onImport && (
          <label className="wl-studio-import" aria-label="Import Worldpack">
            IMPORT
            <input type="file" accept="application/json,.json,.worldpack" onChange={importFile} />
          </label>
        )}
        <button type="button" className="wl-primary" aria-label="Export Studio project" onClick={onExport}>EXPORT</button>
        {onDelete && <button type="button" className="wl-secondary wl-danger" aria-label="Delete Studio project" onClick={onDelete}>DELETE</button>}
      </div>
    </section>
  );
}
