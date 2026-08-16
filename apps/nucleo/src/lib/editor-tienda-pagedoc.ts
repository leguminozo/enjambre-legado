/**
 * Materialización PageDoc ↔ site_content.
 *
 * pageDocFromStore: rows + landing_layout → PageDoc (la página como datos).
 * storeOpsFromPageDoc: PageDoc + rows actuales → diff create/update/delete
 * (todo pasa por los endpoints /api/cms/* existentes, sin tocar la tienda).
 */
import {
  DEFAULT_LANDING_LAYOUT,
  LANDING_SECTION_EDITOR_KEY,
  type LandingLayoutSettings,
} from '@/lib/store-chrome';
import { type CmsSectionKey } from '@/lib/editor-tienda-sections';
import {
  getSectionSchema,
  type CMSItemDoc,
  type PageDoc,
} from '@/lib/editor-tienda-schema';

/** Row de site_content con locale (migración 1001; el contrato es es|en). */
export type PageDocRow = CMSItemDoc & { locale?: string | null };

function contentEquals(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Materializa el PageDoc del home: el orden sale de landing_layout; cada
 * landing section mapea a su herramienta (LANDING_SECTION_EDITOR_KEY); hero
 * no tiene (su copy vive en landing_layout). Los pares (media_items ↔
 * media_settings) componen formato + fichas en una sola instancia.
 */
export function pageDocFromStore(
  rows: readonly PageDocRow[],
  layout: LandingLayoutSettings,
  locale: 'es' | 'en',
): PageDoc {
  const doc: PageDoc = { title: 'Inicio', locale, sections: {}, order: [] };
  const byKey = new Map<string, PageDocRow[]>();
  for (const row of rows) {
    const list = byKey.get(row.section_key) ?? [];
    list.push(row);
    byKey.set(row.section_key, list);
  }
  const rowsFor = (key: string): PageDocRow[] => {
    const all = byKey.get(key) ?? [];
    const localized = all.filter((r) => (r.locale ?? 'es') === locale);
    return localized.length > 0 ? localized : all;
  };

  for (const cfg of layout.sections) {
    const key = LANDING_SECTION_EDITOR_KEY[cfg.id];
    if (!key) continue; // hero: el copy editable vive en landing_layout
    const schema = getSectionSchema(key);
    const keyRows = rowsFor(key).slice().sort((a, b) => a.item_order - b.item_order);

    let settings: Record<string, unknown> = {};
    let items: CMSItemDoc[] | undefined;
    if (schema && schema.kind.kind === 'settings') {
      settings = keyRows[0]?.content ?? {};
    } else {
      items = keyRows;
      if (schema && schema.kind.kind === 'pair') {
        settings = rowsFor(schema.kind.settingsKey)[0]?.content ?? {};
      }
    }
    doc.sections[key] = { type: key as CmsSectionKey, settings, items, disabled: !cfg.enabled };
    doc.order.push(key);
  }
  return doc;
}

export type StoreOps = {
  create: Array<{
    section_key: CmsSectionKey;
    content: Record<string, unknown>;
    item_order: number;
    is_active: boolean;
  }>;
  update: Array<{ id: string; content: Record<string, unknown>; is_active: boolean }>;
  delete: string[];
};

/**
 * Diff PageDoc → rows: crea/actualiza por id (items) o por singleton (settings),
 * borra items que ya no están en el doc. Idempotente: un doc materializado de
 * las mismas rows produce ops vacías. Los singletons no se borran (compartidos).
 */
export function storeOpsFromPageDoc(doc: PageDoc, current: readonly CMSItemDoc[]): StoreOps {
  const create: StoreOps['create'] = [];
  const update: StoreOps['update'] = [];
  const deleteIds: string[] = [];
  const currentById = new Map(current.map((r) => [r.id, r]));

  const reconcileSettings = (key: string, settings: Record<string, unknown>, isActive: boolean) => {
    const row = current.find((r) => r.section_key === key);
    if (row) {
      if (!contentEquals(row.content, settings) || row.is_active !== isActive) {
        update.push({ id: row.id, content: settings, is_active: isActive });
      }
    } else {
      create.push({ section_key: key as CmsSectionKey, content: settings, item_order: 1, is_active: isActive });
    }
  };

  for (const key of doc.order) {
    const inst = doc.sections[key];
    if (!inst) continue;
    const schema = getSectionSchema(key);
    const isSettings = schema ? schema.kind.kind === 'settings' : inst.items === undefined;

    if (isSettings) {
      reconcileSettings(key, inst.settings, !inst.disabled);
      continue;
    }

    const seenIds = new Set<string>();
    (inst.items ?? []).forEach((item, idx) => {
      seenIds.add(item.id);
      const row = currentById.get(item.id);
      if (row) {
        if (!contentEquals(row.content, item.content) || row.is_active !== item.is_active) {
          update.push({ id: item.id, content: item.content, is_active: item.is_active });
        }
      } else {
        create.push({
          section_key: key as CmsSectionKey,
          content: item.content,
          item_order: item.item_order ?? idx + 1,
          is_active: item.is_active,
        });
      }
    });
    for (const row of current) {
      if (row.section_key === key && !seenIds.has(row.id)) deleteIds.push(row.id);
    }

    // El formato del par vive en su propia section_key (media_settings).
    if (schema && schema.kind.kind === 'pair') {
      reconcileSettings(schema.kind.settingsKey, inst.settings, !inst.disabled);
    }
  }
  return { create, update, delete: deleteIds };
}

/** Layout del home con solo los bloques editables (default + fixtures). */
export function defaultLandingLayout(): LandingLayoutSettings {
  return {
    ...DEFAULT_LANDING_LAYOUT,
    sections: DEFAULT_LANDING_LAYOUT.sections.map((s) => ({ ...s })),
  };
}
