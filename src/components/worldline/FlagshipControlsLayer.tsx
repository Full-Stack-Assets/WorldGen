import { FlagshipSequenceControls } from './FlagshipSequenceControls';
import { FLAGSHIP_STAGES } from './flagshipSequence';

export interface CinematicJourneyState {
  activeStageIndex: number;
  completedStageIndex: number;
  playing: boolean;
  exporting: boolean;
  status: string | null;
  play: (startIndex?: number) => Promise<boolean>;
  pause: () => void;
  exit: () => void;
  exportWebM: () => Promise<void>;
  selectStage: (index: number) => Promise<void>;
}

export function FlagshipControlsLayer({
  journey,
  forgeOpen = false,
}: {
  journey: CinematicJourneyState;
  forgeOpen?: boolean;
}) {
  if (forgeOpen) return null;

  return (
    <FlagshipSequenceControls
      stages={FLAGSHIP_STAGES}
      activeStageIndex={journey.activeStageIndex}
      completedStageIndex={journey.completedStageIndex}
      playing={journey.playing}
      exporting={journey.exporting}
      status={journey.status}
      compact={forgeOpen}
      onPlay={() => void journey.play(0)}
      onPause={journey.pause}
      onExit={journey.exit}
      onExport={() => void journey.exportWebM()}
      onSelectStage={(index) => void journey.selectStage(index)}
    />
  );
}
