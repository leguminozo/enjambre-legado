import { describe, expect, it } from 'vitest';
import { calculateTimeRemaining, parseTargetDate } from './CensoCountdown';

describe('CensoCountdown', () => {
  it('parses YYYY-MM-DD to end of day', () => {
    const d = parseTargetDate('2026-10-31');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9); // 0-indexed October
    expect(d.getDate()).toBe(31);
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(59);
    expect(d.getSeconds()).toBe(59);
  });

  it('defaults to October 31 if target is null or empty', () => {
    const d = parseTargetDate(null);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(31);
  });

  it('calculates remaining days, hours, minutes, seconds accurately', () => {
    const target = new Date('2026-10-31T23:59:59.000Z');
    // Exactly 1 day, 2 hours, 3 minutes, 4 seconds before target
    const nowMs = target.getTime() - (1 * 86400000 + 2 * 3600000 + 3 * 60000 + 4 * 1000);
    const res = calculateTimeRemaining(target, nowMs);

    expect(res.days).toBe(1);
    expect(res.hours).toBe(2);
    expect(res.minutes).toBe(3);
    expect(res.seconds).toBe(4);
    expect(res.isEnded).toBe(false);
  });

  it('detects when time has ended', () => {
    const target = new Date('2026-10-31T23:59:59.000Z');
    const nowMs = target.getTime() + 1000;
    const res = calculateTimeRemaining(target, nowMs);

    expect(res.isEnded).toBe(true);
    expect(res.days).toBe(0);
    expect(res.hours).toBe(0);
    expect(res.minutes).toBe(0);
    expect(res.seconds).toBe(0);
  });
});
