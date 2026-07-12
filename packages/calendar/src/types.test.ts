import { describe, expect, it } from 'vitest';
import { resolveEventToolLink, EVENT_TOOL_LINKS } from './types';

describe('EVENT_TOOL_LINKS', () => {
  it('mapea cada tipo a una ruta de Núcleo', () => {
    expect(resolveEventToolLink('feria').href).toContain('/crm');
    expect(resolveEventToolLink('apicultura').href).toBe('/colmenas');
    expect(resolveEventToolLink('marketing').href).toBe('/comunidad');
    expect(resolveEventToolLink('historico').href).toBe('/produccion');
    expect(resolveEventToolLink('inspeccion').href).toContain('/colmenas');
  });

  it('cubre todos los tipos de evento', () => {
    expect(Object.keys(EVENT_TOOL_LINKS).sort()).toEqual(
      ['apicultura', 'feria', 'historico', 'inspeccion', 'marketing'].sort(),
    );
  });
});
