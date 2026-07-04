import type { ProveedorConfig } from './gasto-extranjero';
import { PROVEEDORES } from './gasto-extranjero';

export type ProveedorOverride = {
  proveedor_id: string;
  rut: string;
  nombre: string;
  giro: string;
  moneda: ProveedorConfig['moneda'];
  con_iva: boolean;
  activo?: boolean;
};

export function mergeProveedorCatalog(overrides: ProveedorOverride[] = []): ProveedorConfig[] {
  const byId = new Map(PROVEEDORES.map((p) => [p.id, { ...p }]));

  for (const row of overrides) {
    if (row.activo === false) {
      byId.delete(row.proveedor_id);
      continue;
    }

    const base = byId.get(row.proveedor_id);
    byId.set(row.proveedor_id, {
      id: row.proveedor_id,
      nombre: row.nombre || base?.nombre || row.proveedor_id,
      rut: row.rut || base?.rut || '',
      giro: row.giro || base?.giro || 'SERVICIOS DIGITALES',
      moneda: row.moneda || base?.moneda || 'USD',
      conIva: row.con_iva ?? base?.conIva ?? false,
      keywords: base?.keywords ?? [row.proveedor_id, row.nombre.toLowerCase()],
    });
  }

  return Array.from(byId.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function findProveedorInCatalog(catalog: ProveedorConfig[], id: string): ProveedorConfig | undefined {
  return catalog.find((p) => p.id === id);
}

export function detectarProveedorEnCatalog(catalog: ProveedorConfig[], text: string): ProveedorConfig | undefined {
  const lower = text.toLowerCase();
  return catalog.find((p) => p.keywords.some((kw) => new RegExp(`\\b${escapeRegex(kw)}\\b`).test(lower)));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}