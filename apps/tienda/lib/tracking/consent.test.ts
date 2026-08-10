import { describe, expect, it } from 'vitest';
import {
  CONSENT_COOKIE_NAME,
  consentEssentialOnly,
  consentForAll,
  isMarketingConsented,
  parseConsentCookie,
  readConsentFromCookieHeader,
  readConsentFromCookieValue,
  readConsentFromDocumentCookie,
  serializeConsentCookie,
} from './consent';

describe('parseConsentCookie', () => {
  it('parsea una cookie v1 válida', () => {
    const state = parseConsentCookie(
      JSON.stringify({ essential: true, analytics: true, marketing: true, version: 1, updatedAt: '2026-08-10T00:00:00Z' }),
    );
    expect(state).not.toBeNull();
    expect(state?.marketing).toBe(true);
    expect(state?.analytics).toBe(true);
    expect(state?.essential).toBe(true);
  });

  it('rechaza JSON inválido', () => {
    expect(parseConsentCookie('not-json')).toBeNull();
    expect(parseConsentCookie('')).toBeNull();
    expect(parseConsentCookie(undefined)).toBeNull();
  });

  it('rechaza versión distinta (cookie obsoleta → se pide de nuevo)', () => {
    expect(
      parseConsentCookie(JSON.stringify({ essential: true, marketing: true, version: 0 })),
    ).toBeNull();
  });

  it('default estricto: sin marketing explícito → false', () => {
    const state = parseConsentCookie(
      JSON.stringify({ essential: true, analytics: true, version: 1 }),
    );
    expect(state?.marketing).toBe(false);
  });
});

describe('isMarketingConsented', () => {
  it('solo true con marketing explícito', () => {
    const all = parseConsentCookie(JSON.stringify({ ...consentForAll(), version: 1, updatedAt: '' }));
    const essential = parseConsentCookie(
      JSON.stringify({ ...consentEssentialOnly(), version: 1, updatedAt: '' }),
    );
    expect(isMarketingConsented(all)).toBe(true);
    expect(isMarketingConsented(essential)).toBe(false);
    expect(isMarketingConsented(null)).toBe(false);
    expect(isMarketingConsented(undefined)).toBe(false);
  });
});

describe('serializeConsentCookie + lecturas', () => {
  it('roundtrip: lo que se serializa se lee igual (valor URL-encoded)', () => {
    const cookie = serializeConsentCookie(consentForAll());
    expect(cookie).toContain(`${CONSENT_COOKIE_NAME}=`);
    const value = cookie.slice(CONSENT_COOKIE_NAME.length + 1).split(';')[0]!;
    const state = readConsentFromCookieValue(value);
    expect(state?.marketing).toBe(true);
    expect(state?.analytics).toBe(true);
  });

  it('lee desde document.cookie', () => {
    const cookie = serializeConsentCookie(consentEssentialOnly());
    const state = readConsentFromDocumentCookie(`${cookie}; other=1`);
    expect(state?.marketing).toBe(false);
    expect(state?.essential).toBe(true);
  });

  it('lee desde header Cookie crudo (server)', () => {
    const cookie = serializeConsentCookie(consentForAll());
    const state = readConsentFromCookieHeader(`theme=dark; ${cookie}`);
    expect(state?.marketing).toBe(true);
  });

  it('null si la cookie no está presente', () => {
    expect(readConsentFromDocumentCookie('theme=dark')).toBeNull();
    expect(readConsentFromCookieHeader('')).toBeNull();
  });
});
