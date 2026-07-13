import { describe, expect, it } from 'vitest';
import {
  parseLocalDate,
  parseLocalDateTime,
  toDateInputValue,
  toDateTimeLocalValue,
} from './dates';

describe('calendar date helpers', () => {
  it('parseLocalDate avoids UTC day shift', () => {
    const d = parseLocalDate('2026-07-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
  });

  it('roundtrips datetime-local', () => {
    const d = new Date(2026, 6, 15, 14, 30);
    const s = toDateTimeLocalValue(d);
    expect(s).toBe('2026-07-15T14:30');
    const back = parseLocalDateTime(s);
    expect(back?.getHours()).toBe(14);
    expect(back?.getMinutes()).toBe(30);
  });

  it('toDateInputValue formats yyyy-MM-dd', () => {
    expect(toDateInputValue(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('parseLocalDateTime rejects garbage', () => {
    expect(parseLocalDateTime('nope')).toBeNull();
  });
});
