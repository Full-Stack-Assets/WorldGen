import type { ChangeEvent } from 'react';
import {
  FORGE_PROMPT_SEEDS,
  FORGE_VARIANTS,
  forgeVariant,
  type ForgeState,
  type ForgeVariantId,
} from './forgeModel';
import './forge.css';

export interface ForgeControlsProps {
  state: ForgeState;
  onOpen: () => void;
  onClose: () => void;
  onSelectParcel: () => void;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onSelectVariant: (variantId: ForgeVariantId) => void;
  onToggleGhost: () => void;
  onTransformationChange: (value: number) => void;
  onDirect: () => void;
  onExportStill: () => void;
  onExportScene: () => void;
}

function ConceptBadge() {
  return (
    <span className="forge-concept-badge">
      <i aria-hidden="true" />
      VISUAL CONCEPT
    </span>
  );
}

function VariantRibbon({
  state,
  onSelectVariant,
}: Pick<ForgeControlsProps, 'state' | 'onSelectVariant'>) {
  return (
    <div className="forge-variant-ribbon" aria-label="FORGE visual directions">
      {FORGE_VARIANTS.map((variant) => {
        const selected = state.variantId === variant.id;
        return (
          <button
            key={variant.id}
            type="button"
            className={selected ? 'forge-variant active' : 'forge-variant'}
            aria-pressed={selected}
            onClick={() => onSelectVariant(variant.id)}
          >
            <span
              className="forge-variant-swatch"
              style={{
                background: `linear-gradient(135deg, ${variant.palette.surface}, ${variant.palette.accent})`,
              }}
              aria-hidden="true"
            />
            <span className="forge-variant-copy">
              <strong>{variant.name}</strong>
              <small>{variant.maxHeight}m · {variant.assetReuseCount} reused assets</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EditingTools({
  state,
  onToggleGhost,
  onTransformationChange,
  onDirect,
  onExportStill,
  onExportScene,
}: Pick<
  ForgeControlsProps,
  | 'state'
  | 'onToggleGhost'
  | 'onTransformationChange'
  | 'onDirect'
  | 'onExportStill'
  | 'onExportScene'
>) {
  const variant = forgeVariant(state.variantId);
  const percent = Math.round(state.transformation * 100);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onTransformationChange(Number(event.target.value));
  };

  return (
    <div className="forge-editing-tools">
      <div className="forge-reality-row">
        <label htmlFor="forge-reality-transform">
          <span>Reality transformation</span>
          <strong>{percent}%</strong>
        </label>
        <input
          id="forge-reality-transform"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={state.transformation}
          onChange={handleChange}
          aria-valuetext={`${percent}% transformed`}
        />
        <div className="forge-reality-labels" aria-hidden="true">
          <span>Present</span>
          <span>{variant.name}</span>
        </div>
      </div>

      <div className="forge-tool-row">
        <button
          type="button"
          className={state.ghostVisible ? 'forge-chip active' : 'forge-chip'}
          aria-pressed={state.ghostVisible}
          onClick={onToggleGhost}
        >
          Ghost view
        </button>
        <button
          type="button"
          className="forge-director-button"
          onClick={onDirect}
          disabled={state.mode === 'directing'}
        >
          <span aria-hidden="true">◆</span>
          {state.mode === 'directing' ? 'Directing…' : 'Director reveal'}
        </button>
      </div>

      <div className="forge-export-row" aria-label="FORGE exports">
        <button type="button" onClick={onExportStill}>Export still</button>
        <button type="button" onClick={onExportScene}>Export scene package</button>
      </div>
    </div>
  );
}

export function ForgeControls({
  state,
  onOpen,
  onClose,
  onSelectParcel,
  onPromptChange,
  onGenerate,
  onSelectVariant,
  onToggleGhost,
  onTransformationChange,
  onDirect,
  onExportStill,
  onExportScene,
}: ForgeControlsProps) {
  if (state.mode === 'closed') {
    return (
      <button type="button" className="forge-entry" onClick={onOpen}>
        <span className="forge-entry-mark" aria-hidden="true">◇</span>
        <span>
          <strong>Enter FORGE</strong>
          <small>Direct this world</small>
        </span>
      </button>
    );
  }

  const activeVariant = forgeVariant(state.variantId);

  return (
    <section className={`forge-surface forge-mode-${state.mode}`} aria-label="WorldGen FORGE">
      <header className="forge-header">
        <div>
          <span className="forge-kicker">WORLDGEN FORGE · 5.0</span>
          <strong>New Bedford Waterfront Mutation Lab</strong>
        </div>
        <div className="forge-header-actions">
          <ConceptBadge />
          <button type="button" className="forge-close" aria-label="Close FORGE" onClick={onClose}>×</button>
        </div>
      </header>

      <div className="forge-content" aria-live="polite">
        {state.mode === 'selecting' && (
          <div className="forge-select-step">
            <span className="forge-step-number">01</span>
            <div>
              <h2>Select the waterfront</h2>
              <p>The concept parcel is illuminated in the scene. Enter it to begin directing a visual future.</p>
              <button type="button" className="forge-primary" onClick={onSelectParcel}>
                Select waterfront parcel
              </button>
            </div>
          </div>
        )}

        {state.mode === 'prompting' && (
          <div className="forge-prompt-step">
            <label htmlFor="forge-visual-direction">Visual direction</label>
            <textarea
              id="forge-visual-direction"
              value={state.prompt}
              rows={3}
              onChange={(event) => onPromptChange(event.target.value)}
            />
            <div className="forge-seed-row" aria-label="Visual direction presets">
              {FORGE_PROMPT_SEEDS.map((seed, index) => (
                <button key={seed} type="button" onClick={() => onPromptChange(seed)}>
                  {['Civic harbor', 'Tidal industry', 'Luminous future'][index]}
                </button>
              ))}
            </div>
            <button type="button" className="forge-primary" onClick={onGenerate} disabled={!state.prompt.trim()}>
              Generate directions
            </button>
          </div>
        )}

        {state.mode === 'comparing' && (
          <div className="forge-compare-step">
            <div className="forge-section-heading">
              <span>Three visual futures</span>
              <small>Choose a direction to place it in the waterfront.</small>
            </div>
            <VariantRibbon state={state} onSelectVariant={onSelectVariant} />
          </div>
        )}

        {(state.mode === 'editing' || state.mode === 'directing') && (
          <div className="forge-edit-step">
            <div className="forge-active-direction">
              <span
                className="forge-active-swatch"
                style={{ background: activeVariant.palette.accent }}
                aria-hidden="true"
              />
              <div>
                <strong>{activeVariant.name}</strong>
                <p>{activeVariant.thesis}</p>
              </div>
            </div>
            <VariantRibbon state={state} onSelectVariant={onSelectVariant} />
            <EditingTools
              state={state}
              onToggleGhost={onToggleGhost}
              onTransformationChange={onTransformationChange}
              onDirect={onDirect}
              onExportStill={onExportStill}
              onExportScene={onExportScene}
            />
          </div>
        )}
      </div>

      {state.status && <div className="forge-status" role="status">{state.status}</div>}
    </section>
  );
}
