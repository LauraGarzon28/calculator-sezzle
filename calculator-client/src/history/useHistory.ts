import { useCallback, useEffect, useState } from 'react';
import type { Calculation } from '../calculator/types';
import { prependEntry, type HistoryEntry, type HistoryStorage } from './historyStorage';

export function useHistory(storage: HistoryStorage) {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => storage.load());

  useEffect(() => {
    storage.save(entries);
  }, [storage, entries]);

  const add = useCallback((calculation: Calculation) => {
    setEntries((current) => prependEntry(current, calculation));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, add, clear };
}
