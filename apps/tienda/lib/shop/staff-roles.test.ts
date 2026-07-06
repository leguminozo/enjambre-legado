import { describe, expect, it } from 'vitest';
import { isNucleoStaffRole, normalizeStaffRole } from './staff-roles';

describe('staff-roles', () => {
  it('normaliza legacy gerente → admin', () => {
    expect(normalizeStaffRole('gerente')).toBe('admin');
  });

  it('detecta staff Núcleo', () => {
    expect(isNucleoStaffRole('admin')).toBe(true);
    expect(isNucleoStaffRole('gerente')).toBe(true);
    expect(isNucleoStaffRole('tienda_admin')).toBe(true);
    expect(isNucleoStaffRole('cliente')).toBe(false);
    expect(isNucleoStaffRole('creador')).toBe(false);
    expect(isNucleoStaffRole('rep_ventas')).toBe(false);
  });
});