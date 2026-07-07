import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { downloadWorldJson, downloadScenePng } from './exportWorld';
import { generateWorld, seedToString } from './worldgen';
import { DEFAULT_CONFIG } from '../types/world';

const world = generateWorld({ ...DEFAULT_CONFIG, seed: 314, width: 24, height: 24 });

let clicked: { download: string; href: string } | null = null;

beforeEach(() => {
  clicked = null;
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    clicked = { download: this.download, href: this.href };
  });
});

afterEach(() => vi.restoreAllMocks());

describe('downloadWorldJson', () => {
  it('triggers a download named for the seed', () => {
    downloadWorldJson(world);
    expect(clicked?.download).toBe(`worldgen-${seedToString(world.seed)}.json`);
  });
});

describe('downloadScenePng', () => {
  it('returns false gracefully when no canvas is present', () => {
    expect(downloadScenePng(world.seed)).toBe(false);
    expect(clicked).toBeNull();
  });
});
