import type { OperationName } from '../calculator/types';

export interface CalculatorApi {
  calculate(operation: OperationName, operands: number[]): Promise<number>;
}

export class CalculatorApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'CalculatorApiError';
    this.code = code;
    this.status = status;
  }
}

type FetchFn = (input: string, init: RequestInit) => Promise<Response>;

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export function createHttpCalculatorApi(
  baseUrl: string = DEFAULT_BASE_URL,
  fetchFn: FetchFn = (input, init) => fetch(input, init),
): CalculatorApi {
  return {
    async calculate(operation, operands) {
      let response: Response;
      try {
        response = await fetchFn(`${baseUrl}/operations/${operation}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operands }),
        });
      } catch {
        throw new CalculatorApiError('Unable to reach the calculator service', 'NETWORK_ERROR', 0);
      }

      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = readErrorDetail(body);
        throw new CalculatorApiError(
          detail?.message ?? `Request failed with status ${response.status}`,
          detail?.code ?? 'UNEXPECTED_RESPONSE',
          response.status,
        );
      }
      if (!isRecord(body) || typeof body.result !== 'number') {
        throw new CalculatorApiError('Unexpected response from the calculator service', 'UNEXPECTED_RESPONSE', response.status);
      }
      return body.result;
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readErrorDetail(body: unknown): { code: string; message: string } | null {
  if (!isRecord(body) || !isRecord(body.error)) {
    return null;
  }
  const { code, message } = body.error;
  return typeof code === 'string' && typeof message === 'string' ? { code, message } : null;
}
