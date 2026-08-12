import { create4DWorldBenchExport, createBenchmarkReceipt, createOmniWorldBenchTrace } from '../../worldline/benchmarks';
import type { WorldlineState } from '../../worldline/types';

export function BenchmarkLab({ state }: { state: WorldlineState }) {
  const fourD = create4DWorldBenchExport(state);
  const omni = createOmniWorldBenchTrace(state);
  const receipts = [
    createBenchmarkReceipt({ benchmark: '4DWorldBench', status: 'NOT_RUN' }),
    createBenchmarkReceipt({ benchmark: 'Omni-WorldBench', status: 'NOT_RUN' }),
  ];
  return (
    <section className="wl-benchmark-lab">
      <div className="wl-panel-kicker">BENCHMARK LAB</div>
      <h3>External evaluation adapters</h3>
      <div className="wl-benchmark-grid">
        <article><strong>4DWorldBench</strong><span>{fourD.renderFrames.length} exportable temporal frames</span><small>Adapter ready · benchmark not executed</small></article>
        <article><strong>Omni-WorldBench</strong><span>{omni.transitions.length} deterministic state transitions</span><small>Adapter ready · benchmark not executed</small></article>
      </div>
      {receipts.map((receipt) => <div className="wl-benchmark-receipt" key={receipt.id}><span>{receipt.benchmark}</span><code>{receipt.status}</code><strong>{receipt.score === null ? 'NO SCORE' : receipt.score}</strong></div>)}
      <p className="wl-help">Compatibility artifacts and receipts are evidence plumbing only. Worldline records no benchmark score until the external benchmark is actually executed.</p>
    </section>
  );
}
