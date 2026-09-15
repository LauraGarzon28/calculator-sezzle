import { OPERATOR_SYMBOLS, type BinaryOperator, type CalculatorAction, type Digit } from '../../calculator/types';

export type KeyVariant = 'digit' | 'operator' | 'function' | 'equals';

export interface KeyDefinition {
  label: string;
  ariaLabel: string;
  action: CalculatorAction;
  variant: KeyVariant;
  wide?: boolean;
}

const digit = (value: Digit, wide = false): KeyDefinition => ({
  label: value,
  ariaLabel: value,
  action: { type: 'digit', digit: value },
  variant: 'digit',
  wide,
});

const operator = (value: BinaryOperator, ariaLabel: string): KeyDefinition => ({
  label: OPERATOR_SYMBOLS[value],
  ariaLabel,
  action: { type: 'operator', operator: value },
  variant: 'operator',
});

/** Keys in rendering order for a 4-column grid. */
export const KEYPAD_LAYOUT: KeyDefinition[] = [
  { label: '%', ariaLabel: 'Percent', action: { type: 'percent' }, variant: 'function' },
  { label: 'CE', ariaLabel: 'Clear entry', action: { type: 'clearEntry' }, variant: 'function' },
  { label: 'C', ariaLabel: 'Clear', action: { type: 'clear' }, variant: 'function' },
  { label: '⌫', ariaLabel: 'Backspace', action: { type: 'backspace' }, variant: 'function' },

  { label: 'xʸ', ariaLabel: 'Power', action: { type: 'operator', operator: 'power' }, variant: 'function' },
  { label: '√x', ariaLabel: 'Square root', action: { type: 'sqrt' }, variant: 'function' },
  { label: '±', ariaLabel: 'Negate', action: { type: 'negate' }, variant: 'function' },
  operator('divide', 'Divide'),

  digit('7'),
  digit('8'),
  digit('9'),
  operator('multiply', 'Multiply'),

  digit('4'),
  digit('5'),
  digit('6'),
  operator('subtract', 'Subtract'),

  digit('1'),
  digit('2'),
  digit('3'),
  operator('add', 'Add'),

  digit('0', true),
  { label: '.', ariaLabel: 'Decimal point', action: { type: 'decimal' }, variant: 'digit' },
  { label: '=', ariaLabel: 'Equals', action: { type: 'equals' }, variant: 'equals' },
];
