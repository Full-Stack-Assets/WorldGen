import type { EpistemicClass } from '../../worldline/types';

export function epistemicVisualClass(value: EpistemicClass): string {
  return `wl-truth-${value.toLowerCase()}`;
}

export function TruthLens({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return <button type="button" className={`wl-truth-toggle ${active ? 'active' : ''}`} onClick={onToggle} aria-pressed={active}>TRUTH LENS {active ? 'ON' : 'OFF'}</button>;
}
