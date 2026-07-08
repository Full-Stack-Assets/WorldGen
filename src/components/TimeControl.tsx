interface TimeControlProps {
  timeOfDay: number;
  autoPlay: boolean;
  onScrub: (t: number) => void;
  onToggleAutoPlay: () => void;
}

function formatClock(timeOfDay: number): string {
  const totalMinutes = Math.floor(timeOfDay * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function TimeControl({ timeOfDay, autoPlay, onScrub, onToggleAutoPlay }: TimeControlProps) {
  return (
    <div className="time-control">
      <button
        className="hud-btn"
        type="button"
        onClick={onToggleAutoPlay}
        aria-label={autoPlay ? 'Pause day/night cycle' : 'Resume day/night cycle'}
        title={autoPlay ? 'Pause day/night cycle' : 'Resume day/night cycle'}
      >
        {autoPlay ? '⏸' : '▶'}
      </button>
      <input
        className="time-slider"
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={timeOfDay}
        aria-label="Time of day"
        onChange={(e) => onScrub(parseFloat(e.target.value))}
      />
      <span className="time-readout">{formatClock(timeOfDay)}</span>
    </div>
  );
}
