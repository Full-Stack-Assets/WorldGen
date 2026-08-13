import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ForgeControls } from '../ForgeControls';
import { createInitialForgeState, FORGE_VARIANTS } from '../forgeModel';

const noop = () => undefined;

function render(state = createInitialForgeState()) {
  return renderToStaticMarkup(createElement(ForgeControls, {
    state,
    onOpen: noop,
    onClose: noop,
    onSelectParcel: noop,
    onPromptChange: noop,
    onGenerate: noop,
    onSelectVariant: noop,
    onToggleGhost: noop,
    onTransformationChange: noop,
    onDirect: noop,
    onExportStill: noop,
    onExportScene: noop,
  }));
}

describe('ForgeControls', () => {
  it('closed state contains Enter FORGE', () => {
    expect(render()).toContain('Enter FORGE');
  });

  it('disables Enter FORGE until the map is ready', () => {
    const html = renderToStaticMarkup(createElement(ForgeControls, {
      state: createInitialForgeState(),
      mapReady: false,
      onOpen: noop,
      onClose: noop,
      onSelectParcel: noop,
      onPromptChange: noop,
      onGenerate: noop,
      onSelectVariant: noop,
      onToggleGhost: noop,
      onTransformationChange: noop,
      onDirect: noop,
      onExportStill: noop,
      onExportScene: noop,
    }));
    expect(html).toContain('disabled');
  });

  it('prompting state renders editable default prompt and Generate directions', () => {
    const html = render({ ...createInitialForgeState(), mode: 'prompting', parcelSelected: true });
    expect(html).toContain('Generate directions');
    expect(html).toContain('bioluminescent mixed-use harbor district');
  });

  it('comparing state contains all three direction names', () => {
    const html = render({ ...createInitialForgeState(), mode: 'comparing', generated: true, parcelSelected: true });
    for (const variant of FORGE_VARIANTS) {
      expect(html).toContain(variant.name);
    }
  });

  it('editing state contains a range input labeled Reality transformation and percentage text', () => {
    const html = render({ ...createInitialForgeState(), mode: 'editing', parcelSelected: true, generated: true });
    expect(html).toContain('Reality transformation');
    expect(html).toContain('68%');
    expect(html).toContain('type="range"');
  });

  it('every active FORGE state contains VISUAL CONCEPT', () => {
    for (const mode of ['selecting', 'prompting', 'comparing', 'editing', 'directing'] as const) {
      expect(render({ ...createInitialForgeState(), mode })).toContain('VISUAL CONCEPT');
    }
  });

  it('mobile-compatible labels exist for Director, still export, and scene export', () => {
    const html = render({ ...createInitialForgeState(), mode: 'editing' });
    expect(html).toContain('Director');
    expect(html).toContain('Export still');
    expect(html).toContain('Export scene');
  });
});
