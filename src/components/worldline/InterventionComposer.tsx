import { useState, type FormEvent } from 'react';
import type { InterventionCategory, InterventionInput } from '../../worldline/interventions';

const CATEGORIES: InterventionCategory[] = ['housing', 'mobility', 'climate-resilience', 'energy', 'land-use', 'public-realm', 'custom'];

export function InterventionComposer({
  worldId,
  branchId,
  selectedYear,
  onAdd,
  onRun,
}: {
  worldId: string;
  branchId: string;
  selectedYear: number;
  onAdd: (input: InterventionInput) => void;
  onRun: () => void;
}) {
  const [label, setLabel] = useState('Studio intervention');
  const [category, setCategory] = useState<InterventionCategory>('housing');
  const [startYear, setStartYear] = useState(selectedYear);
  const [durationYears, setDurationYears] = useState<number | null>(null);
  const [magnitude, setMagnitude] = useState(1);
  const [affordability, setAffordability] = useState(0);
  const [vitality, setVitality] = useState(0);
  const [resilience, setResilience] = useState(0);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const metricEffects = Object.fromEntries([
      ['affordability', affordability],
      ['vitality', vitality],
      ['resilience', resilience],
    ].filter(([, value]) => value !== 0));
    onAdd({
      worldId,
      branchId,
      label,
      category,
      startYear,
      durationYears,
      magnitude,
      metricEffects,
      notes: 'Created in Worldline Studio. Scenario input only.',
      epistemicClass: 'SIMULATED',
    });
  };

  return (
    <section className="wl-studio-composer" aria-label="Intervention Composer">
      <div className="wl-panel-header">
        <div>
          <div className="wl-panel-kicker">STUDIO</div>
          <h3>Intervention Composer</h3>
        </div>
        <span className="wl-badge">SIMULATED</span>
      </div>
      <form className="wl-studio-form" onSubmit={submit}>
        <label>
          <span>Intervention</span>
          <input aria-label="Intervention name" value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <label>
          <span>Category</span>
          <select aria-label="Intervention category" value={category} onChange={(event) => setCategory(event.target.value as InterventionCategory)}>
            {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>Start year</span>
          <input aria-label="Intervention start year" type="number" value={startYear} onChange={(event) => setStartYear(Number(event.target.value))} />
        </label>
        <label>
          <span>Duration</span>
          <input aria-label="Intervention duration years" type="number" min="0" placeholder="Open ended" value={durationYears ?? ''} onChange={(event) => setDurationYears(event.target.value === '' ? null : Number(event.target.value))} />
        </label>
        <label>
          <span>Magnitude</span>
          <input aria-label="Intervention magnitude" type="number" step="0.1" value={magnitude} onChange={(event) => setMagnitude(Number(event.target.value))} />
        </label>
        <fieldset className="wl-studio-effects">
          <legend>Metric effects</legend>
          <label><span>Affordability</span><input aria-label="Affordability effect" type="number" step="0.1" value={affordability} onChange={(event) => setAffordability(Number(event.target.value))} /></label>
          <label><span>Vitality</span><input aria-label="Vitality effect" type="number" step="0.1" value={vitality} onChange={(event) => setVitality(Number(event.target.value))} /></label>
          <label><span>Resilience</span><input aria-label="Resilience effect" type="number" step="0.1" value={resilience} onChange={(event) => setResilience(Number(event.target.value))} /></label>
        </fieldset>
        <div className="wl-studio-form-actions">
          <button className="wl-secondary" type="submit">Add scenario input</button>
          <button className="wl-primary" type="button" onClick={onRun}>Run experiment</button>
        </div>
      </form>
      <p className="wl-help">Every intervention is an explicit scenario input. It never rewrites observed evidence or claims a calibrated policy effect.</p>
    </section>
  );
}
