import { useEffect, useRef } from 'react';
import { getMonetizationConfig } from '../lib/monetization';
import { useProStatus } from '../hooks/useProStatus';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const config = getMonetizationConfig();

// Renders a single AdSense unit. Loads the AdSense script only when a
// publisher client + slot are configured — otherwise renders nothing and no
// third-party request is ever made. Pro users never see ads.
export function AdBanner() {
  const isPro = useProStatus();
  const pushed = useRef(false);

  useEffect(() => {
    if (!config.adsense || isPro || pushed.current) return;

    const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsense.client}`;
    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blocked or script unavailable — the app must never break over ads.
    }
  }, [isPro]);

  if (!config.adsense || isPro) return null;

  return (
    <div className="ad-banner">
      <span className="ad-label">Ad</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: 90 }}
        data-ad-client={config.adsense.client}
        data-ad-slot={config.adsense.slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
