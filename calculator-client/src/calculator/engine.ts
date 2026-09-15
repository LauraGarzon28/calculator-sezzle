import type { CalculatorApi } from '../api/calculatorApi';
import { toUserMessage } from './errorMessages';
import { formatNumber } from './formatNumber';
import {
  OPERATOR_SYMBOLS,
  isAvailableOnError,
  type BinaryOperator,
  type Calculation,
  type CalculatorAction,
  type Digit,
  type OperationName,
} from './types';

export interface CalculatorState {
  /** Main display: the entry being typed or the last result. */
  display: string;
  /** Secondary line describing the current expression, e.g. "12 + ". */
  expression: string;
  /** Left operand of the pending operation. */
  accumulator: number | null;
  pendingOperator: BinaryOperator | null;
  /** Operation repeated when "=" is pressed again, as in the Windows calculator. */
  lastOperation: { operator: BinaryOperator; operand: number } | null;
  /** The next digit replaces the display instead of being appended to it. */
  startNewEntry: boolean;
  /** An operator was just pressed and the right operand hasn't been provided yet. */
  awaitingOperand: boolean;
  /** "=" was just pressed; the next entry starts a new expression. */
  evaluated: boolean;
  error: string | null;
}

export interface Transition {
  state: CalculatorState;
  calculation?: Calculation;
}

export type CalculatorEngine = (state: CalculatorState, action: CalculatorAction) => Promise<Transition>;

export const initialState: CalculatorState = {
  display: '0',
  expression: '',
  accumulator: null,
  pendingOperator: null,
  lastOperation: null,
  startNewEntry: false,
  awaitingOperand: false,
  evaluated: false,
  error: null,
};

const MAX_ENTRY_DIGITS = 16;

export function createCalculatorEngine(api: CalculatorApi): CalculatorEngine {
  return async (state, action) => {
    if (state.error && !isAvailableOnError(action)) {
      return { state };
    }

    switch (action.type) {
      case 'digit':
        return { state: inputDigit(state, action.digit) };
      case 'decimal':
        return { state: inputDecimal(state) };
      case 'negate':
        return { state: negate(state) };
      case 'backspace':
        return { state: backspace(state) };
      case 'clearEntry':
        return { state: clearEntry(state) };
      case 'clear':
        return { state: initialState };
      case 'recall':
        return { state: { ...startFresh(state), display: action.value, startNewEntry: true, awaitingOperand: false } };
      case 'operator':
        return applyOperator(api, state, action.operator);
      case 'equals':
        return evaluate(api, state);
      case 'sqrt':
        return squareRoot(api, state);
      case 'percent':
        return percent(api, state);
    }
  };
}

function startFresh(state: CalculatorState): CalculatorState {
  if (state.error) {
    return initialState;
  }
  return state.evaluated ? { ...state, expression: '', evaluated: false } : state;
}

function inputDigit(state: CalculatorState, digit: Digit): CalculatorState {
  const current = startFresh(state);
  if (current.startNewEntry) {
    return { ...current, display: digit, startNewEntry: false, awaitingOperand: false };
  }
  if (countDigits(current.display) >= MAX_ENTRY_DIGITS) {
    return current;
  }
  return { ...current, display: current.display === '0' ? digit : current.display + digit };
}

function inputDecimal(state: CalculatorState): CalculatorState {
  const current = startFresh(state);
  if (current.startNewEntry) {
    return { ...current, display: '0.', startNewEntry: false, awaitingOperand: false };
  }
  if (current.display.includes('.')) {
    return current;
  }
  return { ...current, display: `${current.display}.` };
}

function negate(state: CalculatorState): CalculatorState {
  if (Number(state.display) === 0) {
    return state;
  }
  const display = state.display.startsWith('-') ? state.display.slice(1) : `-${state.display}`;
  return { ...state, display, awaitingOperand: false };
}

function backspace(state: CalculatorState): CalculatorState {
  if (state.error) {
    return initialState;
  }
  if (state.evaluated) {
    return { ...state, expression: '', evaluated: false };
  }
  if (state.startNewEntry) {
    return state;
  }
  const trimmed = state.display.slice(0, -1);
  return { ...state, display: trimmed === '' || trimmed === '-' ? '0' : trimmed };
}

function clearEntry(state: CalculatorState): CalculatorState {
  if (state.error || state.evaluated) {
    return initialState;
  }
  return { ...state, display: '0', startNewEntry: false, awaitingOperand: false };
}

async function applyOperator(api: CalculatorApi, state: CalculatorState, operator: BinaryOperator): Promise<Transition> {
  const { accumulator, pendingOperator } = state;

  if (accumulator === null || pendingOperator === null) {
    return { state: withPendingOperator(state, Number(state.display), operator) };
  }
  if (state.awaitingOperand) {
    // Pressing another operator right after one just replaces it.
    return { state: withPendingOperator(state, accumulator, operator) };
  }

  const operand = Number(state.display);
  const expression = binaryExpression(accumulator, pendingOperator, operand);
  return compute(api, pendingOperator, [accumulator, operand], expression, (result) => ({
    state: withPendingOperator(state, result, operator),
    calculation: { expression, result: formatNumber(result) },
  }));
}

async function evaluate(api: CalculatorApi, state: CalculatorState): Promise<Transition> {
  const current = Number(state.display);

  if (state.accumulator !== null && state.pendingOperator !== null) {
    return evaluateBinary(api, state.accumulator, state.pendingOperator, current);
  }
  if (state.lastOperation) {
    return evaluateBinary(api, current, state.lastOperation.operator, state.lastOperation.operand);
  }
  return {
    state: { ...state, display: formatNumber(current), expression: `${formatNumber(current)} =`, startNewEntry: true, evaluated: true },
  };
}

async function evaluateBinary(api: CalculatorApi, left: number, operator: BinaryOperator, right: number): Promise<Transition> {
  const expression = binaryExpression(left, operator, right);
  return compute(api, operator, [left, right], expression, (result) => ({
    state: {
      ...initialState,
      display: formatNumber(result),
      expression,
      lastOperation: { operator, operand: right },
      startNewEntry: true,
      evaluated: true,
    },
    calculation: { expression, result: formatNumber(result) },
  }));
}

async function squareRoot(api: CalculatorApi, state: CalculatorState): Promise<Transition> {
  const operand = Number(state.display);
  const label = `√(${formatNumber(operand)})`;
  const expression = pendingPrefix(state) + label;

  return compute(api, 'sqrt', [operand], expression, (result) => ({
    state: operandReplaced(state, result, expression),
    calculation: { expression: `${label} =`, result: formatNumber(result) },
  }));
}

/**
 * Mirrors the Windows calculator: with a pending addition or subtraction, "b%" becomes
 * b percent of the left operand; otherwise it becomes b / 100.
 */
async function percent(api: CalculatorApi, state: CalculatorState): Promise<Transition> {
  const operand = Number(state.display);
  const { accumulator, pendingOperator } = state;
  const relativeToAccumulator = accumulator !== null && (pendingOperator === 'add' || pendingOperator === 'subtract');
  const operands = relativeToAccumulator ? [accumulator, operand] : [operand, 1];

  return compute(api, 'percentage', operands, `${pendingPrefix(state)}${formatNumber(operand)}%`, (result) => ({
    state: operandReplaced(state, result, pendingPrefix(state) + formatNumber(result)),
  }));
}

async function compute(
  api: CalculatorApi,
  operation: OperationName,
  operands: number[],
  expression: string,
  onSuccess: (result: number) => Transition,
): Promise<Transition> {
  let result: number;
  try {
    result = await api.calculate(operation, operands);
  } catch (error) {
    return { state: { ...initialState, expression, error: toUserMessage(error) } };
  }
  return onSuccess(result);
}

function withPendingOperator(state: CalculatorState, accumulator: number, operator: BinaryOperator): CalculatorState {
  const formatted = formatNumber(accumulator);
  return {
    ...state,
    display: formatted,
    expression: `${formatted} ${OPERATOR_SYMBOLS[operator]} `,
    accumulator,
    pendingOperator: operator,
    startNewEntry: true,
    awaitingOperand: true,
    evaluated: false,
  };
}

function operandReplaced(state: CalculatorState, value: number, expression: string): CalculatorState {
  return { ...state, display: formatNumber(value), expression, startNewEntry: true, awaitingOperand: false, evaluated: false };
}

function pendingPrefix({ accumulator, pendingOperator }: CalculatorState): string {
  return accumulator !== null && pendingOperator !== null
    ? `${formatNumber(accumulator)} ${OPERATOR_SYMBOLS[pendingOperator]} `
    : '';
}

function binaryExpression(left: number, operator: BinaryOperator, right: number): string {
  return `${formatNumber(left)} ${OPERATOR_SYMBOLS[operator]} ${formatNumber(right)} =`;
}

function countDigits(value: string): number {
  return value.replace(/\D/g, '').length;
}
