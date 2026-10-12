/**
 * editor-schema — el "lenguaje" del Editor de Tienda (patrón {% schema %} de
 * Shopify adaptado). Cada campo declara su semántica; el panel se genera solo.
 * La UI decide la ergonomía (segmented vs dropdown); el schema decide la
 * semántica. Sin React: serializable y emisible por un LLM contra SectionSchema.
 */
import type { PublicCopyRiskKind } from './store-chrome';

// ── FieldSchema ────────────────────────────────────────────────────────────

interface FieldBase {
  id: string;
  label: string;
  /** Ayuda contextual; soporta [texto](url). */
  info?: string;
  /** Settings condicionales: el campo se oculta salvo que la regla se cumpla. */
  visible_if?: VisibleIfRule;
}

export type VisibleIfRule =
  | { field: string; equals: string | number | boolean }
  | { field: string; not_equals: string | number | boolean };

export type TextField = FieldBase & {
  type: 'text';
  default?: string;
  /** Genera el par `id` + `id_en` en el content (bilingual es/en real). */
  bilingual?: boolean;
  maxLength?: number;
  /** Escanea el valor contra riesgos de copy público (stack leak, claims 20.606). */
  riskScan?: readonly PublicCopyRiskKind[];
};

export type TextareaField = FieldBase & {
  type: 'textarea';
  default?: string;
  bilingual?: boolean;
  rows?: number;
  maxLength?: number;
  riskScan?: readonly PublicCopyRiskKind[];
};

export type NumberField = FieldBase & {
  type: 'number';
  default?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
};

/** Defaults siempre válidos: default requerido (regla Shopify). */
export type RangeField = FieldBase & {
  type: 'range';
  default: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
};

export type SelectOption = { value: string | number; label: string };

export type SelectField = FieldBase & {
  type: 'select';
  options: readonly SelectOption[];
  /** Sin default → primera opción (regla Shopify). */
  default?: string | number;
  /** 'auto' aplica la regla 2-5 cortas → segmented; >5 o largas → dropdown. */
  control?: 'auto' | 'segmented' | 'dropdown';
  /** Castea el value elegido (grid_columns guarda number, no "3"). */
  valueType?: 'string' | 'number';
};

export type CheckboxField = FieldBase & {
  type: 'checkbox';
  /** false si no hay default. */
  default?: boolean;
};

/** Hex; sin default → opción "clear" ("" ≠ transparente, regla Shopify). */
export type ColorField = FieldBase & {
  type: 'color';
  default?: string;
  presets?: { label: string; value: string }[];
};

/**
 * Uploader a Storage (nunca URL manual). `altField` enlaza el campo alt;
 * `focalPoint` genera `{id}_focal` ("x% y%", default "50% 50%") → object-position
 * en el render: el punto sobrevive al crop/resize del slide.
 */
export type ImageField = FieldBase & {
  type: 'image';
  altField?: string;
  focalPoint?: boolean;
};

export type UrlField = FieldBase & {
  type: 'url';
  default?: string;
  /** Solo rutas internas (/) con preview ExternalLink. */
  internalOnly?: boolean;
};

/** Campo dentro de una ficha de lista (propuesta, dato, paso, FAQ). */
export type ListItemField = {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'string_list';
  bilingual?: boolean;
  default?: string;
  rows?: number;
};

/**
 * Lista de fichas en un singleton (value_props, FAQ…). El operador suma/quita
 * tarjetas; no ve `[object Object]`.
 */
export type ListField = FieldBase & {
  type: 'list';
  itemLabel: string;
  itemFields: readonly ListItemField[];
  min?: number;
  max?: number;
  default?: readonly Record<string, unknown>[];
};

/**
 * Lista de textos (párrafos de bio, viñetas). Cada ítem es un string, no un
 * objeto: evita el dump y no inventa `{ text: "…" }` en el storage.
 */
export type StringListField = FieldBase & {
  type: 'string_list';
  itemLabel: string;
  min?: number;
  max?: number;
  rows?: number;
  default?: readonly string[];
};

/** Organizativos (sidebar): jerarquía y contexto, sin valor. */
export type HeaderField = { type: 'header'; content: string; info?: string };
export type ParagraphField = { type: 'paragraph'; content: string };

export type FieldSchema =
  | TextField
  | TextareaField
  | NumberField
  | RangeField
  | SelectField
  | CheckboxField
  | ColorField
  | ImageField
  | UrlField
  | ListField
  | StringListField
  | HeaderField
  | ParagraphField;

/** Valor que produce cada tipo (los organizativos no producen valor). */
export type FieldValue<F extends FieldSchema> = F extends { type: 'checkbox' }
  ? boolean
  : F extends { type: 'number' | 'range' }
    ? number
    : F extends { type: 'header' | 'paragraph' }
      ? never
      : F extends { type: 'string_list' }
        ? readonly string[]
        : F extends { type: 'list' }
          ? readonly Record<string, unknown>[]
          : string;

// ── SectionSchema ──────────────────────────────────────────────────────────

export type SectionGroupId =
  | 'apariencia'
  | 'cabecera'
  | 'home'
  | 'tienda'
  | 'b2b'
  | 'pie'
  | 'contenido'
  | 'legal';

export type EditorCategoryId = 'bloques' | 'diseno' | 'otras';

/**
 * kind — la forma de la sección en site_content:
 *  settings: singleton formato (*_settings)          → 1 row
 *  items:    lista de fichas (*_items)               → N rows con item_order
 *  pair:     items + formato compañero (carrusel)    → N rows + 1 row settings
 */
export type SectionKind =
  | { kind: 'settings' }
  | { kind: 'items' }
  | { kind: 'pair'; settingsKey: string };

export type SectionSchema<Id extends string = string> = {
  id: Id;
  label: string;
  short: string;
  hint?: string;
  group: SectionGroupId;
  category: EditorCategoryId;
  /** Key de icono lucide; se resuelve en la UI (registro sin React). */
  icon: string;
  /** La forma de la sección en site_content (settings | items | pair). */
  kind: SectionKind;
  /** Fields del content (items) o del formato (settings). */
  fields: readonly FieldSchema[];
  /** Defaults: los items viejos se completan con esto (paridad SECTION_TEMPLATES). */
  template?: Readonly<Record<string, unknown>>;
  previewPath?: string;
  /** Chrome escribe content vivo; copy largo va por draft_content. */
  publishMode?: 'auto' | 'draft';
  limits?: { maxItems?: number };
  /** Editor custom a mano (menu, tipografía, orden del home, presets de acento…). */
  customEditor?: string;
};

/** Content tipado de una sección, derivado del schema (requiere schemas `as const`). */
export type SectionContent<S extends SectionSchema> = {
  [F in S['fields'][number] as F extends { id: string }
    ? F extends { bilingual: true }
      ? F['id'] | `${F['id']}_en`
      : F['id']
    : never]: FieldValue<F>;
};

// ── Comportamientos (reglas, no heurísticas) ───────────────────────────────

/** Regla Shopify: 2-5 opciones cortas → segmented; si no, dropdown. */
export function resolveSelectControl(field: SelectField): 'segmented' | 'dropdown' {
  if (field.control && field.control !== 'auto') return field.control;
  const short = (o: SelectOption) => o.label.length <= 16;
  return field.options.length >= 2 && field.options.length <= 5 && field.options.every(short)
    ? 'segmented'
    : 'dropdown';
}

/** Defaults siempre válidos: redondea al step y clampea a min/max (range). */
export function clampRangeValue(field: RangeField, value: number): number {
  const step = field.step ?? 1;
  const stepped = Math.round((value - field.min) / step) * step + field.min;
  return Math.min(field.max, Math.max(field.min, stepped));
}

/** visible_if: el campo solo se renderiza si la regla se cumple contra los valores actuales. */
export function isFieldVisible(field: FieldSchema, values: Record<string, unknown>): boolean {
  // Los organizativos (header/paragraph) no llevan regla.
  if (!('visible_if' in field) || !field.visible_if) return true;
  const rule = field.visible_if;
  const actual = values[rule.field];
  return 'equals' in rule ? actual === rule.equals : actual !== rule.not_equals;
}

/** El <select> compara strings. valueType number guarda 3; sin esto el control queda en blanco. */
export function selectDisplayValue(value: unknown): string {
  if (value == null || value === '') return '';
  return String(value);
}

/** Clona filas de lista para no mutar el template al editar. */
function cloneListRows(rows: readonly Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const copy: Record<string, unknown> = { ...row };
    for (const [k, v] of Object.entries(copy)) {
      if (Array.isArray(v)) copy[k] = [...v];
    }
    return copy;
  });
}

/** Array de strings desde storage o textarea (uno por línea). */
export function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string') return value.split('\n');
  return [];
}

/** Valor neutral por tipo (los organizativos no producen valor). */
export function defaultFieldValue(field: FieldSchema): unknown {
  switch (field.type) {
    case 'header':
    case 'paragraph':
      return undefined;
    case 'checkbox':
      return field.default ?? false;
    case 'range':
      return field.default;
    case 'select': {
      const raw = field.default ?? field.options[0]?.value ?? '';
      return field.valueType === 'number' ? Number(raw) : raw;
    }
    case 'number':
      return field.default ?? 0;
    case 'image':
      return '';
    case 'list':
      return field.default ? cloneListRows(field.default) : [];
    case 'string_list':
      return field.default ? [...field.default] : [];
    case 'url':
    case 'color':
    case 'text':
    case 'textarea':
      return field.default ?? '';
  }
}

/**
 * Rellena defaults de cada field (bilingual genera `id` + `id_en`), aplica
 * clamp en ranges y primera opción en selects. El cast está justificado: el
 * schema garantiza los valores (template + defaults); los campos extra del raw
 * se conservan para compat con rows legacy.
 */
export function parseSectionContent<S extends SectionSchema>(
  schema: S,
  raw: Record<string, unknown> | null | undefined,
): SectionContent<S> {
  const templateSlug =
    schema.kind.kind === 'settings' && typeof schema.template?.slug === 'string'
      ? schema.template.slug.trim()
      : '';
  const rawSlug = typeof raw?.slug === 'string' ? raw.slug.trim() : '';
  const safeRaw =
    templateSlug && rawSlug && rawSlug !== templateSlug ? undefined : raw;

  const out: Record<string, unknown> = {};
  for (const field of schema.fields) {
    if (field.type === 'header' || field.type === 'paragraph') continue;
    const current = safeRaw?.[field.id];
    if (field.type === 'range') {
      out[field.id] = clampRangeValue(field, typeof current === 'number' ? current : field.default);
      continue;
    }
    if (field.type === 'select' && field.valueType === 'number') {
      const n = Number(current);
      out[field.id] = Number.isFinite(n) && current !== undefined ? n : defaultFieldValue(field);
      continue;
    }
    if (field.type === 'list') {
      if (Array.isArray(current)) {
        out[field.id] = current;
      } else {
        const fromTemplate = schema.template?.[field.id];
        out[field.id] = Array.isArray(fromTemplate)
          ? cloneListRows(fromTemplate as Record<string, unknown>[])
          : defaultFieldValue(field);
      }
      continue;
    }
    if (field.type === 'string_list') {
      if (Array.isArray(current)) {
        out[field.id] = current.map((item) => String(item));
      } else {
        const fromTemplate = schema.template?.[field.id];
        out[field.id] = Array.isArray(fromTemplate)
          ? fromTemplate.map((item) => String(item))
          : defaultFieldValue(field);
      }
      continue;
    }
    const fromTemplate = schema.template?.[field.id];
    out[field.id] =
      current !== undefined
        ? current
        : fromTemplate !== undefined && fromTemplate !== ''
          ? fromTemplate
          : defaultFieldValue(field);
    if ((field.type === 'text' || field.type === 'textarea') && field.bilingual) {
      const en = safeRaw?.[`${field.id}_en`];
      const enFromTemplate = schema.template?.[`${field.id}_en`];
      out[`${field.id}_en`] =
        en !== undefined
          ? en
          : enFromTemplate !== undefined && enFromTemplate !== ''
            ? enFromTemplate
            : (field.default ?? '');
    }
  }
  const base =
    templateSlug && !safeRaw && schema.template
      ? { slug: templateSlug }
      : (safeRaw ?? {});
  return { ...base, ...out } as unknown as SectionContent<S>;
}

// ── Contrato preview ↔ editor (equivalente local de shopify:section:*) ─────

/** El preview sabe que corre dentro del editor (equivalente a Shopify.designMode). */
export const EDITOR_MODE_FLAG = '__EDITOR_MODE__';

/** Eventos que el preview (tienda) escucha del editor — contrato tipo shopify:section:*. */
export type EditorPreviewEvent =
  | { type: 'section:load'; sectionId: string }
  | { type: 'section:unload'; sectionId: string }
  | { type: 'section:select'; sectionId: string; load?: boolean }
  | { type: 'section:deselect'; sectionId: string }
  | { type: 'section:reorder'; sectionId: string }
  | { type: 'block:select'; sectionId: string; blockId: string; load?: boolean }
  | { type: 'block:deselect'; sectionId: string; blockId: string };
