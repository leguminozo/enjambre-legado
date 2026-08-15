import { describe, expect, it } from 'vitest';
import { parseLegalDoc, scanPublicCopyRisks } from './store-chrome';

describe('parseLegalDoc', () => {
  it('trimea title/body y prefiere last_updated a updated_at', () => {
    expect(
      parseLegalDoc({
        title: '  Términos  ',
        body: '  <p>hola</p>  ',
        last_updated: '2026-08-14',
        updated_at: '2026-01-01',
      }),
    ).toEqual({
      title: 'Términos',
      body: '<p>hola</p>',
      last_updated: '2026-08-14',
    });
  });

  it('trata body vacío o solo espacios como vacío (fallback del repo)', () => {
    expect(parseLegalDoc({ title: 'X', body: '   ' }).body).toBe('');
    expect(parseLegalDoc(null).body).toBe('');
    expect(parseLegalDoc({ updated_at: '  19 de mayo de 2026  ' }).last_updated).toBe(
      '19 de mayo de 2026',
    );
  });
});

describe('scanPublicCopyRisks', () => {
  it('marca fugas de patio y claims sanitarios', () => {
    const leaks = scanPublicCopyRisks('Hostado en Hostinger con Next.js HMR', ['stack_leak']);
    expect(leaks.map((r) => r.label)).toEqual(expect.arrayContaining(['Hostinger', 'Next.js', 'HMR']));

    const claims = scanPublicCopyRisks('Sustituye azúcar y baja el HbA1c', ['health_claim']);
    expect(claims.map((r) => r.label)).toEqual(
      expect.arrayContaining(['“Sustituye azúcar”', 'HbA1c']),
    );
  });

  it('no marca copy limpio', () => {
    expect(scanPublicCopyRisks('Miel cruda de bosque nativo de Chiloé.')).toEqual([]);
  });
});
