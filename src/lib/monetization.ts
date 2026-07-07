// Every monetization channel is opt-in via build-time env vars: with nothing
// configured, no monetization UI renders and no third-party scripts load.

export interface SupportLink {
  id: 'kofi' | 'sponsors' | 'patreon';
  label: string;
  url: string;
}

export interface MonetizationConfig {
  supportLinks: SupportLink[];
  adsense?: { client: string; slot: string };
}

function cleanUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return /^https:\/\//.test(trimmed) ? trimmed : undefined;
}

export function getMonetizationConfig(): MonetizationConfig {
  const env = import.meta.env;
  const supportLinks: SupportLink[] = [];

  const kofi = cleanUrl(env.VITE_SUPPORT_KOFI);
  if (kofi) supportLinks.push({ id: 'kofi', label: 'Buy me a coffee', url: kofi });

  const sponsors = cleanUrl(env.VITE_SUPPORT_GITHUB_SPONSORS);
  if (sponsors) supportLinks.push({ id: 'sponsors', label: 'GitHub Sponsors', url: sponsors });

  const patreon = cleanUrl(env.VITE_SUPPORT_PATREON);
  if (patreon) supportLinks.push({ id: 'patreon', label: 'Patreon', url: patreon });

  const client = env.VITE_ADSENSE_CLIENT?.trim();
  const slot = env.VITE_ADSENSE_SLOT?.trim();

  return {
    supportLinks,
    adsense: client && slot ? { client, slot } : undefined,
  };
}
