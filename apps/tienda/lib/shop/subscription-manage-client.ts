'use client';

import { friendlyApiError } from '@enjambre/ui';

import type { SubscriptionManageAction } from '@/lib/shop/subscription-api';

export type { SubscriptionManageAction };

export type SubscriptionManageResult =
  | { ok: true; status: string }
  | { ok: false; message: string };

export async function manageSubscription(
  action: SubscriptionManageAction,
): Promise<SubscriptionManageResult> {
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

  const json = (await res.json()) as { status?: string; error?: string; message?: string };

  if (!res.ok) {
    const raw = json.message ?? json.error ?? 'No se pudo actualizar la reposición';
    return { ok: false, message: friendlyApiError(undefined, raw) };
  }

  return { ok: true, status: json.status ?? action };
}