import { useCallback, useMemo } from 'react';
import type { CalculatorApi } from '../../api/calculatorApi';
import { createCalculatorEngine } from '../../calculator/engine';
import { useCalculator } from '../../calculator/useCalculator';
import { useKeyboardShortcuts } from '../../calculator/useKeyboardShortcuts';
import type { HistoryStorage } from '../../history/historyStorage';
import { useHistory } from '../../history/useHistory';
import { Display } from '../Display/Display';
import { HistoryPanel } from '../HistoryPanel/HistoryPanel';
import { Keypad } from '../Keypad/Keypad';
import styles from './Calculator.module.css';

interface CalculatorProps {
  api: CalculatorApi;
  historyStorage: HistoryStorage;
}

export function Calculator({ api, historyStorage }: CalculatorProps) {
  const engine = useMemo(() => createCalculatorEngine(api), [api]);
  const history = useHistory(historyStorage);
  const { state, dispatch } = useCalculator(engine, history.add);
  useKeyboardShortcuts(dispatch);

  const recall = useCallback((value: string) => dispatch({ type: 'recall', value }), [dispatch]);

  return (
    <div className={styles.layout}>
      <section className={styles.calculator} aria-label="Calculator">
        <Display expression={state.expression} value={state.display} error={state.error} />
        <Keypad onPress={dispatch} hasError={state.error !== null} />
      </section>
      <HistoryPanel entries={history.entries} onSelect={recall} onClear={history.clear} />
    </div>
  );
}
