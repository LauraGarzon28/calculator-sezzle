import { useEffect } from 'react';
import { keyToAction } from './keyboard';
import type { CalculatorAction } from './types';

export function useKeyboardShortcuts(dispatch: (action: CalculatorAction) => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const action = keyToAction(event);
      if (!action) {
        return;
      }
      event.preventDefault();
      dispatch(action);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);
}
