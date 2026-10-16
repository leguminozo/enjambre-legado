import { describe, it, expect } from 'vitest';
import { parseB2BSegmentContent } from '@enjambre/shop-chrome';
import {
  B2B_SEGMENTS,
  isValidSegment,
  getSegmentContent,
  getSegmentKits,
  getSegmentQuestions,
  getSegmentKitById,
  type B2BSegmentSlug,
} from './segment-content';

describe('B2B Segment Content & Planned Kits', () => {
  it('reconoce correctamente los 5 segmentos autorizados', () => {
    expect(B2B_SEGMENTS).toHaveLength(5);
    expect(isValidSegment('cafeterias')).toBe(true);
    expect(isValidSegment('hoteles')).toBe(true);
    expect(isValidSegment('tiendas-gourmet')).toBe(true);
    expect(isValidSegment('ferias')).toBe(true);
    expect(isValidSegment('revendedores')).toBe(true);
    expect(isValidSegment('invalido')).toBe(false);
  });

  it('obtiene el contenido y propuesta de valor para cada segmento', () => {
    B2B_SEGMENTS.forEach((slug) => {
      const content = getSegmentContent(slug);
      expect(content).toBeDefined();
      expect(content?.slug).toBe(slug);
      expect(content?.headline.length).toBeGreaterThan(5);
      expect(content?.valueProps.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('ofrece entre 2 y 4 kits planificados por segmento con precios y componentes', () => {
    B2B_SEGMENTS.forEach((slug) => {
      const kits = getSegmentKits(slug);
      expect(kits.length).toBeGreaterThanOrEqual(2);
      expect(kits.length).toBeLessThanOrEqual(4);

      kits.forEach((kit) => {
        expect(kit.id).toBeTruthy();
        expect(kit.nombre).toBeTruthy();
        expect(kit.precioNetoClp).toBeGreaterThan(0);
        expect(kit.pvpEstimadoClp).toBeGreaterThan(kit.precioNetoClp);
        expect(kit.margenEstimadoPct).toBeGreaterThanOrEqual(30);

        // Formatos de miel
        expect(kit.componentesFisicos.length).toBeGreaterThanOrEqual(1);

        // Lo digital y código local
        expect(kit.integracionesDigitales.length).toBeGreaterThanOrEqual(1);
        kit.integracionesDigitales.forEach((dig) => {
          expect(['resenas', 'trazabilidad', 'fidelizacion', 'pricing', 'marketing']).toContain(
            dig.tag,
          );
        });
      });
    });
  });

  it('obtiene kits específicos por ID para el segmento cafeterías', () => {
    const piloto = getSegmentKitById('cafeterias', 'piloto-mesa-barra');
    expect(piloto).toBeDefined();
    expect(piloto?.nombre).toBe('Set Piloto de Mesa & Barra');
    expect(piloto?.tier).toBe('entrada');

    const reserva = getSegmentKitById('cafeterias', 'reserva-barra-vitrina');
    expect(reserva).toBeDefined();
    expect(reserva?.tier).toBe('avanzado');
  });

  it('define preguntas operativas sin redundancia para cada segmento', () => {
    B2B_SEGMENTS.forEach((slug) => {
      const questions = getSegmentQuestions(slug);
      expect(questions.length).toBeGreaterThanOrEqual(1);

      questions.forEach((q) => {
        expect(q.id).toBeTruthy();
        expect(q.label).toBeTruthy();
        if (q.type === 'select') {
          expect(q.options?.length).toBeGreaterThanOrEqual(2);
        }
      });
    });

    const cafeQuestions = getSegmentQuestions('cafeterias');
    const questionIds = cafeQuestions.map((q) => q.id);
    expect(questionIds).toContain('formato_prioritario');
    expect(cafeQuestions.find((q) => q.id === 'formato_prioritario')?.required).toBe(false);
  });

  it('no contiene palabras prohibidas en los kits (recolección, poder silencioso, no cosecha)', () => {
    B2B_SEGMENTS.forEach((slug) => {
      const kits = getSegmentKits(slug);
      const allText = JSON.stringify(kits).toLowerCase();

      // Reglas inviolables del proyecto
      expect(allText).not.toContain('cosecha');
      expect(allText).not.toContain('cosechas');
      expect(allText).not.toContain('cosechado');
      expect(allText).not.toContain('biocultural');
      expect(allText).not.toContain('custodia');
      expect(allText).not.toContain('oficio');
    });
  });

  it('normaliza kits de CMS (B2BKitItem) a SegmentKit preservando herramientas y estrategia', () => {
    const cmsKits = [
      {
        id: 'kit-prueba',
        nombre: 'Kit de Prueba CMS',
        badge: 'Insignia',
        tier: 'entrada' as const,
        tagline: 'Promesa de prueba',
        descripcion: 'Descripción de prueba',
        precio_neto_clp: 150000,
        pvp_estimado_clp: 260000,
        margen_estimado_pct: 42,
        moq_summary: '1 kit mínimo',
        sales_strategy: 'Estrategia de venta rápida en barra',
        componentes_fisicos: ['12x Miel Ulmo 300g', '6x Miel Tiaca 300g'],
        herramientas_servicio: ['2x Cuchara avellano chilote'],
        materiales_exhibicion: ['1x Tótem de roble con QR'],
        integraciones_digitales: ['Certificado de origen digital'],
        recomendado_para: 'Nuevos locales aliados',
      },
    ];

    const kits = getSegmentKits('cafeterias', cmsKits);
    expect(kits).toHaveLength(1);
    expect(kits[0].id).toBe('kit-prueba');
    expect(kits[0].nombre).toBe('Kit de Prueba CMS');
    expect(kits[0].precioNetoClp).toBe(150000);
    expect(kits[0].pvpEstimadoClp).toBe(260000);
    expect(kits[0].margenEstimadoPct).toBe(42);
    expect(kits[0].salesStrategy).toBe('Estrategia de venta rápida en barra');
    expect(kits[0].herramientasServicio).toEqual(['2x Cuchara avellano chilote']);
    expect(kits[0].componentesFisicos).toHaveLength(2);
    expect(kits[0].componentesFisicos[0].cantidad).toBe('12x');
    expect(kits[0].materialesExhibicion).toEqual(['1x Tótem de roble con QR']);
  });

  it('los módulos de código local (@enjambre) respetan el vocabulario sagrado y las directrices de poder silencioso', () => {
    for (const slug of B2B_SEGMENTS) {
      const parsed = parseB2BSegmentContent(null, slug);
      expect(parsed.code_modules).toBeDefined();
      expect(parsed.code_modules!.length).toBe(4);

      const allText = JSON.stringify(parsed.code_modules).toLowerCase();
      expect(allText).not.toContain('cosecha');
      expect(allText).not.toContain('cosechas');
      expect(allText).not.toContain('cosechado');
      expect(allText).not.toContain('biocultural');
      expect(allText).not.toContain('custodia');
      expect(allText).not.toContain('oficio');
    }
  });
});

