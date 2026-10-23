import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables } from '@/api/lib/middleware';
import { authMiddleware, requireProfileRole } from '@/api/lib/middleware';
import { createAdminClient } from '@enjambre/auth/server-index';
import { getPaymentProviderByName } from '@/api/lib/payments/provider';
import { enqueueTransactionalNotification } from '@/lib/notifications/enqueue-transactional';

const DTE_FACTURA = 33;
const DTE_BOLETA = 39;
const DTE_NOTA_CREDITO = 61;
const IVA_FACTOR = 1.19;

export const reembolsosRoutes = new Hono<{ Variables: AppVariables }>();

reembolsosRoutes.use('*', authMiddleware);
reembolsosRoutes.use('*', requireProfileRole('admin'));

// GET / - List all refunds with pagination
reembolsosRoutes.get('/', async (c) => {
  const supabase = c.get('supabase');
  
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
    console.error('[reembolsos] Error al listar:', error);
    return c.json({ code: 'reembolso_list_error', message: 'No se pudieron obtener los reembolsos.' }, 500);
  }

  return c.json({ data });
});

// GET /:id - Get single refund with full detail
reembolsosRoutes.get('/:id', async (c) => {
  const supabase = c.get('supabase');
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
  const supabase = c.get('supabase');
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
  const supabase = c.get('supabase');
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

  // Buscar DTEs asociados. facturas_emitidas no tiene venta_id: el vínculo
  // canónico es idempotency_key = 'venta:{venta_id}' (checkout-fulfill).
  const ventaIds = (ventas || []).map((v) => v.id);
  const dteKeys = ventaIds.map((id: string) => `venta:${id}`);
  const { data: dtes } = await supabase
    .from('facturas_emitidas')
    .select('id, idempotency_key, tipo_documento, tipo_dte, folio, estado_sii')
    .in('idempotency_key', dteKeys.length > 0 ? dteKeys : ['venta:00000000-0000-0000-0000-000000000000']);

  const dteMap = new Map(
    ((dtes ?? []) as Array<{ idempotency_key: string | null } & Record<string, unknown>>)
      .filter((d) => typeof d.idempotency_key === 'string' && d.idempotency_key.startsWith('venta:'))
      .map((d) => [(d.idempotency_key as string).slice('venta:'.length), d]),
  );

  const enriched = (ventas || []).map((v) => ({
    ...v,
    dte: dteMap.get(v.id) || null,
  }));

  return c.json({ data: enriched });
});

// POST / - Create a new refund request
reembolsosRoutes.post('/', zValidator('json', createReembolsoSchema), async (c) => {
  const supabase = c.get('supabase');
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
    .select('id, total, user_id, buy_order, reembolso_estado')
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

  // Idempotencia determinista por venta + tipo + monto: reintentos del mismo
  // formulario devuelven la solicitud existente en lugar de duplicarla.
  const idempotency_key = `refund-${venta_id}-${tipo}-${monto_reembolso}`;

  // Si no se pasó explícito, intentar resolver documento fiscal asociado (Boleta 39 o Factura 33)
  let resolvedTipoDoc: 'boleta' | 'factura' | 'sin_dte' = tipo_documento_origen;
  let resolvedTipoDte: number | null | undefined = tipo_dte_origen;
  let resolvedFolio: number | null | undefined = folio_origen;
  let resolvedDteId: string | null | undefined = factura_emitida_id;

  if (!resolvedFolio) {
    const { data: dteAsociado } = await supabase
      .from('facturas_emitidas')
      .select('id, tipo_documento, tipo_dte, folio')
      .eq('idempotency_key', `venta:${venta_id}`)
      .maybeSingle();

    if (dteAsociado) {
      resolvedDteId = dteAsociado.id;
      resolvedFolio = dteAsociado.folio;
      resolvedTipoDte = dteAsociado.tipo_dte;
      resolvedTipoDoc = dteAsociado.tipo_dte === DTE_FACTURA ? 'factura' : 'boleta';
    }
  }

  const { data: reembolso, error: insertError } = await supabase
    .from('reembolsos')
    .insert({
      venta_id,
      checkout_session_id: venta.buy_order ?? null,
      idempotency_key,
      solicitado_por: user.id,
      cliente_id: venta.user_id,
      tipo,
      motivo,
      monto_original: venta.total,
      monto_reembolso,
      tipo_documento_origen: resolvedTipoDoc,
      tipo_dte_origen: resolvedTipoDte || (resolvedTipoDoc === 'factura' ? DTE_FACTURA : DTE_BOLETA),
      folio_origen: resolvedFolio || null,
      factura_emitida_id: resolvedDteId || null,
      nc_tipo_dte: DTE_NOTA_CREDITO,
      estado: 'pendiente',
    })
    .select()
    .single();

  if (insertError) {
    // Reintento del mismo formulario: devolver la solicitud existente.
    if (insertError.code === '23505') {
      const { data: existing } = await supabase
        .from('reembolsos')
        .select('*')
        .eq('idempotency_key', idempotency_key)
        .maybeSingle();
      if (existing) return c.json({ data: existing, deduped: true }, 200);
    }
    return c.json({ code: 'reembolso_create_error', message: `Error al crear reembolso: ${insertError.message}` }, 500);
  }

  return c.json({ data: reembolso }, 201);
});

// POST /:id/procesar - Process the refund
reembolsosRoutes.post('/:id/procesar', async (c) => {
  const supabase = c.get('supabase');
  const id = c.req.param('id');
  const adminClient = createAdminClient();

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

  // Step 1: Claim atómico — solo un request pasa a 'procesando' (evita doble reversa PSP).
  const { data: claimed, error: claimError } = await supabase
    .from('reembolsos')
    .update({ estado: 'procesando' })
    .eq('id', id)
    .neq('estado', 'procesando')
    .neq('estado', 'completado')
    .select('id')
    .maybeSingle();

  if (claimError) {
    return c.json({ code: 'reembolso_claim_error', message: 'No se pudo tomar el reembolso para procesar.' }, 500);
  }
  if (!claimed) {
    return c.json(
      { code: 'reembolso_in_progress', message: 'El reembolso ya está en proceso o fue completado por otro operador.' },
      409,
    );
  }

  try {
    // Step 1b: Reversa en el PSP (Flow refund / Transbank nullify).
    // Ventas sin buy_order (efectivo feria, POS) no tienen reversa: se continúa.
    const { data: ventaOrigen } = await adminClient
      .from('ventas')
      .select('id, buy_order, metodo_pago, productos, buyer_email, user_id, total')
      .eq('id', reembolso.venta_id)
      .maybeSingle();

    const buyOrder = (ventaOrigen?.buy_order as string | null) ?? null;
    // Solo las ventas con pasarela (flow/transbank) tienen reversa: el efectivo
    // y POS sin buy_order siguen directo a NC + stock.
    const metodo = String(ventaOrigen?.metodo_pago ?? '').toLowerCase();
    const esPSP = metodo === 'flow' || metodo === 'transbank';
    if (!reembolso.psp_reversa_ok && buyOrder && esPSP) {
      const providerName = metodo === 'transbank' ? 'transbank' : 'flow';
      const provider = getPaymentProviderByName(providerName);
      const refundResult = await provider.refund(buyOrder, reembolso.monto_reembolso);
      if (!refundResult.ok) {
        await supabase
          .from('reembolsos')
          .update({ estado: 'error', error_detalle: `Reversa ${providerName} rechazada para orden ${buyOrder}` })
          .eq('id', id);
        return c.json(
          { code: 'psp_refund_failed', message: 'La reversa del pago fue rechazada por el proveedor. Nada más se movió.' },
          502,
        );
      }
      await supabase
        .from('reembolsos')
        .update({ psp_reversa_ok: true, psp_referencia: buyOrder })
        .eq('id', id);
    } else if (!reembolso.psp_reversa_ok && (!buyOrder || !esPSP)) {
      await supabase
        .from('reembolsos')
        .update({
          psp_reversa_ok: false,
          notas: buyOrder
            ? `Sin reversa PSP: medio ${ventaOrigen?.metodo_pago ?? 'desconocido'} sin devolución por pasarela.`
            : 'Sin reversa PSP: venta sin orden de compra asociada.',
        })
        .eq('id', id);
    }

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

    // Step 2b: Restaurar stock de la venta.
    // Total: devuelve las cantidades íntegras. Parcial: prorrata por monto con nota.
    if (!reembolso.stock_restaurado && Array.isArray(ventaOrigen?.productos)) {
      const lines = ventaOrigen.productos as Array<{
        productId?: string;
        producto_id?: string;
        quantity?: number;
        cantidad?: number;
      }>;
      const ratio =
        reembolso.tipo === 'total'
          ? 1
          : Math.min(1, Number(reembolso.monto_reembolso) / Math.max(1, Number(ventaOrigen.total ?? 0)));
      for (const line of lines) {
        const productId = line.productId ?? line.producto_id;
        const qty = Math.max(0, Math.floor(Number(line.quantity ?? line.cantidad ?? 0) * ratio));
        if (!productId || qty <= 0) continue;
        const { data: product } = await adminClient
          .from('productos')
          .select('stock')
          .eq('id', productId)
          .maybeSingle();
        if (!product || product.stock == null) continue;
        await adminClient
          .from('productos')
          .update({ stock: Number(product.stock) + qty })
          .eq('id', productId);
      }
      await supabase
        .from('reembolsos')
        .update({
          stock_restaurado: true,
          notas:
            reembolso.tipo === 'total'
              ? 'Stock restaurado íntegro.'
              : 'Stock restaurado en prorrata al monto parcial.',
        })
        .eq('id', id);
    }

    // Step 3: Emitir Nota de Crédito 61 (aplica tanto para Boleta 39 como para Factura 33)
    let ncFolioGenerado = reembolso.nc_folio;
    if (!reembolso.nc_emitida) {
      const { data: defaultEmpresa } = await adminClient.from('empresas').select('id').limit(1).maybeSingle();
      const esFactura = reembolso.tipo_documento_origen === 'factura' || reembolso.tipo_dte_origen === DTE_FACTURA;
      const tipoRefNombre = esFactura ? 'Factura Electrónica' : 'Boleta Electrónica';
      const tpoDocRef = esFactura ? DTE_FACTURA : DTE_BOLETA;
      const folioRef = reembolso.folio_origen || 0;

      // Montos proporcionales netos e IVA 19%
      const montoTotal = reembolso.monto_reembolso;
      const montoNeto = Math.round(montoTotal / IVA_FACTOR);
      const montoIva = montoTotal - montoNeto;

      // Registrar Nota de Crédito 61 en facturas_emitidas referenciando el DTE original
      const { data: ncDteRow, error: ncError } = await adminClient
        .from('facturas_emitidas')
        .insert({
          empresa_id: (defaultEmpresa?.id as string | undefined) ?? null,
          tipo_documento: 'Nota de Crédito',
          tipo_dte: DTE_NOTA_CREDITO,
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

      if (ncError) {
        console.warn('[reembolsos] Error al registrar factura_emitida para NC61:', ncError);
      }

      ncFolioGenerado = ncDteRow?.folio ? String(ncDteRow.folio) : `NC61-${id.substring(0, 8).toUpperCase()}`;

      await supabase
        .from('reembolsos')
        .update({
          nc_emitida: true,
          nc_folio: ncFolioGenerado,
        })
        .eq('id', id);
    }

    // Step 4: Update ventas.reembolso_estado (y estado a refunded en devolución total)
    const newReembolsoEstado = reembolso.tipo === 'total' ? 'total' : 'parcial';
    const { error: updateVentaError } = await adminClient
      .from('ventas')
      .update(
        reembolso.tipo === 'total'
          ? { reembolso_estado: newReembolsoEstado, estado: 'refunded' }
          : { reembolso_estado: newReembolsoEstado },
      )
      .eq('id', reembolso.venta_id);

    if (updateVentaError) {
      console.error('[reembolsos] Error al actualizar estado de venta:', updateVentaError);
    }

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

    // Step 6: Avisar al Guardián (email + campana; push si tiene equipo vinculado).
    // Fire-and-forget: un fallo aquí nunca revierte el reembolso ya completado.
    try {
      const guardianEmail = (ventaOrigen?.buyer_email as string | null) ?? null;
      const guardianUserId = (reembolso.cliente_id as string | null) ?? null;
      if (guardianEmail || guardianUserId) {
        await enqueueTransactionalNotification(adminClient, {
          dedupeKey: `reembolso_procesado:${id}`,
          source: 'reembolso_procesado',
          email: guardianEmail,
          userId: guardianUserId,
          subject: `Reembolso procesado — ${ncFolioGenerado ?? 'NC 61'}`,
          body: [
            `Procesamos tu reembolso por $${Number(reembolso.monto_reembolso).toLocaleString('es-CL')}.`,
            `Documento de respaldo: Nota de Crédito ${ncFolioGenerado ?? 'en emisión'}.`,
            `Motivo: ${reembolso.motivo}`,
            'El abono se refleja según los plazos de tu medio de pago.',
          ].join('\n'),
          category: 'pedidos',
          immediate: true,
          sendPush: true,
          pushTitle: 'Reembolso procesado',
          pushUrl: '/perfil/pedidos',
        });
      }
    } catch (notifErr) {
      console.warn('[reembolsos] guardian notification failed:', notifErr);
    }

    return c.json({ data: finalReembolso });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido al procesar';
    await supabase.from('reembolsos').update({ estado: 'error', error_detalle: errorMsg }).eq('id', id);
    return c.json({ code: 'reembolso_process_error', message: `Error al procesar el reembolso: ${errorMsg}` }, 500);
  }
});
