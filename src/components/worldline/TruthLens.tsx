import type { EpistemicClass } from '../../worldline/types';
import { EpistemicBadge } from './FidelityBadge';

export const EPISTEMIC_CLASSES: EpistemicClass[] = [
  'OBSERVED',
  'RECONSTRUCTED',
  'SIMULATED',
  'GENERATED',
  'SPECULATIVE',
];

export function epistemicVisualClass(value: EpistemicClass): string {
  return `wl-truth-${value.toLowerCase()}`;
}

export function TruthLens({
  active,
  onToggle,
  inspectedClass,
  inspectedLabel,
}: {
  active: boolean;
  onToggle: () => void;
  inspectedClass?: EpistemicClass;
  inspectedLabel?: string;
}) {
  return (
    <div className="wl-truth-controls">
      <button type="button" className={`wl-truth-toggle ${active ? 'active' : ''}`} onClick={onToggle} aria-pressed={active}>
        TRUTH LENS {active ? 'ON' : 'OFF'}
      </button>
      {active && (
        <div className="wl-truth-inspect" aria-live="polite">
          <span className="wl-truth-inspect-label">{inspectedLabel ?? 'Active surface'}</span>
          <EpistemicBadge value={inspectedClass ?? 'GENERATED'} />
          <small>Inspect whatever is under focus. Looking never upgrades evidence class.</small>
        </div>
      )}
      {active && (
        <ol className="wl-truth-legend" aria-label="Epistemic classes">
          {EPISTEMIC_CLASSES.map((value) => (
            <li key={value} className={`${epistemicVisualClass(value)} ${value === inspectedClass ? 'active' : ''}`}>
              {value}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
