import type { FlagshipStage } from './flagshipSequence';

export interface FlagshipSequenceControlsProps {
  stages: readonly FlagshipStage[];
  activeStageIndex: number;
  completedStageIndex: number;
  playing: boolean;
  exporting: boolean;
  status: string | null;
  onPlay: () => void;
  onPause: () => void;
  onExit: () => void;
  onExport: () => void;
  onSelectStage: (index: number) => void;
  compact?: boolean;
}

function stageControlLabel(stage: FlagshipStage): string {
  const text = stage.id.replaceAll('-', ' ');
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

export function FlagshipSequenceControls({
  stages,
  activeStageIndex,
  completedStageIndex,
  playing,
  exporting,
  status,
  onPlay,
  onPause,
  onExit,
  onExport,
  onSelectStage,
  compact = false,
}: FlagshipSequenceControlsProps) {
  const activeStage = stages[activeStageIndex] ?? stages[0];
  const progress = stages.length > 1 ? activeStageIndex / (stages.length - 1) : 0;

  return (
    <section className={`wl-flagship-ui ${compact ? 'wl-flagship-compact' : ''}`} aria-label="WorldGen flagship cinematic sequence">
      <div className="wl-flagship-letterbox" aria-hidden="true" />

      <div className="wl-flagship-stage" aria-live="polite">
        <span className="wl-flagship-kicker">WORLDGEN FLAGSHIP FLIGHT</span>
        <h1>{activeStage.title}</h1>
        <p>{activeStage.subtitle}</p>
        <div className="wl-flagship-stage-count">
          {String(activeStageIndex + 1).padStart(2, '0')} / {String(stages.length).padStart(2, '0')}
        </div>
      </div>

      <div className="wl-flagship-progress" aria-label="Cinematic journey progress">
        <div className="wl-flagship-progress-track" aria-hidden="true">
          <i style={{ transform: `scaleX(${progress})` }} />
        </div>
        <div className="wl-flagship-stage-markers">
          {stages.map((stage, index) => {
            const reached = index <= completedStageIndex;
            return (
              <button
                key={stage.id}
                type="button"
                aria-label={`Jump to ${stageControlLabel(stage)}`}
                aria-pressed={index === activeStageIndex}
                disabled={!reached || playing || exporting}
                className={index === activeStageIndex ? 'active' : reached ? 'reached' : ''}
                onClick={() => onSelectStage(index)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="wl-flagship-controls">
        <button
          type="button"
          className="wl-flagship-primary"
          aria-label={playing ? 'Pause cinematic flight' : 'Play flagship flight'}
          onClick={playing ? onPause : onPlay}
          disabled={exporting}
        >
          {playing ? 'Pause' : activeStageIndex > 0 ? 'Replay' : 'Play'}
        </button>
        <button
          type="button"
          aria-label="Export WebM"
          onClick={onExport}
          disabled={playing || exporting}
        >
          {exporting ? 'Capturing' : 'Export WebM'}
        </button>
        <button type="button" aria-label="Explore freely" onClick={onExit}>
          Explore
        </button>
      </div>

      {status && <div className="wl-flagship-status" role="status" aria-live="polite">{status}</div>}
    </section>
  );
}
