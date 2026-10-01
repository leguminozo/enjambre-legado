import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearUtmAttribution,
  readUtmAttribution,
  writeUtmAttribution,
  type UtmAttribution,
} from './commerce-storage';

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

describe('UTM Attribution Commerce Storage', () => {
  beforeEach(() => {
    const session = createMemoryStorage();
    const local = createMemoryStorage();
    vi.stubGlobal('sessionStorage', session);
    vi.stubGlobal('localStorage', local);
  });

  it('guarda y recupera parámetros de atribución correctamente', () => {
    const mockUtm: UtmAttribution = {
      source: 'instagram',
      medium: 'cpc',
      campaign: 'lanzamiento_cremas',
      term: 'miel chiloe',
      content: 'video_sachet',
      fbclid: 'fb_click_id_123',
      capturedAt: '2026-09-30T23:00:00.000Z',
      landingUrl: '/producto/crema-avellanas?utm_source=instagram',
    };

    writeUtmAttribution(mockUtm);
    const retrieved = readUtmAttribution();

    expect(retrieved).not.toBeNull();
    expect(retrieved?.source).toBe('instagram');
    expect(retrieved?.medium).toBe('cpc');
    expect(retrieved?.campaign).toBe('lanzamiento_cremas');
    expect(retrieved?.fbclid).toBe('fb_click_id_123');
    expect(retrieved?.landingUrl).toBe('/producto/crema-avellanas?utm_source=instagram');
  });

  it('retorna null cuando no hay parámetros de atribución guardados', () => {
    clearUtmAttribution();
    const retrieved = readUtmAttribution();
    expect(retrieved).toBeNull();
  });

  it('limpia los parámetros al invocar clearUtmAttribution', () => {
    writeUtmAttribution({
      source: 'google',
      medium: 'search',
      capturedAt: new Date().toISOString(),
    });

    expect(readUtmAttribution()?.source).toBe('google');
    clearUtmAttribution();
    expect(readUtmAttribution()).toBeNull();
  });

  it('persiste y recupera el código promocional en storage', () => {
    sessionStorage.setItem('oyz_promo_discount_code', 'BIENVENIDA10');
    expect(sessionStorage.getItem('oyz_promo_discount_code')).toBe('BIENVENIDA10');
  });
});

