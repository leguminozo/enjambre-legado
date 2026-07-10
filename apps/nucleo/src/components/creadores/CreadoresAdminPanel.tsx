import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { friendlyError, friendlySupabaseError, toast, ViewLoading } from '@enjambre/ui';
import {
  Sparkles, Users, TrendingUp, DollarSign, Check, X,
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
  capabilities: Record<string, unknown> | null;
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
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreador, setSelectedCreador] = useState<CreadorRow | null>(null);
  const [editComision, setEditComision] = useState<{ id: string; porcentaje: number; descuento: number } | null>(null);
  const [activeSection, setActiveSection] = useState<'creadores' | 'ranking' | 'retiros'>('creadores');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

      if (revsRes.data) setCreadores(Array.isArray(revsRes.data) ? (revsRes.data as CreadorRow[]) : []);
      if (rankRes.data) setRanking(Array.isArray(rankRes.data) ? (rankRes.data as RankingRow[]) : []);
      if (retRes.data) setRetiros(Array.isArray(retRes.data) ? (retRes.data as RetiroRow[]) : []);
	} catch (err) {
			console.error('Error fetching creadores data:', err);
			toast(friendlyError(err, 'Error al cargar datos de creadores'), { type: 'error' });
		} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

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

      toast(`Creador ${estado === 'activo' ? 'activado' : estado === 'suspendido' ? 'suspendido' : estado} con éxito`, { type: 'success' });
      await fetchAllData();
	} catch (err) {
			console.error('Error updating creador:', err);
			toast(friendlyError(err, 'No se pudo actualizar el estado'), { type: 'error' });
		} finally {
      setActionLoading(null);
    }
  };

  const updateCapabilities = async (
    creadorId: string,
    caps: { puede_retirar: boolean; tope_retiro_mensual: number },
  ) => {
    setActionLoading(creadorId);
    try {
      const existing = creadores.find((c) => c.id === creadorId)?.capabilities ?? {};
      const { error } = await supabase
        .from('creadores')
        .update({
          capabilities: {
            ...existing,
            puede_retirar: caps.puede_retirar,
            tope_retiro_mensual: caps.tope_retiro_mensual,
          },
        })
        .eq('id', creadorId);

      if (error) throw error;
      toast('Capabilities actualizadas', { type: 'success' });
      await fetchAllData();
    } catch (err) {
      console.error('Error updating capabilities:', err);
      toast(friendlyError(err, 'Error al actualizar capabilities'), { type: 'error' });
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

      toast('Tasas actualizadas', { type: 'success' });
      setEditComision(null);
      await fetchAllData();
	} catch (err) {
			console.error('Error updating comision:', err);
			toast(friendlyError(err, 'Error al actualizar tasas'), { type: 'error' });
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

      const { data: { user } } = await supabase.auth.getUser();
      if (user) updatePayload.revisado_por = user.id;

      const { error } = await supabase
        .from('creador_retiros')
        .update(updatePayload)
        .eq('id', retiroId);

      if (error) throw error;

      toast(`Retiro ${estado} con éxito`, { type: 'success' });
      await fetchAllData();
	} catch (err) {
			console.error('Error updating retiro:', err);
			toast(friendlyError(err, 'Error al procesar retiro'), { type: 'error' });
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
    return <ViewLoading variant="view" label="Red de creadores" hideLabel />;
  }

  return (
  <div className="space-y-8 animate-in relative">
    <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
          <Sparkles size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display text-primary">Red de Creadores</h2>
          <p className="text-sm text-muted-foreground">Gestión de códigos de referencia, comisiones y retiros</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Users size={18} />, val: creadores.length, label: 'Total Creadores', accent: '' },
          { icon: <CheckCircle2 size={18} />, val: estadoCounts['activo'] || 0, label: 'Activos', accent: 'text-success' },
          { icon: <DollarSign size={18} />, val: `$${creadores.reduce((s, c) => s + Number(c.total_comisiones || 0), 0).toLocaleString('es-CL')}`, label: 'Comisiones Totales', accent: 'text-accent' },
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
              <Users size={18} className="text-accent" />
              <h3 className="font-display text-lg">Creadores Registrados</h3>
            </div>
            <div className="flex gap-3 items-center">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
              <p className="text-sm text-muted-foreground italic py-8 text-center">No hay creadores que coincidan.</p>
            ) : (
              filteredCreadores.map(creador => (
                <div
                  key={creador.id}
                  className="p-5 rounded-xl bg-background/[0.03] border border-foreground/[0.06] hover:border-accent/20 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{plataformaIcon[creador.plataforma] || '🌐'}</span>
                        <p className="font-bold text-sm text-primary truncate">{creador.nombre_publico}</p>
                        <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          creador.estado === 'activo' ? 'bg-success/10 text-success' :
                          creador.estado === 'pendiente' ? 'bg-warning/10 text-warning' :
                          creador.estado === 'suspendido' ? 'bg-destructive/10 text-destructive' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {creador.estado}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{creador.profiles?.full_name || 'Sin nombre'} · {creador.profiles?.email || ''}</p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <button
                          onClick={() => copyCode(creador.codigo_ref)}
                          className="flex items-center gap-1 text-xs font-mono bg-accent/15/30 border border-accent/10 px-2 py-1 rounded-md hover:bg-accent/15/50 transition-colors"
                        >
                          {copiedCode === creador.codigo_ref ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-accent" />}
                          <span className="text-accent font-bold">{creador.codigo_ref}</span>
                        </button>
                        <span className="text-[0.65rem] text-muted-foreground">
                          Comisión: <strong className="text-primary">{creador.porcentaje_comision}%</strong>
                        </span>
                        <span className="text-[0.65rem] text-muted-foreground">
                          Descuento: <strong className="text-primary">{creador.descuento_cliente}%</strong>
                        </span>
                        <span className="text-[0.65rem] text-muted-foreground">
                          {creador.seguidores_aprox?.toLocaleString() || 0} seguidores
                        </span>
                      </div>
                      <div className="flex gap-4 mt-2">
                        <span className="text-[0.6rem] text-muted-foreground">Usos: <strong>{creador.total_usos_codigo}</strong></span>
                        <span className="text-[0.6rem] text-muted-foreground">Comisiones: <strong className="text-accent">${Number(creador.total_comisiones || 0).toLocaleString('es-CL')}</strong></span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {creador.estado === 'pendiente' && (
                        <>
                          <button
                            disabled={actionLoading === creador.id}
                            onClick={() => updateCreadorEstado(creador.id, creador.user_id, 'activo')}
                            className="w-9 h-9 rounded-full bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-foreground transition-all disabled:opacity-50"
                            title="Activar"
                          >
                            {actionLoading === creador.id ? <Loader2 className="animate-spin" size={16} /> : <Check size={18} />}
                          </button>
                          <button
                            disabled={actionLoading === creador.id}
                            onClick={() => updateCreadorEstado(creador.id, creador.user_id, 'suspendido')}
                            className="w-9 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-foreground transition-all disabled:opacity-50"
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
                            className="w-9 h-9 rounded-full bg-accent/15/30 text-accent flex items-center justify-center hover:bg-accent/15/50 transition-all"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setEditComision(editComision?.id === creador.id ? null : { id: creador.id, porcentaje: creador.porcentaje_comision, descuento: creador.descuento_cliente })}
                            className="w-9 h-9 rounded-full bg-surface-raised text-foreground flex items-center justify-center hover:bg-card transition-all"
                            title="Editar tasas"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            disabled={actionLoading === creador.id}
                            onClick={() => updateCreadorEstado(creador.id, creador.user_id, 'suspendido')}
                            className="w-9 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-foreground transition-all disabled:opacity-50"
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
                          className="w-9 h-9 rounded-full bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-foreground transition-all disabled:opacity-50"
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
                          <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Comisión %</label>
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
                          <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Descuento cliente %</label>
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
                    <div className="mt-4 pt-4 border-t border-background/5 space-y-3">
                      {creador.nicho && <p className="text-xs text-muted-foreground">Nicho: <span className="text-primary">{creador.nicho}</span></p>}
                      {creador.bio && <p className="text-xs text-muted-foreground italic">"{creador.bio}"</p>}
                      {creador.notas_internas && <p className="text-xs text-warning bg-warning/5 p-2 rounded">Notas internas: {creador.notas_internas}</p>}
                      <div className="p-3 rounded-lg bg-background/5 border border-border space-y-2">
                        <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-bold">Capabilities (ver docs/RED_INTERCAMBIO_LEGAL.md)</p>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            defaultChecked={creador.capabilities?.puede_retirar !== false}
                            id={`retiro-${creador.id}`}
                          />
                          Puede solicitar liquidación de comisiones
                        </label>
                        <div className="flex items-center gap-2 text-xs">
                          <span>Tope mensual CLP:</span>
                          <input
                            type="number"
                            id={`tope-${creador.id}`}
                            defaultValue={Number(creador.capabilities?.tope_retiro_mensual ?? 500000)}
                            className="input-field text-sm"
                            style={{ width: 120 }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            const puede = (document.getElementById(`retiro-${creador.id}`) as HTMLInputElement)?.checked ?? true;
                            const tope = Number((document.getElementById(`tope-${creador.id}`) as HTMLInputElement)?.value ?? 500000);
                            updateCapabilities(creador.id, { puede_retirar: puede, tope_retiro_mensual: tope });
                          }}
                        >
                          Guardar capabilities
                        </button>
                      </div>
                      <p className="text-[0.6rem] text-muted-foreground">Registrado: {new Date(creador.created_at).toLocaleDateString('es-CL')}</p>
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
            <TrendingUp size={18} className="text-accent" />
            <h3 className="font-display text-lg">Ranking de Creadores</h3>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">Sin datos de ranking aún.</p>
            ) : (
              ranking.map(r => (
                <div
                  key={r.id}
                  className={`p-4 rounded-xl flex items-center justify-between transition-all ${
                    r.ranking <= 3
                      ? 'bg-accent/15/20 border border-accent/20'
                      : 'bg-background/[0.03] border border-foreground/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      r.ranking === 1 ? 'bg-accent text-foreground' :
                      r.ranking === 2 ? 'bg-secondary text-foreground' :
                      r.ranking === 3 ? 'bg-card text-foreground' :
                      'bg-background/5 text-muted-foreground'
                    }`}>
                      #{r.ranking}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-primary">{r.nombre_publico}</p>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-[0.65rem] text-muted-foreground font-mono">{r.codigo_ref}</span>
                        <span className="text-[0.65rem]">{plataformaIcon[r.plataforma] || '🌐'}</span>
                        <span className="text-[0.65rem] text-muted-foreground">{r.seguidores_aprox?.toLocaleString() || 0} seg.</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">${Number(r.total_comisiones || 0).toLocaleString('es-CL')}</p>
                    <p className="text-[0.6rem] text-muted-foreground">{r.total_usos_codigo} usos</p>
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
            <DollarSign size={18} className="text-accent" />
            <h3 className="font-display text-lg">Solicitudes de Retiro</h3>
            <span className="badge badge-gold">{retiros.filter(r => r.estado === 'pendiente').length} Pendientes</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {retiros.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">No hay solicitudes de retiro pendientes.</p>
            ) : (
              retiros.map(retiro => (
                <div
                  key={retiro.id}
                  className="p-4 rounded-xl bg-background/[0.03] border border-foreground/[0.06] hover:border-accent/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-sm text-primary">{retiro.creadores?.nombre_publico || 'Desconocido'}</p>
                      <p className="text-xs text-muted-foreground font-mono">{retiro.creadores?.codigo_ref}</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-sm font-bold text-accent">${Number(retiro.monto_solicitado).toLocaleString('es-CL')}</span>
                        <span className="text-xs text-muted-foreground">Vía: {retiro.metodo_pago}</span>
                      </div>
                      {retiro.datos_pago && (
                        <p className="text-[0.65rem] text-muted-foreground mt-1 bg-background/5 p-2 rounded font-mono">
                          {JSON.stringify(retiro.datos_pago)}
                        </p>
                      )}
                      <p className="text-[0.6rem] text-muted-foreground mt-1">{new Date(retiro.created_at).toLocaleDateString('es-CL')}</p>
                    </div>

                    {retiro.estado === 'pendiente' && (
                      <div className="flex gap-2">
                        <button
                          disabled={actionLoading === retiro.id}
                          onClick={() => updateRetiroEstado(retiro.id, 'aprobado', retiro.monto_solicitado)}
                          className="btn btn-sm bg-success/10 text-success hover:bg-success hover:text-foreground transition-all disabled:opacity-50"
                        >
                          {actionLoading === retiro.id ? <Loader2 className="animate-spin" size={14} /> : <><Check size={14} /> Aprobar</>}
                        </button>
                        <button
                          disabled={actionLoading === retiro.id}
                          onClick={() => updateRetiroEstado(retiro.id, 'rechazado')}
                          className="btn btn-sm bg-destructive/10 text-destructive hover:bg-destructive hover:text-foreground transition-all disabled:opacity-50"
                        >
                          <X size={14} /> Rechazar
                        </button>
                      </div>
                    )}

                    {retiro.estado !== 'pendiente' && (
                      <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                        retiro.estado === 'aprobado' ? 'bg-success/10 text-success' :
                        retiro.estado === 'pagado' ? 'bg-surface-raised text-foreground' :
                        'bg-destructive/10 text-destructive'
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
