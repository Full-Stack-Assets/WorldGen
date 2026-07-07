import { AFFILIATE_PARTNERS, affiliatesEnabled } from '../lib/affiliates';

const enabled = affiliatesEnabled();

export function AffiliatePanel() {
  if (!enabled) return null;

  return (
    <div className="panel-section affiliate-panel">
      <h3>Recommended Tools</h3>
      <div className="affiliate-list">
        {AFFILIATE_PARTNERS.map((partner) => (
          <a
            key={partner.id}
            className="affiliate-card"
            href={partner.url}
            target="_blank"
            rel="sponsored noopener noreferrer"
          >
            <span className="affiliate-name">{partner.name}</span>
            <span className="affiliate-desc">{partner.description}</span>
          </a>
        ))}
      </div>
      <p className="hint affiliate-disclosure">
        Some links are affiliate links — WorldGen may earn a commission at no extra cost to you.
      </p>
    </div>
  );
}
