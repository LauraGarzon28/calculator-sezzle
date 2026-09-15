import { beforeEach, describe, expect, it } from 'vitest';
import { CalculatorApiError } from '../api/calculatorApi';
import { createFakeCalculatorApi } from '../test/fakeCalculatorApi.ts';
import { createCalculatorEngine, initialState, type CalculatorEngine, type CalculatorState } from './engine';
import type { Calculation, CalculatorAction, Digit } from './types';

const TOKEN_ACTIONS: Record<string, CalculatorAction> = {
  '+': { type: 'operator', operator: 'add' },
  '-': { type: 'operator', operator: 'subtract' },
  '*': { type: 'operator', operator: 'multiply' },
  '/': { type: 'operator', operator: 'divide' },
  '^': { type: 'operator', operator: 'power' },
  '=': { type: 'equals' },
  '%': { type: 'percent' },
  sqrt: { type: 'sqrt' },
  neg: { type: 'negate' },
  back: { type: 'backspace' },
  CE: { type: 'clearEntry' },
  C: { type: 'clear' },
};

/** Converts "12.5 + 3 =" into the actions produced by pressing those keys. */
function toActions(input: string): CalculatorAction[] {
  return input
    .split(' ')
    .filter(Boolean)
    .flatMap((token) =>
      TOKEN_ACTIONS[token]
        ? [TOKEN_ACTIONS[token]]
        : [...token].map((char): CalculatorAction =>
            char === '.' ? { type: 'decimal' } : { type: 'digit', digit: char as Digit },
          ),
    );
}

describe('calculator engine', () => {
  let api: ReturnType<typeof createFakeCalculatorApi>;
  let engine: CalculatorEngine;

  beforeEach(() => {
    api = createFakeCalculatorApi();
    engine = createCalculatorEngine(api);
  });

  async function press(input: string, from: CalculatorState = initialState) {
    let state = from;
    const calculations: Calculation[] = [];
    for (const action of toActions(input)) {
      const transition = await engine(state, action);
      state = transition.state;
      if (transition.calculation) {
        calculations.push(transition.calculation);
      }
    }
    return { state, calculations };
  }

  describe('entry', () => {
    it.each([
      ['7', '7'],
      ['0 0 7', '7'],
      ['12.5', '12.5'],
      ['. 5', '0.5'],
      ['1.2.3', '1.23'],
      ['123 back', '12'],
      ['5 back', '0'],
      ['5 neg', '-5'],
      ['5 neg neg', '5'],
      ['0 neg', '0'],
      ['5 neg back', '0'],
      ['12345678901234567890', '1234567890123456'],
      ['123 CE', '0'],
    ])('"%s" shows %s', async (input, expected) => {
      const { state } = await press(input);
      expect(state.display).toBe(expected);
    });

    it('does not call the API while typing', async () => {
      await press('12.5 neg back CE');
      expect(api.calculate).not.toHaveBeenCalled();
    });
  });

  describe('binary operations', () => {
    it.each([
      ['2 + 3 =', '5'],
      ['10 - 4 =', '6'],
      ['6 * 7 =', '42'],
      ['10 / 4 =', '2.5'],
      ['2 ^ 10 =', '1024'],
      ['0.1 + 0.2 =', '0.3'],
      ['5 neg * 3 =', '-15'],
    ])('"%s" results in %s', async (input, expected) => {
      const { state } = await press(input);
      expect(state.display).toBe(expected);
      expect(state.evaluated).toBe(true);
    });

    it('shows the pending expression after an operator', async () => {
      const { state } = await press('12 +');
      expect(state.display).toBe('12');
      expect(state.expression).toBe('12 + ');
      expect(api.calculate).not.toHaveBeenCalled();
    });

    it('computes the pending operation when another operator is pressed', async () => {
      const { state, calculations } = await press('2 + 3 *');

      expect(api.calculate).toHaveBeenCalledWith('add', [2, 3]);
      expect(state.display).toBe('5');
      expect(state.expression).toBe('5 × ');
      expect(calculations).toEqual([{ expression: '2 + 3 =', result: '5' }]);
    });

    it('chains several operations left to right', async () => {
      const { state, calculations } = await press('2 + 3 * 4 - 1 =');

      expect(state.display).toBe('19');
      expect(state.expression).toBe('20 − 1 =');
      expect(calculations.map((c) => c.result)).toEqual(['5', '20', '19']);
    });

    it('replaces the operator when two operators are pressed in a row', async () => {
      const { state } = await press('8 + - 3 =');

      expect(api.calculate).toHaveBeenCalledTimes(1);
      expect(api.calculate).toHaveBeenCalledWith('subtract', [8, 3]);
      expect(state.display).toBe('5');
    });

    it('uses the left operand as the right one when "=" follows an operator', async () => {
      const { state } = await press('4 * =');
      expect(state.display).toBe('16');
    });

    it('repeats the last operation when "=" is pressed again', async () => {
      const { state } = await press('2 + 3 = = =');
      expect(state.display).toBe('11');
      expect(state.expression).toBe('8 + 3 =');
    });

    it('repeats the last operation on a new entry', async () => {
      const { state } = await press('2 + 3 = 7 =');
      expect(state.display).toBe('10');
    });

    it('starts a new entry after a result', async () => {
      const { state } = await press('2 + 3 = 9');
      expect(state.display).toBe('9');
      expect(state.expression).toBe('');
    });

    it('continues from a result when an operator is pressed', async () => {
      const { state } = await press('2 + 3 = * 2 =');
      expect(state.display).toBe('10');
    });

    it('echoes the entry when "=" is pressed without an operation', async () => {
      const { state } = await press('4.50 =');
      expect(state.display).toBe('4.5');
      expect(state.expression).toBe('4.5 =');
      expect(api.calculate).not.toHaveBeenCalled();
    });
  });

  describe('unary operations', () => {
    it('applies the square root to the current entry', async () => {
      const { state, calculations } = await press('81 sqrt');

      expect(state.display).toBe('9');
      expect(state.expression).toBe('√(81)');
      expect(calculations).toEqual([{ expression: '√(81) =', result: '9' }]);
    });

    it('uses the square root as the right operand of a pending operation', async () => {
      const { state } = await press('2 + 9 sqrt =');
      expect(state.display).toBe('5');
    });

    it('uses a square root taken right after an operator as the operand', async () => {
      const { state } = await press('16 + sqrt =');
      expect(state.display).toBe('20');
    });

    it.each([
      ['50 %', '0.5'],
      ['200 + 10 % =', '220'],
      ['200 - 10 % =', '180'],
      ['50 * 10 % =', '5'],
    ])('"%s" results in %s', async (input, expected) => {
      const { state } = await press(input);
      expect(state.display).toBe(expected);
    });

    it('does not record percentage conversions in the history', async () => {
      const { calculations } = await press('200 + 10 %');
      expect(calculations).toEqual([]);
    });
  });

  describe('errors', () => {
    it('shows an error when dividing by zero', async () => {
      const { state } = await press('5 / 0 =');

      expect(state.error).toBe('Cannot divide by zero');
      expect(state.expression).toBe('5 ÷ 0 =');
    });

    it('shows an error for the square root of a negative number', async () => {
      const { state } = await press('4 neg sqrt');
      expect(state.error).toBe('Invalid input');
    });

    it('ignores operators while an error is shown', async () => {
      const { state } = await press('5 / 0 = + sqrt %');
      expect(state.error).toBe('Cannot divide by zero');
    });

    it.each(['7', 'C', 'CE', 'back'])('recovers from an error with "%s"', async (key) => {
      const { state: errorState } = await press('5 / 0 =');
      const { state } = await press(key, errorState);
      expect(state.error).toBeNull();
    });

    it('shows a generic message when the service is unreachable', async () => {
      api.calculate.mockRejectedValueOnce(new CalculatorApiError('offline', 'NETWORK_ERROR', 0));
      const { state } = await press('1 + 1 =');
      expect(state.error).toBe('Service unavailable');
    });

    it('handles unexpected failures', async () => {
      api.calculate.mockRejectedValueOnce(new Error('boom'));
      const { state } = await press('1 + 1 =');
      expect(state.error).toBe('Something went wrong');
    });
  });

  describe('clearing and recall', () => {
    it('clears everything with C', async () => {
      const { state } = await press('2 + 3 C');
      expect(state).toEqual(initialState);
    });

    it('clears only the entry with CE while keeping the pending operation', async () => {
      const { state } = await press('2 + 3 CE 4 =');
      expect(state.display).toBe('6');
    });

    it('resets after a result with CE', async () => {
      const { state } = await press('2 + 3 = CE');
      expect(state).toEqual(initialState);
    });

    it('clears the expression with backspace after a result, keeping the value', async () => {
      const { state } = await press('2 + 3 = back');
      expect(state.display).toBe('5');
      expect(state.expression).toBe('');
    });

    it('recalls a value from the history as the current operand', async () => {
      const { state: pending } = await press('10 +');
      const { state: recalled } = await engine(pending, { type: 'recall', value: '5' });
      const { state } = await engine(recalled, { type: 'equals' });

      expect(state.display).toBe('15');
    });
  });
});
