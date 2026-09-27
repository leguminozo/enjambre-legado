import { describe, it, expect } from 'vitest';
import {
  DEVICE_VIEWPORT_PRESETS,
  DEFAULT_DEVICE_PRESET,
  getDevicePreset,
  getPresetDimensions,
  calculateViewportScale,
} from './device-viewport-presets';

describe('device-viewport-presets', () => {
  it('contiene los presets canónicos esenciales', () => {
    const ids = DEVICE_VIEWPORT_PRESETS.map((p) => p.id);
    expect(ids).toContain('fluid');
    expect(ids).toContain('compact');
    expect(ids).toContain('standard');
    expect(ids).toContain('max');
    expect(ids).toContain('classic');
    expect(ids).toContain('tablet');
  });

  it('obtiene el preset por ID o devuelve standard por fallback', () => {
    expect(getDevicePreset('compact').width).toBe(360);
    expect(getDevicePreset('standard').width).toBe(390);
    expect(getDevicePreset('max').width).toBe(430);
    // @ts-expect-error fallback de id inexistente
    expect(getDevicePreset('unknown').id).toBe('standard');
  });

  it('calcula dimensiones según orientación vertical vs horizontal', () => {
    const standard = getDevicePreset('standard');
    const portrait = getPresetDimensions(standard, 'portrait');
    expect(portrait.width).toBe(390);
    expect(portrait.height).toBe(844);

    const landscape = getPresetDimensions(standard, 'landscape');
    expect(landscape.width).toBe(844);
    expect(landscape.height).toBe(390);

    const fluid = getDevicePreset('fluid');
    expect(getPresetDimensions(fluid, 'portrait')).toEqual({ width: 0, height: 0 });
    expect(getPresetDimensions(fluid, 'landscape')).toEqual({ width: 0, height: 0 });
  });

  it('calcula la escala de ajuste sin exceder 1 (no agranda más del 100%)', () => {
    // Si el contenedor es mucho mayor que el dispositivo
    const scaleLarge = calculateViewportScale(1200, 1000, 390, 844, 20);
    expect(scaleLarge).toBe(1);

    // Si el contenedor es más pequeño verticalmente
    const scaleRestrictedH = calculateViewportScale(800, 500, 390, 844, 16);
    expect(scaleRestrictedH).toBeLessThan(1);
    expect(scaleRestrictedH).toBeGreaterThan(0.5);

    // Si las dimensiones del contenedor son 0 o inválidas
    expect(calculateViewportScale(0, 500, 390, 844)).toBe(1);
    expect(calculateViewportScale(500, 0, 390, 844)).toBe(1);
  });
});
