import { describe, it, expect, beforeEach } from 'vitest';
import {
  hslTripletToHex,
  readDesignToken,
  resolveTokenColor,
  readTokenSet,
  clearDesignTokenCache,
  canReadDesignTokens,
} from './design-tokens';

describe('design-tokens', () => {
  beforeEach(() => {
    clearDesignTokenCache();
  });

  describe('hslTripletToHex', () => {
    it('converts valid HSL triplet strings to hex', () => {
      // 0 0% 0% -> #000000
      expect(hslTripletToHex('0 0% 0%')).toBe('#000000');
      // 0 0% 100% -> #ffffff
      expect(hslTripletToHex('0 0% 100%')).toBe('#ffffff');
      // 120 100% 50% -> #00ff00
      expect(hslTripletToHex('120 100% 50%')).toBe('#00ff00');
    });

    it('returns null for invalid inputs', () => {
      expect(hslTripletToHex('invalid')).toBeNull();
      expect(hslTripletToHex('')).toBeNull();
      expect(hslTripletToHex('#fff')).toBeNull();
    });
  });

  describe('resolveTokenColor', () => {
    it('returns fallback when running outside browser', () => {
      expect(resolveTokenColor('--brand-primary', '#123456')).toBe('#123456');
    });
  });

  describe('readDesignToken', () => {
    it('returns fallback in Node environment', () => {
      expect(readDesignToken('--unknown', '#abcdef')).toBe('#abcdef');
    });
  });

  describe('readTokenSet', () => {
    it('resolves set with fallbacks outside browser', () => {
      const names = { primary: '--brand-primary', bg: '--bg-main' };
      const fallbacks = { primary: '#111111', bg: '#222222' };
      const result = readTokenSet(names, fallbacks);

      expect(result).toEqual({
        primary: '#111111',
        bg: '#222222',
      });
    });
  });

  describe('canReadDesignTokens', () => {
    it('returns false outside browser (Node)', () => {
      expect(canReadDesignTokens()).toBe(false);
    });
  });
});
