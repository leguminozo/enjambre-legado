import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Sparkles, Copy, Check, TrendingUp, DollarSign,
  Users, Gift, ArrowUpRight, Loader2, AlertCircle,
  BarChart3, Wallet, Eye, ExternalLink
} from 'lucide-react';

interface CreadorProfile {
  id: string;
  nombre_publico: string;
  codigo_ref: string;
  plataforma: string;
  plataforma_url: string | null;
  nicho: string | null;
  seguidores_aprox: number;
  porcentaje_comision: number;
  descuento_cliente: number;
  estado: string;
  bio: string | null;
  avatar_url: string | null;
  total_usos_codigo: number;
  total_comisiones: number;
  created_at: string;
}

interface BalanceData {
  creador_id: string;
  comisiones_total: number;
  comisiones_pendientes: number;
  total_retirado: number;
  balance_disponible: number;
  total_usos_codigo: number;
}

interface UsoRow {
  id: string;
  codigo_usado: string;
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
  monto_aprobado: number | null;
  estado: string;
  metodo_pago: string;
  created_at: string;
  notas: string | null;
}

interface CreadorPortalProps {
  userId?: string;
}

export function CreadorPortal({ userId }: CreadorPortalProps) {
  const [profile, setProfile] = useState<CreadorProfile | null>(null);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [usos, setUsos] = useState<UsoRow[]>([]);
  const [metricas, setMetricas] = useState<MetricaRow[]>([]);
  const [retiros, setRetiros] = useState<RetiroRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'usos' | 'retiros'>('dashboard');
  const [showRetiroForm, setShowRetiroForm] = useState(false);
  const [retiroForm, setRetiroForm] = useState({ monto: 0, metodo: 'transferencia' as const, datos: '' });

  useEffect(() => {
    fetchCreadorData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCreadorData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const profRes = await supabase.from('creadores').select('*').eq('user_id', session.user.id).single();

      if (!profRes.data) {
        setLoading(false);
        return;
      }

      setProfile(profRes.data);
      const creadorId = profRes.data.id;

      const [balRes, usosRes, metRes, retRes] = await Promise.all([
        supabase.from('creador_balance_view').select('*').eq('creador_id', creadorId).single(),
        supabase.from('creador_codigo_usos').select('*').eq('creador_id', creadorId).order('created_at', { ascending: false }).limit(30),
        supabase.from('creador_metricas_mes').select('*').eq('creador_id', creadorId).order('mes', { ascending: false }).limit(12),
        supabase.from('creador_retiros').select('id,monto_solicitado,monto_aprobado,estado,metodo_pago,created_at,notas,revisado_at').eq('creador_id', creadorId).order('created_at', { ascending: false }).limit(20),
      ]);

      if (balRes.data) setBalance(balRes.data as unknown as BalanceData);
      if (usosRes.data) setUsos(usosRes.data);
      if (metRes.data) setMetricas(metRes.data);
      if (retRes.data) setRetiros(retRes.data);
    } catch (err) {
      console.error('Error fetching creador data:', err);
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetiro = async () => {
    if (!profile || retiroForm.monto < 5000) {
      showToast('Monto mínimo de retiro: $5.000', 'error');
      return;
    }
    if (balance && retiroForm.monto > Number(balance.balance_disponible)) {
      showToast('Monto excede tu balance disponible', 'error');
      return;
    }

    try {
      const datosPago = retiroForm.metodo === 'transferencia'
        ? { cuenta: retiroForm.datos }
        : retiroForm.metodo === 'paypal'
        ? { email: retiroForm.datos }
        : { referencia: retiroForm.datos };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.rpc('solicitar_retiro_creador', {
        p_user_id: session.user.id,
        p_monto: retiroForm.monto,
        p_metodo_pago: retiroForm.metodo,
        p_datos_pago: datosPago,
      });

      if (error) {
        if (error.message === 'TOO_MANY_PENDING') {
          showToast('Máximo 3 retiros pendientes simultáneos', 'error');
        } else if (error.message === 'INSUFFICIENT_BALANCE') {
          showToast('Balance insuficiente', 'error');
        } else {
          throw error;
        }
        return;
      }

      showToast('Solicitud de retiro enviada', 'success');
      setShowRetiroForm(false);
      setRetiroForm({ monto: 0, metodo: 'transferencia', datos: '' });
      await fetchCreadorData();
    } catch (err) {
      console.error('Error creating retiro:', err);
      showToast('Error al solicitar retiro', 'error');
    }
  };

  const copyCode = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.codigo_ref);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const plataformaLabel: Record<string, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    blog: 'Blog',
    podcast: 'Podcast',
    otro: 'Otro',
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-oro-miel-dark" size={32} />
        <p className="text-sm text-text-muted font-datos uppercase tracking-widest">Cargando tu portal de creador...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Sparkles size={48} className="text-oro-miel-dark opacity-30" />
        <p className="text-lg font-display text-bosque-ulmo">Aún no eres creador</p>
        <p className="text-sm text-text-muted text-center max-w-md">
          Si te interesa formar parte de nuestra red de creadores de contenido, contacta al equipo de marketing.
        </p>
      </div>
    );
  }

  const isInactive = profile.estado !== 'activo';

  return (
    <div className="space-y-8 animate-in relative">
      {toast && (
        <div className={`fixed top-24 right-8 z-[100] px-6 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-in ${
          toast.type === 'success' ? 'bg-salud-optima/10 border-salud-optima text-salud-optima' : 'bg-salud-riesgo/10 border-salud-riesgo text-salud-riesgo'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {isInactive && (
        <div className="p-4 rounded-xl bg-amber/10 border border-amber/30 text-amber text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          <span>Tu cuenta de creador está <strong>{profile.estado}</strong>. {profile.estado === 'pendiente' ? 'Estamos revisando tu solicitud.' : 'Contacta al equipo para más info.'}</span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-oro-miel to-oro-miel-dark flex items-center justify-center text-white shadow-lg">
          <Sparkles size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-display text-bosque-ulmo">Portal de Creador</h2>
          <p className="text-sm text-text-muted">{profile.nombre_publico} · {plataformaLabel[profile.plataforma] || profile.plataforma}</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-br from-bosque-ulmo to-bosque-ulmo-dark text-crema-natural relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-oro-miel/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <p className="text-[0.7rem] uppercase tracking-widest text-crema-natural/60 mb-1">Tu código de referencia</p>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-3xl font-mono font-bold tracking-wider text-oro-miel">{profile.codigo_ref}</span>
            <button
              onClick={copyCode}
              className="w-10 h-10 rounded-xl bg-oro-miel/20 flex items-center justify-center hover:bg-oro-miel/30 transition-colors"
            >
              {copiedCode ? <Check size={18} className="text-salud-optima" /> : <Copy size={18} className="text-oro-miel" />}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[0.65rem] uppercase text-crema-natural/50">Descuento para tus seguidores</p>
              <p className="text-xl font-bold text-oro-miel">{profile.descuento_cliente}%</p>
            </div>
            <div>
              <p className="text-[0.65rem] uppercase text-crema-natural/50">Tu comisión</p>
              <p className="text-xl font-bold text-oro-miel">{profile.porcentaje_comision}%</p>
            </div>
            <div>
              <p className="text-[0.65rem] uppercase text-crema-natural/50">Seguidores</p>
              <p className="text-xl font-bold">{profile.seguidores_aprox?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Wallet size={18} />, val: `$${Number(balance?.balance_disponible || 0).toLocaleString('es-CL')}`, label: 'Balance Disponible', accent: 'text-oro-miel-dark' },
          { icon: <DollarSign size={18} />, val: `$${Number(balance?.comisiones_total || 0).toLocaleString('es-CL')}`, label: 'Comisiones Totales', accent: '' },
          { icon: <Users size={18} />, val: profile.total_usos_codigo, label: 'Usos del Código', accent: '' },
          { icon: <Gift size={18} />, val: `$${Number(balance?.total_retirado || 0).toLocaleString('es-CL')}`, label: 'Total Retirado', accent: '' },
        ].map((s, i) => (
          <div key={i} className="stat-card animate-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="stat-header"><div className="stat-icon">{s.icon}</div></div>
            <div className={`stat-value ${s.accent}`}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-2">
        {(['dashboard', 'usos', 'retiros'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn flex items-center gap-2 ${activeTab === tab ? 'btn-gold' : 'btn-outline'}`}
          >
            {tab === 'dashboard' && <BarChart3 size={16} />}
            {tab === 'usos' && <Eye size={16} />}
            {tab === 'retiros' && <Wallet size={16} />}
            {tab === 'dashboard' ? 'Métricas' : tab === 'usos' ? 'Historial de Usos' : 'Retiros'}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-oro-miel-dark" />
            <h3 className="font-display text-lg">Rendimiento Mensual</h3>
          </div>
          {metricas.length === 0 ? (
            <p className="text-sm text-text-muted italic py-8 text-center">Aún no hay métricas mensuales. Los datos se calcularán al cierre de cada mes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Usos</th>
                    <th>Ventas</th>
                    <th>Comisiones</th>
                    <th>Clientes Nuevos</th>
                    <th>Ticket Prom.</th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.map((m, i) => (
                    <tr key={i}>
                      <td className="font-medium">{m.mes}</td>
                      <td>{m.usos_codigo}</td>
                      <td>${Number(m.ventas_generadas).toLocaleString('es-CL')}</td>
                      <td className="text-oro-miel-dark font-bold">${Number(m.comisiones_generadas).toLocaleString('es-CL')}</td>
                      <td>{m.nuevos_clientes}</td>
                      <td>${Number(m.ticket_promedio).toLocaleString('es-CL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'usos' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Eye size={18} className="text-oro-miel-dark" />
            <h3 className="font-display text-lg">Historial de Usos de tu Código</h3>
          </div>
          {usos.length === 0 ? (
            <p className="text-sm text-text-muted italic py-8 text-center">Aún no hay usos registrados de tu código.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {usos.map(u => (
                <div key={u.id} className="p-4 rounded-xl bg-black/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-bosque-ulmo">Venta ${u.monto_venta.toLocaleString('es-CL')}</p>
                    <p className="text-xs text-text-muted">{new Date(u.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-salud-optima">-${u.descuento_aplicado.toLocaleString('es-CL')}</p>
                    <p className="text-xs text-oro-miel-dark font-medium">+${Number(u.comision_generada).toLocaleString('es-CL')} comisión</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'retiros' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-oro-miel-dark" />
              <h3 className="font-display text-lg">Mis Retiros</h3>
            </div>
            {profile.estado === 'activo' && Number(balance?.balance_disponible || 0) > 0 && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowRetiroForm(!showRetiroForm)}
              >
                + Solicitar Retiro
              </button>
            )}
          </div>

          {showRetiroForm && (
            <div className="p-5 rounded-xl bg-oro-miel-glow/20 border border-oro-miel/10 mb-6 space-y-4">
              <div className="text-sm font-bold text-bosque-ulmo">Solicitar Retiro</div>
              <p className="text-xs text-text-muted">Balance disponible: <strong className="text-oro-miel-dark">${Number(balance?.balance_disponible || 0).toLocaleString('es-CL')}</strong></p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[0.6rem] uppercase text-text-muted tracking-wider block mb-1">Monto (CLP)</label>
                  <input
            type="number"
            min={5000}
                    max={Number(balance?.balance_disponible || 0)}
                    value={retiroForm.monto || ''}
                    onChange={e => setRetiroForm({ ...retiroForm, monto: Number(e.target.value) })}
                    className="input-field text-sm"
                    placeholder="10000"
                  />
                </div>
                <div>
                  <label className="text-[0.6rem] uppercase text-text-muted tracking-wider block mb-1">Método de pago</label>
                  <select
                    value={retiroForm.metodo}
                    onChange={e => setRetiroForm({ ...retiroForm, metodo: e.target.value as 'transferencia' | 'paypal' | 'bizum' | 'otro' })}
                    className="input-field text-sm"
                  >
                    <option value="transferencia">Transferencia bancaria</option>
                    <option value="paypal">PayPal</option>
                    <option value="bizum">Bizum</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-[0.6rem] uppercase text-text-muted tracking-wider block mb-1">
                    {retiroForm.metodo === 'transferencia' ? 'N° de cuenta' : retiroForm.metodo === 'paypal' ? 'Email PayPal' : 'Referencia'}
                  </label>
                  <input
                    type="text"
                    value={retiroForm.datos}
                    onChange={e => setRetiroForm({ ...retiroForm, datos: e.target.value })}
                    className="input-field text-sm"
                    placeholder={retiroForm.metodo === 'transferencia' ? 'CLP12345678' : retiroForm.metodo === 'paypal' ? 'email@ejemplo.com' : 'Referencia'}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button className="btn btn-ghost btn-sm" onClick={() => setShowRetiroForm(false)}>Cancelar</button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleRetiro}
                  disabled={retiroForm.monto < 5000 || !retiroForm.datos}
                >
                  Enviar Solicitud
                </button>
              </div>
            </div>
          )}

          {retiros.length === 0 ? (
            <p className="text-sm text-text-muted italic py-8 text-center">No hay solicitudes de retiro.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {retiros.map(r => (
                    <tr key={r.id}>
                      <td className="font-medium">{new Date(r.created_at).toLocaleDateString('es-CL')}</td>
                      <td className="font-bold">${Number(r.monto_solicitado).toLocaleString('es-CL')}</td>
                      <td className="text-xs">{r.metodo_pago}</td>
                      <td>
                        <span className={`badge ${
                          r.estado === 'pendiente' ? 'badge-warning' :
                          r.estado === 'aprobado' ? 'badge-gold' :
                          r.estado === 'pagado' ? 'badge-success' :
                          'badge-error'
                        }`}>
                          {r.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
