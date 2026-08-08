import { describe, expect, it } from 'vitest';
import { selectVisibleColumns, type ColumnDef } from './data-table';

interface Row {
  id: string;
  nombre: string;
  stock: number;
  unidad: string;
  costo: number;
}

const columns: ColumnDef<Row>[] = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'stock', header: 'Stock' },
  { key: 'unidad', header: 'Unidad', hideBelow: 640 },
  { key: 'costo', header: 'Costo', hideBelow: 960 },
];

describe('selectVisibleColumns', () => {
  it('muestra todas las columnas en espacio ancho', () => {
    const visible = selectVisibleColumns(columns, 1200, new Set());
    expect(visible.map((c) => c.key)).toEqual(['nombre', 'stock', 'unidad', 'costo']);
  });

  it('oculta columnas bajo su umbral hideBelow (espacio angosto)', () => {
    expect(selectVisibleColumns(columns, 500, new Set()).map((c) => c.key)).toEqual([
      'nombre',
      'stock',
    ]);
    expect(selectVisibleColumns(columns, 700, new Set()).map((c) => c.key)).toEqual([
      'nombre',
      'stock',
      'unidad',
    ]);
  });

  it('no aplica hideBelow mientras el contenedor no se haya medido (width 0)', () => {
    expect(selectVisibleColumns(columns, 0, new Set()).map((c) => c.key)).toEqual([
      'nombre',
      'stock',
      'unidad',
      'costo',
    ]);
  });

  it('las columnas forzadas-ocultas ganan sobre los umbrales', () => {
    const forced = new Set(['stock']);
    expect(selectVisibleColumns(columns, 1200, forced).map((c) => c.key)).toEqual([
      'nombre',
      'unidad',
      'costo',
    ]);
  });

  it('combina forzadas y adaptativas', () => {
    const forced = new Set(['costo']);
    expect(selectVisibleColumns(columns, 500, forced).map((c) => c.key)).toEqual([
      'nombre',
      'stock',
    ]);
  });

  it('respeta columnas sin hideBelow aunque el usuario fuerce otras', () => {
    const forced = new Set(['nombre', 'stock', 'unidad', 'costo']);
    expect(selectVisibleColumns(columns, 1200, forced)).toEqual([]);
  });
});
