import type { WorldProject } from './studioProjects';

export async function listRemoteProjects(): Promise<WorldProject[]> {
  const response = await fetch('/api/projects', { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('remote_project_list_failed');
  const payload = await response.json() as { projects?: unknown[] };
  return (payload.projects ?? []).filter((item): item is WorldProject => {
    if (!item || typeof item !== 'object') return false;
    const project = item as Partial<WorldProject>;
    return project.schema === 'worldline-project-v2' && typeof project.id === 'string' && typeof project.title === 'string';
  }).map((project) => structuredClone(project));
}

export async function syncRemoteProject(project: WorldProject): Promise<void> {
  const response = await fetch('/api/projects/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(project),
  });
  if (!response.ok) throw new Error('remote_project_sync_failed');
}

export async function deleteRemoteProject(projectId: string): Promise<void> {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('remote_project_delete_failed');
}
