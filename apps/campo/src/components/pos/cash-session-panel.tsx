'use client';

import { useState } from 'react';
import { useCashSession } from './cash-context';
import { TierBadge, useTierProgress } from './tier-badge';
import { useThresholdNotification, ThresholdNotificationBanner } from './threshold-notification';
import { Wallet, Lock, TrendingUp, ChevronRight, Zap, Crown, Radio, Banknote, CreditCard, Smartphone, Nfc, RefreshCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import { ViewLoading } from '@enjambre/ui';

export function CashSessionPanel() {
  const { session, loading, todayCommissions, todaySales, todayRevenue, nextThreshold, lastCommission, openSession, closeSession } = useCashSession();
  const { tierProgress } = useTierProgress();
  const { notification, dismiss } = useThresholdNotification({
    todayRevenue,
    nextThreshold,
  });
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [closingNotas, setClosingNotas] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [closeResult, setCloseResult] = useState<Record<string, unknown> | null>(null);

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{ sincronizadas: number } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.session)?.access_token;
  const API_BASE = process.env.NEXT_PUBLIC_NUCLEO_API_URL || '';

  const handleSumupSync = async () => {
    if (!token) return;
    setSyncLoading(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/sumup/sincronizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error sincronizando');
      setSyncResult(data.data);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSyncLoading(false);
    }
  };

  if (loading) {
    return <ViewLoading variant="view" label="Sesión de caja" hideLabel />;
  }

  if (!session) {
    return (
      <div className="card-glow p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg text-foreground">Abrir Caja</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Declara tu efectivo inicial</p>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase text-muted-foreground tracking-wider block mb-1">Efectivo inicial ($)</label>
          <input
            type="number"
            min={0}
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            placeholder="0"
            className="w-full bg-background/40 border border-border rounded-lg px-4 py-3 text-foreground text-lg font-medium focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <button
          disabled={actionLoading || !openingCash}
          onClick={async () => {
            setActionLoading(true);
            try {
              await openSession(Number(openingCash));
              setOpeningCash('');
            } catch (err) {
              console.error(err);
            } finally {
              setActionLoading(false);
            }
          }}
          className="w-full py-3 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all disabled:opacity-40"
        >
          {actionLoading ? 'Abriendo...' : 'Abrir Caja'}
        </button>
      </div>
    );
  }

  const formatCLP = (n: number) => '$' + n.toLocaleString('es-CL');

  return (
    <div className="space-y-4">
      <div className="card-glow p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
            </div>
            <div>
          <p className="text-sm font-bold text-foreground">Caja Abierta</p>
          <p className="text-[10px] text-muted-foreground">
            Desde {new Date(session.opened_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {tierProgress && <TierBadge tier={tierProgress.current_tier} />}
          </div>
          <span className="text-xs text-muted-foreground">Base: {formatCLP(session.opening_cash)}</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-background/30 rounded-lg p-3 text-center">
            <p className="text-[9px] uppercase text-muted-foreground tracking-wider mb-1">Ventas</p>
            <p className="text-xl font-bold text-foreground">{todaySales}</p>
          </div>
          <div className="bg-background/30 rounded-lg p-3 text-center">
            <p className="text-[9px] uppercase text-muted-foreground tracking-wider mb-1">Ingresos</p>
            <p className="text-lg font-bold text-foreground">{formatCLP(todayRevenue)}</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 text-center border border-primary/20">
            <p className="text-[9px] uppercase text-primary tracking-wider mb-1">Comisión</p>
            <p className="text-lg font-bold text-primary">{formatCLP(todayCommissions)}</p>
          </div>
      </div>

      {lastCommission && (lastCommission.tier_multiplier > 1 || lastCommission.channel_rate !== null) && (
        <div className="mt-3 bg-background/20 rounded-lg p-2.5 flex items-center gap-3 border border-border/50">
          {lastCommission.tier_multiplier > 1 && (
            <div className="flex items-center gap-1.5">
        <Crown className="w-3.5 h-3.5 text-warning" />
        <span className="text-[10px] text-warning font-bold">×{lastCommission.tier_multiplier.toFixed(1)}</span>
            </div>
          )}
          {lastCommission.channel_rate !== null && (
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] text-cyan-400 font-bold">{(lastCommission.channel_rate * 100).toFixed(0)}%</span>
            </div>
          )}
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider ml-auto">Última venta</span>
        </div>
      )}

      {nextThreshold && (
          <div className="mt-4 bg-background/20 rounded-lg p-3 flex items-center gap-3 border border-border/50">
            <Zap className="w-4 h-4 text-warning shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Próximo multiplicador ×{nextThreshold.multiplier}
              </p>
              <div className="mt-1 h-1.5 bg-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-warning rounded-full transition-all"
                  style={{ width: `${Math.min((todayRevenue / nextThreshold.threshold) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {formatCLP(todayRevenue)} / {formatCLP(nextThreshold.threshold)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="card-glow p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Nfc className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest block">Pagos SumUp</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Sincronización manual</span>
            </div>
          </div>
          <button
            type="button"
            disabled={syncLoading}
            onClick={() => void handleSumupSync()}
            className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCcw className={`w-3 h-3 ${syncLoading ? 'animate-spin' : ''}`} />
            {syncLoading ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
        
        {syncResult && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-2.5 flex items-center gap-2 text-success text-[10px] font-bold uppercase tracking-widest">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Sincronización completa. {syncResult.sincronizadas} registros nuevos.</span>
          </div>
        )}
        {syncError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2.5 flex items-center gap-2 text-destructive text-[10px] font-bold uppercase tracking-widest">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}
      </div>

      {closeResult ? (
        <div className="card-glow p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-success" />
            <h3 className="text-sm font-bold text-foreground">Cierre Completado</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-muted-foreground">Ventas efectivo:</div>
            <div className="text-foreground font-medium">{formatCLP(Number(closeResult.cash_sales ?? 0))}</div>
            <div className="text-muted-foreground">Esperado:</div>
            <div className="text-foreground font-medium">{formatCLP(Number(closeResult.expected_cash ?? 0))}</div>
            <div className="text-muted-foreground">Contado:</div>
            <div className="text-foreground font-medium">{formatCLP(Number(closeResult.counted_cash ?? 0))}</div>
            <div className="text-muted-foreground">Diferencia:</div>
            <div className={`font-bold ${Number(closeResult.difference ?? 0) === 0 ? 'text-success' : 'text-destructive'}`}>
              {Number(closeResult.difference ?? 0) >= 0 ? '+' : ''}{formatCLP(Number(closeResult.difference ?? 0))}
            </div>
      <div className="text-muted-foreground">Comisiones del día:</div>
      <div className="text-primary font-bold">{formatCLP(Number(closeResult.total_commission ?? 0))}</div>
    </div>

    {(() => {
      const bd = closeResult.breakdown as Record<string, number> | undefined;
      if (!bd || typeof bd !== 'object' || Object.keys(bd).length === 0) return null;
      return (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          <p className="text-[9px] uppercase text-muted-foreground tracking-widest font-bold">Desglose por metodo</p>
          {Object.entries(bd).map(([method, amount]) => {
            const icon = method === 'efectivo' ? <Banknote className="w-3 h-3" />
              : method === 'tarjeta' || method === 'pos_terminal' ? <CreditCard className="w-3 h-3" />
              : method === 'transferencia' ? <Smartphone className="w-3 h-3" />
              : <Nfc className="w-3 h-3" />;
            const label = method === 'efectivo' ? 'Efectivo'
              : method === 'tarjeta' ? 'Debito'
              : method === 'pos_terminal' ? 'Terminal POS'
              : method === 'transferencia' ? 'Transferencia'
              : method;
            return (
              <div key={method} className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
                <span className="text-foreground font-medium">{formatCLP(Number(amount))}</span>
              </div>
            );
          })}
        </div>
      );
    })()}

    <button
      onClick={() => setCloseResult(null)}
      className="w-full py-2 bg-card text-muted-foreground text-xs uppercase tracking-widest rounded-lg"
    >
      Entendido
    </button>
  </div>
      ) : (
        <div className="card-glow p-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            Cerrar Caja
          </h3>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground tracking-wider block mb-1">Efectivo contado ($)</label>
            <input
              type="number"
              min={0}
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              placeholder="0"
              className="w-full bg-background/40 border border-border rounded-lg px-4 py-3 text-foreground text-lg font-medium focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground tracking-wider block mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={closingNotas}
              onChange={(e) => setClosingNotas(e.target.value)}
              placeholder="Observaciones..."
              className="w-full bg-background/40 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <button
            disabled={actionLoading || !closingCash}
            onClick={async () => {
              setActionLoading(true);
              try {
                const result = await closeSession(Number(closingCash), closingNotas || undefined);
                setCloseResult(result ?? {});
                setClosingCash('');
                setClosingNotas('');
              } catch (err) {
                console.error(err);
              } finally {
                setActionLoading(false);
              }
            }}
            className="w-full py-3 bg-destructive/80 text-foreground font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-destructive transition-all disabled:opacity-40"
          >
            {actionLoading ? 'Cerrando...' : 'Cerrar Caja'}
          </button>
        </div>
      )}
      {notification && <ThresholdNotificationBanner notification={notification} onDismiss={dismiss} />}
    </div>
  );
}
