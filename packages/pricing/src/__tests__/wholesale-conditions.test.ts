import { describe, it, expect } from 'vitest';
import {
  WHOLESALE_PRODUCTS_2025_2026,
  WHOLESALE_COMMERCIAL_RULES,
  resolveInvestmentDiscountPct,
  calculateWholesaleOrder,
  generateWholesaleAgreementMarkdown,
} from '../wholesale-conditions';

describe('wholesale-conditions', () => {
  it('contiene los 6 productos oficiales acordados', () => {
    expect(WHOLESALE_PRODUCTS_2025_2026.length).toBe(6);
    const cremaBosque = WHOLESALE_PRODUCTS_2025_2026.find(
      (p) => p.id === 'crema-miel-reserva-bosque-frasco-mayor-500g'
    );
    expect(cremaBosque).toBeDefined();
    expect(cremaBosque?.pvpRecomendadoClp).toBe(21990);
    expect(cremaBosque?.precioNetoBaseClp).toBe(16655);
    expect(cremaBosque?.pesoGramos).toBe(500);

    const mielTradicional = WHOLESALE_PRODUCTS_2025_2026.find(
      (p) => p.id === 'miel-tradicional-reserva-bosque-frasco-mayor-500g'
    );
    expect(mielTradicional?.pesoGramos).toBe(500);
    expect(mielTradicional?.precioNetoBaseClp).toBe(11100);
  });

  it('calcula los tramos de descuento por inversión neta', () => {
    expect(resolveInvestmentDiscountPct(300000)).toBe(0);
    expect(resolveInvestmentDiscountPct(500000)).toBe(0.05);
    expect(resolveInvestmentDiscountPct(850000)).toBe(0.05);
    expect(resolveInvestmentDiscountPct(1000000)).toBe(0.10);
    expect(resolveInvestmentDiscountPct(1500000)).toBe(0.10);
  });

  it('valida MOQ de frascos y calcula cotización completa', () => {
    // 60 frascos medianos + 60 frascos mayor = 120 frascos (cumple MOQ)
    const quote = calculateWholesaleOrder([
      { productId: 'crema-miel-frasco-mediano-150g', quantity: 60 },
      { productId: 'crema-miel-reserva-bosque-frasco-mayor-500g', quantity: 60 },
    ]);

    expect(quote.totalUnidadesFrascos).toBe(120);
    expect(quote.cumpleMoqFrascos).toBe(true);
    expect(quote.cumpleMoqGeneral).toBe(true);

    // 60 * 2990 = 179.400 + 60 * 16655 = 999.300 => 1.178.700
    expect(quote.subtotalNetoBaseClp).toBe(1178700);
    expect(quote.descuentoInversionPct).toBe(0.10); // >= 1M => 10%
    expect(quote.descuentoInversionClp).toBe(117870);
    expect(quote.subtotalNetoFinalClp).toBe(1060830);
    expect(quote.despachoGratisRm).toBe(true); // >= 900.000
    expect(quote.iva19PctClp).toBe(Math.round(1060830 * 0.19));
  });

  it('detecta cuando no se cumple el MOQ inicial', () => {
    const quote = calculateWholesaleOrder([
      { productId: 'crema-miel-frasco-mediano-150g', quantity: 30 },
    ]);

    expect(quote.totalUnidadesFrascos).toBe(30);
    expect(quote.cumpleMoqFrascos).toBe(false);
    expect(quote.cumpleMoqGeneral).toBe(false);
    expect(quote.descuentoInversionPct).toBe(0);
    expect(quote.despachoGratisRm).toBe(false);
    expect(quote.montoFaltanteDespachoGratisClp).toBe(
      WHOLESALE_COMMERCIAL_RULES.umbralDespachoGratisRmNetoClp - quote.subtotalNetoFinalClp
    );
  });

  it('valida MOQ de sachets (500 unidades)', () => {
    const quote = calculateWholesaleOrder([
      { productId: 'crema-miel-sachet-15g', quantity: 500 },
    ]);

    expect(quote.totalUnidadesSachets).toBe(500);
    expect(quote.cumpleMoqSachets).toBe(true);
    expect(quote.cumpleMoqGeneral).toBe(true);
    // 500 * 400 = 200.000
    expect(quote.subtotalNetoBaseClp).toBe(200000);
    expect(quote.proximoTramoDescuento?.faltanteClp).toBe(300000);
  });

  it('genera texto formal de acuerdo comercial con datos del cliente', () => {
    const agreement = generateWholesaleAgreementMarkdown({
      razonSocial: 'Emporio Gourmet Lo Barnechea SpA',
      rut: '76.123.456-7',
      direccion: 'Av. El Rodeo 12345, Lo Barnechea',
      fecha: '17 / 08 / 2026',
    });

    expect(agreement).toContain('Emporio Gourmet Lo Barnechea SpA');
    expect(agreement).toContain('76.123.456-7');
    expect(agreement).toContain('Av. El Rodeo 12345, Lo Barnechea');
    expect(agreement).toContain('CONDICIONES COMERCIALES – REVENDEDOR AUTORIZADO CHILE');
    expect(agreement).toContain('15 y 25 °C');
  });
});
