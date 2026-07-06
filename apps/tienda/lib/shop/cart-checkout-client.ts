'use client';

import { friendlyApiError } from '@enjambre/ui';
import { PENDING_CHECKOUT_STORAGE_KEY } from '@/lib/shop/commerce-storage';
import { friendlyCheckoutApiMessage } from '@/lib/shop/checkout-errors';
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url';
import { redirectToPaymentProvider } from '@/lib/shop/payment-redirect';

export type CartCheckoutLine = {
  productId: string;
  slug?: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export type CartCheckoutShipping = {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  region: string;
  codigoPostal: string;
  instrucciones: string;
};

export type CartCheckoutOptions = {
  buyerMode: 'legado' | 'privada';
  courierCode: string;
  puntosACanjear?: number;
  codigoDescuento?: string;
  returnUrl: string;
};

export type CartCheckoutPriceConflict = {
  details: string[];
  verifiedCart?: CartCheckoutLine[];
};

export type CartCheckoutResult =
  | { ok: true }
  | { ok: false; message: string; priceConflict?: CartCheckoutPriceConflict };

async function getOptionalAccessToken(): Promise<string | undefined> {
  try {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return undefined;
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData?.session?.access_token;
  } catch {
    return undefined;
  }
}

export async function startCartCheckout(
  cart: CartCheckoutLine[],
  shipping: CartCheckoutShipping,
  options: CartCheckoutOptions,
): Promise<CartCheckoutResult> {
  if (cart.length === 0) {
    return { ok: false, message: 'Tu carrito está vacío.' };
  }

  const NUCLEO_URL = getNucleoApiUrl();
  if (!NUCLEO_URL) {
    return { ok: false, message: 'Checkout no disponible. Configura el servicio de pagos.' };
  }

  const token = await getOptionalAccessToken();

  let res: Response;
  try {
    res = await fetch(`${NUCLEO_URL}/api/checkout/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        cart,
        shipping,
        returnUrl: options.returnUrl,
        buyerMode: options.buyerMode,
        courierCode: options.courierCode,
        puntosACanjear: options.puntosACanjear ?? 0,
        codigoDescuento: options.codigoDescuento,
      }),
    });
  } catch {
    return { ok: false, message: 'Error de conexión. Verifica tu internet e intenta de nuevo.' };
  }

  const json = (await res.json()) as {
    code?: string;
    url?: string;
    token?: string;
    buyOrder?: string;
    provider?: string;
    error?: string;
    message?: string;
    details?: string[];
    verifiedCart?: CartCheckoutLine[];
  };

  if (!res.ok) {
    if (res.status === 409 && json.verifiedCart) {
      return {
        ok: false,
        message: 'Algunos productos cambiaron de precio. Revisa el carrito.',
        priceConflict: {
          details: json.details ?? ['Algunos productos cambiaron de precio'],
          verifiedCart: json.verifiedCart,
        },
      };
    }

    return {
      ok: false,
      message:
        friendlyCheckoutApiMessage(json.code, json.message ?? json.error, 'init') ||
        (json.error ? friendlyApiError(undefined, json.error) : 'No se pudo iniciar el pago'),
    };
  }

  if (!json.url || !json.token) {
    return { ok: false, message: 'No se pudo iniciar el pago' };
  }

  sessionStorage.setItem(
    PENDING_CHECKOUT_STORAGE_KEY,
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