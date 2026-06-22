import type { CreateResenaInput } from '@enjambre/resenas';

const NUCLEO_URL = process.env.NEXT_PUBLIC_NUCLEO_API_URL || 'http://localhost:3001';

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

export async function fetchResenas(
  productoId: string,
  modo: 'anonima' | 'guardian' | 'all' = 'all',
): Promise<ResenasListResponse> {
  const params = new URLSearchParams({
    producto_id: productoId,
    modo,
    limit: '20',
  });
  const res = await fetch(`${NUCLEO_URL}/api/resenas?${params}`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    next: { revalidate: 120 },
  });
  if (!res.ok) {
    return { items: [], page: 1, limit: 20, total: 0, aggregate: null };
  }
  return res.json() as Promise<ResenasListResponse>;
}

export async function getAuthToken(): Promise<string | undefined> {
  try {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
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
  const res = await fetch(`${NUCLEO_URL}/api/resenas`, {
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
  const params = new URLSearchParams({ producto_id: productoId });
  const res = await fetch(`${NUCLEO_URL}/api/resenas/eligible?${params}`, {
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