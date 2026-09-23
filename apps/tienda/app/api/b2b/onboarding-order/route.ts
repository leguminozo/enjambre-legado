import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { validarRUT, formatearRUT } from '@/lib/shop/rut';
import { guardMutation } from '@/lib/api-guard';
import { friendlyError } from '@enjambre/ui';

export async function POST(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Sesión no válida o expirada. Por favor inicia sesión.' },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Formato JSON inválido' }, { status: 400 });
  }

  const segmentSlug = typeof body.segmentSlug === 'string' ? body.segmentSlug : 'cafeterias';
  const razonSocial = typeof body.razonSocial === 'string' ? body.razonSocial.trim() : '';
  const rut = typeof body.rut === 'string' ? body.rut.trim() : '';
  const giro = typeof body.giro === 'string' ? body.giro.trim() : '';
  const direccion = typeof body.direccion === 'string' ? body.direccion.trim() : '';
  const comuna = typeof body.comuna === 'string' ? body.comuna.trim() : '';
  const region = typeof body.region === 'string' ? body.region.trim() : '';
  const contactoRecepcion = typeof body.contactoRecepcion === 'string' ? body.contactoRecepcion.trim() : '';
  const telefonoRecepcion = typeof body.telefonoRecepcion === 'string' ? body.telefonoRecepcion.trim() : '';
  const horarioEntrega = typeof body.horarioEntrega === 'string' ? body.horarioEntrega.trim() : '';
  const kitId = typeof body.kitId === 'string' ? body.kitId.trim() : '';
  const totalFacturable = typeof body.totalFacturable === 'number' ? body.totalFacturable : 0;
  const subtotalNeto = typeof body.subtotalNeto === 'number' ? body.subtotalNeto : 0;
  const iva = typeof body.iva === 'number' ? body.iva : 0;
  const notasAdicionales = typeof body.notasAdicionales === 'string' ? body.notasAdicionales.trim() : '';

  if (!razonSocial || !rut || !direccion || !comuna || !region) {
    return NextResponse.json(
      { error: 'Completa todos los datos de facturación y despacho requeridos.' },
      { status: 400 },
    );
  }

  if (!validarRUT(rut)) {
    return NextResponse.json(
      { error: 'El RUT ingresado no es válido. Verifica el número y dígito verificador.' },
      { status: 400 },
    );
  }

  const rutFormateado = formatearRUT(rut);
  const adminClient = createAdminClient();

  if (!adminClient) {
    return NextResponse.json(
      { error: 'Servicio de procesamiento temporalmente no disponible.' },
      { status: 503 },
    );
  }

  try {
    // 1. Localizar o asociar punto_venta / revendedor
    let puntoVentaId: string | null = null;
    let revendedorId: string | null = null;

    if (segmentSlug === 'revendedores') {
      const { data: rev } = await adminClient
        .from('b2b_revendedores')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (rev) {
        revendedorId = rev.id;
        await adminClient
          .from('b2b_revendedores')
          .update({ estado: 'activo' })
          .eq('id', rev.id);
      } else {
        const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: nuevoRev } = await adminClient
          .from('b2b_revendedores')
          .insert({
            nombre: razonSocial,
            whatsapp: telefonoRecepcion || null,
            tipo_espacio: 'tienda',
            estado: 'activo',
            codigo_revendedor: codigo,
            origen: 'autonomo',
            user_id: user.id,
          })
          .select('id')
          .single();
        if (nuevoRev) revendedorId = nuevoRev.id;
      }
    } else {
      const { data: pv } = await adminClient
        .from('b2b_puntos_venta')
        .select('id')
        .or(`user_id.eq.${user.id},contacto_email.eq.${user.email}`)
        .maybeSingle();

      if (pv) {
        puntoVentaId = pv.id;
        await adminClient
          .from('b2b_puntos_venta')
          .update({
            user_id: user.id,
            rut_empresa: rutFormateado,
            ciudad: `${comuna}, ${region}`,
            estado: 'activo',
          })
          .eq('id', pv.id);
      } else {
        const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: nuevoPv } = await adminClient
          .from('b2b_puntos_venta')
          .insert({
            nombre: razonSocial,
            tipo: segmentSlug === 'hoteles' ? 'hotel' : segmentSlug === 'tiendas-gourmet' ? 'tienda_gourmet' : 'cafeteria',
            ciudad: `${comuna}, ${region}`,
            contacto_nombre: contactoRecepcion || null,
            contacto_email: user.email || null,
            rut_empresa: rutFormateado,
            codigo_acceso: codigo,
            estado: 'activo',
            origen: 'autonomo',
            user_id: user.id,
          })
          .select('id')
          .single();
        if (nuevoPv) puntoVentaId = nuevoPv.id;
      }
    }

    // 2. Actualizar perfil B2B para que el portal mayorista lo reconozca de inmediato
    await adminClient.from('revendedor_profile').upsert(
      {
        user_id: user.id,
        razon_social: razonSocial,
        rut: rutFormateado,
        direccion: `${direccion}, ${comuna}`,
        region,
        tipo_negocio: segmentSlug,
        estado: 'activo',
      },
      { onConflict: 'user_id' },
    );

    // 3. Crear el primer pedido oficial en b2b_pedidos
    const pedidoNotas = JSON.stringify({
      primer_pedido: true,
      segmento: segmentSlug,
      kit_id: kitId,
      giro,
      direccion_despacho: `${direccion}, ${comuna}, ${region}`,
      contacto_recepcion: contactoRecepcion,
      telefono_recepcion: telefonoRecepcion,
      horario_entrega: horarioEntrega,
      subtotal_neto: subtotalNeto,
      iva_19_pct: iva,
      total_facturable: totalFacturable,
      notas_cliente: notasAdicionales,
      fecha_creacion: new Date().toISOString(),
    });

    const { data: pedidoData, error: pedidoError } = await adminClient
      .from('b2b_pedidos')
      .insert({
        punto_venta_id: puntoVentaId,
        revendedor_id: revendedorId,
        user_id: user.id,
        monto_clp: totalFacturable,
        estado: 'solicitado',
        notas: pedidoNotas,
      })
      .select('id')
      .single();

    if (pedidoError) {
      console.error('[b2b/onboarding-order] Error insertando pedido:', pedidoError);
      throw new Error('No se pudo registrar el pedido en el sistema');
    }

    const orderId = pedidoData?.id || '';
    const trackingCode = orderId ? orderId.replace(/-/g, '').slice(0, 8).toUpperCase() : 'B2B-ORD';

    return NextResponse.json({
      ok: true,
      orderId,
      trackingCode,
      totalFacturable,
    });
  } catch (err) {
    const msg = friendlyError(err, 'Ocurrió un error al procesar tu pedido inicial.');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
