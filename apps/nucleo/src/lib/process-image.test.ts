import { describe, expect, it } from 'vitest';
import {
  fieldPreservesAlpha,
  maxSizeForImageField,
  resolveFileMime,
  shouldProcessImage,
  isRasterImage,
} from './process-image';

function file(name: string, type = '', size = 100): File {
  const blob = new Blob([new Uint8Array(size)], { type: type || undefined });
  return new File([blob], name, { type, lastModified: Date.now() });
}

describe('resolveFileMime', () => {
  it('usa file.type cuando es válido', () => {
    expect(resolveFileMime(file('x.bin', 'image/png'))).toBe('image/png');
  });

  it('infiere por extensión si type vacío u octet-stream', () => {
    expect(resolveFileMime(file('logo.PNG', ''))).toBe('image/png');
    expect(resolveFileMime(file('icon.svg', 'application/octet-stream'))).toBe('image/svg+xml');
    expect(resolveFileMime(file('photo.JPEG', ''))).toBe('image/jpeg');
    expect(resolveFileMime(file('a.webp', ''))).toBe('image/webp');
  });
});

describe('fieldPreservesAlpha', () => {
  it('true para campos de logo/favicon/icon', () => {
    expect(fieldPreservesAlpha('logo_url')).toBe(true);
    expect(fieldPreservesAlpha('logo_src')).toBe(true);
    expect(fieldPreservesAlpha('logo_footer_url')).toBe(true);
    expect(fieldPreservesAlpha('favicon_url')).toBe(true);
    expect(fieldPreservesAlpha('icon')).toBe(true);
    expect(fieldPreservesAlpha('hero_logo')).toBe(true);
  });

  it('false para fotos de producto / og genérico sin logo', () => {
    expect(fieldPreservesAlpha('og_image_url')).toBe(false);
    expect(fieldPreservesAlpha('fotos')).toBe(false);
    expect(fieldPreservesAlpha(undefined)).toBe(false);
  });
});

describe('maxSizeForImageField', () => {
  it('tamaños por tipo de asset', () => {
    expect(maxSizeForImageField('favicon_url')).toBe(512);
    expect(maxSizeForImageField('logo_url')).toBe(1600);
    expect(maxSizeForImageField('logo_src')).toBe(1600);
    expect(maxSizeForImageField('og_image_url')).toBe(1200);
    expect(maxSizeForImageField('random')).toBe(1200);
  });
});

describe('shouldProcessImage / isRasterImage', () => {
  it('SVG y PDF no se procesan (passthrough)', () => {
    expect(shouldProcessImage(file('a.svg', 'image/svg+xml'))).toBe(false);
    expect(shouldProcessImage(file('a.pdf', 'application/pdf'))).toBe(false);
  });

  it('GIF no se re-encodea', () => {
    expect(shouldProcessImage(file('a.gif', 'image/gif'))).toBe(false);
    expect(isRasterImage(file('a.gif', 'image/gif'))).toBe(true);
  });

  it('JPEG/PNG/WEBP sí se procesan', () => {
    expect(shouldProcessImage(file('a.jpg', 'image/jpeg'))).toBe(true);
    expect(shouldProcessImage(file('a.png', 'image/png'))).toBe(true);
    expect(shouldProcessImage(file('a.webp', 'image/webp'))).toBe(true);
  });

  it('infiere PNG por extensión y marca como raster procesable', () => {
    const f = file('logo.png', '');
    expect(resolveFileMime(f)).toBe('image/png');
    expect(isRasterImage(f)).toBe(true);
    expect(shouldProcessImage(f)).toBe(true);
  });
});
