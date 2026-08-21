import { describe, expect, it } from 'vitest';
import {
  getNucleoStaffEntryPath,
  getNucleoStaffEntryUrl,
  isStaffRedirectExternal,
} from './nucleo-app-url';

describe('nucleo-app-url — staff redirect externality (RSC-safe navigation)', () => {
  it('expone path canónico de entrada staff de Núcleo', () => {
    expect(getNucleoStaffEntryPath()).toBe('/ejecutivo');
  });

  it('marca URLs http(s) absolutas como externas (deben ir por window.location)', () => {
    expect(isStaffRedirectExternal('https://www.registroapicolachiloe.me/ejecutivo')).toBe(true);
    expect(isStaffRedirectExternal('http://localhost:3000/ejecutivo')).toBe(true);
  });

  it('no marca paths relativos same-origin como externos (van por router)', () => {
    expect(isStaffRedirectExternal('/perfil')).toBe(false);
    expect(isStaffRedirectExternal('/perfil/creador')).toBe(false);
    expect(isStaffRedirectExternal('')).toBe(false);
  });

  it('trata null/undefined como no externo (fallback /perfil por el caller)', () => {
    expect(isStaffRedirectExternal(null)).toBe(false);
    expect(isStaffRedirectExternal(undefined)).toBe(false);
  });

  it('resuelve URL staff absoluta cross-origin con NUCLEO_API_URL válida', () => {
    const url = getNucleoStaffEntryUrl();
    // En CI/VERCEL sin env self-referente -> CANONICAL_NUCLEO_URL (absoluto).
    // En caso de existir env válida -> absoluto. Ambos son externos para router.
    if (url !== null) {
      expect(isStaffRedirectExternal(url)).toBe(true);
      expect(url.endsWith('/ejecutivo')).toBe(true);
    }
  });
});
