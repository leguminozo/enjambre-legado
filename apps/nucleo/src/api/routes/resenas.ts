import { createHash, randomBytes } from 'node:crypto';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import {
  ANON_RATE_LIMIT_PER_DAY,
  CLAIM_TOKEN_TTL_DAYS,
  ClaimResenaSchema,
  CreateResenaSchema,
  ListResenasQuerySchema,
  ModerarResenaSchema,
  isWithinCooldown,
  ventaContainsProduct,
} from '@enjambre/resenas';
import { authMiddleware } from '@/api/lib/middleware';
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/api/lib/ratelimit';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials for admin client');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function resolveUserFromToken(token: string | null) {
  if (!token) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

function hashAnonFingerprint(ip: string, userAgent: string): string {
  const salt = process.env.RESENAS_ANON_SALT ?? 'oyz-resenas-dev-salt';
  return createHash('sha256').update(`${salt}:${ip}:${userAgent}`).digest('hex');
}

function hashClaimToken(token: string): string {
  const salt = process.env.RESENAS_CLAIM_SALT ?? 'oyz-claim-dev-salt';
  return createHash('sha256').update(`${salt}:${token}`).digest('hex');
}

async function rateLimitMiddleware(
  c: {
    req: { header: (name: string) => string | undefined; ip?: string };
    json: (data: unknown, status: number) => Response;
    header: (name: string, value: string) => void;
  },
  config: { readonly limit: number; readonly window: `${number} ${'s' | 'm' | 'h' | 'd'}` },
) {
  const identifier = getClientIdentifier(c);
  const result = await checkRateLimit({ identifier, ...config });

  c.header('X-RateLimit-Limit', String(result.limit));
  c.header('X-RateLimit-Remaining', String(result.remaining));
  c.header('X-RateLimit-Reset', String(result.reset));

  if (!result.success) {
    c.header('Retry-After', String(result.retryAfter || 60));
    return c.json({ code: 'rate_limited', message: 'Demasiadas solicitudes. Intenta más tarde.' }, 429);
  }
  return null;
}

const EligibleQuerySchema = z.object({
  producto_id: z.string().uuid(),
});

export const resenasRoutes = new Hono();

resenasRoutes.get('/', zValidator('query', ListResenasQuerySchema), async (c) => {
  const { producto_id, modo, page, limit } = c.req.valid('query');
  const admin = createAdminClient();
  const offset = (page - 1) * limit;

  let query = admin
    .from('resenas_producto')
    .select(
      'id, modo, rating, comentario_corto, cristalizacion_percibida, familia_aromatica, intensidad_fondo, notas_personales, momento_consumo, maridaje, venta_id, display_name, created_at',
      { count: 'exact' },
    )
    .eq('producto_id', producto_id)
    .eq('estado', 'aprobada')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (modo !== 'all') {
    query = query.eq('modo', modo);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('[resenas] list error:', error.message);
    return c.json({ code: 'list_failed', message: 'No se pudieron cargar reseñas' }, 500);
  }

  const ratingsRes = await admin
    .from('resenas_producto')
    .select('rating')
    .eq('producto_id', producto_id)
    .eq('estado', 'aprobada');

  const ratings = (ratingsRes.data ?? []).map((r) => r.rating as number);
  const ratingSum = ratings.reduce((acc, r) => acc + r, 0);
  const aggregate =
    ratings.length > 0
      ? { ratingValue: Math.round((ratingSum / ratings.length) * 10) / 10, reviewCount: ratings.length }
      : null;

  return c.json({
    items: data ?? [],
    page,
    limit,
    total: count ?? 0,
    aggregate,
  });
});

resenasRoutes.post('/', zValidator('json', CreateResenaSchema), async (c) => {
  const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.api);
  if (rateLimitResult) return rateLimitResult;

  const body = c.req.valid('json');
  const admin = createAdminClient();

  const { data: producto, error: productoError } = await admin
    .from('productos')
    .select('id, visible, lote_id')
    .eq('id', body.producto_id)
    .maybeSingle();

  if (productoError || !producto || producto.visible === false) {
    return c.json({ code: 'product_not_found', message: 'Producto no encontrado' }, 404);
  }

  if (body.modo === 'anonima') {
    const ip = getClientIdentifier(c);
    const ua = c.req.header('user-agent') ?? 'unknown';
    const anonHash = hashAnonFingerprint(ip, ua);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from('resenas_producto')
      .select('id', { count: 'exact', head: true })
      .eq('modo', 'anonima')
      .eq('anon_hash', anonHash)
      .eq('producto_id', body.producto_id)
      .gte('created_at', since);

    if ((count ?? 0) >= ANON_RATE_LIMIT_PER_DAY) {
      return c.json({ code: 'rate_limited', message: 'Límite diario de reseñas anónimas alcanzado' }, 429);
    }

    const claimToken = randomBytes(32).toString('hex');
    const tokenHash = hashClaimToken(claimToken);
    const expiresAt = new Date(Date.now() + CLAIM_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: inserted, error: insertError } = await admin
      .from('resenas_producto')
      .insert({
        producto_id: body.producto_id,
        modo: 'anonima',
        estado: 'pendiente',
        rating: body.rating,
        comentario_corto: body.comentario_corto,
        display_name: body.display_name ?? 'Guardián del bosque',
        anon_hash: anonHash,
      })
      .select('id, estado, created_at')
      .single();

    if (insertError || !inserted) {
      console.error('[resenas] anon insert error:', insertError?.message);
      return c.json({ code: 'create_failed', message: 'No se pudo guardar la reseña' }, 500);
    }

    await admin.from('resenas_claim_tokens').insert({
      resena_id: inserted.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    return c.json({
      ok: true,
      resena: inserted,
      claimToken,
      message: 'Reseña enviada a moderación',
    });
  }

  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '') || null;
  const user = await resolveUserFromToken(token);
  if (!user) {
    return c.json({ code: 'unauthorized', message: 'Inicia sesión para huella guardian' }, 401);
  }

  const { data: lastReview } = await admin
    .from('resenas_producto')
    .select('created_at')
    .eq('user_id', user.id)
    .eq('producto_id', body.producto_id)
    .eq('modo', 'guardian')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (isWithinCooldown(lastReview?.created_at)) {
    return c.json({ code: 'cooldown', message: 'Ya reseñaste este producto recientemente' }, 409);
  }

  let ventaId: string | null = body.venta_id ?? null;
  let loteId: string | null = body.lote_id ?? producto.lote_id ?? null;

  if (ventaId) {
    const { data: venta } = await admin
      .from('ventas')
      .select('id, user_id, productos, estado')
      .eq('id', ventaId)
      .maybeSingle();

    if (!venta || venta.user_id !== user.id || venta.estado !== 'paid') {
      return c.json({ code: 'venta_invalid', message: 'Compra no verificada' }, 400);
    }
    if (!ventaContainsProduct(venta.productos, body.producto_id)) {
      return c.json({ code: 'venta_invalid', message: 'El producto no está en esa compra' }, 400);
    }
  } else {
    const { data: ventas } = await admin
      .from('ventas')
      .select('id, productos, created_at')
      .eq('user_id', user.id)
      .eq('estado', 'paid')
      .order('created_at', { ascending: false })
      .limit(20);

    const match = (ventas ?? []).find((v) => ventaContainsProduct(v.productos, body.producto_id));
    ventaId = match?.id ?? null;
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const { data: inserted, error: insertError } = await admin
    .from('resenas_producto')
    .insert({
      producto_id: body.producto_id,
      modo: 'guardian',
      estado: 'pendiente',
      rating: body.rating,
      comentario_corto: body.comentario_corto ?? null,
      cristalizacion_percibida: body.cristalizacion_percibida,
      familia_aromatica: body.familia_aromatica,
      intensidad_fondo: body.intensidad_fondo,
      notas_personales: body.notas_personales,
      momento_consumo: body.momento_consumo ?? null,
      maridaje: body.maridaje ?? null,
      venta_id: ventaId,
      lote_id: loteId,
      user_id: user.id,
      display_name: profile?.full_name ?? user.email?.split('@')[0] ?? 'Guardián',
    })
    .select('id, estado, venta_id, created_at')
    .single();

  if (insertError || !inserted) {
    console.error('[resenas] guardian insert error:', insertError?.message);
    return c.json({ code: 'create_failed', message: 'No se pudo guardar la huella' }, 500);
  }

  return c.json({
    ok: true,
    resena: inserted,
    compraVerificada: Boolean(ventaId),
    message: 'Huella enviada a moderación',
  });
});

resenasRoutes.get('/eligible', zValidator('query', EligibleQuerySchema), async (c) => {
  const { producto_id } = c.req.valid('query');
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '') || null;
  const user = await resolveUserFromToken(token);

  if (!user) {
    return c.json({ eligible: false, reason: 'auth_required' });
  }

  const admin = createAdminClient();

  const { data: lastReview } = await admin
    .from('resenas_producto')
    .select('created_at')
    .eq('user_id', user.id)
    .eq('producto_id', producto_id)
    .eq('modo', 'guardian')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (isWithinCooldown(lastReview?.created_at)) {
    return c.json({ eligible: false, reason: 'cooldown' });
  }

  const { data: ventas } = await admin
    .from('ventas')
    .select('id, productos, created_at')
    .eq('user_id', user.id)
    .eq('estado', 'paid')
    .order('created_at', { ascending: false })
    .limit(30);

  const ventaMatch = (ventas ?? []).find((v) => ventaContainsProduct(v.productos, producto_id));

  return c.json({
    eligible: true,
    compraVerificada: Boolean(ventaMatch),
    venta_id: ventaMatch?.id ?? null,
  });
});

resenasRoutes.post('/claim', zValidator('json', ClaimResenaSchema), async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '') || null;
  const user = await resolveUserFromToken(token);
  if (!user) {
    return c.json({ code: 'unauthorized', message: 'Inicia sesión para vincular' }, 401);
  }

  const { token: claimToken } = c.req.valid('json');
  const admin = createAdminClient();
  const tokenHash = hashClaimToken(claimToken);

  const { data: claimRow, error: claimError } = await admin
    .from('resenas_claim_tokens')
    .select('id, resena_id, expires_at, claimed_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (claimError || !claimRow) {
    return c.json({ code: 'invalid_token', message: 'Token inválido' }, 400);
  }

  if (claimRow.claimed_at) {
    return c.json({ code: 'already_claimed', message: 'Ya vinculada' }, 409);
  }

  if (new Date(claimRow.expires_at) < new Date()) {
    return c.json({ code: 'expired', message: 'El enlace expiró' }, 410);
  }

  const { data: resena } = await admin
    .from('resenas_producto')
    .select('id, modo, user_id')
    .eq('id', claimRow.resena_id)
    .maybeSingle();

  if (!resena || resena.modo !== 'anonima') {
    return c.json({ code: 'invalid_resena', message: 'Reseña no reclamable' }, 400);
  }

  if (resena.user_id && resena.user_id !== user.id) {
    return c.json({ code: 'already_owned', message: 'Reseña ya vinculada a otra cuenta' }, 409);
  }

  await admin
    .from('resenas_producto')
    .update({ user_id: user.id, updated_at: new Date().toISOString() })
    .eq('id', resena.id);

  await admin
    .from('resenas_claim_tokens')
    .update({
      claimed_at: new Date().toISOString(),
      claimed_user_id: user.id,
    })
    .eq('id', claimRow.id);

  return c.json({ ok: true, resena_id: resena.id });
});

resenasRoutes.get('/mine', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '') || null;
  const user = await resolveUserFromToken(token);
  if (!user) {
    return c.json({ code: 'unauthorized', message: 'Inicia sesión' }, 401);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('resenas_producto')
    .select(
      'id, producto_id, modo, estado, rating, comentario_corto, cristalizacion_percibida, familia_aromatica, venta_id, ciclos_otorgados, created_at, productos(nombre, slug)',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return c.json({ code: 'list_failed', message: error.message }, 500);
  }

  return c.json({ items: data ?? [] });
});

resenasRoutes.patch('/:id/moderar', authMiddleware, zValidator('json', ModerarResenaSchema), async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const resenaId = c.req.param('id');
  const { estado } = c.req.valid('json');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || (profile.role !== 'gerente' && profile.role !== 'tienda_admin')) {
    return c.json({ code: 'forbidden', message: 'Sin permisos de moderación' }, 403);
  }

  const admin = createAdminClient();
  const { data: result, error } = await admin.rpc('moderar_resena_producto', {
    p_resena_id: resenaId,
    p_estado: estado,
    p_moderator_id: user.id,
  });

  if (error) {
    console.error('[resenas] moderar error:', error.message);
    return c.json({ code: 'moderate_failed', message: error.message }, 500);
  }

  const parsed = result as { success?: boolean; error?: string } | null;
  if (parsed?.success === false) {
    return c.json({ code: parsed.error ?? 'moderate_failed', message: 'No se pudo moderar' }, 400);
  }

  return c.json({ ok: true, result: parsed });
});