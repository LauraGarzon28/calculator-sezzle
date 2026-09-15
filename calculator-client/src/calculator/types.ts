export type BinaryOperator = 'add' | 'subtract' | 'multiply' | 'divide' | 'power';

export type OperationName = BinaryOperator | 'sqrt' | 'percentage';

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type CalculatorAction =
  | { type: 'digit'; digit: Digit }
  | { type: 'decimal' }
  | { type: 'operator'; operator: BinaryOperator }
  | { type: 'equals' }
  | { type: 'sqrt' }
  | { type: 'percent' }
  | { type: 'negate' }
  | { type: 'backspace' }
  | { type: 'clearEntry' }
  | { type: 'clear' }
  | { type: 'recall'; value: string };

export const OPERATOR_SYMBOLS: Record<BinaryOperator, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
};

const ACTIONS_AVAILABLE_ON_ERROR = new Set<CalculatorAction['type']>([
  'digit',
  'decimal',
  'backspace',
  'clearEntry',
  'clear',
  'recall',
]);

/** While an error is shown, only actions that start a new entry are accepted. */
export function isAvailableOnError(action: CalculatorAction): boolean {
  return ACTIONS_AVAILABLE_ON_ERROR.has(action.type);
}

/** A completed calculation, as recorded in the history. */
export interface Calculation {
  expression: string;
  result: string;
}
