import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FLAGSHIP_STAGES } from '../flagshipSequence';
import { FlagshipSequenceControls } from '../FlagshipSequenceControls';

function renderControls(overrides: Partial<Parameters<typeof FlagshipSequenceControls>[0]> = {}) {
  return renderToStaticMarkup(
    <FlagshipSequenceControls
      stages={FLAGSHIP_STAGES}
      activeStageIndex={0}
      completedStageIndex={0}
      playing={false}
      exporting={false}
      status={null}
      onPlay={() => undefined}
      onPause={() => undefined}
      onExit={() => undefined}
      onExport={() => undefined}
      onSelectStage={() => undefined}
      {...overrides}
    />,
  );
}

describe('FlagshipSequenceControls', () => {
  it('renders the active cinematic stage and compact controls', () => {
    const markup = renderControls();
    expect(markup).toContain('Space');
    expect(markup).toContain('Play flagship flight');
    expect(markup).toContain('Export WebM');
    expect(markup).toContain('Explore freely');
  });

  it('renders pause while the sequence is playing', () => {
    expect(renderControls({ playing: true })).toContain('Pause cinematic flight');
  });

  it('keeps future stage markers disabled until reached', () => {
    const markup = renderControls({ activeStageIndex: 2, completedStageIndex: 2 });
    expect(markup).toContain('North America');
    expect(markup).toMatch(/aria-label="Jump to Future view"[^>]*disabled/);
  });

  it('announces capture status without replacing the stage title', () => {
    const markup = renderControls({ status: 'Preparing WebM capture.' });
    expect(markup).toContain('Preparing WebM capture.');
    expect(markup).toContain('Space');
  });
});
