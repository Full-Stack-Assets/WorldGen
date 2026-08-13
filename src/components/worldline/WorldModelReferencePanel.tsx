import { WORLD_MODEL_EVALUATION_DIMENSIONS, WORLD_MODEL_REFERENCES, createWorldModelEvaluationReceipt, scoreFromReceipt } from '../../worldline/worldModelRegistry';

function label(value: string): string {
  return value.replaceAll('_', ' ');
}

export function WorldModelReferencePanel() {
  return (
    <section className="wl-world-model-lab" aria-label="World Model Lab">
      <div className="wl-panel-kicker">WORLD MODEL LAB</div>
      <h3>Reference Architectures</h3>
      <p className="wl-help">These entries are research references captured from the Omphalis library. No external model is connected to the Worldline runtime unless its integration status changes from reference-only through a separately verified adapter.</p>
      <div className="wl-world-model-grid">
        {WORLD_MODEL_REFERENCES.map((model) => (
          <article key={model.id} className="wl-world-model-card">
            <div className="wl-panel-header">
              <strong>{model.name}</strong>
              <span className="wl-badge">REFERENCE ONLY</span>
            </div>
            <div className="wl-family-strip">
              {model.capabilities.map((capability) => <span key={capability}>{label(capability)}</span>)}
            </div>
            <small>{model.memoryHorizon}</small>
            <small>{model.grounding}</small>
          </article>
        ))}
      </div>
      <h3>Shared Evaluation Spine</h3>
      <div className="wl-family-strip" aria-label="World model evaluation dimensions">
        {WORLD_MODEL_EVALUATION_DIMENSIONS.map((dimension) => <span key={dimension}>{label(dimension)}</span>)}
      </div>
      <p className="wl-help">Evaluation readiness is not benchmark success. Scores remain absent until a real adapter run produces an executed receipt with evidence.</p>
      <p className="wl-help">Reference receipt score: {scoreFromReceipt(createWorldModelEvaluationReceipt({
        modelId: 'genie-3',
        evaluatorId: 'worldline-reference-contract',
        executed: false,
        evidence: [],
      })) ?? 'none — not executed'}.</p>
    </section>
  );
}
