import type { HistoryEntry } from '../../history/historyStorage';
import styles from './HistoryPanel.module.css';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onSelect: (result: string) => void;
  onClear: () => void;
}

export function HistoryPanel({ entries, onSelect, onClear }: HistoryPanelProps) {
  return (
    <section className={styles.panel} aria-labelledby="history-title">
      <header className={styles.header}>
        <h2 id="history-title" className={styles.title}>
          History
        </h2>
        <button type="button" className={styles.clear} onClick={onClear} disabled={entries.length === 0}>
          Clear history
        </button>
      </header>

      {entries.length === 0 ? (
        <p className={styles.empty}>There's no history yet.</p>
      ) : (
        <ol className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className={styles.entry}
                onClick={() => onSelect(entry.result)}
                title="Use this result"
              >
                <span className={styles.expression}>{entry.expression}</span>
                <span className={styles.result}>{entry.result}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
