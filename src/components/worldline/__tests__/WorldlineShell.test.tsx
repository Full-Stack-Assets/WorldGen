import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WorldlineShell, NAV_ITEMS } from '../WorldlineShell';
import { createEarthRuntimeStatus } from '../../../worldline/earthRuntime';
import { createProviderRegistry, resolveSurfaceProvider } from '../../../worldline/providers';
import { createInitialWorldlineState } from '../../../worldline/state';

describe('Worldline shell', () => {
  it('exposes the six canonical primary surfaces', () => {
    expect(NAV_ITEMS).toEqual(['WORLD', 'TIME', 'FUTURES', 'COMPARE', 'DATA', 'LIBRARY']);
  });

  it('starts with explicit generated and field labels', () => {
    const state = createInitialWorldlineState();
    expect(state.activeWorld.epistemicClass).toBe('GENERATED');
    expect(state.activeWorld.fidelity).toBe('FIELD');
  });

  it('renders Worldline Studio project controls without replacing primary navigation', () => {
    const state = createInitialWorldlineState();
    const registry = createProviderRegistry({
      networkAvailable: false,
      localNewBedfordAvailable: true,
      requested: 'procedural-worldgen',
    });
    const provider = resolveSurfaceProvider(registry, 'procedural-worldgen');
    const runtime = createEarthRuntimeStatus('procedural-worldgen', provider, null);
    const html = renderToStaticMarkup(createElement(WorldlineShell, {
      state,
      onStateChange: () => undefined,
      scene: null,
      worldTools: null,
      providerStatus: provider,
      earthRuntime: runtime,
    }));

    expect(html).toContain('WORLDLINE STUDIO');
    expect(html).toContain('aria-label="Worldline Studio project"');
    expect(html).toContain('WORLD');
    expect(html).toContain('FUTURES');
    expect(html).toContain('COMPARE');
    expect(html).toContain('MECHANICS');
  });
});
