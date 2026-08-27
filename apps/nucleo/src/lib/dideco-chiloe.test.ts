import { describe, expect, it } from 'vitest';
import { COMUNAS_CHILOE } from './chiloe-comunas';
import {
  DIDECO_CHILOE,
  asuntoCorreoDideco,
  cubreDiezComunas,
  cuerpoCorreoDideco,
  didecoDeComuna,
  didecosConCorreo,
  mailtoDideco,
} from './dideco-chiloe';

describe('DIDECO Chiloé', () => {
  it('cubre las 10 comunas de la provincia', () => {
    expect(DIDECO_CHILOE).toHaveLength(10);
    expect(cubreDiezComunas()).toBe(true);
    expect(DIDECO_CHILOE.map((d) => d.slug).sort()).toEqual(
      [...COMUNAS_CHILOE].map((c) => c.slug).sort(),
    );
  });

  it('guarda los dos contactos de ficha pública (Chonchi y Queilén)', () => {
    expect(didecoDeComuna('chonchi')?.email).toBe('dideco@municipalidadchonchi.cl');
    expect(didecoDeComuna('chonchi')?.titular).toMatch(/Eduardo Andrade/);
    expect(didecoDeComuna('queilen')?.email).toBe('dideco@muniqueilen.cl');
    expect(didecoDeComuna('queilen')?.titular).toMatch(/Cristina/);
  });

  it('no inventa correo donde la web municipal no lo publica', () => {
    expect(didecoDeComuna('curaco-de-velez')?.email).toBeNull();
    expect(didecoDeComuna('puqueldon')?.email).toBeNull();
    expect(didecoDeComuna('curaco-de-velez')?.verificado).toBe('pendiente');
  });

  it('el correo a DIDECO es piloto de 90 días, Trama SpA, y no promete SIPEC ni EMT hábil', () => {
    const chonchi = didecoDeComuna('chonchi')!;
    const cuerpo = cuerpoCorreoDideco(chonchi);
    expect(cuerpo).toContain('No sustituye al SAG ni al SIPEC');
    expect(cuerpo).toContain('mal parada si no hace nada');
    expect(cuerpo).toContain('piloto de 90 días');
    expect(cuerpo).toContain('Trama SpA');
    expect(cuerpo).toContain('78.500.141-9');
    expect(cuerpo).toContain('tres cotizaciones');
    expect(cuerpo).toContain('en trámite');
    expect(cuerpo).not.toMatch(/La Obrera y el Zángano/i);
    expect(cuerpo).not.toMatch(/habilitada en el Registro de Proveedores/i);
    expect(cuerpo).not.toMatch(/mandatan a los municipios/i);
    expect(cuerpo).not.toMatch(/ya opera en (todas|las 10)/i);
    expect(cuerpo).not.toContain('30 UTM');
    expect(cuerpo).toContain('/municipalidades/kit');
    expect(cuerpo).toContain('/comuna/chonchi');
    expect(cuerpo).toContain('tesista');
    expect(asuntoCorreoDideco('Chonchi')).toContain('DIDECO Chonchi');
    expect(asuntoCorreoDideco('Chonchi')).toContain('90 días');
    expect(mailtoDideco(chonchi)).toContain('dideco@municipalidadchonchi.cl');
  });

  it('solo arma mailto donde hay correo verificado', () => {
    for (const d of didecosConCorreo()) {
      expect(d.email).toMatch(/@/);
      expect(mailtoDideco(d)).toContain(d.email!);
    }
    expect(didecosConCorreo().length).toBeGreaterThanOrEqual(7);
    expect(mailtoDideco(didecoDeComuna('puqueldon')!)).toBeNull();
  });
});
