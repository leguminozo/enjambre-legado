import { describe, expect, it } from 'vitest';
import { resolveTerritorialWriteGate } from '../territorial-write-gate';

const BASE = '/api/registro-territorial';

describe('territorial-write-gate · oleada 2a + carve-outs 2b', () => {
  it('lecturas siempre abiertas (RLS filtra datos)', () => {
    expect(resolveTerritorialWriteGate('GET', `${BASE}/actores`, null).allow).toBe(true);
    expect(resolveTerritorialWriteGate('HEAD', `${BASE}/predios`, null).allow).toBe(true);
    expect(resolveTerritorialWriteGate('OPTIONS', `${BASE}/alertas`, 'api_residente').allow).toBe(true);
  });

  it('familia api escribe sin restricción de gate', () => {
    for (const rol of ['api_residente', 'api_trashumante', 'api_mixto']) {
      expect(resolveTerritorialWriteGate('POST', `${BASE}/apiarios-externos`, rol).allow).toBe(true);
      expect(resolveTerritorialWriteGate('PATCH', `${BASE}/actores/00000000-0000-0000-0000-000000000000`, rol).allow).toBe(true);
    }
  });

  it('familia institucion escribe; minimo sin sub-rol bloqueado (fail-closed)', () => {
    expect(resolveTerritorialWriteGate('POST', `${BASE}/predios`, 'institucion_publica').allow).toBe(true);
    const blocked = resolveTerritorialWriteGate('POST', `${BASE}/apiarios-externos`, null);
    expect(blocked.allow).toBe(false);
    if (!blocked.allow) {
      expect(blocked.code).toBe('territorial_family_restricted');
      expect(blocked.message).toContain('oleada 2b');
    }
  });

  it('inscripción propia siempre permitida para cualquier sub-rol o sin él', () => {
    for (const rol of [null, 'prop_facilitador', 'agri_fitosanitario', 'tecnico_inspector']) {
      expect(resolveTerritorialWriteGate('POST', `${BASE}/actores`, rol).allow).toBe(true);
    }
  });

  it('carve-out agri_*: emite alertas; resto de escrituras le siguen cerradas', () => {
    for (const rol of ['agri_fitosanitario', 'agri_aplicador']) {
      expect(resolveTerritorialWriteGate('POST', `${BASE}/alertas`, rol).allow).toBe(true);
      expect(resolveTerritorialWriteGate('POST', `${BASE}/predios`, rol).allow).toBe(false);
      expect(resolveTerritorialWriteGate('POST', `${BASE}/apiarios-externos`, rol).allow).toBe(false);
      expect(
        resolveTerritorialWriteGate('POST', `${BASE}/apiarios/sync-desde-operativo`, rol).allow,
      ).toBe(false);
    }
  });

  it('carve-out prop_facilitador: registra predios; no emite alertas ni trashumancia', () => {
    const rol = 'prop_facilitador';
    expect(resolveTerritorialWriteGate('POST', `${BASE}/predios`, rol).allow).toBe(true);
    expect(resolveTerritorialWriteGate('POST', `${BASE}/alertas`, rol).allow).toBe(false);
    expect(resolveTerritorialWriteGate('POST', `${BASE}/apiarios-externos`, rol).allow).toBe(false);
  });

  it('tecnico_inspector y comercial_acopio siguen en solo-lectura + inscripción', () => {
    for (const rol of ['tecnico_inspector', 'comercial_acopio']) {
      expect(resolveTerritorialWriteGate('POST', `${BASE}/alertas`, rol).allow).toBe(false);
      expect(resolveTerritorialWriteGate('POST', `${BASE}/predios`, rol).allow).toBe(false);
    }
  });

  it('confirmar alerta: acuse abierto a todo actor inscrito (ownership en la ruta)', () => {
    const id = '11111111-1111-1111-1111-111111111111';
    for (const rol of [
      'api_residente',
      'agri_fitosanitario',
      'prop_facilitador',
      'tecnico_inspector',
      null,
    ]) {
      expect(
        resolveTerritorialWriteGate('POST', `${BASE}/alertas/${id}/confirmar`, rol).allow,
      ).toBe(true);
    }
  });

  it('PATCH de estado de alerta NO es acuse: sigue restringido para minimo', () => {
    const id = '11111111-1111-1111-1111-111111111111';
    expect(
      resolveTerritorialWriteGate('PATCH', `${BASE}/alertas/${id}/estado`, 'agri_fitosanitario').allow,
    ).toBe(false);
  });
});
