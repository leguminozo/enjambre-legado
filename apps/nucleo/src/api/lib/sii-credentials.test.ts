import { describe, expect, it, vi } from 'vitest';
import { resolveSiiAmbiente } from './sii-credentials';

describe('sii-credentials', () => {
  it('resolveSiiAmbiente maps production correctly', () => {
    expect(resolveSiiAmbiente('produccion')).toBe('PRODUCCION');
    expect(resolveSiiAmbiente('PRODUCCION')).toBe('PRODUCCION');
    expect(resolveSiiAmbiente('certificacion')).toBe('CERTIFICACION');
    expect(resolveSiiAmbiente(null)).toBe('CERTIFICACION');
  });

  it('resolveSiiCredentials returns error when env creds missing', async () => {
    const prevBase64 = process.env.SII_P12_BASE64;
    const prevPassword = process.env.SII_P12_PASSWORD;
    delete process.env.SII_P12_BASE64;
    delete process.env.SII_P12_PASSWORD;

    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      storage: { from: vi.fn() },
    } as any;

    const { resolveSiiCredentials } = await import('./sii-credentials');
    const result = await resolveSiiCredentials(supabase, 'empresa-1');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('no_certificado');
    }

    process.env.SII_P12_BASE64 = prevBase64;
    process.env.SII_P12_PASSWORD = prevPassword;
  });

  it('resolveSiiCredentials prefers storage cert + decrypted password over env', async () => {
    vi.resetModules();
    const prevBase64 = process.env.SII_P12_BASE64;
    const prevPassword = process.env.SII_P12_PASSWORD;
    const prevKey = process.env.SII_CLAVE_ENCRYPTION_KEY;
    delete process.env.SII_P12_BASE64;
    delete process.env.SII_P12_PASSWORD;
    process.env.SII_CLAVE_ENCRYPTION_KEY = 'k'.repeat(32);

    const { encryptSiiSecret } = await import('./sii-crypto');
    const enc = await encryptSiiSecret('secret-p12');
    expect(enc).toBeTruthy();

    const blob = new Blob([Uint8Array.from([1, 2, 3, 4])]);
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            storage_path: 'emp/cert.p12',
            nombre: 'demo',
            p12_password_encriptada: enc,
          },
          error: null,
        }),
      })),
      storage: {
        from: vi.fn(() => ({
          download: vi.fn().mockResolvedValue({ data: blob, error: null }),
        })),
      },
    } as any;

    const { resolveSiiCredentials } = await import('./sii-credentials');
    const result = await resolveSiiCredentials(supabase, 'empresa-1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.credentials.source).toBe('storage');
      expect(result.credentials.p12Password).toBe('secret-p12');
      expect(result.credentials.p12Base64.length).toBeGreaterThan(0);
    }

    process.env.SII_P12_BASE64 = prevBase64;
    process.env.SII_P12_PASSWORD = prevPassword;
    if (prevKey === undefined) delete process.env.SII_CLAVE_ENCRYPTION_KEY;
    else process.env.SII_CLAVE_ENCRYPTION_KEY = prevKey;
  });
});