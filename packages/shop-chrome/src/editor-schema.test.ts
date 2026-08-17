import { describe, expect, it } from 'vitest';
import {
  clampRangeValue,
  defaultFieldValue,
  selectDisplayValue,
  isFieldVisible,
  parseSectionContent,
  resolveSelectControl,
  type SelectField,
  type SectionSchema,
} from './editor-schema';

describe('resolveSelectControl', () => {
  const field = (options: SelectField['options'], control?: SelectField['control']): SelectField => ({
    type: 'select',
    id: 'x',
    label: 'X',
    options,
    control,
  });

  it('2-5 opciones cortas → segmented', () => {
    expect(
      resolveSelectControl(
        field([
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]),
      ),
    ).toBe('segmented');
  });

  it('>5 opciones → dropdown', () => {
    expect(
      resolveSelectControl(
        field([
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
          { value: 'c', label: 'C' },
          { value: 'd', label: 'D' },
          { value: 'e', label: 'E' },
          { value: 'f', label: 'F' },
        ]),
      ),
    ).toBe('dropdown');
  });

  it('opciones largas → dropdown aunque sean 2-5', () => {
    expect(
      resolveSelectControl(
        field([
          { value: 'a', label: 'Media Estándar (50vh Móvil / 70vh Escritorio)' },
          { value: 'b', label: 'Compacta (40vh Móvil / 60vh Escritorio)' },
        ]),
      ),
    ).toBe('dropdown');
  });

  it('control explícito gana al auto', () => {
    expect(resolveSelectControl(field([{ value: 'a', label: 'A' }], 'dropdown'))).toBe('dropdown');
  });
});

describe('clampRangeValue', () => {
  const field = { type: 'range' as const, id: 'x', label: 'X', min: 0, max: 100, step: 5, default: 10 };

  it('redondea al step cercano', () => {
    expect(clampRangeValue(field, 7)).toBe(5);
    expect(clampRangeValue(field, 8)).toBe(10);
  });

  it('clampea a max y min', () => {
    expect(clampRangeValue(field, 120)).toBe(100);
    expect(clampRangeValue(field, -10)).toBe(0);
  });
});

describe('isFieldVisible', () => {
  it('sin regla → visible', () => {
    expect(isFieldVisible({ type: 'text', id: 'x', label: 'X' }, {})).toBe(true);
  });

  it('equals se evalúa contra el valor actual', () => {
    expect(isFieldVisible({ type: 'text', id: 'x', label: 'X', visible_if: { field: 'type', equals: 'video' } }, { type: 'video' })).toBe(true);
    expect(isFieldVisible({ type: 'text', id: 'x', label: 'X', visible_if: { field: 'type', equals: 'video' } }, { type: 'image' })).toBe(false);
  });

  it('not_equals', () => {
    expect(isFieldVisible({ type: 'text', id: 'x', label: 'X', visible_if: { field: 'type', not_equals: 'video' } }, { type: 'image' })).toBe(true);
  });
});

describe('selectDisplayValue', () => {
  it('un select numérico (columnas del grid) se muestra como string', () => {
    expect(selectDisplayValue(3)).toBe('3');
    expect(selectDisplayValue('3')).toBe('3');
    expect(selectDisplayValue(undefined)).toBe('');
  });
});

describe('defaultFieldValue', () => {
  it('checkbox → false sin default', () => {
    expect(defaultFieldValue({ type: 'checkbox', id: 'x', label: 'X' })).toBe(false);
  });

  it('select → primera opción sin default', () => {
    expect(
      defaultFieldValue({
        type: 'select',
        id: 'x',
        label: 'X',
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
      }),
    ).toBe('a');
  });

  it('text → string vacío sin default', () => {
    expect(defaultFieldValue({ type: 'text', id: 'x', label: 'X' })).toBe('');
  });

  it('organizativos → undefined', () => {
    expect(defaultFieldValue({ type: 'header', content: 'H' })).toBeUndefined();
  });
});

describe('parseSectionContent', () => {
  const schema = {
    id: 'media_settings',
    label: 'Formato',
    short: 'F',
    group: 'home',
    category: 'bloques',
    icon: 'Film',
    kind: { kind: 'settings' },
    fields: [
      { type: 'select' as const, id: 'image_fit', label: 'Encuadre', options: [{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }], default: 'cover' },
      { type: 'range' as const, id: 'opacity', label: 'Opacidad', min: 0, max: 100, step: 10, default: 40 },
      { type: 'text' as const, id: 'kicker', label: 'Kicker', bilingual: true, default: 'Ola' },
      { type: 'checkbox' as const, id: 'autoplay', label: 'Autoplay' },
    ],
  } as const satisfies SectionSchema;

  it('rellena defaults y conserva campos extra del raw', () => {
    const out = parseSectionContent(schema, { opacity: 77, legacy: 'x' });
    expect(out.image_fit).toBe('cover');
    expect(out.opacity).toBe(80); // clamp al step 10
    expect(out.kicker).toBe('Ola');
    expect(out.autoplay).toBe(false);
    // Los campos fuera del schema se conservan sin tipar (rows legacy).
    expect((out as Record<string, unknown>).legacy).toBe('x');
  });

  it('el valor del raw gana al default', () => {
    const out = parseSectionContent(schema, { image_fit: 'contain' });
    expect(out.image_fit).toBe('contain');
  });

  it('bilingual genera el par _en', () => {
    const out = parseSectionContent(schema, {});
    expect(out.kicker_en).toBe('Ola');
    const withEn = parseSectionContent(schema, { kicker_en: 'Wave' });
    expect(withEn.kicker_en).toBe('Wave');
  });
});
