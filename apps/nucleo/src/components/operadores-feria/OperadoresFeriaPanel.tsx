'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast, ViewLoading, ImmersiveModal } from '@enjambre/ui';
import {
  Calendar, Package, ClipboardCheck, FileText, Loader2,
  Plus, Check, X, Users, Wallet, AlertTriangle,
} from 'lucide-react';
import { CONTRATO_TERMINOS_VERSION, CONTRATO_TERMINOS_ACK } from './constants';
import {
  feriaContratoEstadoForUser,
  FERIA_CONTRATO_ESTADO_LABEL,
  repNecesitaContratoFeriaActivo,
} from './feria-contrato-status';
import { useSearchParams } from 'next/navigation';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { EnjTableShell } from '@/components/layout/EnjTableShell';

type Tab = 'contratos' | 'eventos' | 'consignacion' | 'arqueos' | 'ledger';

interface ContratoRow {
  id: string;
  user_id: string;
  tipo: string;
  estado: string;
  comision_base_pct: number;
  bono_puntualidad_clp: number;
  honorario_fijo_mensual: number;
  score_confianza: number;
  tope_stock_consignado: number;
  notas_internas: string | null;
  profiles?: { full_name: string; email: string } | null;
}

interface EventoRow {
  id: string;
  contrato_id: string;
  nombre_evento: string;
  ubicacion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: string;
  participante_contrato?: { user_id: string; profiles?: { full_name: string } | null } | null;
}

interface ConsignacionRow {
  id: string;
  evento_id: string;
  producto_id: string | null;
  cantidad_entregada: number;
  cantidad_vendida: number;
  cantidad_devuelta: number;
  productos?: { nombre: string } | null;
  participante_evento?: { nombre_evento: string; estado: string } | null;
}

interface ArqueoRow {
  id: string;
  evento_id: string;
  stock_teorico: number;
  stock_contado: number;
  efectivo_teorico: number;
  efectivo_contado: number;
  diferencia_stock: number;
  diferencia_efectivo: number;
  cerrado_at: string | null;
  participante_evento?: { nombre_evento: string } | null;
}

interface LedgerRow {
  id: string;
  user_id: string;
  participante_tipo: string;
  tipo: string;
  monto: number;
  estado: string;
  origen_tabla: string;
  created_at: string;
}

interface IncentivoLedgerRow {
  id: string;
  user_id: string;
  tipo: string;
  monto: number;
  estado: string;
  referencia_tabla: string | null;
  referencia_id: string | null;
  notas: string | null;
  created_at: string;
}

interface RepOption {
  id: string;
  full_name: string;
  email: string;
}

interface ProductoOption {
  id: string;
  nombre: string;
}

export function OperadoresFeriaPanel() {
  const searchParams = useSearchParams();
  const apiFetch = useApiFetch();
  const [tab, setTab] = useState<Tab>('contratos');
  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState<ContratoRow[]>([]);
  const [eventos, setEventos] = useState<EventoRow[]>([]);
  const [consignaciones, setConsignaciones] = useState<ConsignacionRow[]>([]);
  const [arqueos, setArqueos] = useState<ArqueoRow[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [incentivoLedger, setIncentivoLedger] = useState<IncentivoLedgerRow[]>([]);
  const [honorarioModal, setHonorarioModal] = useState<{
    ledgerId: string;
    userName: string;
    monto: number;
    fecha: string;
    tercero_rut: string;
    tercero_nombre: string;
    numero_bhe: string;
  } | null>(null);
  const [reps, setReps] = useState<RepOption[]>([]);
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showContratoForm, setShowContratoForm] = useState(false);
  const [contratoForm, setContratoForm] = useState({
    user_id: '',
    tipo: 'feria' as const,
    comision_base_pct: 10,
    bono_puntualidad_clp: 0,
    honorario_fijo_mensual: 0,
    tope_stock_consignado: 50,
    notas_internas: '',
  });

  const [showEventoForm, setShowEventoForm] = useState(false);
  const [eventoForm, setEventoForm] = useState({
    contrato_id: '',
    nombre_evento: '',
    ubicacion: '',
    fecha_inicio: '',
    fecha_fin: '',
  });

  const [consignacionForm, setConsignacionForm] = useState({
    evento_id: '',
    producto_id: '',
    cantidad_entregada: 1,
  });

  const [ledgerForm, setLedgerForm] = useState({
    user_id: '',
    tipo: 'honorario_feria' as const,
    monto: 0,
    evento_id: '',
    notas: '',
  });

  const [activateTerms, setActivateTerms] = useState<Record<string, boolean>>({});
  const [devolucionQty, setDevolucionQty] = useState<Record<string, number>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, eRes, gRes, aRes, lRes, ilRes, rRes, pRes] = await Promise.all([
        supabase
          .from('participante_contrato')
          .select('*, profiles!participante_contrato_profiles_fkey(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('participante_evento')
          .select('*, participante_contrato(user_id, profiles!participante_contrato_profiles_fkey(full_name))')
          .order('fecha_inicio', { ascending: false })
          .limit(100),
        supabase
          .from('participante_consignacion')
          .select('*, productos(nombre), participante_evento(nombre_evento, estado)')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('participante_arqueo')
          .select('*, participante_evento(nombre_evento)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('incentivo_unificado_view')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(80),
        supabase
          .from('incentivo_ledger')
          .select('id, user_id, tipo, monto, estado, referencia_tabla, referencia_id, notas, created_at')
          .in('participante_tipo', ['operador_feria', 'rep_ventas'])
          .order('created_at', { ascending: false })
          .limit(80),
        supabase.from('profiles').select('id, full_name, email').eq('role', 'rep_ventas').limit(200),
        supabase.from('productos').select('id, nombre').order('nombre').limit(200),
      ]);

      if (cRes.data) setContratos(cRes.data as ContratoRow[]);
      if (eRes.data) setEventos(eRes.data as EventoRow[]);
      if (gRes.data) setConsignaciones(gRes.data as ConsignacionRow[]);
      if (aRes.data) setArqueos(aRes.data as ArqueoRow[]);
      if (lRes.data) setLedger(lRes.data as LedgerRow[]);
      if (ilRes.data) setIncentivoLedger(ilRes.data as IncentivoLedgerRow[]);
      if (rRes.data) setReps(rRes.data as RepOption[]);
      if (pRes.data) setProductos(pRes.data as ProductoOption[]);
    } catch (err) {
      console.error(err);
      toast(friendlyError(err, 'Error al cargar operadores feria'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const repId = searchParams.get('rep');
    if (!repId) return;
    setTab('contratos');
    setShowContratoForm(true);
    setContratoForm((prev) => ({ ...prev, user_id: repId }));
  }, [searchParams]);

  const repsPendientesFeria = reps.filter((r) => repNecesitaContratoFeriaActivo(contratos, r.id));

  const startCreateContratoForRep = (userId: string) => {
    setTab('contratos');
    setShowContratoForm(true);
    setContratoForm((prev) => ({ ...prev, user_id: userId }));
  };

  const createContrato = async () => {
    if (!contratoForm.user_id) {
      toast('Selecciona un operador', { type: 'error' });
      return;
    }
    const estadoActual = feriaContratoEstadoForUser(contratos, contratoForm.user_id);
    if (estadoActual === 'activo' || estadoActual === 'borrador') {
      toast('Este operador ya tiene contrato activo o borrador', { type: 'error' });
      return;
    }
    setActionLoading('new-contrato');
    try {
      const { error } = await supabase.from('participante_contrato').insert({
        user_id: contratoForm.user_id,
        tipo: contratoForm.tipo,
        estado: 'borrador',
        comision_base_pct: contratoForm.comision_base_pct,
        bono_puntualidad_clp: contratoForm.bono_puntualidad_clp,
        honorario_fijo_mensual: contratoForm.honorario_fijo_mensual,
        tope_stock_consignado: contratoForm.tope_stock_consignado,
        notas_internas: contratoForm.notas_internas || null,
      });
      if (error) throw error;
      toast('Contrato creado en borrador', { type: 'success' });
      setShowContratoForm(false);
      await fetchAll();
    } catch (err) {
      toast(friendlyError(err, 'Error al crear contrato'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const activateContrato = async (id: string) => {
    if (!activateTerms[id]) {
      toast('Debes confirmar la firma offline del contrato', { type: 'error' });
      return;
    }
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('participante_contrato')
        .update({
          estado: 'activo',
          acepto_terminos_at: new Date().toISOString(),
          acepto_terminos_version: CONTRATO_TERMINOS_VERSION,
        })
        .eq('id', id);
      if (error) throw error;
      toast('Contrato activado', { type: 'success' });
      await fetchAll();
    } catch (err) {
      const msg = (err as { message?: string })?.message;
      if (msg?.includes('TERMS_NOT_ACCEPTED')) {
        toast('Faltan términos de aceptación', { type: 'error' });
      } else {
        toast(friendlyError(err, 'Error al activar'), { type: 'error' });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const suspendContrato = async (id: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('participante_contrato')
        .update({ estado: 'suspendido' })
        .eq('id', id);
      if (error) throw error;
      toast('Contrato suspendido', { type: 'success' });
      await fetchAll();
    } catch (err) {
      toast(friendlyError(err, 'Error al suspender'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const createEvento = async () => {
    if (!eventoForm.contrato_id || !eventoForm.nombre_evento) {
      toast('Contrato y nombre de evento son obligatorios', { type: 'error' });
      return;
    }
    setActionLoading('new-evento');
    try {
      const { error } = await supabase.from('participante_evento').insert({
        contrato_id: eventoForm.contrato_id,
        nombre_evento: eventoForm.nombre_evento,
        ubicacion: eventoForm.ubicacion || null,
        fecha_inicio: eventoForm.fecha_inicio || null,
        fecha_fin: eventoForm.fecha_fin || null,
        estado: 'programado',
      });
      if (error) throw error;
      toast('Evento programado', { type: 'success' });
      setShowEventoForm(false);
      await fetchAll();
    } catch (err) {
      toast(friendlyError(err, 'Error al crear evento'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const startEvento = async (id: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase.from('participante_evento').update({ estado: 'en_curso' }).eq('id', id);
      if (error) throw error;
      toast('Evento en curso', { type: 'success' });
      await fetchAll();
    } catch (err) {
      toast(friendlyError(err, 'Error'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const pendienteConsignacion = (g: ConsignacionRow) =>
    g.cantidad_entregada - g.cantidad_vendida - g.cantidad_devuelta;

  const registerDevolucion = async (consignacionId: string) => {
    const cantidad = devolucionQty[consignacionId] ?? 1;
    if (cantidad <= 0) {
      toast('Cantidad inválida', { type: 'error' });
      return;
    }
    setActionLoading(`dev-${consignacionId}`);
    try {
      const { data, error } = await supabase.rpc('registrar_devolucion_consignacion_feria', {
        p_consignacion_id: consignacionId,
        p_cantidad: cantidad,
        p_reponer_almacen: true,
      });
      if (error) throw error;
      const result = (data ?? {}) as { pendiente_restante?: number; stock_almacen?: number };
      const stockMsg =
        result.stock_almacen != null ? ` · Stock almacén: ${result.stock_almacen}` : '';
      toast(`Devolución registrada${stockMsg}`, { type: 'success' });
      setDevolucionQty((prev) => ({ ...prev, [consignacionId]: 1 }));
      await fetchAll();
    } catch (err) {
      toast(friendlyError(err, 'Error en devolución'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const addConsignacion = async () => {
    if (!consignacionForm.evento_id || !consignacionForm.producto_id) {
      toast('Evento y producto requeridos', { type: 'error' });
      return;
    }
    setActionLoading('consignacion');
    try {
      const { data, error } = await supabase.rpc('registrar_consignacion_feria', {
        p_evento_id: consignacionForm.evento_id,
        p_producto_id: consignacionForm.producto_id,
        p_cantidad: consignacionForm.cantidad_entregada,
      });
      if (error) throw error;
      const result = (data ?? {}) as { stock_restante?: number; merged?: boolean };
      const stockMsg =
        result.stock_restante != null ? ` · Stock almacén: ${result.stock_restante}` : '';
      toast(
        `Consignación registrada${result.merged ? ' (unificada)' : ''}${stockMsg}`,
        { type: 'success' },
      );
      setConsignacionForm((prev) => ({ ...prev, cantidad_entregada: 1 }));
      await fetchAll();
    } catch (err) {
      toast(friendlyError(err, 'Error en consignación'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const registerHonorario = async () => {
    if (!ledgerForm.user_id || ledgerForm.monto <= 0) {
      toast('Operador y monto requeridos', { type: 'error' });
      return;
    }
    setActionLoading('ledger');
    try {
      const contrato = contratos.find((c) => c.user_id === ledgerForm.user_id && c.estado === 'activo');
      const { error } = await supabase.from('incentivo_ledger').insert({
        user_id: ledgerForm.user_id,
        participante_tipo: 'operador_feria',
        tipo: ledgerForm.tipo,
        monto: ledgerForm.monto,
        estado: 'pendiente',
        evento_id: ledgerForm.evento_id || null,
        contrato_id: contrato?.id ?? null,
        notas: ledgerForm.notas || 'Honorario feria — requiere revisión y boleta antes de pago',
      });
      if (error) throw error;
      toast('Registro en ledger creado (pendiente de aprobación)', { type: 'success' });
      await fetchAll();
    } catch (err) {
      toast(friendlyError(err, 'Error en ledger'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const operadorDisplayName = (userId: string) => {
    const rep = reps.find((r) => r.id === userId);
    if (rep?.full_name || rep?.email) return rep.full_name || rep.email;
    const contrato = contratos.find((c) => c.user_id === userId);
    return contrato?.profiles?.full_name || contrato?.profiles?.email || userId;
  };

  const openHonorarioModal = (row: IncentivoLedgerRow) => {
    const nombre = operadorDisplayName(row.user_id);
    setHonorarioModal({
      ledgerId: row.id,
      userName: nombre,
      monto: row.monto,
      fecha: new Date().toISOString().slice(0, 10),
      tercero_rut: '',
      tercero_nombre: nombre,
      numero_bhe: '',
    });
  };

  const prepararHonorarioSii = async () => {
    if (!honorarioModal) return;
    if (!honorarioModal.tercero_rut.trim() || !honorarioModal.tercero_nombre.trim()) {
      toast('RUT y nombre del prestador son obligatorios', { type: 'error' });
      return;
    }
    setActionLoading(`hon-${honorarioModal.ledgerId}`);
    try {
      const res = await apiFetch('/api/sii/honorarios/desde-ledger', {
        method: 'POST',
        body: JSON.stringify({
          ledger_id: honorarioModal.ledgerId,
          fecha: honorarioModal.fecha,
          tercero_rut: honorarioModal.tercero_rut.trim(),
          tercero_nombre: honorarioModal.tercero_nombre.trim(),
          numero_bhe: honorarioModal.numero_bhe.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Error al preparar honorario');
      }
      toast('Honorario registrado en módulo SII — revisar en Impuestos antes de declarar F29', { type: 'success' });
      setHonorarioModal(null);
      await fetchAll();
    } catch (err) {
      toast(friendlyError(err, 'Error al preparar honorario SII'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const approveLedger = async (id: string) => {
    setActionLoading(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('incentivo_ledger')
        .update({ estado: 'aprobado', aprobado_por: user?.id, aprobado_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast('Incentivo aprobado — emitir boleta honorarios antes de marcar pagado', { type: 'success' });
      await fetchAll();
    } catch (err) {
      toast(friendlyError(err, 'Error'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'contratos', label: 'Contratos', icon: <Users size={16} /> },
    { key: 'eventos', label: 'Eventos', icon: <Calendar size={16} /> },
    { key: 'consignacion', label: 'Consignación', icon: <Package size={16} /> },
    { key: 'arqueos', label: 'Arqueos', icon: <ClipboardCheck size={16} /> },
    { key: 'ledger', label: 'Ledger', icon: <Wallet size={16} /> },
  ];

  if (loading) {
    return <ViewLoading variant="view" label="Red de feria" hideLabel />;
  }

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        variant="compact"
        eyebrow="Red de intercambio"
        title="Operadores de Feria"
        subtitle="Contratos de prestación independiente, consignación, arqueo e incentivos. Sin órdenes de trabajo."
        icon={<Calendar size={22} />}
      />

      <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-xs text-muted-foreground flex gap-2">
        <AlertTriangle size={16} className="text-warning shrink-0" />
        <span>
          Los honorarios requieren revisión humana y boleta de honorarios antes de pago (retención art. 42 N°2).
          Ver <code className="text-accent">docs/RED_INTERCAMBIO_LEGAL.md</code>.
        </span>
      </div>

      <ResponsiveTabBar
        layoutId="feria-tabs"
        tabs={tabs.map((t) => ({
          id: t.key,
          label: t.label,
          icon: t.icon,
        }))}
        activeId={tab}
        onChange={(id) => setTab(id as Tab)}
      />

      {tab === 'contratos' && (
        <div className="card space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <h3 className="font-display text-lg">Contratos</h3>
            <div className="flex items-center gap-2">
              {repsPendientesFeria.length > 0 && (
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-warning/15 text-warning">
                  {repsPendientesFeria.length} rep{repsPendientesFeria.length === 1 ? '' : 's'} sin contrato activo
                </span>
              )}
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowContratoForm(true)}>
                <Plus size={14} /> Nuevo contrato
              </button>
            </div>
          </div>

          {repsPendientesFeria.length > 0 && (
            <div className="p-4 rounded-xl border border-warning/25 bg-warning/5 space-y-3">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                <span>
                  Estos <code className="text-accent">rep_ventas</code> pueden operar caja y comisiones sin contrato feria activo.
                  Sin contrato no hay consignación, arqueo ni trazabilidad de honorarios.
                </span>
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {repsPendientesFeria.map((r) => {
                  const estado = feriaContratoEstadoForUser(contratos, r.id);
                  return (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-background/50 border border-border text-sm">
                      <div>
                        <span className="font-medium">{r.full_name || r.email}</span>
                        <span className="text-[0.65rem] text-muted-foreground ml-2">
                          {FERIA_CONTRATO_ESTADO_LABEL[estado]}
                        </span>
                      </div>
                      {(estado === 'sin_contrato' || estado === 'suspendido' || estado === 'terminado') && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => startCreateContratoForRep(r.id)}
                        >
                          Crear contrato
                        </button>
                      )}
                      {estado === 'borrador' && (
                        <span className="text-[0.65rem] text-muted-foreground italic">Activa el borrador abajo</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-[520px] overflow-y-auto">
            {contratos.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sin contratos.</p>
            ) : (
              contratos.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-sm">{c.profiles?.full_name || c.user_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.tipo} · {c.comision_base_pct}% comisión · Score {c.score_confianza}
                    </p>
                    <span className={`text-[0.6rem] uppercase font-bold px-2 py-0.5 rounded ${
                      c.estado === 'activo' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}>{c.estado}</span>
                  </div>
                  {c.estado === 'borrador' && (
                    <div className="space-y-2 max-w-md">
                      <label className="flex items-start gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activateTerms[c.id] ?? false}
                          onChange={(e) => setActivateTerms({ ...activateTerms, [c.id]: e.target.checked })}
                        />
                        <span>{CONTRATO_TERMINOS_ACK}</span>
                      </label>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => activateContrato(c.id)}
                        disabled={actionLoading === c.id}>
                        <Check size={14} /> Activar
                      </button>
                    </div>
                  )}
                  {c.estado === 'activo' && (
                    <button type="button" className="btn btn-outline btn-sm text-destructive" onClick={() => suspendContrato(c.id)}>
                      <X size={14} /> Suspender
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'eventos' && (
        <div className="card space-y-4">
          <div className="flex justify-between">
            <h3 className="font-display text-lg">Eventos</h3>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowEventoForm(true)}>
              <Plus size={14} /> Programar
            </button>
          </div>
          <div className="space-y-2">
            {eventos.map((e) => (
              <div key={e.id} className="p-4 rounded-xl border border-border flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{e.nombre_evento}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.participante_contrato?.profiles?.full_name} · {e.estado}
                    {e.fecha_inicio ? ` · ${e.fecha_inicio}` : ''}
                  </p>
                </div>
                {e.estado === 'programado' && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => startEvento(e.id)}>Iniciar</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'consignacion' && (
        <div className="card space-y-4">
          <h3 className="font-display text-lg">Consignación de stock</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select className="input-field text-sm" value={consignacionForm.evento_id}
              onChange={(e) => setConsignacionForm({ ...consignacionForm, evento_id: e.target.value })}>
              <option value="">Evento en curso...</option>
              {eventos.filter((e) => e.estado === 'en_curso').map((e) => (
                <option key={e.id} value={e.id}>{e.nombre_evento}</option>
              ))}
            </select>
            <select className="input-field text-sm" value={consignacionForm.producto_id}
              onChange={(e) => setConsignacionForm({ ...consignacionForm, producto_id: e.target.value })}>
              <option value="">Producto...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            <input type="number" min={1} className="input-field text-sm" value={consignacionForm.cantidad_entregada}
              onChange={(e) => setConsignacionForm({ ...consignacionForm, cantidad_entregada: Number(e.target.value) })} />
            <button type="button" className="btn btn-primary btn-sm" onClick={addConsignacion}>Registrar entrega</button>
          </div>
          <div className="space-y-2">
            {consignaciones.map((g) => {
              const pendiente = pendienteConsignacion(g);
              const eventoAbierto = g.participante_evento?.estado !== 'cerrado';
              return (
                <div key={g.id} className="p-3 rounded-lg border border-border text-sm space-y-2">
                  <div className="flex justify-between gap-3">
                    <span>{g.participante_evento?.nombre_evento} — {g.productos?.nombre}</span>
                    <span className="font-mono text-xs shrink-0">
                      {g.cantidad_vendida}/{g.cantidad_entregada} vend · {g.cantidad_devuelta} dev · {pendiente} pend
                    </span>
                  </div>
                  {eventoAbierto && pendiente > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={pendiente}
                        className="input-field text-xs w-20"
                        value={devolucionQty[g.id] ?? 1}
                        onChange={(e) =>
                          setDevolucionQty((prev) => ({
                            ...prev,
                            [g.id]: Math.min(pendiente, Math.max(1, Number(e.target.value) || 1)),
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={actionLoading === `dev-${g.id}`}
                        onClick={() => registerDevolucion(g.id)}
                      >
                        {actionLoading === `dev-${g.id}` ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          'Registrar devolución'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'arqueos' && (
        <div className="card space-y-4">
          <h3 className="font-display text-lg">Arqueos cerrados</h3>
          <p className="text-xs text-muted-foreground">Los operadores registran arqueo desde Mi Feria. Aquí ves el historial.</p>
          {arqueos.map((a) => (
            <div key={a.id} className="p-4 rounded-xl border border-border text-sm">
              <p className="font-medium">{a.participante_evento?.nombre_evento}</p>
              <p className="text-xs mt-1">
                Stock Δ {a.diferencia_stock} · Efectivo Δ ${Number(a.diferencia_efectivo).toLocaleString('es-CL')}
              </p>
              {a.cerrado_at && (
                <p className="text-[0.65rem] text-muted-foreground mt-1">
                  Cerrado {new Date(a.cerrado_at).toLocaleString('es-CL')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'ledger' && (
        <div className="card space-y-4">
          <h3 className="font-display text-lg">Ledger unificado de incentivos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted/20 rounded-xl">
            <select className="input-field text-sm" value={ledgerForm.user_id}
              onChange={(e) => setLedgerForm({ ...ledgerForm, user_id: e.target.value })}>
              <option value="">Operador...</option>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>{r.full_name}</option>
              ))}
            </select>
            <select className="input-field text-sm" value={ledgerForm.tipo}
              onChange={(e) => setLedgerForm({ ...ledgerForm, tipo: e.target.value as 'honorario_feria' })}>
              <option value="honorario_feria">Honorario feria</option>
              <option value="bono_puntualidad">Bono puntualidad</option>
              <option value="bono_volumen">Bono volumen</option>
            </select>
            <input type="number" className="input-field text-sm" placeholder="Monto CLP" value={ledgerForm.monto || ''}
              onChange={(e) => setLedgerForm({ ...ledgerForm, monto: Number(e.target.value) })} />
            <button type="button" className="btn btn-primary btn-sm" onClick={registerHonorario}>Registrar (pendiente)</button>
          </div>
          <EnjTableShell caption="Desliza horizontalmente para ver todas las columnas">
            <table className="data-table text-sm w-full">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Origen</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((row) => (
                  <tr key={`${row.origen_tabla}-${row.id}`}>
                    <td>{new Date(row.created_at).toLocaleDateString('es-CL')}</td>
                    <td>{row.tipo}</td>
                    <td>${Number(row.monto).toLocaleString('es-CL')}</td>
                    <td>{row.estado}</td>
                    <td className="text-xs">{row.origen_tabla}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </EnjTableShell>

          <div className="border-t border-border pt-4 space-y-3">
            <h4 className="font-display text-sm">Honorarios feria → SII</h4>
            <p className="text-xs text-muted-foreground">
              Flujo: pendiente → aprobar → preparar honorario (retención F29). No emite DTE automáticamente.
            </p>
            <EnjTableShell caption="Desliza horizontalmente para ver todas las columnas">
              <table className="data-table text-sm w-full">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Operador</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>SII</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {incentivoLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted-foreground italic py-4">
                        Sin registros en incentivo_ledger
                      </td>
                    </tr>
                  ) : (
                    incentivoLedger.map((row) => {
                      const bridged = row.referencia_tabla === 'honorarios' && row.referencia_id;
                      return (
                        <tr key={row.id}>
                          <td>{new Date(row.created_at).toLocaleDateString('es-CL')}</td>
                          <td className="text-xs">{operadorDisplayName(row.user_id)}</td>
                          <td>{row.tipo}</td>
                          <td>${Number(row.monto).toLocaleString('es-CL')}</td>
                          <td>{row.estado}</td>
                          <td className="text-xs">{bridged ? 'En honorarios' : '—'}</td>
                          <td className="space-x-1 whitespace-nowrap">
                            {row.estado === 'pendiente' && (
                              <button type="button" className="btn btn-ghost btn-sm" onClick={() => approveLedger(row.id)}>
                                Aprobar
                              </button>
                            )}
                            {row.estado === 'aprobado' && !bridged && (
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => openHonorarioModal(row)}
                              >
                                Preparar SII
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </EnjTableShell>
          </div>

        </div>
      )}

      <ImmersiveModal
        open={showContratoForm}
        onClose={() => setShowContratoForm(false)}
        eyebrow="Operadores feria"
        title="Nuevo contrato"
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowContratoForm(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-gold btn-sm"
              onClick={createContrato}
              disabled={actionLoading === 'new-contrato'}
            >
              {actionLoading === 'new-contrato' ? <Loader2 className="animate-spin" size={14} /> : 'Crear borrador'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Operador</label>
            <select
              className="input-field text-sm w-full"
              value={contratoForm.user_id}
              onChange={(e) => setContratoForm({ ...contratoForm, user_id: e.target.value })}
            >
              <option value="">Operador (rep_ventas)...</option>
              {reps.map((r) => {
                const estado = feriaContratoEstadoForUser(contratos, r.id);
                const suffix = estado === 'activo' ? ' · contrato activo' : estado === 'borrador' ? ' · borrador' : '';
                return (
                  <option key={r.id} value={r.id}>
                    {r.full_name || r.email}{suffix}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Tipo</label>
            <select
              className="input-field text-sm w-full"
              value={contratoForm.tipo}
              onChange={(e) => setContratoForm({ ...contratoForm, tipo: e.target.value as 'feria' })}
            >
              <option value="feria">Feria</option>
              <option value="evento">Evento</option>
              <option value="popup">Pop-up</option>
            </select>
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">% comisión base</label>
            <input
              type="number"
              className="input-field text-sm w-full"
              value={contratoForm.comision_base_pct}
              onChange={(e) => setContratoForm({ ...contratoForm, comision_base_pct: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Bono puntualidad CLP</label>
            <input
              type="number"
              className="input-field text-sm w-full"
              value={contratoForm.bono_puntualidad_clp}
              onChange={(e) => setContratoForm({ ...contratoForm, bono_puntualidad_clp: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Honorario fijo mensual CLP</label>
            <input
              type="number"
              className="input-field text-sm w-full"
              value={contratoForm.honorario_fijo_mensual}
              onChange={(e) => setContratoForm({ ...contratoForm, honorario_fijo_mensual: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Tope stock consignado</label>
            <input
              type="number"
              className="input-field text-sm w-full"
              value={contratoForm.tope_stock_consignado}
              onChange={(e) => setContratoForm({ ...contratoForm, tope_stock_consignado: Number(e.target.value) })}
            />
          </div>
        </div>
      </ImmersiveModal>

      <ImmersiveModal
        open={showEventoForm}
        onClose={() => setShowEventoForm(false)}
        eyebrow="Operadores feria"
        title="Programar evento"
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowEventoForm(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-gold btn-sm" onClick={createEvento}>
              Guardar evento
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Contrato activo</label>
            <select
              className="input-field text-sm w-full"
              value={eventoForm.contrato_id}
              onChange={(e) => setEventoForm({ ...eventoForm, contrato_id: e.target.value })}
            >
              <option value="">Contrato activo...</option>
              {contratos.filter((c) => c.estado === 'activo').map((c) => (
                <option key={c.id} value={c.id}>{c.profiles?.full_name} — {c.tipo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Nombre evento</label>
            <input
              className="input-field text-sm w-full"
              value={eventoForm.nombre_evento}
              onChange={(e) => setEventoForm({ ...eventoForm, nombre_evento: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Ubicación</label>
            <input
              className="input-field text-sm w-full"
              value={eventoForm.ubicacion}
              onChange={(e) => setEventoForm({ ...eventoForm, ubicacion: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Fecha inicio</label>
            <input
              type="date"
              className="input-field text-sm w-full"
              value={eventoForm.fecha_inicio}
              onChange={(e) => setEventoForm({ ...eventoForm, fecha_inicio: e.target.value })}
            />
          </div>
        </div>
      </ImmersiveModal>

      <ImmersiveModal
        open={Boolean(honorarioModal)}
        onClose={() => setHonorarioModal(null)}
        eyebrow="SII · Honorarios"
        title={honorarioModal ? `Preparar honorario — ${honorarioModal.userName}` : 'Preparar honorario'}
        size="md"
        footer={
          honorarioModal ? (
            <>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHonorarioModal(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={actionLoading === `hon-${honorarioModal.ledgerId}`}
                onClick={prepararHonorarioSii}
              >
                {actionLoading === `hon-${honorarioModal.ledgerId}` ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  'Registrar en SII'
                )}
              </button>
            </>
          ) : undefined
        }
      >
        {honorarioModal && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Monto: <span className="font-medium text-foreground">${honorarioModal.monto.toLocaleString('es-CL')}</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Fecha</label>
                <input
                  type="date"
                  className="input-field text-sm w-full"
                  value={honorarioModal.fecha}
                  onChange={(e) => setHonorarioModal({ ...honorarioModal, fecha: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">RUT prestador</label>
                <input
                  className="input-field text-sm w-full"
                  placeholder="Requerido"
                  value={honorarioModal.tercero_rut}
                  onChange={(e) => setHonorarioModal({ ...honorarioModal, tercero_rut: e.target.value })}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Nombre prestador</label>
                <input
                  className="input-field text-sm w-full"
                  value={honorarioModal.tercero_nombre}
                  onChange={(e) => setHonorarioModal({ ...honorarioModal, tercero_nombre: e.target.value })}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">N° boleta honorarios</label>
                <input
                  className="input-field text-sm w-full"
                  placeholder="Opcional"
                  value={honorarioModal.numero_bhe}
                  onChange={(e) => setHonorarioModal({ ...honorarioModal, numero_bhe: e.target.value })}
                  autoComplete="off"
                />
              </div>
            </div>
            <p className="text-[0.65rem] text-muted-foreground">
              Retención 15,25% por defecto · alimenta línea 61 F29 vía tabla honorarios
            </p>
          </div>
        )}
      </ImmersiveModal>
    </div>
  );
}