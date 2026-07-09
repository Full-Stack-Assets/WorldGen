import { useSyncExternalStore } from 'react';
import { getHistory, subscribeHistory, type HistoryEntry } from '../lib/history';

const EMPTY: HistoryEntry[] = [];

export function useWorldHistory(): HistoryEntry[] {
  return useSyncExternalStore(subscribeHistory, getHistory, () => EMPTY);
}
