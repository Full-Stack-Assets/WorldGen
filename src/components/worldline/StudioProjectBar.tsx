import type { WorldProject } from '../../worldline/studioProjects';

export function StudioProjectBar({
  project,
  saved,
  onNew,
  onSave,
  onExport,
}: {
  project: WorldProject;
  saved: boolean;
  onNew: () => void;
  onSave: () => void;
  onExport: () => void;
}) {
  return (
    <section className="wl-studio-project-bar glass-panel" aria-label="Worldline Studio project">
      <div className="wl-studio-project-identity">
        <span className="wl-panel-kicker">WORLDLINE STUDIO</span>
        <strong>{project.title}</strong>
        <small>{saved ? 'Saved locally' : 'Unsaved changes'} · {project.id}</small>
      </div>
      <div className="wl-studio-project-actions" role="group" aria-label="Studio project actions">
        <button type="button" className="wl-secondary" aria-label="Create new Studio project" onClick={onNew}>NEW</button>
        <button type="button" className="wl-secondary" aria-label="Save Studio project" onClick={onSave}>SAVE</button>
        <button type="button" className="wl-primary" aria-label="Export Studio project" onClick={onExport}>EXPORT</button>
      </div>
    </section>
  );
}
