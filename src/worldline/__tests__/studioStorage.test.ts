import { describe, expect, it } from 'vitest';
import { createInitialWorldlineState } from '../state';

const modules = import.meta.glob('../*.ts', { eager: true }) as Record<string, Record<string, any>>;
const storageModule = modules['../studioStorage.ts'];
const studio = modules['../studioProjects.ts'];

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.has(key) ? data.get(key)! : null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
}

describe('Studio project storage', () => {
  it('saves, lists, loads, and deletes projects without sharing mutable references', () => {
    expect(storageModule).toBeDefined();
    expect(studio).toBeDefined();
    if (!storageModule || !studio) return;

    const store = storageModule.createStudioProjectStore(memoryStorage());
    const project = studio.createWorldProject(createInitialWorldlineState(), { title: 'Stored Project', now: '2026-08-12T20:00:00.000Z', sequence: 1 });
    store.save(project);
    const loaded = store.load(project.id);
    expect(loaded?.title).toBe('Stored Project');
    expect(loaded).not.toBe(project);
    expect(store.list().map((item: any) => item.id)).toEqual([project.id]);
    store.delete(project.id);
    expect(store.load(project.id)).toBeNull();
  });

  it('keeps valid projects when one record is corrupt and bounds the index to 24 entries', () => {
    expect(storageModule).toBeDefined();
    expect(studio).toBeDefined();
    if (!storageModule || !studio) return;

    const backing = memoryStorage();
    const store = storageModule.createStudioProjectStore(backing);
    for (let i = 0; i < 26; i += 1) {
      store.save(studio.createWorldProject(createInitialWorldlineState(), {
        title: `Project ${i}`,
        now: `2026-08-12T20:${String(i).padStart(2, '0')}:00.000Z`,
        sequence: i,
      }));
    }
    const listed = store.list();
    expect(listed).toHaveLength(24);
    backing.setItem(`worldline:studio:project:${listed[0].id}`, '{bad');
    expect(store.list().length).toBe(23);
  });
});
