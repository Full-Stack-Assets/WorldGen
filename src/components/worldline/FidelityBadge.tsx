import type { EpistemicClass, ModelFidelity } from '../../worldline/types';

export const FIDELITY_LABELS: Record<ModelFidelity, string> = {
  FIELD: 'FIELD',
  COHORT: 'COHORT',
  MICROSIM: 'MICROSIM',
  AGENT: 'AGENT',
  INTERACTING_AGENT: 'INTERACTING AGENT',
  COGNITIVE_AGENT: 'COGNITIVE AGENT',
  EXPERIENTIAL_MODEL: 'EXPERIENTIAL MODEL',
};

const FIDELITY_HELP: Record<ModelFidelity, string> = {
  FIELD: 'Continuous fields. Counts are not interacting agents.',
  COHORT: 'Aggregated cohorts. Not individual people.',
  MICROSIM: 'Microsimulation of groups. Not full agent interaction.',
  AGENT: 'Independent agents without guaranteed interaction.',
  INTERACTING_AGENT: 'Agents may interact. Still a model, not observed persons.',
  COGNITIVE_AGENT: 'Modeled cognition. Not verified minds.',
  EXPERIENTIAL_MODEL: 'Playable or cinematic experience. Not scientific measurement.',
};

export function fidelityLabel(fidelity: ModelFidelity): string {
  return FIDELITY_LABELS[fidelity];
}

export function FidelityBadge({ fidelity }: { fidelity: ModelFidelity }) {
  return (
    <span className="wl-fidelity-badge" title={FIDELITY_HELP[fidelity]} data-fidelity={fidelity}>
      {fidelityLabel(fidelity)}
    </span>
  );
}

export function EpistemicBadge({ value }: { value: EpistemicClass }) {
  return (
    <span className={`wl-epistemic-badge wl-truth-${value.toLowerCase()}`} data-epistemic={value}>
      {value}
    </span>
  );
}
