import {
  mergeProveedorCatalog,
  type ProveedorConfig,
  type ProveedorOverride,
} from '@enjambre/contable';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function loadProveedorCatalog(
  supabase: SupabaseClient,
  empresaId: string,
): Promise<ProveedorConfig[]> {
  const { data, error } = await supabase
    .from('proveedores_config')
    .select('proveedor_id, rut, nombre, giro, moneda, con_iva, activo')
    .eq('empresa_id', empresaId);

  if (error || !data?.length) {
    return mergeProveedorCatalog();
  }

  return mergeProveedorCatalog(data as ProveedorOverride[]);
}