import { CalculatorApiError } from '../api/calculatorApi';

const MESSAGES_BY_CODE: Record<string, string> = {
  DIVISION_BY_ZERO: 'Cannot divide by zero',
  NEGATIVE_SQUARE_ROOT: 'Invalid input',
  UNDEFINED_RESULT: 'Result is undefined',
  INVALID_OPERANDS: 'Invalid input',
  NETWORK_ERROR: 'Service unavailable',
};

const FALLBACK_MESSAGE = 'Something went wrong';

export function toUserMessage(error: unknown): string {
  if (error instanceof CalculatorApiError) {
    return MESSAGES_BY_CODE[error.code] ?? FALLBACK_MESSAGE;
  }
  return FALLBACK_MESSAGE;
}
