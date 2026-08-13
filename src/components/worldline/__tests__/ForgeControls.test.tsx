import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ForgeControls } from '../ForgeControls';
import { createInitialForgeState, type ForgeMode } from '../forgeModel';

function render(mode: ForgeMode) {
  const state = {
    ...createInitialForgeState(),
    mode,
    parcelSelected: mode !== 'closed' && mode !== 'selecting',
    generated: ['comparing', 'editing', 'directing'].includes(mode),
  };
  return renderToStaticMarkup(
    createElement(ForgeControls, {
      state,
      onOpen: () => undefined,
      onClose: () => undefined,
      onSelectParcel: () => undefined,
      onPromptChange: () => undefined,
      onGenerate: () => undefined,
      onSelectVariant: () => undefined,
      onToggleGhost: () => undefined,
      onTransformationChange: () => undefined,
      onDirect: () => undefined,
      onExportStill: () => undefined,
      onExportScene: () => undefined,
    }),
  );
}

describe('ForgeControls', () => {
  it('offers a compact entry control when closed', () => {
    expect(render('closed')).toContain('Enter FORGE');
  });

  it('renders the editable prompt workflow', () => {
    const html = render('prompting');
    expect(html).toContain('Visual direction');
    expect(html).toContain('Transform this waterfront');
    expect(html).toContain('Generate directions');
    expect(html).toContain('VISUAL CONCEPT');
  });

  it('renders all three visual directions for comparison', () => {
    const html = render('comparing');
    expect(html).toContain('Harbor Commons');
    expect(html).toContain('Tidal Works');
    expect(html).toContain('Lumen Quay');
  });

  it('keeps the reality scrubber and exports visible while editing', () => {
    const html = render('editing');
    expect(html).toContain('Reality transformation');
    expect(html).toContain('68%');
    expect(html).toContain('Director reveal');
    expect(html).toContain('Export still');
    expect(html).toContain('Export scene package');
  });

  it('labels every active mode as conceptual', () => {
    for (const mode of ['selecting', 'prompting', 'comparing', 'editing', 'directing'] as const) {
      expect(render(mode)).toContain('VISUAL CONCEPT');
    }
  });
});
