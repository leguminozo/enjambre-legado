'use client';

import { friendlyApiError } from '@enjambre/ui';
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url';

import type { SubscriptionManageAction } from '@/lib/shop/subscription-api';

export type { SubscriptionManageAction };

export type SubscriptionManageResult =
  | { ok: true; status: string }
  | { ok: false; message: string };

/** Best-effort: detener los cargos automáticos de Flow (pause/cancel). Nunca
 *  bloquea el PATCH local; si falla, el equipo cancela en el panel Flow. */
async function cancelFlowInscription(): Promise<void> {
  const nucleoUrl = getNucleoApiUrl();
  if (!nucleoUrl) return;
  try {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.auth.getUser();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return;

    await fetch(`${nucleoUrl}/api/subscriptions/checkout/cancel-inscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
  } catch (error) {
    console.warn('[manage-subscription] cancel-inscription falló (best-effort):', error);
  }
}

export async function manageSubscription(
  action: SubscriptionManageAction,
): Promise<SubscriptionManageResult> {
  // Pausar y cancelar deben detener los cargos automáticos de Flow
  if (action === 'pause' || action === 'cancel') {
    await cancelFlowInscription();
  }

  let res: Response;
  try {
    res = await fetch('/api/subscriptions', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ action }),
    });
  } catch {
    return { ok: false, message: 'Error de conexión. Intenta de nuevo.' };
  }

  let json: { status?: string; error?: string; message?: string };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { ok: false, message: 'Error de conexión. Intenta de nuevo.' };
  }

  if (!res.ok) {
    const raw = json.message ?? json.error ?? 'No se pudo actualizar la reposición';
    return { ok: false, message: friendlyApiError(undefined, raw) };
  }

  return { ok: true, status: json.status ?? action };
}