import { useRegisterSW } from 'virtual:pwa-register/react';

// Shows a small toast when a new service-worker build is waiting, and lets the
// user apply it (registerType: 'prompt', so we never reload without consent).
export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="pwa-toast glass-panel" role="status">
      <span>A new version of WorldGen is available.</span>
      <div className="pwa-toast-actions">
        <button className="btn btn-primary btn-sm" type="button" onClick={() => updateServiceWorker(true)}>
          Update
        </button>
        <button className="btn btn-sm" type="button" onClick={() => setNeedRefresh(false)}>
          Later
        </button>
      </div>
    </div>
  );
}
