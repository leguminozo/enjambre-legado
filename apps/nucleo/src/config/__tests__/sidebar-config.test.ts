import { describe, expect, it } from 'vitest';
import { routeUsesViewShell } from '../sidebar-config';

describe('routeUsesViewShell', () => {
  it('oculta header global en Panel Ejecutivo', () => {
    expect(routeUsesViewShell('/ejecutivo')).toBe(true);
  });

  it('oculta header en módulos gerencia con ViewShell', () => {
    expect(routeUsesViewShell('/invitaciones')).toBe(true);
    expect(routeUsesViewShell('/operadores-feria')).toBe(true);
    expect(routeUsesViewShell('/editor-tienda')).toBe(true);
    expect(routeUsesViewShell('/creador')).toBe(true);
  });

  it('mantiene header en módulos sin ViewShell propio', () => {
    expect(routeUsesViewShell('/comisiones')).toBe(false);
    expect(routeUsesViewShell('/reps')).toBe(false);
    expect(routeUsesViewShell('/caja')).toBe(false);
    // /leaderboard no está en VIEW_SHELL_PATHS (usa header global)
    expect(routeUsesViewShell('/leaderboard')).toBe(false);
  });
});