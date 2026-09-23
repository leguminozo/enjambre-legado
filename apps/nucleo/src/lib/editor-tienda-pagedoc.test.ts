import { describe, expect, it } from 'vitest';
import type { CmsSectionKey } from '@/lib/editor-tienda-sections';
import type { CMSItemDoc } from '@/lib/editor-tienda-schema';
import { defaultLandingLayout, pageDocFromStore, storeOpsFromPageDoc } from '@/lib/editor-tienda-pagedoc';

const row = (
  id: string,
  section_key: CmsSectionKey,
  item_order: number,
  content: Record<string, unknown>,
  is_active = true,
): CMSItemDoc => ({ id, section_key, item_order, content, is_active });

describe('pageDocFromStore', () => {
  it('mapea landing_layout → secciones (hero queda fuera, los pares componen formato)', () => {
    const layout = defaultLandingLayout();
    const rows = [
      row('m1', 'media_items', 2, { type: 'image', src: 'b.jpg' }, false),
      row('m2', 'media_items', 1, { type: 'image', src: 'a.jpg' }),
      row('ms', 'media_settings', 1, { carousel_height: '50vh/70vh' }),
    ];
    const doc = pageDocFromStore(rows, layout, 'es');

    // Orden del home: hero (sin editor key) se salta; mapea según DEFAULT_LANDING_SECTIONS
    expect(doc.order).toEqual([
      'identidad_settings',
      'conservation_content',
      'colecciones',
      'media_items',
      'products_settings',
      'video_settings',
      'club_legado_settings',
      'map_settings',
      'experiencias_home_settings',
      'alianzas_home_settings',
    ]);
    const media = doc.sections['media_items'];
    expect(media.disabled).toBe(false);
    // Items ordenados por item_order
    expect(media.items?.map((i) => i.id)).toEqual(['m2', 'm1']);
    expect(media.items?.[0].is_active).toBe(true);
    // Formato del par compuesto desde su propia section_key
    expect(media.settings).toEqual({ carousel_height: '50vh/70vh' });
  });

  it('deshabilitar un bloque del home → disabled en la instancia', () => {
    const layout = defaultLandingLayout();
    layout.sections = layout.sections.map((s) => (s.id === 'media' ? { ...s, enabled: false } : s));
    const doc = pageDocFromStore([row('m1', 'media_items', 1, {})], layout, 'es');
    expect(doc.sections['media_items'].disabled).toBe(true);
  });

  it('filtra por locale con fallback a cualquier locale', () => {
    const layout = defaultLandingLayout();
    // Sin rows en 'en' → fallback a las existentes (no vacío)
    const es = pageDocFromStore([row('m1', 'media_items', 1, { src: 'es.jpg' })], layout, 'es');
    const en = pageDocFromStore([row('m1', 'media_items', 1, { src: 'es.jpg' })], layout, 'en');
    expect(es.sections['media_items'].items).toHaveLength(1);
    expect(en.sections['media_items'].items).toHaveLength(1);
  });
});

describe('storeOpsFromPageDoc', () => {
  it('idempotente: doc materializado de las mismas rows → ops vacías', () => {
    const layout = defaultLandingLayout();
    // Todos los bloques del home con sus rows (settings singletons incluidos).
    const rows = [
      row('is', 'identidad_settings', 1, {}),
      row('m1', 'media_items', 1, { type: 'image', src: 'a.jpg' }),
      row('ms', 'media_settings', 1, { carousel_height: '50vh/70vh' }),
      row('co', 'conservation_content', 1, { kicker: 'X' }),
      row('cs', 'collections_settings', 1, {}), // colecciones es pair → formato propio
      row('ps', 'products_settings', 1, {}),
      row('vs', 'video_settings', 1, {}),
      row('cl', 'club_legado_settings', 1, {}),
      row('mp', 'map_settings', 1, {}),
      row('eh', 'experiencias_home_settings', 1, {}),
      row('ah', 'alianzas_home_settings', 1, {}),
    ];
    const doc = pageDocFromStore(rows, layout, 'es');
    const ops = storeOpsFromPageDoc(doc, rows);
    expect(ops.create).toEqual([]);
    expect(ops.update).toEqual([]);
    expect(ops.delete).toEqual([]);
  });

  it('editar formato y fichas → update; item removido → delete; item nuevo → create', () => {
    const layout = defaultLandingLayout();
    const rows = [
      row('is', 'identidad_settings', 1, {}),
      row('m1', 'media_items', 1, { type: 'image', src: 'a.jpg' }),
      row('m2', 'media_items', 2, { type: 'image', src: 'b.jpg' }),
      row('ms', 'media_settings', 1, { carousel_height: '50vh/70vh' }),
      row('co', 'conservation_content', 1, {}),
      row('cs', 'collections_settings', 1, {}), // colecciones es pair → formato propio
      row('ps', 'products_settings', 1, {}),
      row('vs', 'video_settings', 1, {}),
      row('cl', 'club_legado_settings', 1, {}),
      row('mp', 'map_settings', 1, {}),
      row('eh', 'experiencias_home_settings', 1, {}),
      row('ah', 'alianzas_home_settings', 1, {}),
    ];
    const doc = pageDocFromStore(rows, layout, 'es');
    // El operador: cambia el formato, borra m2, agrega m3 (m1 queda igual)
    doc.sections['media_items'].settings = { carousel_height: '60vh/80vh' };
    doc.sections['media_items'].items = [
      { id: 'm1', section_key: 'media_items', item_order: 1, content: { type: 'image', src: 'a.jpg' }, is_active: true },
      { id: 'm3', section_key: 'media_items', item_order: 2, content: { type: 'video', src: 'https://youtu.be/x' }, is_active: true },
    ];
    const ops = storeOpsFromPageDoc(doc, rows);

    expect(ops.update.map((u) => u.id)).toEqual(['ms']);
    expect(ops.update.find((u) => u.id === 'ms')?.content).toEqual({ carousel_height: '60vh/80vh' });
    expect(ops.create.map((c) => c.section_key)).toEqual(['media_items']);
    expect(ops.create[0].content).toEqual({ type: 'video', src: 'https://youtu.be/x' });
    expect(ops.delete).toEqual(['m2']);
  });

  it('settings singleton sin row → create; con row sin cambios → sin ops', () => {
    const layout = defaultLandingLayout();
    const doc = pageDocFromStore([], layout, 'es');
    doc.sections['conservation_content'].settings = { kicker: 'Nuevo' };
    const ops = storeOpsFromPageDoc(doc, []);
    expect(ops.create.map((c) => c.section_key)).toContain('conservation_content');
    expect(ops.create.find((c) => c.section_key === 'conservation_content')?.content).toEqual({ kicker: 'Nuevo' });
  });
});
