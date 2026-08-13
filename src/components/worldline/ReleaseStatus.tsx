import { getBuildCommit, WORLDLINE_RELEASE } from '../../worldline/release';

export function ReleaseStatus() {
  return (
    <section className="wl-release-status" aria-label="Worldline release status">
      <div className="wl-panel-kicker">RELEASE</div>
      <h3>Worldline {WORLDLINE_RELEASE.version} · {WORLDLINE_RELEASE.codename}</h3>
      <dl className="wl-mechanics-list">
        <div><dt>Build</dt><dd>{getBuildCommit()}</dd></div>
        <div><dt>World state</dt><dd>{WORLDLINE_RELEASE.worldStateSchema}</dd></div>
        <div><dt>Studio project</dt><dd>{WORLDLINE_RELEASE.projectSchema}</dd></div>
        <div><dt>Experiment</dt><dd>{WORLDLINE_RELEASE.experimentSchema}</dd></div>
        <div><dt>Worldpack</dt><dd>{WORLDLINE_RELEASE.worldpackSchema}</dd></div>
        <div><dt>Research ledger</dt><dd>{WORLDLINE_RELEASE.researchLedgerSchema}</dd></div>
        <div><dt>Chronos</dt><dd>{WORLDLINE_RELEASE.chronosSchema}</dd></div>
        <div><dt>Required providers</dt><dd>{WORLDLINE_RELEASE.providerClasses.join(' · ')}</dd></div>
      </dl>
      <p className="wl-help">{WORLDLINE_RELEASE.evidenceBoundary}</p>
    </section>
  );
}
