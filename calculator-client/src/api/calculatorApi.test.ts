import { describe, expect, it, vi } from 'vitest';
import { CalculatorApiError, createHttpCalculatorApi } from './calculatorApi';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('createHttpCalculatorApi', () => {
  it('posts the operands and returns the result', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, { operation: 'add', operands: [2, 3], result: 5 }));
    const api = createHttpCalculatorApi('/api/v1', fetchFn);

    await expect(api.calculate('add', [2, 3])).resolves.toBe(5);
    expect(fetchFn).toHaveBeenCalledWith('/api/v1/operations/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operands: [2, 3] }),
    });
  });

  it('throws an error with the code returned by the API', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse(422, { error: { code: 'DIVISION_BY_ZERO', message: 'division by zero' } }));
    const api = createHttpCalculatorApi('/api/v1', fetchFn);

    const error = await api.calculate('divide', [1, 0]).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CalculatorApiError);
    expect(error).toMatchObject({ code: 'DIVISION_BY_ZERO', status: 422, message: 'division by zero' });
  });

  it('handles error responses without a JSON body', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('Bad gateway', { status: 502 }));
    const api = createHttpCalculatorApi('/api/v1', fetchFn);

    await expect(api.calculate('add', [1, 2])).rejects.toMatchObject({ code: 'UNEXPECTED_RESPONSE', status: 502 });
  });

  it('rejects successful responses without a numeric result', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, { result: 'five' }));
    const api = createHttpCalculatorApi('/api/v1', fetchFn);

    await expect(api.calculate('add', [2, 3])).rejects.toMatchObject({ code: 'UNEXPECTED_RESPONSE' });
  });

  it('reports network failures', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const api = createHttpCalculatorApi('/api/v1', fetchFn);

    await expect(api.calculate('add', [2, 3])).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });

  it('uses the global fetch by default', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse(200, { result: 9 }));
    vi.stubGlobal('fetch', fetchSpy);

    await expect(createHttpCalculatorApi().calculate('sqrt', [81])).resolves.toBe(9);
    expect(fetchSpy).toHaveBeenCalledWith('/api/v1/operations/sqrt', expect.anything());

    vi.unstubAllGlobals();
  });
});
