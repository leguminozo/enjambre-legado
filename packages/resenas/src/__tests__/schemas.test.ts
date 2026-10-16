import { describe, expect, it } from 'vitest';
import {
  CreateResenaSchema,
  ProductoVarianteSchema,
  ResenaGuardianInputSchema,
} from '../schemas';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const VARIANT_UUID = '987e6543-e21b-12d3-a456-426614174999';

describe('Esquemas sensoriales y variantes (@enjambre/resenas)', () => {
  it('valida reseña guardian legacy con campos planos de miel (compatibilidad retroactiva)', () => {
    const legacyInput = {
      modo: 'guardian' as const,
      producto_id: VALID_UUID,
      rating: 7,
      cristalizacion_percibida: 'Cremosa' as const,
      familia_aromatica: 'Bosque' as const,
      intensidad_fondo: 8,
      notas_personales: 'Persistencia excepcional en el paladar.',
    };

    const parsed = CreateResenaSchema.parse(legacyInput);
    expect(parsed.modo).toBe('guardian');
    if (parsed.modo === 'guardian') {
      expect(parsed.cristalizacion_percibida).toBe('Cremosa');
      expect(parsed.tipo_sensorial).toBe('miel');
    }
  });

  it('valida reseña guardian con atributos de miel fortificada (cacao crudo de Santander) y variante_id', () => {
    const input = {
      modo: 'guardian' as const,
      producto_id: VALID_UUID,
      variante_id: VARIANT_UUID,
      tipo_sensorial: 'miel_fortificada' as const,
      rating: 6,
      atributos: {
        tipo: 'miel_fortificada' as const,
        fortificante: 'cacao_crudo' as const,
        balance_inclusion: 7,
        textura_inclusion: 'nibs_crujientes' as const,
        intensidad_fondo: 9,
      },
      notas_personales: 'Contraste amargo del cacao crudo de Santander sobre la base de miel.',
    };

    const parsed = CreateResenaSchema.parse(input);
    expect(parsed.modo).toBe('guardian');
    if (parsed.modo === 'guardian') {
      expect(parsed.variante_id).toBe(VARIANT_UUID);
      expect(parsed.atributos?.tipo).toBe('miel_fortificada');
    }
  });

  it('valida reseña guardian con atributos de polen floral', () => {
    const input = {
      modo: 'guardian' as const,
      producto_id: VALID_UUID,
      variante_id: VARIANT_UUID,
      tipo_sensorial: 'miel_fortificada' as const,
      rating: 5,
      atributos: {
        tipo: 'miel_fortificada' as const,
        fortificante: 'polen_floral' as const,
        balance_inclusion: 6,
        textura_inclusion: 'granulado_fino' as const,
        intensidad_fondo: 8,
      },
      notas_personales: 'Granulado fino floral y soluble.',
    };

    const parsed = CreateResenaSchema.parse(input);
    expect(parsed.modo).toBe('guardian');
  });

  it('valida reseña guardian con matriz de hidromiel (fermentados)', () => {
    const input = {
      modo: 'guardian' as const,
      producto_id: VALID_UUID,
      tipo_sensorial: 'hidromiel' as const,
      rating: 7,
      atributos: {
        tipo: 'hidromiel' as const,
        estilo: 'semiseco' as const,
        efervescencia: 'petillant' as const,
        acidez_viva: 8,
        tanicidad: 6,
      },
      notas_personales: 'Notas de fermentación silvestre con aguja fina y acidez chispeante.',
    };

    const parsed = CreateResenaSchema.parse(input);
    expect(parsed.modo).toBe('guardian');
    if (parsed.modo === 'guardian') {
      expect(parsed.atributos?.tipo).toBe('hidromiel');
    }
  });

  it('valida reseña anónima con variante_id asignada desde mesa QR', () => {
    const input = {
      modo: 'anonima' as const,
      producto_id: VALID_UUID,
      variante_id: VARIANT_UUID,
      tipo_sensorial: 'miel_fortificada' as const,
      rating: 7,
      comentario_corto: 'Excelente muestra con avellana tostada en cafetería.',
      display_name: 'G. C.',
    };

    const parsed = CreateResenaSchema.parse(input);
    expect(parsed.modo).toBe('anonima');
    if (parsed.modo === 'anonima') {
      expect(parsed.variante_id).toBe(VARIANT_UUID);
    }
  });

  it('valida esquema de creación de ProductoVariante en Núcleo', () => {
    const variante = {
      producto_id: VALID_UUID,
      sku: 'CM-CACAO-250G',
      nombre_variante: 'Crema con Nibs de Cacao Crudo Santander (250g)',
      tipo_variante: 'fortificacion' as const,
      ingrediente_fortificante: 'cacao_crudo' as const,
      peso_neto_g: 250,
      precio_override: 7490,
      stock: 50,
      activo: true,
      sort_order: 10,
    };

    const parsed = ProductoVarianteSchema.parse(variante);
    expect(parsed.sku).toBe('CM-CACAO-250G');
    expect(parsed.ingrediente_fortificante).toBe('cacao_crudo');
  });
});
