import { clearHistory } from '../lib/history';
import { useWorldHistory } from '../hooks/useWorldHistory';

interface HistoryPanelProps {
  activeSeed: number;
  onLoad: (seedString: string) => void;
}

export function HistoryPanel({ activeSeed, onLoad }: HistoryPanelProps) {
  const history = useWorldHistory();

  if (history.length === 0) return null;

  return (
    <div className="panel-section history-panel">
      <div className="history-header">
        <h3>Recent Worlds</h3>
        <button className="history-clear" type="button" onClick={clearHistory}>
          Clear
        </button>
      </div>
      <div className="history-list">
        {history.map((entry) => (
          <button
            key={entry.seed}
            type="button"
            className={`history-chip ${entry.seed === activeSeed ? 'active' : ''}`}
            onClick={() => onLoad(entry.seedString)}
            title={`Scale ${entry.scale} · Sea ${(entry.seaLevel * 100).toFixed(0)}% · ${entry.width}²`}
          >
            {entry.seedString}
          </button>
        ))}
      </div>
    </div>
  );
}
