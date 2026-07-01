export interface Gasto {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  montoIva: number;
  montoNeto: number;
  categoria: string;
  tipoComprobante: string;
  numeroComprobante?: string;
  estado: string;
  proveedorId?: string;
  proveedor?: {
    id: string;
    nombre: string;
    rut: string;
  };
  periodo?: {
    nombre: string;
  };
}

function capitalizeEstado(estado: string): string {
  if (!estado) return 'Pendiente';
  return estado.charAt(0).toUpperCase() + estado.slice(1);
}

export function mapGastoFromApi(row: Record<string, unknown>): Gasto {
  const proveedor = row.proveedor as { id: string; nombre: string; rut: string } | null;
  const periodo = row.periodo as { nombre: string } | null;
  return {
    id: String(row.id),
    fecha: String(row.fecha ?? ''),
    descripcion: String(row.descripcion ?? ''),
    monto: Number(row.monto ?? row.monto_total ?? 0),
    montoIva: Number(row.monto_iva ?? 0),
    montoNeto: Number(row.monto_neto ?? 0),
    categoria: String(row.categoria ?? ''),
    tipoComprobante: String(row.tipo_comprobante ?? 'Boleta'),
    numeroComprobante: row.numero_comprobante ? String(row.numero_comprobante) : undefined,
    estado: capitalizeEstado(String(row.estado ?? 'pendiente')),
    proveedorId: row.tercero_id ? String(row.tercero_id) : undefined,
    proveedor: proveedor ?? undefined,
    periodo: periodo ?? undefined,
  };
}