import { describe, expect, it } from 'vitest';
import {
  extractCmsObjectPath,
  extractCmsPaths,
  walkStorageList,
  type StorageListEntry,
} from './cms-storage';

describe('extractCmsObjectPath', () => {
  it('saca el path real (incluye el prefijo cms/ del upload)', () => {
    expect(
      extractCmsObjectPath(
        'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/colecciones/755ef288.png',
      ),
    ).toBe('cms/colecciones/755ef288.png');
  });

  it('ignora otros buckets', () => {
    expect(
      extractCmsObjectPath(
        'https://x.supabase.co/storage/v1/object/public/productos/abc.webp',
      ),
    ).toBeNull();
  });
});

describe('extractCmsPaths', () => {
  it('recorre content anidado', () => {
    const acc = new Set<string>();
    extractCmsPaths(
      {
        image: 'https://x.supabase.co/storage/v1/object/public/cms/cms/media_items/a.png',
        nested: { logo: 'https://x.supabase.co/storage/v1/object/public/cms/cms/brand_assets/b.svg' },
      },
      acc,
    );
    expect([...acc].sort()).toEqual(['cms/brand_assets/b.svg', 'cms/media_items/a.png']);
  });
});

describe('walkStorageList', () => {
  it('baja cms/{seccion}/archivo (el listado de 1 nivel devolvía 0)', async () => {
    const tree: Record<string, StorageListEntry[]> = {
      '': [{ name: 'cms', id: null }],
      cms: [
        { name: 'colecciones', id: null },
        { name: 'media_items', id: null },
      ],
      'cms/colecciones': [
        { name: 'a.png', id: 'file-1', metadata: { size: 1200 }, created_at: '2026-08-01' },
      ],
      'cms/media_items': [
        { name: 'b.png', id: 'file-2', metadata: { size: 800 }, created_at: '2026-08-02' },
      ],
    };
    const files = await walkStorageList(async (prefix) => tree[prefix] ?? []);
    expect(files.map((f) => f.path).sort()).toEqual([
      'cms/colecciones/a.png',
      'cms/media_items/b.png',
    ]);
  });
});
