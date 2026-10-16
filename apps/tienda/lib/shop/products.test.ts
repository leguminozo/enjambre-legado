import { describe, it, expect } from 'vitest';
import { mapProduct, resolveProductBadges } from './products';

type Row = Parameters<typeof mapProduct>[0];

const UUID = '11111111-1111-4111-8111-111111111111';

function baseRow(overrides: Partial<Row> = {}): Row {
  return {
    id: UUID,
    slug: 'miel-de-ulmo',
    nombre: 'Miel de Ulmo Premium',
    descripcion_regenerativa: 'Miel monofloral del bosque nativo de Chiloé',
    descripcion_corta: 'Resumen para tarjetas',
    video_url: 'https://youtube.com/watch?v=123',
    ingredientes: '100% miel de ulmo virgen',
    trazabilidad_qr: true,
    peso_neto_g: 500,
    precio: 19990,
    stock: 12,
    formato: '500g',
    categoria: 'miel',
    tags: ['ulmo', 'premium'],
    origen_apicola: 'Pureo, Chiloé',
    fotos: ['https://cdn.cl/foto1.jpg'],
    visible: true,
    sustituye_azucar_g: null,
    co2_evitado_kg: null,
    irr_referencia: null,
    lote_id: null,
    lotes: null,
    ...overrides,
  };
}

describe('mapProduct (catálogo → ShopProduct)', () => {
  it('mapea los campos base', () => {
    const p = mapProduct(baseRow());
    expect(p.id).toBe(UUID);
    expect(p.slug).toBe('miel-de-ulmo');
    expect(p.name).toBe('Miel de Ulmo Premium');
    expect(p.shortDescription).toBe('Resumen para tarjetas');
    expect(p.videoUrl).toBe('https://youtube.com/watch?v=123');
    expect(p.ingredientes).toBe('100% miel de ulmo virgen');
    expect(p.trazabilidadQr).toBe(true);
    expect(p.pesoNetoG).toBe(500);
    expect(p.price).toBe(19990);
    expect(p.stock).toBe(12);
    expect(p.format).toBe('500g');
    expect(p.category).toBe('miel');
    expect(p.tags).toEqual(['ulmo', 'premium']);
    expect(p.photos).toEqual(['https://cdn.cl/foto1.jpg']);
    expect(p.visible).toBe(true);
    expect(p.origenApicola).toBe('Pureo, Chiloé');
  });

  it('fallback: slug usa el id si falta; nombre/stock/formato tienen defaults seguros', () => {
    const p = mapProduct(baseRow({ slug: null, nombre: null, stock: null, visible: null }));
    expect(p.slug).toBe(UUID);
    expect(p.name).toBe('');
    expect(p.stock).toBeNull();
    expect(p.visible).toBe(true);
  });

  it('mapea el join del lote (trazabilidad) incluyendo lote_id', () => {
    const p = mapProduct(
      baseRow({
        lote_id: UUID,
        lotes: {
          blockchain_hash: '0xabc123',
          cosecha_ids: [UUID],
          nombre_lote: 'Lote Ulmo 2026',
          descripcion: 'Recolección de enero en Pureo',
          fecha_envasado: '2026-03-10T00:00:00.000Z',
          publico: true,
        },
      }),
    );
    expect(p.lote_id).toBe(UUID);
    expect(p.blockchain_hash).toBe('0xabc123');
    expect(p.nombre_lote).toBe('Lote Ulmo 2026');
    expect(p.descripcion_lote).toBe('Recolección de enero en Pureo');
    expect(p.fecha_envasado).toBe('2026-03-10T00:00:00.000Z');
    // colmena_origen se resuelve con la query de cosechas (no en el mapeo)
    expect(p.colmena_origen).toBeNull();
  });

  it('sin lote: campos de trazabilidad quedan null', () => {
    const p = mapProduct(baseRow());
    expect(p.lote_id).toBeNull();
    expect(p.blockchain_hash).toBeNull();
    expect(p.nombre_lote).toBeNull();
    expect(p.fecha_envasado).toBeNull();
  });

  it('preserva métricas numéricas cero (no las convierte en null)', () => {
    const p = mapProduct(baseRow({ co2_evitado_kg: 0, irr_referencia: 0, sustituye_azucar_g: 0 }));
    expect(p.co2_evitado_kg).toBe(0);
    expect(p.irr_referencia).toBe(0);
    expect(p.sustituye_azucar_g).toBe(0);
  });

  it('tags vacíos → array vacío (no null)', () => {
    const p = mapProduct(baseRow({ tags: null }));
    expect(p.tags).toEqual([]);
  });
});

describe('ProductRowSchema coerce (catálogo resiliente)', () => {
  // Import interno vía parse de mapProduct path: re-export test a través de list behavior
  // Validamos coerce numérico/string con el mismo schema exportado indirectamente.
  it('mapProduct acepta precio numérico y métricas cero', () => {
    const p = mapProduct(baseRow({ precio: 15000, co2_evitado_kg: 0 }));
    expect(p.price).toBe(15000);
    expect(p.co2_evitado_kg).toBe(0);
  });

  it('mapProduct: lotes null no rompe', () => {
    const p = mapProduct(baseRow({ lotes: null, lote_id: null }));
    expect(p.blockchain_hash).toBeNull();
  });
});

describe('resolveProductBadges (unificado catálogo y PDP)', () => {
  it('resuelve badges dinámicos según cosecha y tags configurados', () => {
    const p = mapProduct(
      baseRow({
        tags: ['bosque nativo', 'virgen'],
      }),
    );
    p.fecha_cosecha = '2026-03-15';
    const badges = resolveProductBadges(p);
    expect(badges).toContain('Recolección 2026');
    expect(badges).toContain('bosque nativo');
    expect(badges).toContain('virgen');
  });

  it('fallback a origenApicola si no hay otros badges', () => {
    const p = mapProduct(
      baseRow({
        tags: [],
        co2_evitado_kg: null,
        irr_referencia: null,
        origen_apicola: 'Valle de Notuco, Chiloé',
      }),
    );
    const badges = resolveProductBadges(p);
    expect(badges).toEqual(['Valle de Notuco, Chiloé']);
  });

  it('filtra claims de salud prohibidos como "Sustituye azúcar" de los badges públicos', () => {
    const p = mapProduct(
      baseRow({
        tags: ['Sustituye azúcar', 'Bajo índice glicémico', 'Bosque Templado', 'Ulmo'],
      }),
    );
    const badges = resolveProductBadges(p);
    expect(badges).not.toContain('Sustituye azúcar');
    expect(badges).not.toContain('Bajo índice glicémico');
    expect(badges).toContain('Bosque Templado');
    expect(badges).toContain('Ulmo');
  });
});

