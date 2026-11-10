import { describe, expect, it } from 'vitest';
import {
  resolveEventToolLink,
  EVENT_TOOL_LINKS,
  categoryToType,
  USER_CATEGORIES,
  TERRITORIAL_USER_CATEGORIES,
} from './types';

describe('EVENT_TOOL_LINKS', () => {
  it('mapea cada tipo a una ruta de Núcleo', () => {
    expect(resolveEventToolLink('feria').href).toContain('/crm');
    expect(resolveEventToolLink('apicultura').href).toBe('/colmenas');
    expect(resolveEventToolLink('marketing').href).toBe('/comunidad');
    expect(resolveEventToolLink('historico').href).toBe('/produccion');
    expect(resolveEventToolLink('inspeccion').href).toContain('/colmenas');
    expect(resolveEventToolLink('personal').href).toBe('/calendario');
    expect(resolveEventToolLink('tratamiento').href).toContain('/territorio/alertas');
    expect(resolveEventToolLink('transhumancia').href).toContain('/territorio/trashumancia');
  });

  it('cubre todos los tipos de evento', () => {
    expect(Object.keys(EVENT_TOOL_LINKS).length).toBeGreaterThanOrEqual(12);
  });

  it('categoryToType normaliza categorías de usuario', () => {
    expect(categoryToType('reunion')).toBe('reunion');
    expect(categoryToType('tratamiento')).toBe('tratamiento');
    expect(categoryToType('transhumancia')).toBe('transhumancia');
    expect(categoryToType('cosecha')).toBe('cosecha');
    expect(categoryToType('unknown')).toBe('personal');
    expect(categoryToType('')).toBe('personal');
  });

  it('cada categoría de usuario resuelve un tipo de evento cubierto', () => {
    for (const cat of USER_CATEGORIES) {
      const type = categoryToType(cat.value);
      expect(EVENT_TOOL_LINKS[type]).toBeDefined();
      expect(resolveEventToolLink(type).href.startsWith('/')).toBe(true);
    }
  });

  it('TERRITORIAL_USER_CATEGORIES no incluye ferias ni marketing ni logistica', () => {
    const values = TERRITORIAL_USER_CATEGORIES.map((c) => c.value);
    expect(values).not.toContain('feria');
    expect(values).not.toContain('marketing');
    expect(values).not.toContain('logistica');
    expect(values).toContain('apicultura');
    expect(values).toContain('inspeccion');
    expect(values).toContain('tratamiento');
    expect(values).toContain('cosecha');
    expect(values).toContain('transhumancia');
  });

  it('USER_CATEGORIES tienen color y label', () => {
    expect(USER_CATEGORIES.every((c) => c.color && c.label)).toBe(true);
    expect(TERRITORIAL_USER_CATEGORIES.every((c) => c.color && c.label)).toBe(true);
  });
});
