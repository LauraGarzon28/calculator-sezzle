import { useCallback, useEffect, useRef, useState } from 'react';
import { initialState, type CalculatorEngine } from './engine';
import type { Calculation, CalculatorAction } from './types';

export function useCalculator(engine: CalculatorEngine, onCalculation?: (calculation: Calculation) => void) {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(initialState);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const onCalculationRef = useRef(onCalculation);

  useEffect(() => {
    onCalculationRef.current = onCalculation;
  }, [onCalculation]);

  const dispatch = useCallback(
    (action: CalculatorAction) => {
      queueRef.current = queueRef.current
        .then(async () => {
          const { state: next, calculation } = await engine(stateRef.current, action);
          stateRef.current = next;
          setState(next);
          if (calculation) {
            onCalculationRef.current?.(calculation);
          }
        })
        .catch((error: unknown) => console.error('Calculator action failed', error));
    },
    [engine],
  );

  return { state, dispatch };
}
