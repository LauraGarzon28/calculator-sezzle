import type { Calculation } from '../calculator/types';

export interface HistoryEntry extends Calculation {
  id: string;
  createdAt: number;
}

export interface HistoryStorage {
  load(): HistoryEntry[];
  save(entries: HistoryEntry[]): void;
}

export const HISTORY_LIMIT = 20;
const STORAGE_KEY = 'calculator:history';

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

// Persists the history in localStorage
export function createLocalHistoryStorage(store: KeyValueStore | null = getLocalStorage(), key = STORAGE_KEY): HistoryStorage {
  return {
    load() {
      try {
        const parsed: unknown = JSON.parse(store?.getItem(key) ?? '[]');
        return Array.isArray(parsed) ? parsed.filter(isHistoryEntry).slice(0, HISTORY_LIMIT) : [];
      } catch {
        return [];
      }
    },
    save(entries) {
      try {
        store?.setItem(key, JSON.stringify(entries));
      } catch {
        return;
      }
    },
  };
}

export function prependEntry(entries: HistoryEntry[], calculation: Calculation, now = Date.now()): HistoryEntry[] {
  const entry: HistoryEntry = {
    id: `${now}-${Math.random().toString(36).slice(2, 10)}`,
    expression: calculation.expression,
    result: calculation.result,
    createdAt: now,
  };
  return [entry, ...entries].slice(0, HISTORY_LIMIT);
}

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.expression === 'string' &&
    typeof entry.result === 'string' &&
    typeof entry.createdAt === 'number'
  );
}
