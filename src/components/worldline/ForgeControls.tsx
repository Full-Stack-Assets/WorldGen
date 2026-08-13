import {
  DEFAULT_FORGE_PROMPT,
  FORGE_PROMPT_SEEDS,
  FORGE_VARIANTS,
  type ForgeState,
  type ForgeVariantId,
} from './forgeModel';

export interface ForgeControlsProps {
  state: ForgeState;
  compact?: boolean;
  mapReady?: boolean;
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

export function ForgeControls({
  state,
  compact = false,
  mapReady = true,
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
  const active = state.mode !== 'closed';
  const percent = Math.round(state.transformation * 100);

  return (
    <div className={`wl-forge ${compact ? 'compact' : ''} ${state.mode}`} data-forge-mode={state.mode}>
      {state.mode === 'closed' && (
        <button type="button" className="wl-forge-enter" onClick={onOpen} disabled={!mapReady}>
          Enter FORGE
        </button>
      )}

      {active && (
        <div className="wl-forge-dock" aria-live="polite">
          <header className="wl-forge-dock-header">
            <strong>WorldGen FORGE</strong>
            <span className="wl-forge-concept">VISUAL CONCEPT</span>
            <button type="button" className="wl-secondary" onClick={onClose}>Close</button>
          </header>

          {state.mode === 'selecting' && (
            <p className="wl-forge-copy">Select the New Bedford waterfront parcel to begin a visual mutation. Results stay conceptual.</p>
          )}
          {(state.mode === 'selecting' || !state.parcelSelected) && active && (
            <button type="button" className="wl-forge-primary" onClick={onSelectParcel}>
              Select waterfront parcel
            </button>
          )}

          {(state.mode === 'prompting' || state.mode === 'comparing' || state.mode === 'editing' || state.mode === 'directing') && (
            <label className="wl-forge-prompt">
              <span>Visual direction</span>
              <textarea
                aria-label="FORGE visual direction"
                value={state.prompt}
                onChange={(event) => onPromptChange(event.target.value)}
                rows={compact ? 2 : 3}
              />
            </label>
          )}

          {state.mode === 'prompting' && (
            <>
              <div className="wl-forge-seeds">
                {FORGE_PROMPT_SEEDS.map((seed) => (
                  <button key={seed} type="button" onClick={() => onPromptChange(seed)}>{seed}</button>
                ))}
              </div>
              <button type="button" className="wl-forge-primary" onClick={onGenerate}>Generate directions</button>
            </>
          )}

          {(state.mode === 'comparing' || state.mode === 'editing' || state.mode === 'directing') && (
            <div className="wl-forge-ribbon" role="listbox" aria-label="FORGE directions">
              {FORGE_VARIANTS.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  className={state.variantId === variant.id ? 'active' : ''}
                  onClick={() => onSelectVariant(variant.id)}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          )}

          {(state.mode === 'editing' || state.mode === 'directing') && (
            <label className="wl-forge-scrubber">
              <span>Reality transformation {percent}%</span>
              <input
                aria-label="Reality transformation"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={state.transformation}
                onChange={(event) => onTransformationChange(Number(event.target.value))}
              />
            </label>
          )}

          {active && (
            <div className="wl-forge-actions">
              <button type="button" className={state.ghostVisible ? 'active' : ''} onClick={onToggleGhost}>Ghost preview</button>
              <button type="button" aria-label="Director" onClick={onDirect}>Director</button>
              <button type="button" aria-label="Export still" onClick={onExportStill}>Export still</button>
              <button type="button" aria-label="Export scene" onClick={onExportScene}>Export scene</button>
            </div>
          )}

          {state.status && <p className="wl-forge-status">{state.status}</p>}
          <p className="wl-forge-disclosure">Generated visual concepts — not approved or constructed projects. Default prompt: {DEFAULT_FORGE_PROMPT.slice(0, 48)}…</p>
        </div>
      )}
    </div>
  );
}
