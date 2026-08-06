import { describe, expect, it } from 'vitest';
import {
  calcularABV,
  calcularCO2Residual,
  calcularCostoPorBotella,
  calcularOGEstimada,
  calcularPrimingMiel,
  mielKgDesdeIngredientes,
  ESTADOS_SUGERIDOS,
  TIPOS_MEDICION_SUGERIDOS,
} from './hidromiel';

describe('calcularABV', () => {
  it('calcula ABV estándar: 1.100 → 1.000 = 13.1%', () => {
    expect(calcularABV(1.1, 1.0)).toBe(13.13);
  });

  it('hidromiel seca típica: 1.090 → 1.002 = 11.5%', () => {
    expect(calcularABV(1.09, 1.002)).toBe(11.55);
  });

  it('devuelve null con entradas inválidas', () => {
    expect(calcularABV(1.0, 1.1)).toBeNull(); // FG > OG
    expect(calcularABV(0.5, 1.0)).toBeNull(); // fuera de rango
    expect(calcularABV(NaN, 1.0)).toBeNull();
  });
});

describe('calcularCO2Residual', () => {
  it('devuelve valores de tabla en puntos exactos', () => {
    expect(calcularCO2Residual(20)).toBe(0.9);
    expect(calcularCO2Residual(18)).toBe(1.0);
    expect(calcularCO2Residual(10)).toBe(1.4);
    expect(calcularCO2Residual(4)).toBe(1.7);
    expect(calcularCO2Residual(25)).toBe(0.75);
  });

  it('interpola linealmente entre puntos', () => {
    // 7→1.55, 10→1.4: a 8.5°C el punto medio
    expect(calcularCO2Residual(8.5)).toBe(1.48);
  });

  it('clampa fuera del rango de la tabla', () => {
    expect(calcularCO2Residual(0)).toBe(1.7);
    expect(calcularCO2Residual(40)).toBe(0.75);
  });
});

describe('calcularPrimingMiel', () => {
  it('3 vol a 18 °C en 10 L → ~99 g de miel (no 40–50 g/L)', () => {
    const r = calcularPrimingMiel({ volumenL: 10, co2TargetVol: 3, tempC: 18 });
    expect(r).not.toBeNull();
    expect(r!.gramosMiel).toBeCloseTo(98.86, 1);
    expect(r!.gramosPorLitro).toBeLessThan(12); // corrige la "regla" peligrosa de 40–50 g/L
    expect(r!.co2ResidualVol).toBe(1.0);
    expect(r!.co2NuevoVol).toBeCloseTo(2.0, 2);
    expect(r!.zona).toBe('flip-top');
  });

  it('2.5 vol a 20 °C en 5 L', () => {
    const r = calcularPrimingMiel({ volumenL: 5, co2TargetVol: 2.5, tempC: 20 });
    expect(r).not.toBeNull();
    expect(r!.gramosMiel).toBeCloseTo(39.54, 1);
    expect(r!.zona).toBe('flip-top');
  });

  it('clasifica la zona de seguridad por envase', () => {
    expect(calcularPrimingMiel({ volumenL: 1, co2TargetVol: 3.5, tempC: 18 })!.zona).toBe('champagne');
    expect(calcularPrimingMiel({ volumenL: 1, co2TargetVol: 5, tempC: 18 })!.zona).toBe('peligro');
  });

  it('respeta fermentabilidad configurable (miel más diluida → más gramos)', () => {
    const base = calcularPrimingMiel({ volumenL: 10, co2TargetVol: 3, tempC: 18 })!;
    const diluida = calcularPrimingMiel({ volumenL: 10, co2TargetVol: 3, tempC: 18, fermentabilidadMiel: 0.75 })!;
    expect(diluida.gramosMiel).toBeGreaterThan(base.gramosMiel);
  });

  it('devuelve null con entradas inválidas', () => {
    expect(calcularPrimingMiel({ volumenL: 0, co2TargetVol: 3, tempC: 18 })).toBeNull();
    expect(calcularPrimingMiel({ volumenL: 10, co2TargetVol: 7, tempC: 18 })).toBeNull();
    expect(calcularPrimingMiel({ volumenL: 10, co2TargetVol: 3, tempC: Number.NaN })).toBeNull();
  });
});

describe('calcularOGEstimada', () => {
  it('3 kg de miel en 10 L → OG ≈ 1.0818 (hidromiel tradicional)', () => {
    expect(calcularOGEstimada(3, 10)).toBeCloseTo(1.0818, 4);
  });

  it('devuelve null con entradas inválidas', () => {
    expect(calcularOGEstimada(0, 10)).toBeNull();
    expect(calcularOGEstimada(3, -1)).toBeNull();
  });
});

describe('calcularCostoPorBotella', () => {
  it('costo unitario: (3 kg × $8.000 + $20.000) / 100 botellas = $440', () => {
    expect(calcularCostoPorBotella({ mielKg: 3, costoMielKg: 8000, costoEnvases: 20000, nBotellas: 100 })).toBe(440);
  });

  it('devuelve null con botellas en cero o costos negativos', () => {
    expect(calcularCostoPorBotella({ mielKg: 3, costoMielKg: 8000, costoEnvases: 0, nBotellas: 0 })).toBeNull();
    expect(calcularCostoPorBotella({ mielKg: 3, costoMielKg: -1, costoEnvases: 0, nBotellas: 10 })).toBeNull();
  });
});

describe('mielKgDesdeIngredientes', () => {
  it('suma ingredientes de miel en kg', () => {
    expect(
      mielKgDesdeIngredientes([
        { nombre: 'Miel de ulmo', cantidad: 3, unidad: 'kg' },
        { nombre: 'Miel de bosque', cantidad: 1.5, unidad: 'kg' },
      ]),
    ).toBe(4.5);
  });

  it('acepta miel sin unidad (kg implícito)', () => {
    expect(mielKgDesdeIngredientes([{ nombre: 'Miel', cantidad: 3, unidad: null }])).toBe(3);
  });

  it('ignora miel medida en litros y otros ingredientes', () => {
    expect(
      mielKgDesdeIngredientes([
        { nombre: 'Miel', cantidad: 3, unidad: 'L' },
        { nombre: 'Agua', cantidad: 10, unidad: 'L' },
      ]),
    ).toBeNull();
  });

  it('devuelve null sin evidencia', () => {
    expect(mielKgDesdeIngredientes([])).toBeNull();
    expect(mielKgDesdeIngredientes([{ nombre: 'Agua', cantidad: 10, unidad: 'L' }])).toBeNull();
  });
});

describe('sugerencias de UI (nunca restricciones)', () => {
  it('incluyen el flujo del proceso y son arrays abiertos', () => {
    expect(ESTADOS_SUGERIDOS).toContain('fermentando');
    expect(ESTADOS_SUGERIDOS).toContain('degustado');
    expect(TIPOS_MEDICION_SUGERIDOS).toContain('densidad');
    expect(TIPOS_MEDICION_SUGERIDOS).toContain('Brix');
  });
});
