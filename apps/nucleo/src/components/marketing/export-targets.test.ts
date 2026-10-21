import { describe, expect, it } from 'vitest';
import {
  EXPORT_TARGETS,
  buildExportPlan,
  listExportTargets,
  resolveExportTarget,
} from './export-targets';

describe('formatos de salida', () => {
  it('cada formato declara mime, extensión y familia', () => {
    for (const target of EXPORT_TARGETS) {
      expect(target.mime.length).toBeGreaterThan(0);
      expect(target.extension.length).toBeGreaterThan(0);
      expect(['raster', 'video', 'data']).toContain(target.kind);
      expect(target.scopes.length).toBeGreaterThan(0);
    }
  });

  it('el alcance estático no ofrece video', () => {
    const targets = listExportTargets('estatico');
    expect(targets.some((target) => target.kind === 'video')).toBe(false);
    expect(targets.some((target) => target.kind === 'raster')).toBe(true);
    expect(targets.some((target) => target.id === 'recipe')).toBe(true);
  });

  it('los alcances con movimiento ofrecen video', () => {
    for (const scope of ['elegante', 'rupturista'] as const) {
      const targets = listExportTargets(scope);
      expect(targets.some((target) => target.id === 'mp4')).toBe(true);
      expect(targets.some((target) => target.id === 'webm')).toBe(true);
    }
  });

  it('el modelo y la receta no dependen del equipo', () => {
    expect(resolveExportTarget('json').engine).toBe('none');
    expect(resolveExportTarget('recipe').engine).toBe('none');
  });

  it('cae a un formato conocido ante un valor desconocido', () => {
    expect(resolveExportTarget('desconocido').id).toBe('png');
  });

  it('arma el plan con nombre y extensión', () => {
    const plan = buildExportPlan({
      target: resolveExportTarget('png'),
      index: 2,
      total: 6,
      baseName: 'oyz lamina',
    });
    expect(plan.filename).toBe('oyz_lamina_03.png');
    expect(plan.extension).toBe('png');
    expect(plan.kind).toBe('raster');
    expect(plan.requiresTimeline).toBe(false);
  });

  it('el modelo conserva el nombre sin sufijo cuando es una sola pieza', () => {
    const plan = buildExportPlan({
      target: resolveExportTarget('recipe'),
      total: 1,
      baseName: 'oyz_lamina',
    });
    expect(plan.filename).toBe('oyz_lamina.recipe.json');
  });

  it('el video exige recorrer la línea de tiempo', () => {
    const plan = buildExportPlan({ target: resolveExportTarget('mp4'), total: 3 });
    expect(plan.requiresTimeline).toBe(true);
    expect(plan.kind).toBe('video');
  });
});
