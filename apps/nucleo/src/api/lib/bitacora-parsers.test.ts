import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  numeroHablado,
  detectarMarcadores,
  segmentarPorColmenas,
  parseFragmento,
  assessConfidence,
  parseTranscripcion,
  PARSE_AUTO_EMIT_THRESHOLD,
} from '@/api/lib/bitacora-parsers';

describe('numeroHablado', () => {
  it('convierte números en palabras y dígitos', () => {
    expect(numeroHablado('veinte')).toBe(20);
    expect(numeroHablado('cincuenta')).toBe(50);
    expect(numeroHablado('20')).toBe(20);
    expect(numeroHablado('tres')).toBe(3);
    expect(numeroHablado('muchas')).toBeNull();
  });
});

describe('detectarMarcadores — voz libre no correlativa (§3.2)', () => {
  it('detecta colmenas en orden no correlativo', () => {
    const marcadores = detectarMarcadores(
      'Colmena veinte: la reina está fuerte... Ahora colmena uno: está más floja... y la 15 tiene poca cría'
    );
    expect(marcadores.map((m) => m.numero)).toEqual([20, 1, 15]);
    expect(marcadores.map((m) => m.etiqueta)).toEqual([
      'colmena veinte',
      'colmena uno',
      'la 15',
    ]);
  });

  it('soporta "núcleo cinco" como marcador', () => {
    expect(detectarMarcadores('núcleo cinco: seis cuadros con cría')[0]?.numero).toBe(5);
  });

  it('soporta variación "número veinte" y "la veinte"', () => {
    expect(detectarMarcadores('la veinte está bien')[0]?.numero).toBe(20);
    expect(detectarMarcadores('colmena número veinte está bien')[0]?.numero).toBe(20);
  });

  it('no confunde "la reina" con un marcador', () => {
    expect(detectarMarcadores('la reina está puesta, la abeja tranquila')).toHaveLength(0);
  });
});

describe('segmentarPorColmenas — atribución de fragmentos', () => {
  it('agrupa lo dicho entre marcadores a la colmena correspondiente', () => {
    const fragmentos = segmentarPorColmenas(
      'colmena 20: la reina está fuerte, tiene seis cuadros con cría abierta y cuatro con cría cerrada, dos cuadros con miel en la primera alza. ahora colmena 1: está más floja, solo tres cuadros de cría y poco polen'
    );
    expect(fragmentos).toHaveLength(2);
    expect(fragmentos[0]!.numero).toBe(20);
    expect(fragmentos[0]!.fragmento).toContain('seis cuadros con cria abierta');
    expect(fragmentos[1]!.numero).toBe(1);
    expect(fragmentos[1]!.fragmento).toContain('tres cuadros de cria');
  });

  it('vuelve a una colmena ya mencionada sin perderse', () => {
    const fragmentos = segmentarPorColmenas(
      'colmena 1: cría abierta. colmena 20: miel. colmena 1: cera labrada'
    );
    expect(fragmentos.map((f) => f.numero)).toEqual([1, 20, 1]);
  });
});

describe('parseFragmento — campos estructurados', () => {
  it('extrae cría abierta, cerrada y miel', () => {
    const r = parseFragmento('seis cuadros con cría abierta y cuatro con cría cerrada, dos cuadros con miel');
    expect(r.marcos_cria).toBe(10);
    expect(r.marcos_miel).toBe(2);
    expect(r.cuadros.filter((c) => c.tipo === 'cria_abierta')).toHaveLength(6);
    expect(r.cuadros.filter((c) => c.tipo === 'cria_cerrada')).toHaveLength(4);
    expect(r.cuadros.filter((c) => c.tipo === 'miel')).toHaveLength(2);
  });

  it('distingue cera estampada de cera labrada', () => {
    const r = parseFragmento('cuatro cuadros con cera estampada y cinco con cera labrada');
    expect(r.cuadros.filter((c) => c.tipo === 'cera_estampada')).toHaveLength(4);
    expect(r.cuadros.filter((c) => c.tipo === 'cera_labrada')).toHaveLength(5);
  });

  it('detecta reina RV / NV / SR', () => {
    expect(parseFragmento('la reina está vista, fuerte').reina).toBe('RV');
    expect(parseFragmento('no veo la reina').reina).toBe('NV');
    expect(parseFragmento('está sin reina').reina).toBe('SR');
  });

  it('detecta fase alza y asigna cuerpo alza_1', () => {
    const r = parseFragmento('en la primera alza hay ocho cuadros con miel');
    expect(r.fase).toBe('alza');
    expect(r.cuadros.every((c) => c.cuerpo === 'alza_1')).toBe(true);
  });

  it('preserva la voz libre no reconocida en notas', () => {
    const r = parseFragmento('tiene harto néctar de ulmo, se ve sana');
    expect(r.notas).toContain('harto');
    expect(r.notas).toContain('ulmo');
  });
});

describe('assessConfidence — umbral de auto-aprobación', () => {
  it('fragmento rico supera el umbral 0.85', () => {
    const r = parseFragmento(
      'seis cuadros con cría abierta, cuatro con cría cerrada, dos con miel, reina vista, población fuerte, primera alza'
    );
    expect(assessConfidence(r)).toBeGreaterThanOrEqual(PARSE_AUTO_EMIT_THRESHOLD);
  });

  it('fragmento pobre queda bajo el umbral (va a curaduría)', () => {
    const r = parseFragmento('se ve rara, no sé qué tiene');
    expect(assessConfidence(r)).toBeLessThan(PARSE_AUTO_EMIT_THRESHOLD);
  });
});

describe('parseTranscripcion — orquestador completo', () => {
  it('segmenta y parsea un discurso libre no correlativo', () => {
    const out = parseTranscripcion(
      'Colmena veinte: la reina está fuerte, seis cuadros con cría abierta, cuatro con cría cerrada, dos cuadros con miel en la primera alza. Ahora colmena uno: está más floja, solo tres cuadros de cría y poco polen'
    );
    expect(out).toHaveLength(2);
    expect(out[0]!.numero).toBe(20);
    expect(out[0]!.resultado.marcos_cria).toBe(10);
    expect(out[0]!.confianza).toBeGreaterThanOrEqual(PARSE_AUTO_EMIT_THRESHOLD);
    expect(out[1]!.numero).toBe(1);
  });
});
