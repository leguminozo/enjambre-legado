import { describe, expect, it, beforeEach } from 'vitest';
import {
  formatMoney,
  formatMoneyCompact,
  formatMoneyDigits,
  parseMoneyInput,
  setDefaultCurrency,
  getDefaultCurrency,
  moneyFromDigits,
  normalizeNumericStringCLP,
  parseNumberCLP,
  parseIntegerCLP,
} from './currency';

describe('currency — CLP as-you-type y formato', () => {
  beforeEach(() => {
    setDefaultCurrency('CLP');
  });

  it('default de plataforma es CLP', () => {
    expect(getDefaultCurrency()).toBe('CLP');
  });

  it('formatMoney CLP: prefijo $ y punto de miles', () => {
    expect(formatMoney(8000, 'CLP')).toBe('$8.000');
    expect(formatMoney(80_000, 'CLP')).toBe('$80.000');
    expect(formatMoney(800_000, 'CLP')).toBe('$800.000');
    expect(formatMoney(8_000_000, 'CLP')).toBe('$8.000.000');
    expect(formatMoney(0, 'CLP')).toBe('$0');
  });

  it('formatMoneyDigits inserta puntos al tipear', () => {
    expect(formatMoneyDigits('8', 'CLP')).toBe('8');
    expect(formatMoneyDigits('80', 'CLP')).toBe('80');
    expect(formatMoneyDigits('800', 'CLP')).toBe('800');
    expect(formatMoneyDigits('8000', 'CLP')).toBe('8.000');
    expect(formatMoneyDigits('80000', 'CLP')).toBe('80.000');
    expect(formatMoneyDigits('800000', 'CLP')).toBe('800.000');
    expect(formatMoneyDigits('8000000', 'CLP')).toBe('8.000.000');
  });

  it('parseMoneyInput entiende display y dígitos crudos', () => {
    expect(parseMoneyInput('8.000', 'CLP')).toBe(8000);
    expect(parseMoneyInput('$8.000', 'CLP')).toBe(8000);
    expect(parseMoneyInput('8000', 'CLP')).toBe(8000);
    expect(parseMoneyInput('', 'CLP')).toBe(0);
  });

  it('moneyFromDigits alinea con el valor canónico', () => {
    expect(moneyFromDigits('8000', 'CLP')).toBe(8000);
    expect(moneyFromDigits('8', 'CLP')).toBe(8);
  });

  it('formatMoneyCompact CLP', () => {
    expect(formatMoneyCompact(1500, 'CLP')).toBe('$1,5K');
    expect(formatMoneyCompact(2_500_000, 'CLP')).toBe('$2,5M');
  });

  it('USD usa coma de miles y decimales', () => {
    expect(formatMoney(8000.5, 'USD')).toBe('US$8,000.50');
    expect(formatMoneyDigits('800050', 'USD')).toBe('8,000.50');
    expect(parseMoneyInput('8,000.50', 'USD')).toBe(8000.5);
  });

  it('normalizeNumericStringCLP, parseNumberCLP y parseIntegerCLP respetan formato chileno (1000 y 1.000)', () => {
    expect(normalizeNumericStringCLP('1.000')).toBe('1000');
    expect(normalizeNumericStringCLP('1000')).toBe('1000');
    expect(normalizeNumericStringCLP('15,5')).toBe('15.5');
    expect(normalizeNumericStringCLP('0.650')).toBe('0.650');
    expect(parseNumberCLP('1.000')).toBe(1000);
    expect(parseNumberCLP('1000')).toBe(1000);
    expect(parseNumberCLP('$1.290')).toBe(1290);
    expect(parseNumberCLP('15,5')).toBe(15.5);
    expect(parseNumberCLP('0.650')).toBe(0.65);
    expect(parseIntegerCLP('1.000')).toBe(1000);
    expect(parseIntegerCLP('1000')).toBe(1000);
    expect(parseIntegerCLP('$4.500')).toBe(4500);
  });
});
