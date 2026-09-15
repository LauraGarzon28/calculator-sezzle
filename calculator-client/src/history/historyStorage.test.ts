import { describe, expect, it } from 'vitest';
import { HISTORY_LIMIT, createLocalHistoryStorage, prependEntry, type HistoryEntry } from './historyStorage';

const entry = (id: string): HistoryEntry => ({ id, expression: '1 + 1 =', result: '2', createdAt: 1 });

describe('createLocalHistoryStorage', () => {
  it('saves and loads entries', () => {
    const storage = createLocalHistoryStorage(window.localStorage);
    const entries = [entry('a'), entry('b')];

    storage.save(entries);

    expect(storage.load()).toEqual(entries);
  });

  it('returns an empty list when nothing is stored', () => {
    expect(createLocalHistoryStorage(window.localStorage).load()).toEqual([]);
  });

  it('ignores corrupted data', () => {
    window.localStorage.setItem('calculator:history', '{not json');
    expect(createLocalHistoryStorage(window.localStorage).load()).toEqual([]);
  });

  it('drops malformed entries', () => {
    window.localStorage.setItem('calculator:history', JSON.stringify([entry('a'), { id: 1 }, null, 'text']));
    expect(createLocalHistoryStorage(window.localStorage).load()).toEqual([entry('a')]);
  });

  it('ignores non-array data', () => {
    window.localStorage.setItem('calculator:history', JSON.stringify({ id: 'a' }));
    expect(createLocalHistoryStorage(window.localStorage).load()).toEqual([]);
  });

  it('keeps working when the storage is unavailable or throws', () => {
    const throwingStore = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };

    for (const store of [null, throwingStore]) {
      const storage = createLocalHistoryStorage(store);
      expect(() => storage.save([entry('a')])).not.toThrow();
      expect(storage.load()).toEqual([]);
    }
  });
});

describe('prependEntry', () => {
  it('adds the newest calculation first', () => {
    const result = prependEntry([entry('old')], { expression: '2 × 3 =', result: '6' }, 1000);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ expression: '2 × 3 =', result: '6', createdAt: 1000 });
    expect(result[1].id).toBe('old');
  });

  it(`keeps at most ${HISTORY_LIMIT} entries`, () => {
    const full = Array.from({ length: HISTORY_LIMIT }, (_, i) => entry(String(i)));

    const result = prependEntry(full, { expression: '1 + 1 =', result: '2' });

    expect(result).toHaveLength(HISTORY_LIMIT);
    expect(result.at(-1)?.id).toBe(String(HISTORY_LIMIT - 2));
  });
});
