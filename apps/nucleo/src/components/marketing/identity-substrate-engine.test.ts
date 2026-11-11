import { describe, it, expect, vi } from 'vitest';
import {
  IdentitySubstrateSimulation,
  DEFAULT_SUBSTRATE_PARAMS,
  SUBSTRATE_PALETTES,
  type SubstrateMotorType,
} from './identity-substrate-engine';

function createMockCanvas(width = 1080, height = 1350): HTMLCanvasElement {
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    rect: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn(),
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
  };
  return {
    width,
    height,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
}

describe('identity-substrate-engine', () => {
  it('inicializa con el motor por defecto obrera_zangano', () => {
    expect(DEFAULT_SUBSTRATE_PARAMS.motor).toBe('obrera_zangano');
    const canvas = createMockCanvas();
    const sim = new IdentitySubstrateSimulation(canvas);
    const stats = sim.getStats();

    expect(stats.tick).toBe(0);
    expect(stats.organismCount).toBeGreaterThan(0);
    expect(stats.width).toBe(1080);
    expect(stats.height).toBe(1350);
  });

  const ALL_MOTORS: SubstrateMotorType[] = [
    'obrera_zangano',
    'hueco_bosque',
    'radar_constelacion',
    'floracion_bosque',
    'cristalizacion_miel',
    'alambique_hidromiel',
    'reologia_miel',
    'enjambre_flujo',
    'geometria_panal',
    'lidar_fiordos',
    'filigrana_origen',
  ];

  ALL_MOTORS.forEach((motor) => {
    it(`ejecuta pasos de simulación y render sin errores para motor: ${motor}`, () => {
      const canvas = createMockCanvas();
      const sim = new IdentitySubstrateSimulation(canvas, {
        ...DEFAULT_SUBSTRATE_PARAMS,
        motor,
      });

      // Avanza 5 cuadros completos
      for (let i = 0; i < 5; i++) {
        sim.step();
      }

      const stats = sim.getStats();
      expect(stats.tick).toBe(5);
      expect(stats.organismCount).toBeGreaterThan(0);
    });
  });

  it('permite reaccionar a pulsos gravitacionales e interacción de cursor', () => {
    const canvas = createMockCanvas();
    const sim = new IdentitySubstrateSimulation(canvas);

    sim.setCursor(500, 600, true);
    sim.triggerPulse(500, 600);
    sim.step();

    const stats = sim.getStats();
    expect(stats.tick).toBe(1);

    sim.setCursor(0, 0, false);
    sim.step();
    expect(sim.getStats().tick).toBe(2);
  });

  it('permite redimensionar y cambiar de paleta cromática reactivamente', () => {
    const canvas = createMockCanvas();
    const sim = new IdentitySubstrateSimulation(canvas);

    sim.resize(1920, 1080);
    expect(sim.getStats().width).toBe(1920);
    expect(sim.getStats().height).toBe(1080);

    sim.updateParameters({ palette: 'selva' });
    const palette = sim.getActivePalette();
    expect(palette.id).toBe('selva');

    sim.step();
  });

  it('soporta reinicio completo de la simulación', () => {
    const canvas = createMockCanvas();
    const sim = new IdentitySubstrateSimulation(canvas);

    for (let i = 0; i < 10; i++) sim.step();
    expect(sim.getStats().tick).toBe(10);

    sim.resetSimulation();
    expect(sim.getStats().tick).toBe(0);
  });
});
