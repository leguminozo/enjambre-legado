'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { friendlyError, friendlySupabaseError, toast } from '@enjambre/ui';
import {
  Sparkles, Copy, Check, DollarSign, Users, Gift, Loader2, AlertCircle,
  BarChart3, Wallet, Eye, FileText,
} from 'lucide-react';
import {
  parseCreadorCapabilities,
  type CreadorCapabilities,
} from '@/lib/shop/participacion';

interface CreadorProfile {
  id: string;
  nombre_publico: string;
  codigo_ref: string;
  plataforma: string;
  estado: string;
  porcentaje_comision: number;
  descuento_cliente: number;
  seguidores_aprox: number;
  capabilities: unknown;
}

interface BalanceData {
  balance_disponible: number;
  comisiones_total: number;
  total_retirado: number;
}

interface UsoRow {
  id: string;
  monto_venta: number;
  descuento_aplicado: number;
  comision_generada: number;
  created_at: string;
}

interface MetricaRow {
  mes: string;
  usos_codigo: number;
  ventas_generadas: number;
  comisiones_generadas: number;
  nuevos_clientes: number;
  ticket_promedio: number;
}

interface RetiroRow {
  id: string;
  monto_solicitado: number;
  estado: string;
  metodo_pago: string;
  created_at: string;
}

const PLATAFORMA_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  blog: 'Blog',
  podcast: 'Podcast',
  otro: 'Otro',
};

const RETIRO_CONSENT_TEXT =
  'Autorizo el uso de mis datos de pago exclusivamente para procesar esta liquidación de comisiones por referido, conforme a la política de privacidad de Enjambre Legado.';

export function CreadorPortalClient() {
  const [profile, setProfile] = useState<CreadorProfile | null>(null);
  const [capabilities, setCapabilities] = useState<CreadorCapabilities | null>(null);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [usos, setUsos] = useState<UsoRow[]>([]);
  const [metricas, setMetricas] = useState<MetricaRow[]>([]);
  const [retiros, setRetiros] = useState<RetiroRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'usos' | 'retiros'>('dashboard');
  const [showRetiroForm, setShowRetiroForm] = useState(false);
  const [retiroConsent, setRetiroConsent] = useState(false);
  const [retiroForm, setRetiroForm] = useState({
    monto: 0,
    metodo: 'transferencia' as const,
    datos: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profRes = await supabase.from('creadores').select('*').eq('user_id', user.id).single();
      if (!profRes.data) {
        setLoading(false);
        return;
      }

      const prof = profRes.data as CreadorProfile;
      setProfile(prof);
      setCapabilities(parseCreadorCapabilities(prof.capabilities));

      const [balRes, usosRes, metRes, retRes] = await Promise.all([
        supabase.from('creador_balance_view').select('*').eq('creador_id', prof.id).single(),
        supabase.from('creador_codigo_usos').select('id,monto_venta,descuento_aplicado,comision_generada,created_at')
          .eq('creador_id', prof.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('creador_metricas_mes').select('*').eq('creador_id', prof.id)
          .order('mes', { ascending: false }).limit(12),
        supabase.from('creador_retiros').select('id,monto_solicitado,estado,metodo_pago,created_at')
          .eq('creador_id', prof.id).order('created_at', { ascending: false }).limit(20),
      ]);

      if (balRes.data) setBalance(balRes.data as BalanceData);
      if (usosRes.data) setUsos(usosRes.data);
      if (metRes.data) setMetricas(metRes.data);
      if (retRes.data) setRetiros(retRes.data);
    } catch (err) {
      console.error('Error fetching creador data:', err);
      toast(friendlyError(err, 'Error al cargar datos'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetiro = async () => {
    if (!profile || !capabilities) return;

    if (!capabilities.puede_retirar) {
      toast('Los retiros están deshabilitados para tu cuenta. Contacta al equipo.', { type: 'error' });
      return;
    }

    if (!retiroConsent) {
      toast('Debes aceptar el tratamiento de datos de pago para solicitar un retiro', { type: 'error' });
      return;
    }

    if (retiroForm.monto < 5000) {
      toast('Monto mínimo de retiro: $5.000', { type: 'error' });
      return;
    }

    if (retiroForm.monto > capabilities.tope_retiro_mensual) {
      toast(`El tope mensual de retiro es $${capabilities.tope_retiro_mensual.toLocaleString('es-CL')}`, { type: 'error' });
      return;
    }

    if (balance && retiroForm.monto > Number(balance.balance_disponible)) {
      toast('Monto excede tu balance disponible', { type: 'error' });
      return;
    }

    try {
      const supabase = createClient();
      const datosPago =
        retiroForm.metodo === 'transferencia'
          ? { cuenta: retiroForm.datos }
          : retiroForm.metodo === 'paypal'
            ? { email: retiroForm.datos }
            : { referencia: retiroForm.datos };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc('solicitar_retiro_creador', {
        p_user_id: user.id,
        p_monto: retiroForm.monto,
        p_metodo_pago: retiroForm.metodo,
        p_datos_pago: datosPago,
      });

      if (error) {
        const msg = error.message;
        if (msg === 'TOO_MANY_PENDING') toast('Máximo 3 retiros pendientes simultáneos', { type: 'error' });
        else if (msg === 'INSUFFICIENT_BALANCE') toast('Balance insuficiente', { type: 'error' });
        else if (msg === 'RETIROS_DISABLED') toast('Retiros deshabilitados para tu cuenta', { type: 'error' });
        else if (msg === 'MONTHLY_LIMIT_EXCEEDED') toast('Superaste el tope mensual de retiro', { type: 'error' });
        else if (msg === 'FORBIDDEN') toast('No autorizado para este retiro', { type: 'error' });
        else toast(friendlySupabaseError(error), { type: 'error' });
        return;
      }

      toast('Solicitud de liquidación enviada', { type: 'success' });
      setShowRetiroForm(false);
      setRetiroConsent(false);
      setRetiroForm({ monto: 0, metodo: 'transferencia', datos: '' });
      await fetchData();
    } catch (err) {
      console.error('Error creating retiro:', err);
      toast(friendlyError(err, 'Error al solicitar retiro'), { type: 'error' });
    }
  };

  const copyCode = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.codigo_ref);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-accent" size={32} />
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Cargando portal de embajador...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Sparkles size={48} className="text-accent opacity-30" />
        <p className="text-lg font-display text-foreground">Aún no eres embajador del bosque</p>
        <p className="text-sm text-muted-foreground max-w-md">
          Si te interesa unirte al programa de referidos, contáctanos. Las comisiones se liquidan como
          referidos comerciales, no como relación laboral.
        </p>
        <Link href="/contacto" className="text-accent text-sm hover:underline">Contactar equipo</Link>
      </div>
    );
  }

  const isInactive = profile.estado !== 'activo';
  const puedeRetirar = capabilities?.puede_retirar && !isInactive;

  return (
    <div className="space-y-8 animate-in">
      <div className="p-4 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground flex gap-3">
        <FileText size={16} className="shrink-0 mt-0.5" />
        <p>
          Programa de comisiones por referido. No constituye relación laboral. Pagos sujetos a revisión
          administrativa y documentación tributaria según corresponda. Ver{' '}
          <Link href="/terminos" className="text-accent hover:underline">términos</Link>.
        </p>
      </div>

      {isInactive && (
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 text-warning text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          <span>
            Tu cuenta está <strong>{profile.estado}</strong>.
            {profile.estado === 'pendiente' ? ' Estamos revisando tu solicitud.' : ' Contacta al equipo.'}
          </span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center text-accent">
          <Sparkles size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-display text-foreground">Embajador del Bosque</h1>
          <p className="text-sm text-muted-foreground">
            {profile.nombre_publico} · {PLATAFORMA_LABEL[profile.plataforma] || profile.plataforma}
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-primary text-primary-foreground relative overflow-hidden">
        <p className="text-[0.7rem] uppercase tracking-widest opacity-60 mb-1">Tu código de referencia</p>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-3xl font-mono font-bold tracking-wider text-accent">{profile.codigo_ref}</span>
          <button
            type="button"
            onClick={copyCode}
            className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors"
            aria-label="Copiar código"
          >
            {copiedCode ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-[0.65rem] uppercase opacity-50">Descuento seguidores</p>
            <p className="text-xl font-bold text-accent">{profile.descuento_cliente}%</p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase opacity-50">Tu comisión</p>
            <p className="text-xl font-bold text-accent">{profile.porcentaje_comision}%</p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase opacity-50">Usos del código</p>
            <p className="text-xl font-bold">{profile.seguidores_aprox?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Wallet, val: `$${Number(balance?.balance_disponible || 0).toLocaleString('es-CL')}`, label: 'Balance disponible' },
          { icon: DollarSign, val: `$${Number(balance?.comisiones_total || 0).toLocaleString('es-CL')}`, label: 'Comisiones acumuladas' },
          { icon: Users, val: String(usos.length), label: 'Usos recientes' },
          { icon: Gift, val: `$${Number(balance?.total_retirado || 0).toLocaleString('es-CL')}`, label: 'Total liquidado' },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border">
            <s.icon size={18} className="text-accent mb-2" />
            <p className="text-lg font-bold font-mono">{s.val}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['dashboard', 'usos', 'retiros'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
              activeTab === tab
                ? 'bg-accent text-accent-foreground border-accent'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'dashboard' ? 'Métricas' : tab === 'usos' ? 'Historial' : 'Liquidaciones'}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="rounded-xl border border-border overflow-x-auto">
          {metricas.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">Sin métricas mensuales aún.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="p-3 text-left">Mes</th>
                  <th className="p-3 text-right">Usos</th>
                  <th className="p-3 text-right">Ventas</th>
                  <th className="p-3 text-right">Comisiones</th>
                </tr>
              </thead>
              <tbody>
                {metricas.map((m) => (
                  <tr key={m.mes} className="border-t border-border">
                    <td className="p-3">{m.mes}</td>
                    <td className="p-3 text-right">{m.usos_codigo}</td>
                    <td className="p-3 text-right">${Number(m.ventas_generadas).toLocaleString('es-CL')}</td>
                    <td className="p-3 text-right text-accent font-medium">
                      ${Number(m.comisiones_generadas).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'usos' && (
        <div className="space-y-3">
          {usos.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">Sin usos registrados aún.</p>
          ) : (
            usos.map((u) => (
              <div key={u.id} className="p-4 rounded-xl border border-border flex justify-between">
                <div>
                  <p className="text-sm font-medium">Venta ${u.monto_venta.toLocaleString('es-CL')}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <p className="text-sm text-accent font-medium">
                  +${Number(u.comision_generada).toLocaleString('es-CL')}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'retiros' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Solicitudes de liquidación</h2>
            {puedeRetirar && Number(balance?.balance_disponible || 0) > 0 && (
              <button
                type="button"
                onClick={() => setShowRetiroForm(!showRetiroForm)}
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm"
              >
                + Solicitar liquidación
              </button>
            )}
          </div>

          {!capabilities?.puede_retirar && (
            <p className="text-sm text-muted-foreground">
              Los retiros están deshabilitados en tu cuenta. Contacta al equipo de administración.
            </p>
          )}

          {showRetiroForm && (
            <div className="p-5 rounded-xl border border-accent/20 bg-accent/5 space-y-4">
              <p className="text-sm font-medium">Solicitar liquidación de comisiones</p>
              <p className="text-xs text-muted-foreground">
                Balance: <strong>${Number(balance?.balance_disponible || 0).toLocaleString('es-CL')}</strong>
                {' · '}Tope mensual: ${capabilities?.tope_retiro_mensual.toLocaleString('es-CL')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="number"
                  min={5000}
                  max={Number(balance?.balance_disponible || 0)}
                  value={retiroForm.monto || ''}
                  onChange={(e) => setRetiroForm({ ...retiroForm, monto: Number(e.target.value) })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Monto CLP"
                />
                <select
                  value={retiroForm.metodo}
                  onChange={(e) => setRetiroForm({ ...retiroForm, metodo: e.target.value as typeof retiroForm.metodo })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="transferencia">Transferencia</option>
                  <option value="paypal">PayPal</option>
                  <option value="otro">Otro</option>
                </select>
                <input
                  type="text"
                  value={retiroForm.datos}
                  onChange={(e) => setRetiroForm({ ...retiroForm, datos: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder={retiroForm.metodo === 'transferencia' ? 'N° cuenta' : 'Referencia'}
                />
              </div>
              <label className="flex items-start gap-3 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={retiroConsent}
                  onChange={(e) => setRetiroConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span>{RETIRO_CONSENT_TEXT}</span>
              </label>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowRetiroForm(false)} className="text-sm text-muted-foreground">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRetiro}
                  disabled={!retiroConsent || retiroForm.monto < 5000 || !retiroForm.datos}
                  className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm disabled:opacity-50"
                >
                  Enviar solicitud
                </button>
              </div>
            </div>
          )}

          {retiros.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4 text-center">Sin solicitudes aún.</p>
          ) : (
            <div className="space-y-2">
              {retiros.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-border flex justify-between text-sm">
                  <span>{new Date(r.created_at).toLocaleDateString('es-CL')}</span>
                  <span className="font-medium">${Number(r.monto_solicitado).toLocaleString('es-CL')}</span>
                  <span className="text-muted-foreground">{r.estado}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}