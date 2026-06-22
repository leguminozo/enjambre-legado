import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COURIER,
  buildCourierTrackingUrl,
  getCourierLabel,
  isCourierCode,
  resolveCourierCode,
} from './couriers';

describe('couriers', () => {
  it('defaults to blueexpress', () => {
    expect(DEFAULT_COURIER).toBe('blueexpress');
    expect(resolveCourierCode(null)).toBe('blueexpress');
    expect(resolveCourierCode('invalid')).toBe('blueexpress');
  });

  it('validates known courier codes', () => {
    expect(isCourierCode('chilexpress')).toBe(true);
    expect(isCourierCode('blueexpress')).toBe(true);
    expect(isCourierCode('ups')).toBe(false);
  });

  it('builds tracking url for blueexpress', () => {
    const url = buildCourierTrackingUrl('blueexpress', 'ABC123');
    expect(url).toContain('bluex.cl');
    expect(url).toContain('ABC123');
  });

  it('returns human labels', () => {
    expect(getCourierLabel('starken')).toBe('Starken');
    expect(getCourierLabel(null)).toBe('BlueExpress');
  });
});