import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createRateLimiter, getClientIdentifier } from '@/lib/ratelimit';
import { guardMutation } from '@/lib/api-guard';
import { friendlySupabaseError, friendlyError } from '@enjambre/ui';

const b2bRegisterLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });

const CODIGO_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generarCodigoAcceso(len = 6): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let res = '';
  for (let i = 0; i < len; i++) {
    res += CODIGO_CHARS[bytes[i] % CODIGO_CHARS.length];
  }
  return res;
}

export async function POST(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  const identifier = getClientIdentifier(request);
  const rateLimit = b2bRegisterLimiter(identifier);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor intenta en un momento.' },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Formato JSON inválido' }, { status: 400 });
  }

  const kind = typeof body.kind === 'string' ? body.kind : 'account';
  const segmentSlug = typeof body.segmentSlug === 'string' ? body.segmentSlug : 'cafeterias';
  const segmentTipo = typeof body.segmentTipo === 'string' ? body.segmentTipo : 'cafeteria';
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const ciudad = typeof body.ciudad === 'string' ? body.ciudad.trim() : '';
  const contactoNombre = typeof body.contactoNombre === 'string' ? body.contactoNombre.trim() : '';
  const contactoEmail = typeof body.contactoEmail === 'string' ? body.contactoEmail.trim().toLowerCase() : '';
  const whatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const kitId = typeof body.kitId === 'string' ? body.kitId : '';
  const operationalAnswers =
    body.operationalAnswers && typeof body.operationalAnswers === 'object'
      ? (body.operationalAnswers as Record<string, string>)
      : {};

  if (!nombre || !contactoEmail) {
    return NextResponse.json({ error: 'Nombre y correo electrónico son obligatorios.' }, { status: 400 });
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const baseOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : siteUrl || request.nextUrl.origin;

  const adminClient = createAdminClient();

  // ── MODO B: Solo Catálogo a sus Datos (Sin creación de contraseña) ──
  if (kind === 'dossier_only') {
    if (adminClient) {
      const codigoAcceso = generarCodigoAcceso();
      const notas = JSON.stringify({
        tipo_solicitud: 'solo_catalogo',
        segmento: segmentSlug,
        whatsapp,
        ciudad,
        fecha: new Date().toISOString(),
      });

      try {
        await adminClient.from('b2b_puntos_venta').insert({
          nombre,
          tipo: segmentTipo,
          ciudad: ciudad || null,
          contacto_nombre: contactoNombre || null,
          contacto_email: contactoEmail,
          estado: 'prospecto',
          codigo_acceso: codigoAcceso,
          origen: 'autonomo',
          notas,
        });

        // Sincronizar prospecto en CRM clientes
        await adminClient.from('clientes').insert({
          name: nombre,
          empresa: nombre,
          email: contactoEmail,
          telefono: whatsapp || null,
          type: 'B2B',
          status: 'prospecto',
          fuente: `web_alianzas_${segmentSlug}`,
          notes: `Solicitud de catálogo para ${segmentSlug}. Ciudad: ${ciudad || 'No indicada'}`,
        });
      } catch (err) {
        console.error('[b2b/register-lead] Error guardando prospecto dossier:', err);
      }
    }

    return NextResponse.json({
      ok: true,
      kind: 'dossier_only',
      message: 'Catálogo enviado exitosamente',
    });
  }

  // ── MODO A: Activación de Kit / Cuenta de Aliado ──
  const safeNext = `/alianzas/${segmentSlug}/onboarding?kit=${encodeURIComponent(kitId || '')}`;
  let userId: string | null = null;
  let authData: { user?: { id?: string; identities?: unknown[] } | null; session?: unknown } | null = null;

  if (password && password.trim()) {
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    const supabase = await createClient();
    const emailRedirectTo = `${baseOrigin.replace(/\/$/, '')}/auth/callback?next=${encodeURIComponent(safeNext)}`;

    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email: contactoEmail,
      password,
      options: {
        data: {
          full_name: contactoNombre || nombre,
          app_source: 'tienda',
          b2b_segmento: segmentSlug,
          b2b_establecimiento: nombre,
        },
        emailRedirectTo,
      },
    });

    if (authError) {
      const friendlyMsg = friendlySupabaseError(authError);
      return NextResponse.json(
        { error: friendlyMsg !== 'Ocurrió un problema inesperado. Intenta más tarde' ? friendlyMsg : (authError.message || 'No se pudo crear la cuenta') },
        { status: 400 },
      );
    }

    if (signUpData?.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este correo electrónico. Por favor inicia sesión.' },
        { status: 400 },
      );
    }

    authData = signUpData;
    userId = signUpData?.user?.id ?? null;
  }

  // Registrar el punto de venta o revendedor con datos operacionales vinculados
  if (adminClient) {
    const codigoAcceso = generarCodigoAcceso();
    const notas = JSON.stringify({
      kit_interes: kitId,
      respuestas_operativas: operationalAnswers,
      whatsapp,
      registrado_at: new Date().toISOString(),
    });

    try {
      if (segmentSlug === 'revendedores') {
        await adminClient.from('b2b_revendedores').insert({
          nombre,
          whatsapp: whatsapp || null,
          tipo_espacio: 'tienda',
          estado: 'prospecto',
          codigo_revendedor: codigoAcceso,
          origen: 'autonomo',
          user_id: userId || null,
          notas,
        });
      } else {
        await adminClient.from('b2b_puntos_venta').insert({
          nombre,
          tipo: segmentTipo,
          ciudad: ciudad || null,
          contacto_nombre: contactoNombre || null,
          contacto_email: contactoEmail,
          estado: 'prospecto',
          codigo_acceso: codigoAcceso,
          origen: 'autonomo',
          user_id: userId || null,
          notas,
        });
      }

      // Pre-crear o actualizar revendedor_profile para que sea reconocido como aliado
      if (userId) {
        await adminClient.from('revendedor_profile').upsert(
          {
            user_id: userId,
            razon_social: nombre,
            rut: 'PENDIENTE',
            direccion: ciudad || null,
            region: null,
            tipo_negocio: segmentTipo,
            estado: 'pendiente',
          },
          { onConflict: 'user_id' },
        );
      }

      // Sincronizar en CRM centralizado
      await adminClient.from('clientes').insert({
        name: nombre,
        empresa: nombre,
        email: contactoEmail,
        telefono: whatsapp || null,
        type: 'B2B',
        status: 'prospecto',
        fuente: `web_alianzas_${segmentSlug}`,
        notes: `Registro aliado ${segmentSlug} · Kit: ${kitId || 'No indicado'} · Contacto: ${contactoNombre}`,
      });
    } catch (dbErr) {
      console.error('[b2b/register-lead] Error vinculando registro en BD:', dbErr);
    }
  }

  const requiresEmailConfirmation = Boolean(authData?.user && !authData.session);

  return NextResponse.json({
    ok: true,
    requiresEmailConfirmation,
    userId,
    nextUrl: safeNext,
  });
}
