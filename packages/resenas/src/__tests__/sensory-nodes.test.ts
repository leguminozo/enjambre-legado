import { describe, it, expect } from 'vitest';
import {
  EJES_SENSORIALES_POR_CATEGORIA,
  VALORES_DEFAULT_EJES,
  obtenerGuiaEjeSensorial,
  resolverEjesSensoriales,
  NODE_ALIASES,
} from '../constants';

describe('Sensory Nodes & Guidance', () => {
  it('defines 8 intuitive, direct nodes for miel', () => {
    const ejes = EJES_SENSORIALES_POR_CATEGORIA.miel;
    expect(ejes).toHaveLength(8);
    expect(ejes).toContain('Intensidad de Sabor');
    expect(ejes).toContain('Aroma a Bosque');
    expect(ejes).toContain('Dulzor Natural');
    expect(ejes).toContain('Textura & Cremosidad');
    expect(ejes).toContain('Toque Cítrico & Frescor');
    expect(ejes).toContain('Cuerpo & Densidad');
    expect(ejes).toContain('Duración en Boca');
    expect(ejes).toContain('Carácter Silvestre');
  });

  it('defines 8 intuitive, direct nodes for fortificaciones', () => {
    const ejes = EJES_SENSORIALES_POR_CATEGORIA.fortificaciones;
    expect(ejes).toHaveLength(8);
    expect(ejes).toContain('Tostado & Calidez');
    expect(ejes).toContain('Suavidad & Untuosidad');
    expect(ejes).toContain('Finura de la Molienda');
    expect(ejes).toContain('Cuerpo & Presencia');
    expect(ejes).toContain('Toque Amargo Noble');
    expect(ejes).toContain('Crocancia & Mordida');
    expect(ejes).toContain('Duración del Sabor');
    expect(ejes).toContain('Carácter de Origen');
  });

  it('provides guide questions and meaningful endpoints for intuitive nodes', () => {
    const guiaIntensidad = obtenerGuiaEjeSensorial('Intensidad de Sabor');
    expect(guiaIntensidad.preguntaGuia).toContain('sabor');
    expect(guiaIntensidad.extremoIzq).toContain('1.0');
    expect(guiaIntensidad.extremoDer).toContain('10.0');

    const guiaMolienda = obtenerGuiaEjeSensorial('Finura de la Molienda');
    expect(guiaMolienda.preguntaGuia).toContain('molido');
    expect(guiaMolienda.extremoIzq).toContain('Rústica');
    expect(guiaMolienda.extremoDer).toContain('Sedosa');
  });

  it('resolves historical aliases transparently without errors', () => {
    const guiaMadurez = obtenerGuiaEjeSensorial('Madurez Enzimática');
    expect(guiaMadurez.preguntaGuia).toBeDefined();
    expect(guiaMadurez.extremoIzq).toContain('1.0');

    const guiaGranulo = obtenerGuiaEjeSensorial('Granulometría & Molienda');
    expect(guiaGranulo.preguntaGuia).toContain('molido');
  });

  it('provides default scores in VALORES_DEFAULT_EJES for all category axes', () => {
    Object.values(EJES_SENSORIALES_POR_CATEGORIA).forEach((axes) => {
      axes.forEach((axis) => {
        expect(VALORES_DEFAULT_EJES[axis]).toBeGreaterThanOrEqual(10);
        expect(VALORES_DEFAULT_EJES[axis]).toBeLessThanOrEqual(100);
      });
    });
  });

  it('correctly resolves axes by product name or family type', () => {
    const mielAxes = resolverEjesSensoriales('miel', 'Miel de Ulmo');
    expect(mielAxes[0]).toBe('Intensidad de Sabor');

    const avellanaAxes = resolverEjesSensoriales('fortificaciones', 'Avellana Chilena Tostada');
    expect(avellanaAxes).toContain('Finura de la Molienda');
  });
});
