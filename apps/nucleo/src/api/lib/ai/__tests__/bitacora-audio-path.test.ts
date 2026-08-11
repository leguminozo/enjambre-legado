import { describe, expect, it } from 'vitest';
import { resolveBitacoraStoragePath } from '../bitacora-audio-path';

describe('resolveBitacoraStoragePath', () => {
  it('acepta path relativo del sync engine', () => {
    expect(resolveBitacoraStoragePath('uid/req-1.m4a')).toBe('uid/req-1.m4a');
    expect(resolveBitacoraStoragePath('/uid/req-1.webm')).toBe('uid/req-1.webm');
  });

  it('extrae path de URL con segmento bitacora-audio', () => {
    expect(
      resolveBitacoraStoragePath(
        'https://xyz.supabase.co/storage/v1/object/sign/bitacora-audio/uid/a.m4a?token=abc',
      ),
    ).toBe('uid/a.m4a');
  });

  it('rechaza vacío y URL sin bucket conocido', () => {
    expect(resolveBitacoraStoragePath('')).toBeNull();
    expect(resolveBitacoraStoragePath('   ')).toBeNull();
    expect(resolveBitacoraStoragePath('https://cdn.example.com/file.m4a')).toBeNull();
  });
});
