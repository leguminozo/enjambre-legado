'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { friendlyError } from '@enjambre/ui';

type Estado = 'loading' | 'success' | 'failed';

/** Resultado del checkout de planes territoriales (post-redirect de Flow). */
export function PlanesResultadoClient() {
  const apiFetch = useApiFetch();
  const params = useSearchParams();
  const token = params.get('token_ws') || params.get('token');
  const tbkToken = params.get('TBK_TOKEN') || params.get('tbk_token');
  const statusParam = params.get('status');
  const buyOrderParam = params.get('buyOrder');
  const providerParam = params.get('provider');
  const provider =
    providerParam === 'transbank' || providerParam === 'flow' ? providerParam : undefined;
  const [estado, setEstado] = useState<Estado>('loading');
  const [mensaje, setMensaje] = useState('Confirmando tu suscripción…');

  useEffect(() => {
    if (statusParam === 'canceled' || statusParam === 'cancelled' || (tbkToken && !token)) {
      setEstado('failed');
      setMensaje('Has cancelado el proceso de pago en la pasarela. No se ha realizado ningún cobro.');
      return;
    }
    if (statusParam === 'failed') {
      setEstado('failed');
      setMensaje('El pago no se completó. Intenta nuevamente.');
      return;
    }
    if (!token) {
      setEstado('failed');
      setMensaje('No se recibió la confirmación del proveedor de pago.');
      return;
    }
    void (async () => {
      try {
        const res = await apiFetch('/api/subscriptions/checkout/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token_ws: token,
            buyOrder: buyOrderParam ?? undefined,
            provider,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: unknown;
          error?: unknown;
          message?: unknown;
          canceled?: unknown;
          code?: unknown;
          alreadyProcessed?: unknown;
        };
        // 200 con ok:false también es fallo (p.ej. sesión expirada o fulfill roto).
        if (!res.ok || json.ok !== true) {
          setEstado('failed');
          if (json.canceled === true || json.code === 'payment_canceled') {
            setMensaje('Has cancelado el proceso de pago en la pasarela. No se ha realizado ningún cobro.');
            return;
          }
          setMensaje(
            friendlyError(
              json.error ?? json.message,
              'Hubo un error confirmando el pago. Si el cargo se realizó, escríbenos y lo regularizamos.',
            ),
          );
          return;
        }
        setEstado('success');
        setMensaje(
          json.alreadyProcessed
            ? 'Tu suscripción ya estaba activa.'
            : 'Suscripción activada. ¡Gracias por sostener la red!',
        );
      } catch (err) {
        setEstado('failed');
        setMensaje(
          friendlyError(
            err,
            'Hubo un error confirmando el pago. Si el cargo se realizó, escríbenos y lo regularizamos.',
          ),
        );
      }
    })();
  }, [token, tbkToken, buyOrderParam, provider, statusParam, apiFetch]);

  const Icon = estado === 'success' ? CheckCircle2 : estado === 'failed' ? XCircle : Clock;
  const iconColor =
    estado === 'success' ? 'text-success' : estado === 'failed' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="flex flex-col items-center justify-center p-16 text-center gap-4">
      <Icon className={`w-14 h-14 ${iconColor}`} />
      <h1 className="text-xl font-semibold text-foreground">
        {estado === 'success' ? 'Suscripción activa' : estado === 'failed' ? 'Pago no confirmado' : 'Confirmando'}
      </h1>
      <p className="text-sm text-muted-foreground max-w-md">{mensaje}</p>
      <Link
        href="/mis-planes"
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Volver a los planes
      </Link>
    </div>
  );
}
