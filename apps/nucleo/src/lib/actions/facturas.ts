'use server';

import { z } from 'zod';
import { createClient } from '@/lib/server/supabase';
import { triggerFacturaDteEmission } from '@/api/lib/fiscal/trigger-factura-dte';

const facturaSchema = z.object({
  empresaId: z.string().min(1),
  clienteId: z.string().optional(),
  numero: z.string().min(1),
  fecha: z.string(),
  fechaVencimiento: z.string().optional(),
  montoTotal: z.number().positive(),
  montoNeto: z.number().positive(),
  montoIva: z.number().positive(),
  montoExento: z.number().optional().default(0),
  montoIvaUsado: z.number().optional().default(0),
  descripcion: z.string().optional(),
  tipoDocumento: z.string().default('Factura'),
});

export type FacturaFormData = z.infer<typeof facturaSchema>;

type ActionResult = { success: true; id: string } | { success: false; error: string };

export async function createFacturaEmitida(data: FacturaFormData): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: 'Supabase no configurado' };

  const fechaDate = new Date(data.fecha);
  const mes = fechaDate.getMonth() + 1;
  const anio = fechaDate.getFullYear();

  let { data: periodo } = await supabase
    .from('periodos_contables')
    .select('id')
    .eq('empresa_id', data.empresaId)
    .eq('mes', mes)
    .eq('anio', anio)
    .maybeSingle();

  if (!periodo) {
    const { data: newPeriodo, error: createError } = await supabase
      .from('periodos_contables')
      .insert({
        empresa_id: data.empresaId, mes, anio, estado: 'abierto',
        ingresos_netos: 0, egresos_netos: 0, utilidad_bruta: 0,
        utilidad_neta: 0, iva_debito: 0, iva_credito: 0, iva_pagar: 0, ppm_calculado: 0,
      })
      .select('id')
      .single();

    if (createError) return { success: false, error: createError.message };
    periodo = newPeriodo;
  }

  const { data: factura, error } = await supabase
    .from('facturas_emitidas')
    .insert({
      empresa_id: data.empresaId,
      tercero_id: data.clienteId ?? null,
      periodo_id: periodo!.id,
      numero: data.numero,
      fecha_emision: data.fecha,
      fecha_vencimiento: data.fechaVencimiento ?? null,
      monto_neto: data.montoNeto,
      monto_iva: data.montoIva,
      monto_total: data.montoTotal,
      monto_exento: data.montoExento,
      monto_iva_usado: data.montoIvaUsado,
      descripcion: data.descripcion ?? null,
      tipo_documento: data.tipoDocumento,
      estado: 'pendiente',
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };

  if (['Factura', 'Nota de Crédito', 'Nota de Débito'].includes(data.tipoDocumento)) {
    void triggerFacturaDteEmission(supabase, data.empresaId, factura.id);
  }

  return { success: true, id: factura.id };
}

export async function deleteFacturaEmitida(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('facturas_emitidas')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true, id };
}
