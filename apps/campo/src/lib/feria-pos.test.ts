import { describe, expect, it } from 'vitest';
import { formatFeriaValidationError, isFeriaChannel } from './feria-pos';

describe('isFeriaChannel', () => {
  it('solo channel feria', () => {
    expect(isFeriaChannel('feria')).toBe(true);
    expect(isFeriaChannel('local')).toBe(false);
    expect(isFeriaChannel(null)).toBe(false);
    expect(isFeriaChannel(undefined)).toBe(false);
  });
});

describe('formatFeriaValidationError', () => {
  it('mensaje genérico sin errors', () => {
    expect(formatFeriaValidationError({})).toMatch(/insuficiente/i);
  });

  it('formatea sin_consignacion y stock', () => {
    const msg = formatFeriaValidationError({
      errors: [
        { producto_id: 'abcdefgh-1234', error: 'sin_consignacion' },
        { producto_id: 'x', error: 'stock', pendiente: 1, solicitado: 3 },
      ],
    });
    expect(msg).toContain('no consignado');
    expect(msg).toContain('1 disponible');
    expect(msg).toContain('3 solicitado');
  });
});
