import { getMonetizationConfig } from '../lib/monetization';

const config = getMonetizationConfig();

export function SupportPanel() {
  if (config.supportLinks.length === 0) return null;

  return (
    <div className="panel-section support-panel">
      <h3>Support WorldGen</h3>
      <div className="support-links">
        {config.supportLinks.map((link) => (
          <a
            key={link.id}
            className="btn btn-primary btn-sm"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.label}
          </a>
        ))}
      </div>
      <p className="hint">WorldGen is free and open source. Support keeps development going.</p>
    </div>
  );
}
