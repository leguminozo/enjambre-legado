'use client';

/**
 * Canje de código de invitación (cualquier usuario autenticado en Núcleo).
 * Usa redeemInvitationCode → BFF + refreshSession/checkUser.
 */

import { useState } from 'react';
import { Ticket, Loader2 } from 'lucide-react';
import { toast } from '@enjambre/ui';
import { redeemInvitationCode } from '@/lib/redeem-invitation';

export function RedeemInviteForm({ compact = false }: { compact?: boolean }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const trimmed = code.trim();
    if (trimmed.length < 4) {
      toast('Ingresa un código válido', { type: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const result = await redeemInvitationCode(trimmed);
      if (!result.ok) {
        toast(result.message ?? 'No se pudo canjear el código', { type: 'error' });
        return;
      }
      toast(
        result.roles_asignados?.length
          ? `Código canjeado · roles: ${result.roles_asignados.join(', ')}`
          : (result.message ?? 'Código canjeado · sesión actualizada'),
        { type: 'success' },
      );
      setCode('');
      // Recargar shell con nuevo rol
      if (typeof window !== 'undefined') {
        window.location.assign('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-border bg-card ${compact ? 'p-4' : 'p-5'} space-y-3`}
    >
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-accent/15 p-2 text-accent">
          <Ticket size={18} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground">Canjear código de invitación</h3>
          <p className="text-[11px] text-muted-foreground">
            Actualiza tu rol de plataforma (p. ej. patio apicultor). Tras el canje se refresca la sesión.
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CÓDIGO"
          autoComplete="off"
          className="flex-1 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 font-mono text-sm tracking-wider text-foreground uppercase"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={loading || code.trim().length < 4}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Ticket size={14} />}
          Canjear
        </button>
      </div>
    </div>
  );
}
