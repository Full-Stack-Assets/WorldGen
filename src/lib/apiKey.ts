const STORAGE_KEY = 'worldgen_gemini_api_key';

export function getGeminiApiKey(): string | undefined {
  const stored = localStorage.getItem(STORAGE_KEY)?.trim();
  if (stored) return stored;

  const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  return envKey?.trim() || undefined;
}

export function setGeminiApiKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function isAiAvailable(): boolean {
  return Boolean(getGeminiApiKey());
}
