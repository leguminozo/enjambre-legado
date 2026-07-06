'use client';

import { friendlyApiError } from '@enjambre/ui';
import { PENDING_SUBSCRIPTION_STORAGE_KEY } from '@/lib/shop/commerce-storage';
import { redirectToPaymentProvider } from '@/lib/shop/payment-redirect';
import { REPOSICION_RESULTADO_PATH } from '@/lib/shop/store-routes';

export type SubscriptionCheckoutResult =
  | { ok: true }
  | { ok: false; message: string };

export type SubscriptionCheckoutOptions = {
  deliveryAddress?: string;
};

export async function startSubscriptionCheckout(
  planId: string,
  options?: SubscriptionCheckoutOptions,
): Promise<SubscriptionCheckoutResult> {
  const { createClient } = await import('@/utils/supabase/client');
  const supabase = createClient();
  await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    return { ok: false, message: 'Inicia sesión para continuar' };
  }

  const { getNucleoApiUrl } = await import('@/lib/shop/nucleo-url');
  const NUCLEO_URL = getNucleoApiUrl();
  if (!NUCLEO_URL) {
    return { ok: false, message: 'Reposición no disponible en este momento.' };
  }

  const returnUrl = `${window.location.origin}${REPOSICION_RESULTADO_PATH}`;

  let res: Response;
  try {
    res = await fetch(`${NUCLEO_URL}/api/subscriptions/checkout/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        planId,
        returnUrl,
        deliveryAddress: options?.deliveryAddress?.trim() || undefined,
      }),
    });
  } catch {
    return { ok: false, message: 'Error de conexión. Intenta de nuevo.' };
  }

  const json = (await res.json()) as {
    url?: string;
    token?: string;
    buyOrder?: string;
    provider?: string;
    message?: string;
  };

  if (!res.ok) {
    return {
      ok: false,
      message: json.message ? friendlyApiError(undefined, json.message) : 'No se pudo iniciar el pago',
    };
  }

  if (!json.url || !json.token) {
    return { ok: false, message: 'No se pudo iniciar el pago' };
  }

  sessionStorage.setItem(
    PENDING_SUBSCRIPTION_STORAGE_KEY,
    JSON.stringify({
      buyOrder: json.buyOrder,
      provider: json.provider,
    }),
  );

  redirectToPaymentProvider({
    url: json.url,
    token: json.token,
    provider: json.provider,
  });

  return { ok: true };
}