import type { CreateResenaInput } from '@enjambre/resenas';
import { computeAggregateRating } from '@enjambre/resenas';
import { createAnonServerClient } from '@/utils/supabase/anon-server';
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url';
import { RESENA_CLAIM_TOKEN_KEY } from '@/lib/shop/commerce-storage';

export type ResenaPublic = {
  id: string;
  modo: 'anonima' | 'guardian';
  rating: number;
  comentario_corto: string | null;
  cristalizacion_percibida: string | null;
  familia_aromatica: string | null;
  intensidad_fondo: number | null;
  notas_personales: string | null;
  momento_consumo: string | null;
  maridaje: string | null;
  venta_id: string | null;
  display_name: string | null;
  created_at: string;
};

export type ResenasListResponse = {
  items: ResenaPublic[];
  page: number;
  limit: number;
  total: number;
  aggregate: { ratingValue: number; reviewCount: number } | null;
};

const EMPTY_RESENAS: ResenasListResponse = {
  items: [],
  page: 1,
  limit: 20,
  total: 0,
  aggregate: null,
};

async function getSupabaseForResenas() {
  if (typeof window === 'undefined') {
    return createAnonServerClient();
  }
  const { createClient } = await import('@/utils/supabase/client');
  return createClient();
}

async function fetchResenasFromSupabase(
  productoId: string,
  modo: 'anonima' | 'guardian' | 'all' = 'all',
  page = 1,
  limit = 20,
): Promise<ResenasListResponse> {
  try {
    const supabase = await getSupabaseForResenas();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('resenas_producto')
      .select(
        'id, modo, rating, comentario_corto, cristalizacion_percibida, familia_aromatica, intensidad_fondo, notas_personales, momento_consumo, maridaje, venta_id, display_name, created_at',
        { count: 'exact' },
      )
      .eq('producto_id', productoId)
      .eq('estado', 'aprobada')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (modo !== 'all') {
      query = query.eq('modo', modo);
    }

    const { data, error, count } = await query;
    if (error) {
      console.error('[resenas] supabase list:', error.message);
      return EMPTY_RESENAS;
    }

    const ratingsRes = await supabase
      .from('resenas_producto')
      .select('rating')
      .eq('producto_id', productoId)
      .eq('estado', 'aprobada');

    const ratings = (ratingsRes.data ?? []).map((r: { rating: number | null }) => Number(r.rating) || 0);
    const aggregate = computeAggregateRating(ratings);

    return {
      items: (data ?? []) as ResenaPublic[],
      page,
      limit,
      total: count ?? 0,
      aggregate,
    };
  } catch (err) {
    console.error('[resenas] fetch failed:', err);
    return EMPTY_RESENAS;
  }
}

/** Lectura pública — Supabase directo (SSG/build-safe, sin depender de núcleo). */
export async function fetchResenas(
  productoId: string,
  modo: 'anonima' | 'guardian' | 'all' = 'all',
  page = 1,
  limit = 20,
): Promise<ResenasListResponse> {
  return fetchResenasFromSupabase(productoId, modo, page, limit);
}

export async function getAuthToken(): Promise<string | undefined> {
  try {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.auth.getUser();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  } catch {
    return undefined;
  }
}

export async function createResena(
  input: CreateResenaInput,
  token?: string,
): Promise<{ ok: boolean; claimToken?: string; message?: string; error?: string }> {
  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) {
    return { ok: false, error: 'Servicio de reseñas no disponible' };
  }

  const res = await fetch(`${nucleoUrl}/api/resenas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    return {
      ok: false,
      error: typeof json.message === 'string' ? json.message : 'Error al enviar reseña',
    };
  }
  return {
    ok: true,
    claimToken: typeof json.claimToken === 'string' ? json.claimToken : undefined,
    message: typeof json.message === 'string' ? json.message : 'Reseña enviada',
  };
}

export async function checkEligible(productoId: string, token: string) {
  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) {
    return { eligible: false, reason: 'Servicio no disponible' };
  }

  const params = new URLSearchParams({ producto_id: productoId });
  const res = await fetch(`${nucleoUrl}/api/resenas/eligible?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  return res.json() as Promise<{
    eligible: boolean;
    compraVerificada?: boolean;
    venta_id?: string | null;
    reason?: string;
  }>;
}

export async function claimResena(token: string, authToken: string): Promise<{ ok: boolean; message?: string }> {
  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) {
    return { ok: false, message: 'Servicio no disponible' };
  }

  const res = await fetch(`${nucleoUrl}/api/resenas/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({ token }),
  });
  const json = (await res.json()) as { message?: string };
  if (!res.ok) {
    return { ok: false, message: json.message ?? 'No se pudo vincular la reseña' };
  }
  return { ok: true, message: json.message ?? 'Reseña vinculada a tu cuenta' };
}

export function getPendingClaimToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(RESENA_CLAIM_TOKEN_KEY);
}

export function clearPendingClaimToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RESENA_CLAIM_TOKEN_KEY);
}