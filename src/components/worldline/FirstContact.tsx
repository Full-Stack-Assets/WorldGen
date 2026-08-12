import { useEffect } from 'react';
import { FIRST_CONTACT_DURATION_MS } from '../../worldline/firstContact';

export function FirstContact({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, FIRST_CONTACT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <section className="wl-first-contact" aria-label="Worldline first contact" aria-live="polite">
      <button type="button" className="wl-first-skip" onClick={onComplete}>Skip</button>
      <div className="wl-first-space" aria-hidden="true">
        <i className="wl-first-point" />
        <i className="wl-first-line wl-first-line-main" />
        <i className="wl-first-line wl-first-line-a" />
        <i className="wl-first-line wl-first-line-b" />
        <i className="wl-first-line wl-first-line-c" />
      </div>
      <div className="wl-first-title">
        <strong>WORLDLINE</strong>
        <span>WORLDLINE ONE · 1.0.0</span>
        <small>Navigate what remains possible.</small>
      </div>
    </section>
  );
}
