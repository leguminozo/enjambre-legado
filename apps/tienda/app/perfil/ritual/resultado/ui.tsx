'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Repeat } from 'lucide-react';
import { friendlyApiError } from '@enjambre/ui';

type CommitState = 'loading' | 'success' | 'failed';

type PendingSubscription = { buyOrder?: string; provider?: string };

function parsePending(raw: string | null): PendingSubscription | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      return {
        buyOrder: typeof obj.buyOrder === 'string' ? obj.buyOrder : undefined,
        provider: typeof obj.provider === 'string' ? obj.provider : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

type CommitResponse = {
  ok?: boolean;
  authorized?: boolean;
  error?: string;
  buyOrder?: string;
  alreadyProcessed?: boolean;
};

function parseCommitResponse(obj: unknown): CommitResponse {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return {};
  const record = obj as Record<string, unknown>;
  return {
    ok: typeof record.ok === 'boolean' ? record.ok : undefined,
    authorized: typeof record.authorized === 'boolean' ? record.authorized : undefined,
    error: typeof record.error === 'string' ? record.error : undefined,
    buyOrder: typeof record.buyOrder === 'string' ? record.buyOrder : undefined,
    alreadyProcessed: typeof record.alreadyProcessed === 'boolean' ? record.alreadyProcessed : undefined,
  };
}

export function RitualResultClient() {
  const params = useSearchParams();
  const token = params.get('token_ws') || params.get('token');
  const buyOrderParam = params.get('buyOrder');
  const statusParam = params.get('status');
  const [state, setState] = useState<CommitState>('loading');
  const [message, setMessage] = useState('Confirmando pago del ritual...');

  const contentRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statusParam === 'failed') {
      setState('failed');
      setMessage('El pago fue rechazado o cancelado.');
      return;
    }

    if (!token) {
      setState('failed');
      setMessage('No se recibió la confirmación de pago.');
      return;
    }

    const raw = sessionStorage.getItem('oyz_pending_subscription');
    const pending = parsePending(raw);

    void (async () => {
      const NUCLEO_URL = process.env.NEXT_PUBLIC_NUCLEO_API_URL || 'http://localhost:3001';
      let res: Response;
      try {
        res = await fetch(`${NUCLEO_URL}/api/subscriptions/checkout/commit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            token_ws: token,
            buyOrder: buyOrderParam || pending?.buyOrder || undefined,
            provider: pending?.provider || undefined,
          }),
        });
      } catch {
        setState('failed');
        setMessage('Error de conexión. Verifica tu internet e intenta de nuevo.');
        return;
      }

      const json = parseCommitResponse(await res.json());

      if (!res.ok || !json.ok || !json.authorized) {
        setState('failed');
        setMessage(json.error ? friendlyApiError(undefined, json.error) : 'No se pudo confirmar el pago del ritual.');
        return;
      }

      sessionStorage.removeItem('oyz_pending_subscription');
      setState('success');
      setMessage(
        json.alreadyProcessed
          ? 'Tu ritual ya estaba activo. ¡Gracias por tu compromiso con el bosque!'
          : '¡Ritual activado! Tu próxima selección llegará según el ciclo elegido.',
      );
    })();
  }, [token, buyOrderParam, statusParam]);

  useEffect(() => {
    if (state === 'loading') return;
    const ctx = gsap.context(() => {
      gsap.from(contentRef.current, { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' });
      gsap.from(iconRef.current, { scale: 0, duration: 0.6, ease: 'back.out(1.7)', delay: 0.2 });
    });
    return () => ctx.revert();
  }, [state]);

  const Icon = state === 'success' ? CheckCircle : state === 'failed' ? XCircle : Clock;
  const iconColor =
    state === 'success' ? 'text-accent' : state === 'failed' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div ref={contentRef} className="max-w-lg w-full text-center space-y-8">
        <div ref={iconRef} className="flex justify-center">
          <div className={`w-20 h-20 rounded-full bg-secondary flex items-center justify-center ${iconColor}`}>
            <Icon size={40} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Repeat size={16} className="text-accent" />
            <span className="text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">Ritual Mensual</span>
          </div>
          <h1 className="font-display text-3xl text-foreground mb-4">
            {state === 'loading' ? 'Procesando…' : state === 'success' ? '¡Listo!' : 'Algo salió mal'}
          </h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {state !== 'loading' ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/perfil/ritual"
              className="px-8 py-3 bg-accent text-accent-foreground text-[0.65rem] uppercase tracking-[0.25em] font-bold rounded-xl hover:shadow-glow transition-all"
            >
              Ver mi ritual
            </Link>
            <Link
              href="/catalogo"
              className="px-8 py-3 border border-border text-foreground text-[0.65rem] uppercase tracking-[0.25em] rounded-xl hover:border-accent/30 transition-all"
            >
              Explorar catálogo
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}