'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@enjambre/auth';
import { TierBadge, TierProgressBar, useTierProgress } from '@/components/pos/tier-badge';
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';
import { TrendingUp, DollarSign, Zap, Building2, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { useClientViewLoading, ViewLoading, formatCLP } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { getNucleoApiUrl } from '@/lib/public-urls';

export interface BankDetails {
  banco: string;
  tipo_cuenta: 'vista_cuentarut' | 'corriente' | 'ahorro';
  numero_cuenta: string;
  rut: string;
  titular: string;
}

const CHILEAN_BANKS = [
  'BancoEstado (CuentaRUT / Chequera)',
  'Banco de Chile / Edwards',
  'Banco Santander Chile',
  'BCI (Banco de Crédito e Inversiones)',
  'Scotiabank Chile',
  'Itaú Corpbanca',
  'Banco Falabella',
  'Banco BICE',
  'Banco Security',
  'Banco Consorcio',
  'Tenpo Prepago',
  'Mach (BCI)',
  'Coopeuch',
];

type DailyEntry = { date: string; revenue: number; commissions: number; sales: number };
type SessionEntry = { id: string; opened_at: string; closed_at: string | null; opening_cash: number; session_status: string; cash_difference: number | null };
type CommissionEntry = { id: string; total_commission: number; base_commission: number; volume_multiplier: number; loyalty_bonus: number; streak_bonus: number; tier_multiplier: number; channel_rate: number | null; paid: boolean; created_at: string };

interface HistoryData {
  profile: {
    total_commissions_earned: number; total_commissions_paid: number; total_sales_lifetime: number;
    total_revenue_lifetime: number; clients_captured: number; current_streak_days: number;
    best_streak_days: number; commission_tier: string;
    bank_details?: BankDetails | null;
  } | null;
  sessions: SessionEntry[];
  commissions: CommissionEntry[];
  summary: { total_earned: number; total_pending: number; session_count: number };
  daily: DailyEntry[];
}

export type HistorialTab = 'overview' | 'commissions' | 'sessions' | 'leaderboard' | 'datos_pago';

export interface HistorialPageProps {
  defaultTab?: HistorialTab;
}

export default function HistorialPage({ defaultTab = 'overview' }: HistorialPageProps = {}) {
  const { tierProgress } = useTierProgress();
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [tab, setTab] = useState<HistorialTab>(defaultTab);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlTab = new URLSearchParams(window.location.search).get('tab') as HistorialTab | null;
      if (urlTab && ['overview', 'commissions', 'sessions', 'leaderboard', 'datos_pago'].includes(urlTab)) {
        setTab(urlTab);
      }
    }
  }, []);
  const [bankForm, setBankForm] = useState<BankDetails>({
    banco: CHILEAN_BANKS[0],
    tipo_cuenta: 'vista_cuentarut',
    numero_cuenta: '',
    rut: '',
    titular: '',
  });
  const [savingBank, setSavingBank] = useState(false);
  const [bankMsg, setBankMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const authSession = useAuthStore.getState().session;
      if (!authSession) return;

      const API_BASE = getNucleoApiUrl();
      const res = await fetch(`${API_BASE}/api/rep-ventas/history?range=${range}`, {
        headers: { Authorization: `Bearer ${authSession.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error('[Historial] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    if (data?.profile?.bank_details) {
      setBankForm(data.profile.bank_details);
    }
  }, [data?.profile?.bank_details]);

  const saveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    setBankMsg(null);
    try {
      const authSession = useAuthStore.getState().session;
      if (!authSession) throw new Error('No hay sesión activa');

      const API_BASE = getNucleoApiUrl();
      const res = await fetch(`${API_BASE}/api/rep-ventas/bank-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify(bankForm),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Error al guardar datos bancarios');
      }

      setBankMsg({ type: 'success', text: '¡Datos bancarios guardados con éxito!' });
      setData((prev) =>
        prev && prev.profile
          ? {
              ...prev,
              profile: { ...prev.profile, bank_details: bankForm },
            }
          : prev,
      );
    } catch (err) {
      setBankMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar datos bancarios',
      });
    } finally {
      setSavingBank(false);
    }
  };

  const showLoading = useClientViewLoading(loading);

  if (showLoading) {
    return <ViewLoading variant="view" label="Historial" hideLabel />;
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">No se pudo cargar el historial.</p>
      </div>
    );
  }

  const profile = data.profile;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <ViewShell
          variant="compact"
          eyebrow="POS"
          title="Historial"
          subtitle="Comisiones, ventas y rendimiento"
          className="!mb-0"
        />
        <div className="flex gap-2 shrink-0">
          {(['week', 'month', 'quarter'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRange(r);
                setLoading(true);
              }}
              className={`min-h-11 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${
                range === r
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {r === 'week' ? '7d' : r === 'month' ? '30d' : '90d'}
            </button>
          ))}
        </div>
      </div>

{profile && (
  <>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="card-glow p-4 text-center">
        <DollarSign className="w-4 h-4 text-primary mx-auto mb-2" />
        <p className="text-lg font-bold text-primary">{formatCLP(Math.abs(data.summary.total_pending))}</p>
        <p className="text-[9px] uppercase text-muted-foreground tracking-widest">Pendiente</p>
      </div>
      <div className="card-glow p-4 text-center">
        <TrendingUp className="w-4 h-4 text-success mx-auto mb-2" />
        <p className="text-lg font-bold text-foreground">{formatCLP(Math.abs(Number(profile.total_revenue_lifetime)))}</p>
        <p className="text-[9px] uppercase text-muted-foreground tracking-widest">Lifetime</p>
      </div>
      <div className="card-glow p-4 text-center">
        <Zap className="w-4 h-4 text-warning mx-auto mb-2" />
        <p className="text-lg font-bold text-foreground">{profile.current_streak_days}d</p>
        <p className="text-[9px] uppercase text-muted-foreground tracking-widest">Racha</p>
      </div>
      <div className="card-glow p-4 text-center">
        <TierBadge tier={profile.commission_tier} />
        <p className="text-lg font-bold text-foreground mt-2">{profile.total_sales_lifetime}</p>
        <p className="text-[9px] uppercase text-muted-foreground tracking-widest">Ventas</p>
      </div>
    </div>
    {tierProgress && <TierProgressBar progress={tierProgress} />}
  </>
)}

      <div className="flex flex-wrap gap-2">
        {(['overview', 'commissions', 'sessions', 'leaderboard', 'datos_pago'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`min-h-11 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'overview' ? 'Curva' : t === 'commissions' ? 'Comisiones' : t === 'sessions' ? 'Sesiones' : t === 'leaderboard' ? 'Ranking' : 'Datos Bancarios'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="card-glow p-5 space-y-4">
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest">Curva de volumen diario</h3>
          {data.daily.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">Sin datos en este período.</p>
          ) : (
            <div className="space-y-2">
              {data.daily.map(d => {
                const maxComms = Math.max(...data.daily.map(x => x.commissions), 1);
                const widthPct = (d.commissions / maxComms) * 100;
                return (
                  <div key={d.date} className="flex items-center gap-3">
      <span className="text-[10px] text-muted-foreground w-16 shrink-0">{new Date(d.date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span>
      <div className="flex-1 h-6 bg-card rounded-lg overflow-hidden relative">
        <div className="h-full bg-gradient-to-r from-primary/40 to-primary rounded-lg transition-all" style={{ width: `${widthPct}%` }} />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-foreground font-bold">
          {formatCLP(Math.abs(d.commissions))}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground w-8 text-right">{d.sales}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'commissions' && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {data.commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">Sin comisiones en este período.</p>
          ) : data.commissions.map(c => (
            <div key={c.id} className="card-glow p-4 flex items-center justify-between">
              <div>
        <p className="text-sm font-bold text-foreground">{formatCLP(Math.abs(Number(c.total_commission)))}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-muted-foreground">Base: {formatCLP(Math.abs(Number(c.base_commission)))}</span>
        {Number(c.volume_multiplier) > 1 && <span className="text-[9px] text-warning">×{Number(c.volume_multiplier).toFixed(1)}</span>}
        {Number(c.loyalty_bonus) > 0 && <span className="text-[9px] text-success">+loyalty</span>}
        {Number(c.streak_bonus) > 0 && <span className="text-[9px] text-info">+streak</span>}
        {Number(c.tier_multiplier) > 1 && <span className="text-[9px] text-info">tier ×{Number(c.tier_multiplier).toFixed(1)}</span>}
        {c.channel_rate != null && Number(c.channel_rate) !== 0.10 && <span className="text-[9px] text-info">{(Number(c.channel_rate) * 100).toFixed(0)}%</span>}
          </div>
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  c.paid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  {c.paid ? 'pagada' : 'pendiente'}
                </span>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(c.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'sessions' && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {data.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">Sin sesiones en este período.</p>
          ) : data.sessions.map(s => (
            <div key={s.id} className="card-glow p-4 flex items-center justify-between">
              <div>
        <p className="text-sm font-bold text-foreground">
          {new Date(s.opened_at).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-muted-foreground">Base: {formatCLP(Math.abs(s.opening_cash))}</span>
                  {s.cash_difference !== null && (
                    <span className={`text-[9px] font-bold ${Number(s.cash_difference) === 0 ? 'text-success' : 'text-destructive'}`}>
                      Δ {Number(s.cash_difference) >= 0 ? '+' : '-'}{formatCLP(Math.abs(Number(s.cash_difference)))}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
          s.session_status === 'reconciled' ? 'bg-success/10 text-success' :
          s.session_status === 'closed' ? 'bg-warning/10 text-warning' :
                'bg-primary/10 text-primary'
              }`}>
                {s.session_status}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'leaderboard' && <LeaderboardPanel variant="widget" />}

      {tab === 'datos_pago' && (
        <div className="card-glow p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground tracking-tight">
                Datos de Transferencia Bancaria
              </h3>
              <p className="text-xs text-muted-foreground">
                Registra tu cuenta personal para el pago y liquidación de tus comisiones
              </p>
            </div>
          </div>

          {bankMsg && (
            <div
              className={`rounded-xl p-3.5 flex items-start gap-2.5 text-xs ${
                bankMsg.type === 'success'
                  ? 'bg-success/10 border border-success/30 text-success'
                  : 'bg-destructive/10 border border-destructive/30 text-destructive'
              }`}
            >
              {bankMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{bankMsg.text}</span>
            </div>
          )}

          {data.profile?.bank_details?.numero_cuenta && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-primary tracking-wider">
                  Cuenta Actual Registrada
                </p>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  {data.profile.bank_details.banco} · {data.profile.bank_details.tipo_cuenta === 'vista_cuentarut' ? 'CuentaRUT / Vista' : data.profile.bank_details.tipo_cuenta === 'corriente' ? 'Cta. Corriente' : 'Cta. Ahorro'}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  N° {data.profile.bank_details.numero_cuenta} · RUT: {data.profile.bank_details.rut} · {data.profile.bank_details.titular}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-success/15 text-success border border-success/30">
                Activa ✓
              </span>
            </div>
          )}

          <form onSubmit={(e) => void saveBankDetails(e)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                  Nombre del Titular
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.titular}
                  onChange={(e) => setBankForm({ ...bankForm, titular: e.target.value })}
                  className="w-full min-h-11 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                  placeholder="Camila Soto Pérez"
                />
              </div>

              <div>
                <label className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                  RUT del Titular (con guión y dígito verificador)
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.rut}
                  onChange={(e) => setBankForm({ ...bankForm, rut: e.target.value })}
                  className="w-full min-h-11 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-xs text-foreground font-mono placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                  placeholder="19.123.456-7"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                  Institución Bancaria
                </label>
                <select
                  value={bankForm.banco}
                  onChange={(e) => setBankForm({ ...bankForm, banco: e.target.value })}
                  className="w-full min-h-11 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none transition-colors"
                >
                  {CHILEAN_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                  Tipo de Cuenta
                </label>
                <select
                  value={bankForm.tipo_cuenta}
                  onChange={(e) =>
                    setBankForm({
                      ...bankForm,
                      tipo_cuenta: e.target.value as 'vista_cuentarut' | 'corriente' | 'ahorro',
                    })
                  }
                  className="w-full min-h-11 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="vista_cuentarut">CuentaRUT / Cuenta Vista</option>
                  <option value="corriente">Cuenta Corriente</option>
                  <option value="ahorro">Cuenta de Ahorro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                Número de Cuenta
              </label>
              <input
                type="text"
                required
                value={bankForm.numero_cuenta}
                onChange={(e) => setBankForm({ ...bankForm, numero_cuenta: e.target.value })}
                className="w-full min-h-11 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-xs text-foreground font-mono placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                placeholder="Si es CuentaRUT, ingresa tu RUT sin puntos ni guión"
              />
            </div>

            <button
              type="submit"
              disabled={savingBank}
              className="min-h-11 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingBank ? 'Guardando…' : 'Guardar Datos Bancarios'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
