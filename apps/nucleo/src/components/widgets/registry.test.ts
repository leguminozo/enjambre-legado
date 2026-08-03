import { describe, it, expect } from 'vitest';
import { WIDGETS, widgetsPara } from '@/components/widgets/registry';
import type { WidgetContexto } from '@/components/widgets/types';

const CONTEXTOS_VALIDOS: WidgetContexto[] = ['apicultor', 'inicio-admin', 'inicio-territorial'];

describe('Registro de widgets', () => {
  it('tiene claves únicas', () => {
    const keys = WIDGETS.map((w) => w.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('cada widget declara componente, título y contextos válidos', () => {
    for (const w of WIDGETS) {
      expect(w.titulo, w.key).toBeTruthy();
      expect(typeof w.Componente, w.key).toBe('function');
      expect(w.contextos.length, w.key).toBeGreaterThan(0);
      for (const ctx of w.contextos) {
        expect(CONTEXTOS_VALIDOS, `${w.key} → ${ctx}`).toContain(ctx);
      }
    }
  });

  it('filtra widgets por contexto', () => {
    const apicultor = widgetsPara('apicultor');
    expect(apicultor.map((w) => w.key)).toEqual(
      expect.arrayContaining(['oraculo-fenologico', 'ventanas-de-vuelo', 'espectro-vivo', 'voz-colmena', 'reflexion']),
    );
    expect(widgetsPara('inicio-territorial').map((w) => w.key)).toContain('oraculo-fenologico');
    expect(widgetsPara('inicio-admin')).toHaveLength(0);
  });
});
