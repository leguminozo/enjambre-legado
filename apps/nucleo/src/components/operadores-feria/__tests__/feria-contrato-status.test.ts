import { describe, expect, it } from 'vitest';
import {
  feriaContratoEstadoForUser,
  repNecesitaContratoFeriaActivo,
} from '../feria-contrato-status';

describe('feriaContratoEstadoForUser', () => {
  const contratos = [
    { user_id: 'a', estado: 'terminado', id: '1' },
    { user_id: 'b', estado: 'borrador', id: '2' },
    { user_id: 'c', estado: 'activo', id: '3' },
    { user_id: 'c', estado: 'terminado', id: '4' },
  ];

  it('prioriza activo sobre otros estados', () => {
    expect(feriaContratoEstadoForUser(contratos, 'c')).toBe('activo');
  });

  it('detecta borrador', () => {
    expect(feriaContratoEstadoForUser(contratos, 'b')).toBe('borrador');
  });

  it('detecta sin contrato', () => {
    expect(feriaContratoEstadoForUser(contratos, 'z')).toBe('sin_contrato');
  });
});

describe('repNecesitaContratoFeriaActivo', () => {
  it('solo excluye contrato activo', () => {
    const rows = [{ user_id: 'a', estado: 'activo' }];
    expect(repNecesitaContratoFeriaActivo(rows, 'a')).toBe(false);
    expect(repNecesitaContratoFeriaActivo(rows, 'b')).toBe(true);
  });
});