import { describe, it, expect } from 'vitest';
import { parseNumberCLP, parseIntegerCLP } from './costeo-utils';

describe('costeo-utils', () => {
  describe('parseNumberCLP', () => {
    it('parsea enteros simples y con separador de miles con punto', () => {
      expect(parseNumberCLP('1000')).toBe(1000);
      expect(parseNumberCLP('1.000')).toBe(1000);
      expect(parseNumberCLP('15.000')).toBe(15000);
      expect(parseNumberCLP('1.250.000')).toBe(1250000);
    });

    it('parsea valores monetarios con símbolo $', () => {
      expect(parseNumberCLP('$1.000')).toBe(1000);
      expect(parseNumberCLP('$ 1.290')).toBe(1290);
      expect(parseNumberCLP('$350')).toBe(350);
    });

    it('parsea decimales con coma y con punto', () => {
      expect(parseNumberCLP('15,5')).toBe(15.5);
      expect(parseNumberCLP('15.5')).toBe(15.5);
      expect(parseNumberCLP('0,25')).toBe(0.25);
      expect(parseNumberCLP('0.05')).toBe(0.05);
      expect(parseNumberCLP('1.500,5')).toBe(1500.5);
    });

    it('maneja valores numéricos, vacíos o nulos', () => {
      expect(parseNumberCLP(1000)).toBe(1000);
      expect(parseNumberCLP(15.5)).toBe(15.5);
      expect(parseNumberCLP('')).toBe(0);
      expect(parseNumberCLP(null)).toBe(0);
      expect(parseNumberCLP(undefined)).toBe(0);
    });
  });

  describe('parseIntegerCLP', () => {
    it('parsea enteros CLP respetando punto y comas de miles', () => {
      expect(parseIntegerCLP('1000')).toBe(1000);
      expect(parseIntegerCLP('1.000')).toBe(1000);
      expect(parseIntegerCLP('1,000')).toBe(1000);
      expect(parseIntegerCLP('$1.290')).toBe(1290);
      expect(parseIntegerCLP('350')).toBe(350);
      expect(parseIntegerCLP(661)).toBe(661);
    });
  });

  describe('RecipeSchema con preprocesamiento CLP', () => {
    it('acepta 1.000 como 1000 en rendimiento_frascos y costo_empaque', async () => {
      const { RecipeSchema } = await import('./costeo-types');
      const parsed = RecipeSchema.safeParse({
        producto_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        rendimiento_frascos: '1.000',
        formato_frasco: '15g',
        merma_pct: '2,5',
        costo_empaque: '1.000',
        lines: [
          {
            ingredient_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
            cantidad: '1.000',
            unidad: 'g',
            estado: 'crudo',
          },
        ],
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.rendimiento_frascos).toBe(1000);
        expect(parsed.data.costo_empaque).toBe(1000);
        expect(parsed.data.merma_pct).toBe(2.5);
        expect(parsed.data.lines[0].cantidad).toBe(1000);
      }
    });
  });
});
