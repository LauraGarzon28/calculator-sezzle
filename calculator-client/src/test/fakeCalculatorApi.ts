import { vi } from 'vitest';
import { CalculatorApiError, type CalculatorApi } from '../api/calculatorApi';
import type { OperationName } from '../calculator/types';

export function createFakeCalculatorApi() {
  const calculate = vi.fn(async (operation: OperationName, operands: number[]): Promise<number> => {
    const [a, b] = operands;
    switch (operation) {
      case 'add':
        return a + b;
      case 'subtract':
        return a - b;
      case 'multiply':
        return a * b;
      case 'divide':
        if (b === 0) {
          throw new CalculatorApiError('division by zero is not allowed', 'DIVISION_BY_ZERO', 422);
        }
        return a / b;
      case 'power':
        return a ** b;
      case 'sqrt':
        if (a < 0) {
          throw new CalculatorApiError('square root of a negative number is not defined', 'NEGATIVE_SQUARE_ROOT', 422);
        }
        return Math.sqrt(a);
      case 'percentage':
        return (a * b) / 100;
    }
  });

  return { calculate } satisfies CalculatorApi;
}
