import { parseWorldProject, serializeWorldProject, type WorldProject } from './studioProjects';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const INDEX_KEY = 'worldline:studio:index:v2';
const PROJECT_PREFIX = 'worldline:studio:project:';
const MAX_PROJECTS = 24;

function readIndex(storage: StorageLike): string[] {
  try {
    const raw = storage.getItem(INDEX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function projectKey(id: string): string {
  return `${PROJECT_PREFIX}${id}`;
}

export function createStudioProjectStore(storage: StorageLike) {
  const load = (id: string): WorldProject | null => {
    const raw = storage.getItem(projectKey(id));
    if (!raw) return null;
    const parsed = parseWorldProject(raw);
    return parsed.ok ? structuredClone(parsed.project) : null;
  };

  const list = (): WorldProject[] => readIndex(storage)
    .map(load)
    .filter((item): item is WorldProject => item !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));

  const save = (project: WorldProject): WorldProject => {
    const copy = structuredClone(project);
    storage.setItem(projectKey(copy.id), serializeWorldProject(copy));
    const ids = Array.from(new Set([...readIndex(storage), copy.id]));
    const projects = ids
      .map((id) => id === copy.id ? copy : load(id))
      .filter((item): item is WorldProject => item !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
    const kept = projects.slice(0, MAX_PROJECTS);
    const keptIds = new Set(kept.map((item) => item.id));
    for (const id of ids) if (!keptIds.has(id)) storage.removeItem(projectKey(id));
    storage.setItem(INDEX_KEY, JSON.stringify(kept.map((item) => item.id)));
    return structuredClone(copy);
  };

  const remove = (id: string): void => {
    storage.removeItem(projectKey(id));
    storage.setItem(INDEX_KEY, JSON.stringify(readIndex(storage).filter((item) => item !== id)));
  };

  return { save, load, list, delete: remove };
}
