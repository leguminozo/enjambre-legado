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
});