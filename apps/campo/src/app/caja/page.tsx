'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WalletCards, Store, Clock, ArrowRight } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { useCashSession } from '@/components/pos/cash-context';
import { CashSessionPanel } from '@/components/pos/cash-session-panel';
import { SessionVoidsPanel } from '@/components/pos/session-voids-panel';
import { useAuthStore } from '@enjambre/auth';
import { formatCLP, useClientViewLoading, ViewLoading } from '@enjambre/ui';
import { getNucleoApiUrl } from '@/lib/public-urls';

type SessionEntry = {
  id: string;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number;
  session_status: string;
  cash_difference: number | null;
};

function CajaContent() {
  const { session, loading } = useCashSession();
  const token = useAuthStore((s) => s.session)?.access_token;
  const showLoading = useClientViewLoading(loading);
  const [pastSessions, setPastSessions] = useState<SessionEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const API_BASE = getNucleoApiUrl();
        const res = await fetch(`${API_BASE}/api/rep-ventas/history?range=month`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setPastSessions(json.data?.sessions ?? []);
        }
      } catch (err) {
        console.error('[Caja] error loading past sessions:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    void fetchHistory();
  }, [token]);

  if (showLoading) {
    return <ViewLoading variant="view" label="Control de Caja" hideLabel />;
  }

  return (
    <div className="space-y-6">
      <ViewShell
        variant="compact"
        eyebrow="Campo · Terreno"
        title="Control de Caja"
        subtitle={
          session
            ? 'Sesión activa · Registra tus arqueos y cierres de caja'
            : 'Inicia tu sesión para operar en el punto de venta'
        }
        icon={<WalletCards size={20} />}
        actions={
          <span
            className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wide font-medium ${
              session
                ? 'bg-success/15 text-success border border-success/30'
                : 'bg-warning/15 text-warning border border-warning/30'
            }`}
          >
            {session ? 'Caja abierta' : 'Caja cerrada'}
          </span>
        }
      />

      <CashSessionPanel />

      {session && (
        <div className="space-y-4">
          <SessionVoidsPanel />

          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-foreground">Caja lista para operar</p>
              <p className="text-[11px] text-muted-foreground">
                Accede al catálogo de venta rápida o al carrito multi-producto
              </p>
            </div>
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 min-h-11 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shrink-0"
            >
              <Store size={14} />
              <span>Ir a Vender</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Historial de sesiones de caja del agente comercial */}
      <div className="card-glow p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Sesiones de Caja Anteriores</h3>
          </div>
          <Link
            href="/pos/historial?tab=sessions"
            className="text-xs text-primary hover:underline font-medium"
          >
            Ver historial completo &rarr;
          </Link>
        </div>

        {loadingHistory ? (
          <p className="text-xs text-muted-foreground italic py-4 text-center">
            Cargando sesiones anteriores…
          </p>
        ) : pastSessions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-4 text-center">
            No hay registros de sesiones previas.
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {pastSessions.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-lg bg-background/50 border border-border/40 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {new Date(s.opened_at).toLocaleDateString('es-CL', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Apertura: {formatCLP(Math.abs(s.opening_cash))}
                    {s.cash_difference !== null && (
                      <span
                        className={`ml-2 font-bold ${
                          Number(s.cash_difference) === 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        Δ {Number(s.cash_difference) >= 0 ? '+' : '-'}
                        {formatCLP(Math.abs(Number(s.cash_difference)))}
                      </span>
                    )}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    s.session_status === 'reconciled'
                      ? 'bg-success/10 text-success'
                      : s.session_status === 'closed'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-primary/10 text-primary'
                  }`}
                >
                  {s.session_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CajaPage() {
  return <CajaContent />;
}
