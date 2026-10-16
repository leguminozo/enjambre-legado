import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getClientIdentifier } from '@/lib/ratelimit';
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url';
import { guardMutation } from '@/lib/api-guard';
import { friendlySupabaseError } from '@enjambre/ui';

const registerRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });

export async function POST(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  const identifier = getClientIdentifier(request);
  const rateLimitResult = registerRateLimiter(identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
      { 
        status: 429, 
        headers: { 
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.resetTime),
        } 
      }
    );
  }

  const supabase = await createClient();

  let body: {
    email?: string;
    password?: string;
    fullName?: string;
    referrerId?: string;
    returnTo?: string;
    birthDate?: string;
    marketingOptIn?: boolean;
    termsAccepted?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { email, password, fullName, referrerId, returnTo, marketingOptIn, termsAccepted } = body;
  if (!email?.trim() || !password || !fullName?.trim()) {
    return NextResponse.json({ error: 'Completa todos los campos' }, { status: 400 });
  }

  if (termsAccepted === false) {
    return NextResponse.json(
      { error: 'Debes aceptar los términos del servicio y la política de privacidad para continuar' },
      { status: 400 }
    );
  }

  // Fecha de cumpleaños opcional (YYYY-MM-DD): el CMS decide si se solicita y
  // si es obligatoria; el servidor solo acepta fechas reales pasadas.
  const rawBirthDate = body.birthDate?.trim() || undefined;
  let birthDateISO: string | undefined;
  if (rawBirthDate !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawBirthDate)) {
      return NextResponse.json({ error: 'La fecha de cumpleaños no es válida' }, { status: 400 });
    }
    const [birthYear, birthMonth, birthDay] = rawBirthDate.split('-').map(Number);
    const birthDt = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));
    const now = new Date();
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    if (
      birthYear < 1900 ||
      birthDt.getUTCFullYear() !== birthYear ||
      birthDt.getUTCMonth() !== birthMonth - 1 ||
      birthDt.getUTCDate() !== birthDay ||
      birthDt.getTime() > todayUTC
    ) {
      return NextResponse.json({ error: 'La fecha de cumpleaños no es válida' }, { status: 400 });
    }
    birthDateISO = rawBirthDate;
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const baseOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : siteUrl || request.nextUrl.origin;

  const rawReturnTo = returnTo?.trim();
  const safeNext =
    rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
      ? rawReturnTo
      : '/perfil';

  const emailRedirectTo = `${baseOrigin.replace(/\/$/, '')}/auth/callback?next=${encodeURIComponent(safeNext)}`;

  const nowIso = new Date().toISOString();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        app_source: 'tienda',
        referrer_id: referrerId || undefined,
        birth_date: birthDateISO || undefined,
        terms_accepted: true,
        terms_accepted_at: nowIso,
        terms_version: '2026-v1',
        privacy_accepted: true,
        privacy_accepted_at: nowIso,
        privacy_version: '2026-v1',
        is_adult_confirmed: true,
        marketing_opt_in: Boolean(marketingOptIn),
      },
      emailRedirectTo,
    },
  });

  if (authError) {
    const friendlyMsg = friendlySupabaseError(authError);
    return NextResponse.json(
      { error: friendlyMsg !== 'Ocurrió un problema inesperado. Intenta más tarde' ? friendlyMsg : (authError.message || 'No se pudo crear la cuenta') },
      { status: 400 }
    );
  }

  // Si el usuario ya existía previamente, Supabase devuelve identities vacío sin lanzar error
  if (authData?.user && authData.user.identities && authData.user.identities.length === 0) {
    return NextResponse.json(
      { error: 'Ya existe una cuenta registrada con este correo electrónico. Por favor inicia sesión.' },
      { status: 400 }
    );
  }

  // Fallback defensivo por si el cliente auth devuelve user en la raíz del payload
  const user = authData?.user ?? ((authData as unknown as { id?: string })?.id ? (authData as unknown as { id: string }) : null);

  if (!user) {
    return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 400 });
  }

  // El perfil lo crea el trigger handle_new_user (migration 998, SECURITY
  // DEFINER). Un insert aquí con el cliente anónimo falla por RLS (42501)
  // cuando la confirmación de email está activa (signup sin sesión) y es
  // redundante con el trigger.

  const nucleoUrl = getNucleoApiUrl();
  const internalKey = process.env.INTERNAL_API_SECRET;
  if (nucleoUrl && internalKey) {
    await fetch(`${nucleoUrl}/api/notifications/internal/welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': internalKey },
      body: JSON.stringify({
        userId: user.id,
        email: email.trim(),
        subject: 'Bienvenido al Legado',
        body: 'Gracias por unirte. Explora tus alertas de floración y el impacto de tu colmena.',
        source: 'tienda_signup',
      }),
    }).catch(() => {});
  }

  const admin = createAdminClient();
  if (admin && user && marketingOptIn === false) {
    try {
      await admin.from('profiles').update({
        notification_preferences: {
          territorio: { in_app: true, email: true },
          floracion: { in_app: true, email: false },
          pedidos: { in_app: true, email: true },
          sistema: { in_app: true, email: true },
        },
      }).eq('id', user.id);
    } catch {
      /* fail-soft */
    }
  }

  if (referrerId && referrerId !== user.id) {
    if (admin) {
      try {
        let resolvedReferrerId = referrerId.trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedReferrerId);
        if (!isUuid) {
          const { data: refProfile } = await admin
            .from('profiles')
            .select('id')
            .ilike('referral_code', resolvedReferrerId)
            .maybeSingle();
          if (refProfile?.id) {
            resolvedReferrerId = refProfile.id;
          }
        }

        if (resolvedReferrerId && resolvedReferrerId !== user.id) {
          // RPC no tipado en Database generado
          await (admin as unknown as { rpc: (n: string, a: object) => PromiseLike<unknown> }).rpc(
            'complete_referral_signup',
            { p_referrer_id: resolvedReferrerId, p_new_user_id: user.id },
          );
        }
      } catch {
        /* referido opcional */
      }
    }
  }

  return NextResponse.json({
    ok: true,
    requiresEmailConfirmation: !authData?.session,
  });
}