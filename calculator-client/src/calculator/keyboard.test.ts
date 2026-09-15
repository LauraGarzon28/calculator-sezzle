import { describe, expect, it } from 'vitest';
import { keyToAction } from './keyboard';

const press = (key: string, modifiers: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey', boolean>> = {}) =>
  keyToAction({ key, ctrlKey: false, metaKey: false, altKey: false, ...modifiers });

describe('keyToAction', () => {
  it.each([
    ['7', { type: 'digit', digit: '7' }],
    ['.', { type: 'decimal' }],
    [',', { type: 'decimal' }],
    ['+', { type: 'operator', operator: 'add' }],
    ['-', { type: 'operator', operator: 'subtract' }],
    ['*', { type: 'operator', operator: 'multiply' }],
    ['/', { type: 'operator', operator: 'divide' }],
    ['^', { type: 'operator', operator: 'power' }],
    ['Enter', { type: 'equals' }],
    ['=', { type: 'equals' }],
    ['Backspace', { type: 'backspace' }],
    ['Delete', { type: 'clearEntry' }],
    ['Escape', { type: 'clear' }],
    ['%', { type: 'percent' }],
    ['@', { type: 'sqrt' }],
    ['F9', { type: 'negate' }],
  ])('maps "%s"', (key, expected) => {
    expect(press(key)).toEqual(expected);
  });

  it.each(['a', 'Tab', 'ArrowUp', ' ', '12'])('ignores "%s"', (key) => {
    expect(press(key)).toBeNull();
  });

  it('ignores shortcuts with modifier keys', () => {
    expect(press('c', { ctrlKey: true })).toBeNull();
    expect(press('7', { metaKey: true })).toBeNull();
    expect(press('+', { altKey: true })).toBeNull();
  });
});
