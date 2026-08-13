import { clearHistory, historyEntryToConfig, type HistoryEntry } from '../lib/history';
import { useWorldHistory } from '../hooks/useWorldHistory';

interface HistoryPanelProps {
  activeSeed: number;
  onLoad: (entry: HistoryEntry) => void;
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
            onClick={() => onLoad(entry)}
            title={`Scale ${entry.scale} · Sea ${(entry.seaLevel * 100).toFixed(0)}% · ${entry.width}² · persist ${entry.persistence}`}
          >
            {entry.seedString}
          </button>
        ))}
      </div>
      <p className="history-hint">Restores full terrain and climate settings ({Object.keys(historyEntryToConfig(history[0])).length} fields).</p>
    </div>
  );
}
