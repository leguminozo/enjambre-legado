import { describe, expect, it } from 'vitest';
import {
  resolveEventToolLink,
  EVENT_TOOL_LINKS,
  categoryToType,
  USER_CATEGORIES,
} from './types';

describe('EVENT_TOOL_LINKS', () => {
  it('mapea cada tipo a una ruta de Núcleo', () => {
    expect(resolveEventToolLink('feria').href).toContain('/crm');
    expect(resolveEventToolLink('apicultura').href).toBe('/colmenas');
    expect(resolveEventToolLink('marketing').href).toBe('/comunidad');
    expect(resolveEventToolLink('historico').href).toBe('/produccion');
    expect(resolveEventToolLink('inspeccion').href).toContain('/colmenas');
    expect(resolveEventToolLink('personal').href).toBe('/calendario');
  });

  it('cubre todos los tipos de evento', () => {
    expect(Object.keys(EVENT_TOOL_LINKS).length).toBeGreaterThanOrEqual(9);
  });

  it('categoryToType normaliza categorías de usuario', () => {
    expect(categoryToType('reunion')).toBe('reunion');
    expect(categoryToType('unknown')).toBe('personal');
  });

  it('USER_CATEGORIES tienen color y label', () => {
    expect(USER_CATEGORIES.every((c) => c.color && c.label)).toBe(true);
  });
});
