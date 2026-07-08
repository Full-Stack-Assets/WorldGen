// WorldGen Pro — a real, license-gated upgrade tier.
//
// Verification is done client-side against Gumroad's public license API. On a
// static site there is no server to hide the gate behind, so this is a
// good-faith unlock (a determined user can bypass any client-only check), not
// DRM. Everything Pro adds is additive — the free tier is never degraded.

const STORAGE_KEY = 'worldgen_pro';
const CHANGE_EVENT = 'worldgen-pro-change';

export interface ProConfig {
  buyUrl?: string;
  gumroadProductId?: string;
  licensingAvailable: boolean;
}

export interface VerifyResult {
  ok: boolean;
  message: string;
}

function cleanUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return /^https:\/\//.test(trimmed) ? trimmed : undefined;
}

export function getProConfig(): ProConfig {
  const env = import.meta.env;
  const gumroadProductId = env.VITE_GUMROAD_PRODUCT_ID?.trim() || undefined;
  return {
    buyUrl: cleanUrl(env.VITE_PRO_PRODUCT_URL),
    gumroadProductId,
    licensingAvailable: Boolean(gumroadProductId),
  };
}

export function isProUnlocked(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    return Boolean((JSON.parse(raw) as { key?: string })?.key);
  } catch {
    return false;
  }
}

function notifyChange(): void {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeProChange(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function clearLicense(): void {
  localStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

interface GumroadPurchase {
  refunded?: boolean;
  chargebacked?: boolean;
  disputed?: boolean;
}

export async function verifyLicense(licenseKey: string): Promise<VerifyResult> {
  const key = licenseKey.trim();
  if (!key) return { ok: false, message: 'Enter your license key.' };

  const { gumroadProductId } = getProConfig();
  if (!gumroadProductId) {
    return { ok: false, message: 'Licensing is not configured for this site.' };
  }

  try {
    const body = new URLSearchParams({
      product_id: gumroadProductId,
      license_key: key,
      increment_uses_count: 'false',
    });
    const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await res.json()) as { success?: boolean; purchase?: GumroadPurchase };
    const purchase = data.purchase;
    const valid =
      data.success === true &&
      purchase !== undefined &&
      !purchase.refunded &&
      !purchase.chargebacked &&
      !purchase.disputed;

    if (!valid) {
      return { ok: false, message: 'That license key could not be verified.' };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ key, verifiedAt: new Date().toISOString() }));
    notifyChange();
    return { ok: true, message: 'Pro unlocked — thank you for supporting WorldGen!' };
  } catch {
    return { ok: false, message: 'Could not reach the licensing server. Please try again.' };
  }
}
