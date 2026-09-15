import type { BinaryOperator, CalculatorAction, Digit } from './types';

const OPERATOR_KEYS: Record<string, BinaryOperator> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '^': 'power',
};

const ACTION_KEYS: Record<string, CalculatorAction> = {
  '.': { type: 'decimal' },
  ',': { type: 'decimal' },
  Enter: { type: 'equals' },
  '=': { type: 'equals' },
  Backspace: { type: 'backspace' },
  Delete: { type: 'clearEntry' },
  Escape: { type: 'clear' },
  '%': { type: 'percent' },
  '@': { type: 'sqrt' },
  F9: { type: 'negate' },
};

type KeyInput = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'>;

/** Maps a keyboard event to a calculator action, or null when the key isn't a shortcut. */
export function keyToAction({ key, ctrlKey, metaKey, altKey }: KeyInput): CalculatorAction | null {
  if (ctrlKey || metaKey || altKey) {
    return null;
  }
  if (/^[0-9]$/.test(key)) {
    return { type: 'digit', digit: key as Digit };
  }
  if (key in OPERATOR_KEYS) {
    return { type: 'operator', operator: OPERATOR_KEYS[key] };
  }
  return ACTION_KEYS[key] ?? null;
}
