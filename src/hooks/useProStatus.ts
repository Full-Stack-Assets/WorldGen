import { useSyncExternalStore } from 'react';
import { isProUnlocked, subscribeProChange } from '../lib/pro';

export function useProStatus(): boolean {
  return useSyncExternalStore(subscribeProChange, isProUnlocked, () => false);
}
