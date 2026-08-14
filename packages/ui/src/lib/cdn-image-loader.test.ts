import { describe, expect, it } from 'vitest';
import { cdnImageLoader } from './cdn-image-loader';

describe('cdnImageLoader', () => {
  it('devuelve URLs de Storage sin reescribir (sin /_next/image)', () => {
    const src =
      'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/productos/abc.webp';
    expect(cdnImageLoader({ src, width: 800, quality: 75 })).toBe(src);
  });

  it('conserva paths locales y thumbs de YouTube', () => {
    expect(cdnImageLoader({ src: '/brand/hero.jpg', width: 1200 })).toBe('/brand/hero.jpg');
    const yt = 'https://img.youtube.com/vi/abc/hqdefault.jpg';
    expect(cdnImageLoader({ src: yt, width: 480 })).toBe(yt);
  });
});
