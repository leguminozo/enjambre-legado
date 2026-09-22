import webpush from "web-push";

export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export interface WebPushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface WebPushSubscriptionTarget {
  endpoint: string;
  keys: WebPushSubscriptionKeys;
}

// Claves de fallback para desarrollo/preview seguro sin variables de entorno
const FALLBACK_VAPID_PUBLIC =
  "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
const FALLBACK_VAPID_PRIVATE = "UUxIUXwtN5Yer_pG5vUfVsmc2gJk88l1u3eK5A6r-lQ";
const FALLBACK_VAPID_SUBJECT = "mailto:contacto@laobrerayelzangano.cl";

export function getVapidPublicKey(): string {
  return (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    FALLBACK_VAPID_PUBLIC
  );
}

function initVapid() {
  const publicKey = getVapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY || FALLBACK_VAPID_PRIVATE;
  const subject = process.env.VAPID_SUBJECT || FALLBACK_VAPID_SUBJECT;

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

let vapidInitialized = false;

function ensureVapid() {
  if (!vapidInitialized) {
    initVapid();
    vapidInitialized = true;
  }
}

/**
 * Envía una notificación Web Push a una suscripción específica
 */
export async function sendWebPush(
  subscription: WebPushSubscriptionTarget,
  payload: WebPushPayload,
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    ensureVapid();

    const stringifiedPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icons/icon-192.png",
      data: {
        url: payload.url || "/",
        ...payload.data,
      },
      tag: payload.tag,
    });

    const response = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      stringifiedPayload,
      {
        TTL: 60 * 60 * 24, // 24 horas
        urgency: "high",
      },
    );

    return {
      success: true,
      statusCode: response.statusCode,
    };
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    console.error("[WebPush Sender] Error enviando notificación push:", error?.message || err);

    // Códigos 404 o 410 indican suscripción expirada o revocada por el navegador
    return {
      success: false,
      statusCode: error?.statusCode,
      error: error?.message || String(err),
    };
  }
}
