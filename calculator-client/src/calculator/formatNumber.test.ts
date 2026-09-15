import { describe, expect, it } from 'vitest';
import { formatNumber } from './formatNumber';

describe('formatNumber', () => {
  it.each([
    [5, '5'],
    [-12.5, '-12.5'],
    [0.1 + 0.2, '0.3'],
    [1 / 3, '0.333333333333333'],
    [-0, '0'],
    [1e21, '1e+21'],
    [1.5e-7, '1.5e-7'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatNumber(value)).toBe(expected);
  });
});
