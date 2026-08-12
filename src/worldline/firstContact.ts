export const FIRST_CONTACT_DURATION_MS = 1400;
export const FIRST_CONTACT_STORAGE_KEY = 'worldline.first-contact.v1';

export function shouldShowFirstContact(input: { reducedMotion: boolean; seen: boolean }): boolean {
  return !input.reducedMotion && !input.seen;
}
