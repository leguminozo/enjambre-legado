'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UseWebPushOptions {
  appSource?: 'tienda' | 'nucleo' | 'campo';
  apiUrl?: string;
  vapidPublicKey?: string;
}

export interface UseWebPushReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: (topics?: string[]) => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

const DEFAULT_VAPID_PUBLIC_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush(options: UseWebPushOptions = {}): UseWebPushReturn {
  const { appSource = 'tienda', apiUrl = '', vapidPublicKey } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (!supported) {
      setIsLoading(false);
      return;
    }

    setPermission(Notification.permission);

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setIsSubscribed(Boolean(subscription));
      })
      .catch((err) => {
        console.warn('[useWebPush] Error verificando suscripción existente:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const subscribe = useCallback(
    async (topics: string[] = ['general']): Promise<boolean> => {
      if (!isSupported) {
        setError('Las notificaciones push no están soportadas en este dispositivo.');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm !== 'granted') {
          setError('Permiso de notificaciones rechazado.');
          setIsLoading(false);
          return false;
        }

        const registration = await navigator.serviceWorker.ready;

        // Obtener clave pública si no viene en options
        let key = vapidPublicKey;
        if (!key) {
          try {
            const res = await fetch(`${apiUrl}/api/push/vapid-public-key`);
            if (res.ok) {
              const data = await res.json();
              key = data.publicKey;
            }
          } catch {
            key = DEFAULT_VAPID_PUBLIC_KEY;
          }
        }
        if (!key) key = DEFAULT_VAPID_PUBLIC_KEY;

        const rawKey = urlBase64ToUint8Array(key);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: rawKey as unknown as BufferSource,
        });

        const subJson = subscription.toJSON();
        if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
          throw new Error('Datos de suscripción incompletos devueltos por el navegador.');
        }

        // Registrar en backend
        const endpointUrl = `${apiUrl}/api/push/subscribe`;
        const res = await fetch(endpointUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            },
            app_source: appSource,
            topics,
          }),
        });

        if (!res.ok) {
          console.warn('[useWebPush] El backend retornó error al registrar push:', res.status);
        }

        setIsSubscribed(true);
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido al suscribir';
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, vapidPublicKey, apiUrl, appSource],
  );

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        try {
          await fetch(`${apiUrl}/api/push/unsubscribe`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint }),
          });
        } catch {
          // Ignorar error de red si localmente ya se desuscribió
        }
      }

      setIsSubscribed(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cancelar suscripción';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, apiUrl]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  };
}
