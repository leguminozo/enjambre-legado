import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables } from '@/api/lib/middleware';
import { authMiddleware, requireProfileRole } from '@/api/lib/middleware';
import { createAdminClient } from '@enjambre/auth/server-index';

export const reembolsosRoutes = new Hono<{ Variables: AppVariables }>();

reembolsosRoutes.use('*', authMiddleware);
reembolsosRoutes.use('*', requireProfileRole('admin'));

// GET / - List all refunds with pagination
reembolsosRoutes.get('/', async (c) => {
  const supabase = c.get('supabase') as any;
  
  const { data, error } = await supabase
    .from('reembolsos')
    .select(`
      *,
      ventas ( id, total ),
      cliente:profiles!cliente_id ( id, first_name, last_name, email ),
      solicitado_por:profiles!solicitado_por ( id, first_name, last_name )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ code: 'reembolso_list_error', message: 'No se pudieron obtener los reembolsos.' }, 500);
  }

  return c.json({ data });
});

// GET /:id - Get single refund with full detail
reembolsosRoutes.get('/:id', async (c) => {
  const supabase = c.get('supabase') as any;
  const id = c.req.param('id');

  const { data, error } = await supabase
    .from('reembolsos')
    .select(`
      *,
      ventas ( * ),
      cliente:profiles!cliente_id ( * ),
      solicitado_por:profiles!solicitado_por ( * )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return c.json({ code: 'reembolso_not_found', message: 'Reembolso no encontrado.' }, 404);
  }

  return c.json({ data });
});

// GET /venta/:ventaId - Get refund history for a specific sale
reembolsosRoutes.get('/venta/:ventaId', async (c) => {
  const supabase = c.get('supabase') as any;
  const ventaId = c.req.param('ventaId');

  const { data, error } = await supabase
    .from('reembolsos')
    .select('*')
    .eq('venta_id', ventaId)
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ code: 'reembolso_history_error', message: 'No se pudo obtener el historial de reembolsos de la venta.' }, 500);
  }

  return c.json({ data });
});

const createReembolsoSchema = z.object({
  venta_id: z.string().uuid(),
  monto_reembolso: z.number().positive(),
  motivo: z.string().min(1),
  tipo: z.enum(['total', 'parcial']),
  tipo_documento_origen: z.enum(['boleta', 'factura', 'sin_dte']).default('boleta'),
  tipo_dte_origen: z.number().int().optional(),
  folio_origen: z.number().int().optional(),
  factura_emitida_id: z.string().uuid().optional(),
});

// GET /ventas-candidatas - Lista ventas recientes para seleccionar en el formulario de reembolso
reembolsosRoutes.get('/ventas-candidatas', async (c) => {
  const supabase = c.get('supabase') as any;
  const { data: ventas, error } = await supabase
    .from('ventas')
    .select(`
      id,
      total,
      created_at,
      channel,
      origen,
      estado,
      reembolso_estado,
      buyer_email,
      cliente:profiles!cliente_id ( id, first_name, last_name, email )
    `)
    .in('estado', ['paid', 'confirmado', 'completada', 'despachado'])
    .neq('reembolso_estado', 'total')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    return c.json({ code: 'ventas_fetch_failed', message: error.message }, 500);
  }

  // Buscar DTEs asociados (boletas o facturas emitidas)
  const ventaIds = (ventas || []).map((v: any) => v.id);
  const { data: dtes } = await supabase
    .from('facturas_emitidas')
    .select('id, venta_id, tipo_documento, tipo_dte, folio, estado_sii')
    .in('venta_id', ventaIds.length > 0 ? ventaIds : ['00000000-0000-0000-0000-000000000000']);

  const dteMap = new Map((dtes || []).map((d: any) => [d.venta_id, d]));

  const enriched = (ventas || []).map((v: any) => ({
    ...v,
    dte: dteMap.get(v.id) || null,
  }));

  return c.json({ data: enriched });
});

// POST / - Create a new refund request
reembolsosRoutes.post('/', zValidator('json', createReembolsoSchema), async (c) => {
  const supabase = c.get('supabase') as any;
  const user = c.get('user');
  const {
    venta_id,
    monto_reembolso,
    motivo,
    tipo,
    tipo_documento_origen,
    tipo_dte_origen,
    folio_origen,
    factura_emitida_id,
  } = c.req.valid('json');

  const { data: venta, error: ventaError } = await supabase
    .from('ventas')
    .select('id, total, user_id, checkout_session_id, reembolso_estado')
    .eq('id', venta_id)
    .single();

  if (ventaError || !venta) {
    return c.json({ code: 'venta_not_found', message: 'Venta no encontrada.' }, 404);
  }

  if (venta.reembolso_estado === 'total') {
    return c.json({ code: 'venta_fully_refunded', message: 'La venta ya ha sido reembolsada en su totalidad.' }, 400);
  }

  const { data: pastRefunds } = await supabase
    .from('reembolsos')
    .select('monto_reembolso')
    .eq('venta_id', venta_id)
    .neq('estado', 'rechazado')
    .neq('estado', 'error');

  const totalRefunded = pastRefunds?.reduce((acc: number, r: { monto_reembolso: number }) => acc + r.monto_reembolso, 0) || 0;
  const remainingRefundable = venta.total - totalRefunded;

  if (monto_reembolso > remainingRefundable) {
    return c.json({ code: 'monto_exceeded', message: 'El monto solicitado excede el total reembolsable.' }, 400);
  }

  const idempotency_key = `refund-${venta_id}-${Date.now()}`;

  // Si no se pasó explícito, intentar resolver documento fiscal asociado (Boleta 39 o Factura 33)
  let resolvedTipoDoc = tipo_documento_origen;
  let resolvedTipoDte = tipo_dte_origen;
  let resolvedFolio = folio_origen;
  let resolvedDteId = factura_emitida_id;

  if (!resolvedFolio) {
    const { data: dteAsociado } = await supabase
      .from('facturas_emitidas')
      .select('id, tipo_documento, tipo_dte, folio')
      .eq('venta_id', venta_id)
      .maybeSingle();

    if (dteAsociado) {
      resolvedDteId = dteAsociado.id;
      resolvedFolio = dteAsociado.folio;
      resolvedTipoDte = dteAsociado.tipo_dte;
      resolvedTipoDoc = dteAsociado.tipo_dte === 33 ? 'factura' : 'boleta';
    }
  }

  const { data: reembolso, error: insertError } = await supabase
    .from('reembolsos')
    .insert({
      venta_id,
      checkout_session_id: venta.checkout_session_id,
      idempotency_key,
      solicitado_por: user.id,
      cliente_id: venta.user_id,
      tipo,
      motivo,
      monto_original: venta.total,
      monto_reembolso,
      tipo_documento_origen: resolvedTipoDoc,
      tipo_dte_origen: resolvedTipoDte || (resolvedTipoDoc === 'factura' ? 33 : 39),
      folio_origen: resolvedFolio || null,
      factura_emitida_id: resolvedDteId || null,
      nc_tipo_dte: 61,
      estado: 'pendiente',
    })
    .select()
    .single();

  if (insertError) {
    return c.json({ code: 'reembolso_create_error', message: `Error al crear reembolso: ${insertError.message}` }, 500);
  }

  return c.json({ data: reembolso }, 201);
});

// POST /:id/procesar - Process the refund
reembolsosRoutes.post('/:id/procesar', async (c) => {
  const supabase = c.get('supabase') as any;
  const id = c.req.param('id');
  const adminClient = createAdminClient() as any;

  const { data: reembolso, error: fetchError } = await supabase
    .from('reembolsos')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !reembolso) {
    return c.json({ code: 'reembolso_not_found', message: 'Reembolso no encontrado.' }, 404);
  }

  if (reembolso.estado === 'completado') {
    return c.json({ code: 'reembolso_already_completed', message: 'El reembolso ya ha sido completado.' }, 400);
  }

  // Step 1: Mark as 'procesando'
  await supabase.from('reembolsos').update({ estado: 'procesando' }).eq('id', id);

  try {
    // Step 2: Insert clawback event in loyalty_events_ledger
    if (!reembolso.puntos_revertidos && reembolso.cliente_id) {
      const deltaPuntos = -Math.floor(reembolso.monto_reembolso * 0.01);
      
      const { error: ledgerError } = await adminClient
        .from('loyalty_events_ledger')
        .insert({
          user_id: reembolso.cliente_id,
          tipo_evento: 'ajuste_manual',
          delta_puntos: deltaPuntos,
          idempotency_key: `refund-clawback-${id}`,
          metadata: {
            motivo: `Reversión por reembolso ${id}`,
            reembolso_id: id,
          },
        })
        .select()
        .single();
        
      if (!ledgerError || ledgerError.code === '23505') {
        await supabase.from('reembolsos').update({ puntos_revertidos: true }).eq('id', id);
      }
    }

    // Step 3: Emitir Nota de Crédito 61 (aplica tanto para Boleta 39 como para Factura 33)
    let ncFolioGenerado = reembolso.nc_folio;
    if (!reembolso.nc_emitida) {
      const esFactura = reembolso.tipo_documento_origen === 'factura' || reembolso.tipo_dte_origen === 33;
      const tipoRefNombre = esFactura ? 'Factura Electrónica' : 'Boleta Electrónica';
      const tpoDocRef = esFactura ? 33 : 39;
      const folioRef = reembolso.folio_origen || 0;

      // Montos proporcionales netos e IVA 19%
      const montoTotal = reembolso.monto_reembolso;
      const montoNeto = Math.round(montoTotal / 1.19);
      const montoIva = montoTotal - montoNeto;

      // Registrar Nota de Crédito 61 en facturas_emitidas referenciando el DTE original
      const { data: ncDteRow, error: ncError } = await adminClient
        .from('facturas_emitidas')
        .insert({
          tipo_documento: 'Nota de Crédito',
          tipo_dte: 61,
          estado: 'pendiente',
          estado_sii: 'pendiente',
          monto_neto: montoNeto,
          monto_iva: montoIva,
          monto_total: montoTotal,
          idempotency_key: `nc61-reembolso-${id}`,
          sii_response: {
            tipo_operacion: 'reembolso',
            documento_anulado: {
              tipo_documento: tipoRefNombre,
              tipo_dte: tpoDocRef,
              folio: folioRef,
              motivo: reembolso.motivo,
            },
          },
        })
        .select('id, folio')
        .maybeSingle();

      ncFolioGenerado = ncDteRow?.folio ? String(ncDteRow.folio) : `NC61-${id.substring(0, 8).toUpperCase()}`;

      await supabase
        .from('reembolsos')
        .update({
          nc_emitida: true,
          nc_folio: ncFolioGenerado,
        })
        .eq('id', id);
    }

    // Step 4: Update ventas.reembolso_estado
    const newReembolsoEstado = reembolso.tipo === 'total' ? 'total' : 'parcial';
    await adminClient.from('ventas').update({ reembolso_estado: newReembolsoEstado }).eq('id', reembolso.venta_id);

    // Step 5: Mark as 'completado', set completed_at
    const { data: finalReembolso, error: finalError } = await supabase
      .from('reembolsos')
      .update({
        estado: 'completado',
        completed_at: new Date().toISOString(),
        nc_folio: ncFolioGenerado,
      })
      .eq('id', id)
      .select()
      .single();

    if (finalError) throw finalError;

    return c.json({ data: finalReembolso });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido al procesar';
    await supabase.from('reembolsos').update({ estado: 'error', error_detalle: errorMsg }).eq('id', id);
    return c.json({ code: 'reembolso_process_error', message: `Error al procesar el reembolso: ${errorMsg}` }, 500);
  }
});
