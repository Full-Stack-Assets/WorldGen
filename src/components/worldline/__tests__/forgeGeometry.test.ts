import { describe, expect, it } from 'vitest';
import { createForgeGeometry } from '../forgeGeometry';

describe('FORGE geometry', () => {
  it('marks every feature as a visual concept', () => {
    const geometry = createForgeGeometry('lumen-quay', 0.68);
    expect(geometry.features.length).toBeGreaterThan(8);
    expect(
      geometry.features.every(
        (feature) => feature.properties.classification === 'VISUAL_CONCEPT',
      ),
    ).toBe(true);
  });

  it('scales building heights continuously with transformation', () => {
    const present = createForgeGeometry('tidal-works', 0);
    const future = createForgeGeometry('tidal-works', 1);
    const height = (collection: typeof present) =>
      collection.features
        .filter((feature) => feature.properties.kind === 'forge-building')
        .reduce((sum, feature) => sum + (feature.properties.height ?? 0), 0);
    expect(height(present)).toBe(0);
    expect(height(future)).toBeGreaterThan(80);
  });

  it('produces visibly different direction geometry', () => {
    const commons = JSON.stringify(createForgeGeometry('harbor-commons', 1));
    const works = JSON.stringify(createForgeGeometry('tidal-works', 1));
    const lumen = JSON.stringify(createForgeGeometry('lumen-quay', 1));
    expect(commons).not.toBe(works);
    expect(works).not.toBe(lumen);
    expect(lumen).not.toBe(commons);
  });
});
