import { describe, it, expect } from 'vitest';
import {
  computeStampRemaining,
  formatStampMessage,
  toStampProgressView,
} from '../stamp-progress';

describe('computeStampRemaining', () => {
  it('calcula faltan en ciclo parcial', () => {
    expect(computeStampRemaining(8, 10)).toEqual({
      remaining: 2,
      eligibleForFree: false,
      cyclePosition: 8,
    });
  });

  it('marca elegible al completar ciclo', () => {
    expect(computeStampRemaining(10, 10)).toEqual({
      remaining: 0,
      eligibleForFree: true,
      cyclePosition: 0,
    });
  });
});

describe('toStampProgressView', () => {
  it('arma vista con label wallet', () => {
    const view = toStampProgressView({
      program_id: 'p1',
      unidades_acumuladas: 3,
      unidades_canjeadas: 0,
      program: {
        id: 'p1',
        producto_id: 'prod',
        nombre: 'Décimo sachet',
        unidades_requeridas: 10,
        unidad_gratis: 1,
        wallet_label: 'Sachets Ulmo',
        imagen_url: null,
      },
    });
    expect(view?.label).toBe('Sachets Ulmo');
    expect(view?.remaining).toBe(7);
  });
});

describe('formatStampMessage', () => {
  it('mensaje cuando faltan 2', () => {
    const msg = formatStampMessage({
      programId: 'p',
      label: 'Sachets',
      accumulated: 8,
      required: 10,
      remaining: 2,
      eligibleForFree: false,
      progressPct: 80,
    });
    expect(msg).toContain('Te faltan 2');
  });
});