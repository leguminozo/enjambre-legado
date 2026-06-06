import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { friendlyError, friendlySupabaseError } from '@enjambre/ui';
import {
  Sparkles, Users, TrendingUp, DollarSign, Check, X, AlertCircle,
  Loader2, Search, Filter, Eye, Edit3, ChevronDown, ExternalLink,
  ArrowUpRight, Copy, CheckCircle2
} from 'lucide-react';

interface CreadorRow {
  id: string;
  user_id: string;
  nombre_publico: string;
  codigo_ref: string;
  plataforma: string;
  nicho: string | null;
  seguidores_aprox: number;
  porcentaje_comision: number;
  descuento_cliente: number;
  estado: string;
  total_usos_codigo: number;
  total_comisiones: number;
  bio: string | null;
  notas_internas: string | null;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
}

interface RankingRow {
  id: string;
  nombre_publico: string;
  codigo_ref: string;
  plataforma: string;
  estado: string;
  total_usos_codigo: number;
  total_comisiones: number;
  seguidores_aprox: number;
  ranking: number;
}

interface RetiroRow {
  id: string;
  creador_id: string;
  monto_solicitado: number;
  monto_aprobado: number | null;
  estado: string;
  metodo_pago: string;
  datos_pago: Record<string, unknown> | null;
  notas: string | null;
  created_at: string;
  creadores: { nombre_publico: string; codigo_ref: string } | null;
}

export function CreadoresAdminPanel() {
  const [creadores, setCreadores] = useState<CreadorRow[]>([]);
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [retiros, setRetiros] = useState<RetiroRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreador, setSelectedCreador] = useState<CreadorRow | null>(null);
  const [editComision, setEditComision] = useState<{ id: string; porcentaje: number; descuento: number } | null>(null);
  const [activeSection, setActiveSection] = useState<'creadores' | 'ranking' | 'retiros'>('creadores');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [revsRes, rankRes, retRes] = await Promise.all([
        supabase
          .from('creadores')
          .select('*, profiles!creadores_user_id_fkey(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('creador_ranking_view')
          .select('*')
          .limit(50),
        supabase
          .from('creador_retiros')
          .select('*, creadores(nombre_publico, codigo_ref)')
          .eq('estado', 'pendiente')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (revsRes.data) setCreadores(revsRes.data as unknown as CreadorRow[]);
      if (rankRes.data) setRanking(rankRes.data as unknown as RankingRow[]);
      if (retRes.data) setRetiros(retRes.data as unknown as RetiroRow[]);
	} catch (err) {
			console.error('Error fetching creadores data:', err);
			showToast(friendlyError(err, 'Error al cargar datos de creadores'), 'error');
		} finally {
      setLoading(false);
    }
  };

  const updateCreadorEstado = async (creadorId: string, userId: string, estado: string) => {
    setActionLoading(creadorId);
    try {
      const { error } = await supabase
        .from('creadores')
        .update({ estado })
        .eq('id', creadorId);

      if (error) throw error;

      if (estado === 'activo') {
        await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'creador', is_active: true });
      }

      showToast(`Creador ${estado === 'activo' ? 'activado' : estado === 'suspendido' ? 'suspendido' : estado} con éxito`, 'success');
      await fetchAllData();
	} catch (err) {
			console.error('Error updating creador:', err);
			showToast(friendlyError(err, 'No se pudo actualizar el estado'), 'error');
		} finally {
      setActionLoading(null);
    }
  };

  const updateComisionTasa = async (creadorId: string, porcentaje: number, descuento: number) => {
    setActionLoading(creadorId);
    try {
      const { error } = await supabase
        .from('creadores')
        .update({ porcentaje_comision: porcentaje, descuento_cliente: descuento })
        .eq('id', creadorId);

      if (error) throw error;

      showToast('Tasas actualizadas', 'success');
      setEditComision(null);
      await fetchAllData();
	} catch (err) {
			console.error('Error updating comision:', err);
			showToast(friendlyError(err, 'Error al actualizar tasas'), 'error');
		} finally {
      setActionLoading(null);
    }
  };

  const updateRetiroEstado = async (retiroId: string, estado: string, montoAprobado?: number) => {
    setActionLoading(retiroId);
    try {
      const updatePayload: Record<string, unknown> = {
        estado,
        revisado_at: new Date().toISOString(),
      };

      if (montoAprobado) updatePayload.monto_aprobado = montoAprobado;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) updatePayload.revisado_por = session.user.id;

      const { error } = await supabase
        .from('creador_retiros')
        .update(updatePayload)
        .eq('id', retiroId);

      if (error) throw error;

      showToast(`Retiro ${estado} con éxito`, 'success');
      await fetchAllData();
	} catch (err) {
			console.error('Error updating retiro:', err);
			showToast(friendlyError(err, 'Error al procesar retiro'), 'error');
		} finally {
      setActionLoading(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCreadores = creadores.filter(c => {
    const matchEstado = filterEstado === 'todos' || c.estado === filterEstado;
    const matchSearch = !searchQuery ||
      c.nombre_publico.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.codigo_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchEstado && matchSearch;
  });

  const estadoCounts = creadores.reduce<Record<string, number>>((acc, c) => {
    acc[c.estado] = (acc[c.estado] || 0) + 1;
    return acc;
  }, {});

  const plataformaIcon: Record<string, string> = {
    instagram: '📸',
    tiktok: '🎵',
    youtube: '🎬',
    blog: '✍️',
    podcast: '🎙️',
    otro: '🌐',
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-oro-miel-dark" size={32} />
        <p className="text-sm text-text-muted font-datos uppercase tracking-widest">Cargando red de creadores...</p>
      </div>
    );
  }

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

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-oro-miel-glow flex items-center justify-center text-oro-miel-dark">
          <Sparkles size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display text-bosque-ulmo">Red de Creadores</h2>
          <p className="text-sm text-text-muted">Gestión de códigos de referencia, comisiones y retiros</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Users size={18} />, val: creadores.length, label: 'Total Creadores', accent: '' },
          { icon: <CheckCircle2 size={18} />, val: estadoCounts['activo'] || 0, label: 'Activos', accent: 'text-salud-optima' },
          { icon: <DollarSign size={18} />, val: `$${creadores.reduce((s, c) => s + Number(c.total_comisiones || 0), 0).toLocaleString('es-CL')}`, label: 'Comisiones Totales', accent: 'text-oro-miel-dark' },
          { icon: <TrendingUp size={18} />, val: creadores.reduce((s, c) => s + (c.total_usos_codigo || 0), 0), label: 'Usos de Códigos', accent: '' },
        ].map((s, i) => (
          <div key={i} className="stat-card animate-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="stat-header">
              <div className="stat-icon">{s.icon}</div>
            </div>
            <div className={`stat-value ${s.accent}`}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-2">
        {(['creadores', 'ranking', 'retiros'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={`btn flex items-center gap-2 ${activeSection === tab ? 'btn-gold' : 'btn-outline'}`}
          >
            {tab === 'creadores' && <Users size={16} />}
            {tab === 'ranking' && <TrendingUp size={16} />}
            {tab === 'retiros' && <DollarSign size={16} />}
            {tab === 'creadores' ? 'Creadores' : tab === 'ranking' ? 'Ranking' : `Retiros (${retiros.length})`}
          </button>
        ))}
      </div>

      {activeSection === 'creadores' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-oro-miel-dark" />
              <h3 className="font-display text-lg">Creadores Registrados</h3>
            </div>
            <div className="flex gap-3 items-center">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Buscar creador..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-field pl-9 text-sm"
                  style={{ width: 200 }}
                />
              </div>
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <select
                  value={filterEstado}
                  onChange={e => setFilterEstado(e.target.value)}
                  className="input-field pl-9 text-sm"
                  style={{ width: 150 }}
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="activo">Activo</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredCreadores.length === 0 ? (
              <p className="text-sm text-text-muted italic py-8 text-center">No hay creadores que coincidan.</p>
            ) : (
              filteredCreadores.map(creador => (
                <div
                  key={creador.id}
                  className="p-5 rounded-xl bg-background/[0.03] border border-foreground/[0.06] hover:border-oro-miel/20 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{plataformaIcon[creador.plataforma] || '🌐'}</span>
                        <p className="font-bold text-sm text-bosque-ulmo truncate">{creador.nombre_publico}</p>
                        <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          creador.estado === 'activo' ? 'bg-salud-optima/10 text-salud-optima' :
                          creador.estado === 'pendiente' ? 'bg-amber/10 text-amber' :
                          creador.estado === 'suspendido' ? 'bg-salud-riesgo/10 text-salud-riesgo' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {creador.estado}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted">{creador.profiles?.full_name || 'Sin nombre'} · {creador.profiles?.email || ''}</p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <button
                          onClick={() => copyCode(creador.codigo_ref)}
                          className="flex items-center gap-1 text-xs font-mono bg-oro-miel-glow/30 border border-oro-miel/10 px-2 py-1 rounded-md hover:bg-oro-miel-glow/50 transition-colors"
                        >
                          {copiedCode === creador.codigo_ref ? <Check size={12} className="text-salud-optima" /> : <Copy size={12} className="text-oro-miel-dark" />}
                          <span className="text-oro-miel-dark font-bold">{creador.codigo_ref}</span>
                        </button>
                        <span className="text-[0.65rem] text-text-muted">
                          Comisión: <strong className="text-bosque-ulmo">{creador.porcentaje_comision}%</strong>
                        </span>
                        <span className="text-[0.65rem] text-text-muted">
                          Descuento: <strong className="text-bosque-ulmo">{creador.descuento_cliente}%</strong>
                        </span>
                        <span className="text-[0.65rem] text-text-muted">
                          {creador.seguidores_aprox?.toLocaleString() || 0} seguidores
                        </span>
                      </div>
                      <div className="flex gap-4 mt-2">
                        <span className="text-[0.6rem] text-text-muted">Usos: <strong>{creador.total_usos_codigo}</strong></span>
                        <span className="text-[0.6rem] text-text-muted">Comisiones: <strong className="text-oro-miel-dark">${Number(creador.total_comisiones || 0).toLocaleString('es-CL')}</strong></span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {creador.estado === 'pendiente' && (
                        <>
                          <button
                            disabled={actionLoading === creador.id}
                            onClick={() => updateCreadorEstado(creador.id, creador.user_id, 'activo')}
                            className="w-9 h-9 rounded-full bg-salud-optima/10 text-salud-optima flex items-center justify-center hover:bg-salud-optima hover:text-foreground transition-all disabled:opacity-50"
                            title="Activar"
                          >
                            {actionLoading === creador.id ? <Loader2 className="animate-spin" size={16} /> : <Check size={18} />}
                          </button>
                          <button
                            disabled={actionLoading === creador.id}
                            onClick={() => updateCreadorEstado(creador.id, creador.user_id, 'suspendido')}
                            className="w-9 h-9 rounded-full bg-salud-riesgo/10 text-salud-riesgo flex items-center justify-center hover:bg-salud-riesgo hover:text-foreground transition-all disabled:opacity-50"
                            title="Rechazar"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                      {creador.estado === 'activo' && (
                        <>
                          <button
                            onClick={() => setSelectedCreador(selectedCreador?.id === creador.id ? null : creador)}
                            className="w-9 h-9 rounded-full bg-oro-miel-glow/30 text-oro-miel-dark flex items-center justify-center hover:bg-oro-miel-glow/50 transition-all"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setEditComision(editComision?.id === creador.id ? null : { id: creador.id, porcentaje: creador.porcentaje_comision, descuento: creador.descuento_cliente })}
                            className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-all"
                            title="Editar tasas"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            disabled={actionLoading === creador.id}
                            onClick={() => updateCreadorEstado(creador.id, creador.user_id, 'suspendido')}
                            className="w-9 h-9 rounded-full bg-salud-riesgo/10 text-salud-riesgo flex items-center justify-center hover:bg-salud-riesgo hover:text-foreground transition-all disabled:opacity-50"
                            title="Suspender"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      {creador.estado === 'suspendido' && (
                        <button
                          disabled={actionLoading === creador.id}
                          onClick={() => updateCreadorEstado(creador.id, creador.user_id, 'activo')}
                          className="w-9 h-9 rounded-full bg-salud-optima/10 text-salud-optima flex items-center justify-center hover:bg-salud-optima hover:text-foreground transition-all disabled:opacity-50"
                          title="Reactivar"
                        >
                          {actionLoading === creador.id ? <Loader2 className="animate-spin" size={16} /> : <Check size={18} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {editComision?.id === creador.id && (
                    <div className="mt-4 pt-4 border-t border-background/5">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <label className="text-[0.6rem] uppercase text-text-muted tracking-wider block mb-1">Comisión %</label>
                          <input
                            type="number"
                            min={0}
                            max={30}
                            step={0.5}
                            value={editComision.porcentaje}
                            onChange={e => setEditComision({ ...editComision, porcentaje: Number(e.target.value) })}
                            className="input-field text-sm"
                            style={{ width: 80 }}
                          />
                        </div>
                        <div>
                          <label className="text-[0.6rem] uppercase text-text-muted tracking-wider block mb-1">Descuento cliente %</label>
                          <input
                            type="number"
                            min={0}
                            max={15}
                            step={0.5}
                            value={editComision.descuento}
                            onChange={e => setEditComision({ ...editComision, descuento: Number(e.target.value) })}
                            className="input-field text-sm"
                            style={{ width: 80 }}
                          />
                        </div>
                        <button
                          className="btn btn-primary btn-sm mt-4"
                          onClick={() => updateComisionTasa(creador.id, editComision.porcentaje, editComision.descuento)}
                          disabled={actionLoading === creador.id}
                        >
                          {actionLoading === creador.id ? <Loader2 className="animate-spin" size={14} /> : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedCreador?.id === creador.id && (
                    <div className="mt-4 pt-4 border-t border-background/5 space-y-2">
                      {creador.nicho && <p className="text-xs text-text-muted">Nicho: <span className="text-bosque-ulmo">{creador.nicho}</span></p>}
                      {creador.bio && <p className="text-xs text-text-secondary italic">"{creador.bio}"</p>}
                      {creador.notas_internas && <p className="text-xs text-amber bg-amber/5 p-2 rounded">Notas internas: {creador.notas_internas}</p>}
                      <p className="text-[0.6rem] text-text-muted">Registrado: {new Date(creador.created_at).toLocaleDateString('es-CL')}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSection === 'ranking' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-oro-miel-dark" />
            <h3 className="font-display text-lg">Ranking de Creadores</h3>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {ranking.length === 0 ? (
              <p className="text-sm text-text-muted italic py-8 text-center">Sin datos de ranking aún.</p>
            ) : (
              ranking.map(r => (
                <div
                  key={r.id}
                  className={`p-4 rounded-xl flex items-center justify-between transition-all ${
                    r.ranking <= 3
                      ? 'bg-oro-miel-glow/20 border border-oro-miel/20'
                      : 'bg-background/[0.03] border border-foreground/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      r.ranking === 1 ? 'bg-oro-miel text-foreground' :
                      r.ranking === 2 ? 'bg-secondary text-foreground' :
                      r.ranking === 3 ? 'bg-amber-700 text-amber-100' :
                      'bg-background/5 text-text-muted'
                    }`}>
                      #{r.ranking}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-bosque-ulmo">{r.nombre_publico}</p>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[0.65rem] text-text-muted font-mono">{r.codigo_ref}</span>
                        <span className="text-[0.65rem]">{plataformaIcon[r.plataforma] || '🌐'}</span>
                        <span className="text-[0.65rem] text-text-muted">{r.seguidores_aprox?.toLocaleString() || 0} seg.</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-oro-miel-dark">${Number(r.total_comisiones || 0).toLocaleString('es-CL')}</p>
                    <p className="text-[0.6rem] text-text-muted">{r.total_usos_codigo} usos</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSection === 'retiros' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign size={18} className="text-oro-miel-dark" />
            <h3 className="font-display text-lg">Solicitudes de Retiro</h3>
            <span className="badge badge-gold">{retiros.filter(r => r.estado === 'pendiente').length} Pendientes</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {retiros.length === 0 ? (
              <p className="text-sm text-text-muted italic py-8 text-center">No hay solicitudes de retiro pendientes.</p>
            ) : (
              retiros.map(retiro => (
                <div
                  key={retiro.id}
                  className="p-4 rounded-xl bg-background/[0.03] border border-foreground/[0.06] hover:border-oro-miel/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-sm text-bosque-ulmo">{retiro.creadores?.nombre_publico || 'Desconocido'}</p>
                      <p className="text-xs text-text-muted font-mono">{retiro.creadores?.codigo_ref}</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-sm font-bold text-oro-miel-dark">${Number(retiro.monto_solicitado).toLocaleString('es-CL')}</span>
                        <span className="text-xs text-text-muted">Vía: {retiro.metodo_pago}</span>
                      </div>
                      {retiro.datos_pago && (
                        <p className="text-[0.65rem] text-text-muted mt-1 bg-background/5 p-2 rounded font-mono">
                          {JSON.stringify(retiro.datos_pago)}
                        </p>
                      )}
                      <p className="text-[0.6rem] text-text-muted mt-1">{new Date(retiro.created_at).toLocaleDateString('es-CL')}</p>
                    </div>

                    {retiro.estado === 'pendiente' && (
                      <div className="flex gap-2">
                        <button
                          disabled={actionLoading === retiro.id}
                          onClick={() => updateRetiroEstado(retiro.id, 'aprobado', retiro.monto_solicitado)}
                          className="btn btn-sm bg-salud-optima/10 text-salud-optima hover:bg-salud-optima hover:text-foreground transition-all disabled:opacity-50"
                        >
                          {actionLoading === retiro.id ? <Loader2 className="animate-spin" size={14} /> : <><Check size={14} /> Aprobar</>}
                        </button>
                        <button
                          disabled={actionLoading === retiro.id}
                          onClick={() => updateRetiroEstado(retiro.id, 'rechazado')}
                          className="btn btn-sm bg-salud-riesgo/10 text-salud-riesgo hover:bg-salud-riesgo hover:text-foreground transition-all disabled:opacity-50"
                        >
                          <X size={14} /> Rechazar
                        </button>
                      </div>
                    )}

                    {retiro.estado !== 'pendiente' && (
                      <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                        retiro.estado === 'aprobado' ? 'bg-salud-optima/10 text-salud-optima' :
                        retiro.estado === 'pagado' ? 'bg-blue-100 text-blue-600' :
                        'bg-salud-riesgo/10 text-salud-riesgo'
                      }`}>
                        {retiro.estado}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
