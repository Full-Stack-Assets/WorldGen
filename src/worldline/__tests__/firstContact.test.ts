import { describe, expect, it } from 'vitest';
import { FIRST_CONTACT_DURATION_MS, FIRST_CONTACT_STORAGE_KEY, shouldShowFirstContact } from '../firstContact';

describe('Worldline First Contact', () => {
  it('shows for a fresh normal-motion session', () => {
    expect(shouldShowFirstContact({ reducedMotion: false, seen: false })).toBe(true);
  });

  it('bypasses for reduced-motion users', () => {
    expect(shouldShowFirstContact({ reducedMotion: true, seen: false })).toBe(false);
  });

  it('bypasses when the release cinematic was already seen', () => {
    expect(shouldShowFirstContact({ reducedMotion: false, seen: true })).toBe(false);
  });

  it('stays within the 1.5 second interaction budget and uses a versioned storage key', () => {
    expect(FIRST_CONTACT_DURATION_MS).toBeLessThanOrEqual(1500);
    expect(FIRST_CONTACT_DURATION_MS).toBe(1400);
    expect(FIRST_CONTACT_STORAGE_KEY).toBe('worldline.first-contact.v1');
  });
});