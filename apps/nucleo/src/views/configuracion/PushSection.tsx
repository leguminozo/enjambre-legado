'use client';

import { BellRing, BellOff } from 'lucide-react';
import { toast } from '@enjambre/ui';
import { useWebPush } from '@enjambre/auth';

export function PushSection() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = useWebPush({ appSource: 'nucleo' });

  const handleToggle = async () => {
    if (isSubscribed) {
      const ok = await unsubscribe();
      if (ok) toast.success('Avisos desactivados en este equipo.');
      return;
    }
    const ok = await subscribe(['general', 'sistema', 'pedidos']);
    if (ok) {
      toast.success('Equipo vinculado: recibirás avisos operativos aquí.');
    } else {
      toast.error('No se pudo activar. Revisa el permiso del navegador.');
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 animate-in space-y-4">
      <div className="flex items-center gap-2 text-accent">
        <BellRing size={18} />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Avisos inmediatos en este equipo
        </h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
        Vincula este navegador para recibir alertas operativas (quiebres de stock,
        folios bajos, reembolsos y despachos) aunque no tengas la plataforma abierta.
      </p>
      {!isSupported ? (
        <p className="text-xs text-muted-foreground italic">
          Este navegador no admite avisos en segundo plano.
        </p>
      ) : permission === 'denied' ? (
        <p className="text-xs text-destructive">
          El permiso está bloqueado en este navegador. Habilítalo en sus ajustes para continuar.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => void handleToggle()}
          disabled={isLoading}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-secondary px-5 text-sm font-medium text-foreground hover:border-accent/40 hover:text-accent-text transition-colors disabled:opacity-50"
        >
          {isSubscribed ? <BellOff size={16} /> : <BellRing size={16} />}
          {isLoading ? 'Procesando…' : isSubscribed ? 'Desvincular este equipo' : 'Activar avisos en este equipo'}
        </button>
      )}
    </div>
  );
}
