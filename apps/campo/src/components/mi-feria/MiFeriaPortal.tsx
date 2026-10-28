'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@enjambre/auth';
import { friendlyError, toast, ViewLoading, parseIntegerCLP } from '@enjambre/ui';
import {
  Calendar,
  Package,
  ClipboardCheck,
  Loader2,
  Tent,
  Store,
  ShieldCheck,
  FileText,
  X,
  CheckCircle,
  UtensilsCrossed,
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { getNucleoApiUrl } from '@/lib/public-urls';

interface ContratoRow {
  id: string;
  tipo: string;
  estado: string;
  comision_base_pct: number;
  bono_puntualidad_clp: number;
  score_confianza: number;
}

interface EventoRow {
  id: string;
  nombre_evento: string;
  ubicacion: string | null;
  fecha_inicio: string | null;
  estado: string;
}

interface ConsignacionRow {
  id: string;
  evento_id: string;
  producto_id?: string;
  cantidad_entregada: number;
  cantidad_vendida: number;
  cantidad_devuelta: number;
  productos?: { id?: string; nombre: string } | null;
  participante_evento?: { nombre_evento: string; estado: string } | null;
}

export function MiFeriaPortal() {
  const [loading, setLoading] = useState(true);
  const [contrato, setContrato] = useState<ContratoRow | null>(null);
  const [eventos, setEventos] = useState<EventoRow[]>([]);
  const [consignaciones, setConsignaciones] = useState<ConsignacionRow[]>([]);
  const [arqueoEventoId, setArqueoEventoId] = useState('');
  const [arqueoForm, setArqueoForm] = useState({
    stock_teorico: 0,
    stock_contado: 0,
    efectivo_teorico: 0,
    efectivo_contado: 0,
    notas: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [devolucionQty, setDevolucionQty] = useState<Record<string, number>>({});
  const [devolucionLoading, setDevolucionLoading] = useState<string | null>(null);

  // Estados para Salvoconducto DTE 52 y Merma / Degustación
  const [salvoconductoEvento, setSalvoconductoEvento] = useState<EventoRow | null>(null);
  const [mermaModalOpen, setMermaModalOpen] = useState(false);
  const [mermaTargetConsignacion, setMermaTargetConsignacion] = useState<ConsignacionRow | null>(null);
  const [mermaForm, setMermaForm] = useState<{
    cantidad: number;
    motivo: 'degustacion' | 'rotura_transporte';
    notas: string;
  }>({
    cantidad: 1,
    motivo: 'degustacion',
    notas: '',
  });
  const [mermaSubmitting, setMermaSubmitting] = useState(false);

  const authUser = useAuthStore((s) => s.user);
  const authSession = useAuthStore((s) => s.session);

  const reloadConsignaciones = async (eventoIds: string[]) => {
    if (eventoIds.length === 0) return;
    const { data: cons } = await supabase
      .from('participante_consignacion')
      .select('id, evento_id, producto_id, cantidad_entregada, cantidad_vendida, cantidad_devuelta, productos(id, nombre), participante_evento(nombre_evento, estado)')
      .in('evento_id', eventoIds);
    setConsignaciones((cons ?? []) as unknown as ConsignacionRow[]);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadContrato() {
      setLoading(true);
      try {
        const userId = authUser?.id ?? (await supabase.auth.getUser()).data.user?.id;
        if (!userId) {
          if (!cancelled) setLoading(false);
          return;
        }

        const { data: c } = await supabase
          .from('participante_contrato')
          .select('id, tipo, estado, comision_base_pct, bono_puntualidad_clp, score_confianza')
          .eq('user_id', userId)
          .eq('estado', 'activo')
          .maybeSingle();

        if (cancelled) return;

        if (!c) {
          setContrato(null);
          setLoading(false);
          return;
        }

        setContrato(c as ContratoRow);

        const { data: evs } = await supabase
          .from('participante_evento')
          .select('id, nombre_evento, ubicacion, fecha_inicio, estado')
          .eq('contrato_id', c.id)
          .in('estado', ['programado', 'en_curso'])
          .order('fecha_inicio', { ascending: true });

        if (cancelled) return;
        setEventos((evs ?? []) as EventoRow[]);

        const eventoIds = (evs ?? []).map((e: { id: string }) => e.id);
        if (eventoIds.length > 0) {
          const { data: cons } = await supabase
            .from('participante_consignacion')
            .select('id, evento_id, producto_id, cantidad_entregada, cantidad_vendida, cantidad_devuelta, productos(id, nombre), participante_evento(nombre_evento, estado)')
            .in('evento_id', eventoIds);

          if (!cancelled) {
            setConsignaciones((cons ?? []) as unknown as ConsignacionRow[]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          toast(friendlyError(err, 'Error al cargar puesto de feria'), { type: 'error' });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadContrato();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  const pendienteConsignacion = (c: ConsignacionRow) =>
    c.cantidad_entregada - c.cantidad_vendida - c.cantidad_devuelta;

  const registerDevolucion = async (consignacionId: string, pendiente: number) => {
    const cantidad = devolucionQty[consignacionId] ?? 1;
    if (cantidad <= 0 || cantidad > pendiente) {
      toast('Cantidad inválida', { type: 'error' });
      return;
    }
    setDevolucionLoading(consignacionId);
    try {
      const { error } = await supabase.rpc('registrar_devolucion_consignacion_feria', {
        p_consignacion_id: consignacionId,
        p_cantidad: cantidad,
        p_reponer_almacen: true,
      });
      if (error) throw error;
      toast('Devolución registrada — stock repuesto en almacén', { type: 'success' });
      setDevolucionQty((prev) => ({ ...prev, [consignacionId]: 1 }));
      await reloadConsignaciones(eventos.map((e) => e.id));
    } catch (err) {
      toast(friendlyError(err, 'Error al registrar devolución'), { type: 'error' });
    } finally {
      setDevolucionLoading(null);
    }
  };

  const handleRegistrarMerma = async () => {
    if (!mermaTargetConsignacion) return;
    const prodId = mermaTargetConsignacion.producto_id || mermaTargetConsignacion.productos?.id;
    if (!prodId) {
      toast('Identificador de producto no encontrado', { type: 'error' });
      return;
    }
    const maxQty = pendienteConsignacion(mermaTargetConsignacion);
    if (mermaForm.cantidad <= 0 || mermaForm.cantidad > maxQty) {
      toast(`Cantidad debe estar entre 1 y ${maxQty}`, { type: 'error' });
      return;
    }

    setMermaSubmitting(true);
    try {
      const API_BASE = getNucleoApiUrl();
      const token = authSession?.access_token || (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('No hay sesión activa');

      const res = await fetch(`${API_BASE}/api/rep-ventas/merma`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          producto_id: prodId,
          cantidad: mermaForm.cantidad,
          motivo: mermaForm.motivo,
          notas: mermaForm.notas.trim() || undefined,
          evento_id: mermaTargetConsignacion.evento_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al registrar merma ferial');
      }

      toast(
        mermaForm.motivo === 'degustacion'
          ? 'Degustación ferial registrada (Gasto promocional Art. 31 LIR)'
          : 'Merma por rotura registrada (Art. 8 letra d Ley de IVA)',
        { type: 'success' },
      );
      setMermaModalOpen(false);
      setMermaTargetConsignacion(null);
      setMermaForm({ cantidad: 1, motivo: 'degustacion', notas: '' });
      await reloadConsignaciones(eventos.map((e) => e.id));
    } catch (err) {
      toast(friendlyError(err, 'Error al registrar merma o degustación'), { type: 'error' });
    } finally {
      setMermaSubmitting(false);
    }
  };

  const submitArqueo = async () => {
    if (!arqueoEventoId) {
      toast('Selecciona un evento', { type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.rpc('cerrar_arqueo_feria', {
        p_evento_id: arqueoEventoId,
        p_stock_teorico: arqueoForm.stock_teorico,
        p_stock_contado: arqueoForm.stock_contado,
        p_efectivo_teorico: arqueoForm.efectivo_teorico,
        p_efectivo_contado: arqueoForm.efectivo_contado,
        p_notas: arqueoForm.notas || null,
        p_cerrado_por: user?.id,
      });
      if (error) throw error;
      toast('Arqueo registrado. El balance ferial será conciliado.', { type: 'success' });
      setArqueoEventoId('');
    } catch (err) {
      const msg = (err as { message?: string })?.message;
      if (msg === 'EVENTO_NO_DISPONIBLE') {
        toast('Evento no disponible para cierre', { type: 'error' });
      } else {
        toast(friendlyError(err, 'Error al cerrar arqueo'), { type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <ViewLoading variant="view" label="Cargando puesto de feria..." />;
  }

  if (!contrato) {
    return (
      <div className="text-center py-20 space-y-4">
        <Calendar size={40} className="mx-auto text-muted-foreground opacity-40" />
        <p className="text-lg font-display">Sin contrato de feria activo</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Si participas en ferias como Agente Comercial independiente, tu contrato de participación debe ser activado para la consignación de stock. Puedes operar tus ventas directas desde el Punto de Venta.
        </p>
        <div className="pt-2">
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 min-h-11 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-sm"
          >
            <Store size={14} />
            <span>Ir al Punto de Venta</span>
          </Link>
        </div>
      </div>
    );
  }

  const stockPendiente = consignaciones.reduce(
    (s, c) => s + (c.cantidad_entregada - c.cantidad_vendida - c.cantidad_devuelta),
    0,
  );

  return (
    <div className="space-y-8 animate-in">
      <ViewShell
        variant="compact"
        eyebrow="Campo · Feria"
        title="Mi Feria"
        subtitle={`Contrato ${contrato.tipo} · ${contrato.comision_base_pct}% comisión · Score ${contrato.score_confianza}`}
        icon={<Tent size={20} />}
      />

      {/* Blindaje Jurídico & Consignación Mercantil */}
      <div className="p-4 rounded-xl bg-card border border-border text-xs space-y-2 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <ShieldCheck size={16} className="text-primary shrink-0" />
          <span>Régimen de Consignación Mercantil y Servicios Independientes</span>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Operación amparada bajo los Artículos 233 y 245 del Código de Comercio. La mercadería en consignación permanece en propiedad de Enjambre Legado SpA para resguardo y comercialización independiente, sin sujeción a horario ni subordinación laboral (Código del Trabajo).
        </p>
        <p className="text-[11px] text-muted-foreground/80 pt-1 border-t border-border/50">
          Traslados respaldados mediante Guía de Despacho Electrónica DTE 52 (Art. 55 D.L. 825). Mermas fortuitas y degustaciones promocionales reguladas conforme al Art. 8 letra d de la Ley de IVA y Art. 31 LIR.
        </p>
      </div>

      {/* Eventos Programados / En Curso */}
      <div className="card">
        <h2 className="font-display text-lg flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-primary" /> Mis eventos
        </h2>
        {eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Sin eventos programados.</p>
        ) : (
          <div className="space-y-2">
            {eventos.map((e) => (
              <div
                key={e.id}
                className="p-3.5 rounded-lg border border-border text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background/50"
              >
                <div>
                  <p className="font-medium text-foreground">{e.nombre_evento}</p>
                  <p className="text-xs text-muted-foreground">
                    Estado: <span className="font-semibold capitalize text-foreground">{e.estado}</span>
                    {e.ubicacion ? ` · ${e.ubicacion}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSalvoconductoEvento(e)}
                  className="inline-flex items-center gap-1.5 self-start sm:self-auto min-h-10 px-3.5 py-1.5 rounded-lg border border-border hover:border-primary/50 text-xs font-medium text-foreground hover:text-primary transition-colors bg-card"
                >
                  <FileText size={14} className="text-primary" />
                  <span>Salvoconducto DTE 52</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock Consignado */}
      <div className="card">
        <h2 className="font-display text-lg flex items-center gap-2 mb-4">
          <Package size={18} className="text-primary" /> Stock consignado
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Unidades pendientes de rendir: <strong className="text-foreground">{stockPendiente}</strong>
        </p>
        {consignaciones.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">No hay lotes en consignación registrados para tus eventos.</p>
        ) : (
          consignaciones.map((c) => {
            const pendiente = pendienteConsignacion(c);
            const enCurso = c.participante_evento?.estado === 'en_curso';
            return (
              <div key={c.id} className="text-sm py-3 border-b border-border last:border-0 space-y-2.5">
                <div className="flex justify-between items-center gap-3">
                  <span className="font-medium text-foreground">{c.productos?.nombre || 'Producto'}</span>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    {c.cantidad_vendida}/{c.cantidad_entregada} vend · {c.cantidad_devuelta} dev · <strong className="text-foreground">{pendiente} pend</strong>
                  </span>
                </div>
                {enCurso && pendiente > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={pendiente}
                        className="input-field w-20 min-h-10 text-xs"
                        value={devolucionQty[c.id] ?? 1}
                        onChange={(e) =>
                          setDevolucionQty((prev) => ({
                            ...prev,
                            [c.id]: Math.min(pendiente, Math.max(1, Number(e.target.value) || 1)),
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
                        disabled={devolucionLoading === c.id}
                        onClick={() => registerDevolucion(c.id, pendiente)}
                      >
                        {devolucionLoading === c.id ? (
                          <Loader2 className="animate-spin" size={13} />
                        ) : (
                          'Devolver a almacén'
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center gap-1.5 justify-center rounded-lg border border-primary/20 bg-primary/5 px-3 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                      onClick={() => {
                        setMermaTargetConsignacion(c);
                        setMermaForm({ cantidad: 1, motivo: 'degustacion', notas: '' });
                        setMermaModalOpen(true);
                      }}
                    >
                      <UtensilsCrossed size={13} />
                      <span>Degustación / Merma (Art. 8d)</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Cierre de Arqueo */}
      <div className="card">
        <h2 className="font-display text-lg flex items-center gap-2 mb-4">
          <ClipboardCheck size={18} className="text-primary" /> Cierre de arqueo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select className="input-field" value={arqueoEventoId} onChange={(e) => setArqueoEventoId(e.target.value)}>
            <option value="">Evento a cerrar...</option>
            {eventos.filter((e) => e.estado === 'en_curso').map((e) => (
              <option key={e.id} value={e.id}>{e.nombre_evento}</option>
            ))}
          </select>
          <input type="text" inputMode="numeric" className="input-field" placeholder="Stock teórico"
            defaultValue={arqueoForm.stock_teorico || ''} onChange={(e) => setArqueoForm({ ...arqueoForm, stock_teorico: parseIntegerCLP(e.target.value) })} />
          <input type="text" inputMode="numeric" className="input-field" placeholder="Stock contado"
            defaultValue={arqueoForm.stock_contado || ''} onChange={(e) => setArqueoForm({ ...arqueoForm, stock_contado: parseIntegerCLP(e.target.value) })} />
          <input type="text" inputMode="numeric" className="input-field" placeholder="Efectivo teórico CLP"
            defaultValue={arqueoForm.efectivo_teorico || ''} onChange={(e) => setArqueoForm({ ...arqueoForm, efectivo_teorico: parseIntegerCLP(e.target.value) })} />
          <input type="text" inputMode="numeric" className="input-field" placeholder="Efectivo contado CLP"
            defaultValue={arqueoForm.efectivo_contado || ''} onChange={(e) => setArqueoForm({ ...arqueoForm, efectivo_contado: parseIntegerCLP(e.target.value) })} />
          <textarea className="input-field md:col-span-2" placeholder="Notas de cierre operativo"
            value={arqueoForm.notas} onChange={(e) => setArqueoForm({ ...arqueoForm, notas: e.target.value })} />
        </div>
        <button
          type="button"
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-xs font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          onClick={submitArqueo}
          disabled={submitting}
        >
          {submitting ? <Loader2 className="animate-spin" size={14} /> : 'Registrar arqueo ferial'}
        </button>
      </div>

      {/* Modal Salvoconducto DTE 52 */}
      {salvoconductoEvento && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setSalvoconductoEvento(null)}
        >
          <div
            className="card max-w-lg w-full p-6 space-y-5 bg-card border border-border rounded-2xl shadow-xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">Salvoconducto de Traslado Mercantil</h3>
                  <p className="text-xs text-muted-foreground">Amparo Guía de Despacho DTE 52 · Traslado de Consignación</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSalvoconductoEvento(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-sunken border border-border text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Mandante / Emisor</span>
                  <span className="font-semibold text-foreground">Enjambre Legado SpA</span>
                  <span className="text-muted-foreground block">RUT: 77.891.234-5</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Agente Consignatario</span>
                  <span className="font-semibold text-foreground">{authUser?.full_name || 'Agente Comercial'}</span>
                  <span className="text-muted-foreground block">{authUser?.email}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-border grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Evento / Destino</span>
                  <span className="font-semibold text-foreground">{salvoconductoEvento.nombre_evento}</span>
                  <span className="text-muted-foreground block">{salvoconductoEvento.ubicacion || 'Puesto Ferial'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Estado de Habilitación</span>
                  <span className="inline-flex items-center gap-1 font-bold text-success text-[11px]">
                    <CheckCircle size={12} /> HABILITADO
                  </span>
                  <span className="text-muted-foreground block text-[10px]">Cód. Ref: {salvoconductoEvento.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border border-border text-[11px] text-muted-foreground leading-relaxed space-y-1.5">
              <p className="font-semibold text-foreground">Declaración Jurada de Tránsito (Art. 55 D.L. 825):</p>
              <p>
                Se certifica a las autoridades policiales (Carabineros de Chile), sanitarias (Seremi de Salud / SAG) y tributarias (Servicio de Impuestos Internos) que la mercadería transportada consiste en productos apícolas envasados de origen silvestre que no constituyen venta ni entrega definitiva, sino traslado interno para consignación mercantil y degustación en el evento indicado.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSalvoconductoEvento(null)}
              className="w-full min-h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal Degustación / Merma */}
      {mermaModalOpen && mermaTargetConsignacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in"
          onClick={() => {
            if (!mermaSubmitting) {
              setMermaModalOpen(false);
              setMermaTargetConsignacion(null);
            }
          }}
        >
          <div
            className="card max-w-md w-full p-6 space-y-4 bg-card border border-border rounded-2xl shadow-xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">Registrar Degustación / Merma</h3>
                  <p className="text-xs text-muted-foreground">Descarga de stock justificada tributariamente (SII)</p>
                </div>
              </div>
              <button
                type="button"
                disabled={mermaSubmitting}
                onClick={() => {
                  setMermaModalOpen(false);
                  setMermaTargetConsignacion(null);
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-surface-sunken border border-border text-xs">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Producto en consignación</span>
              <span className="font-semibold text-foreground text-sm">{mermaTargetConsignacion.productos?.nombre || 'Producto'}</span>
              <span className="text-muted-foreground block text-[11px] mt-0.5">
                Stock disponible para descarga: {pendienteConsignacion(mermaTargetConsignacion)} unidades
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Motivo justificado</label>
                <select
                  className="input-field"
                  value={mermaForm.motivo}
                  disabled={mermaSubmitting}
                  onChange={(e) =>
                    setMermaForm((prev) => ({
                      ...prev,
                      motivo: e.target.value as 'degustacion' | 'rotura_transporte',
                    }))
                  }
                >
                  <option value="degustacion">Degustación ferial / Muestra cliente (Art. 31 LIR)</option>
                  <option value="rotura_transporte">Merma fortuita / Rotura en traslado (Art. 8d Ley IVA)</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Cantidad a descargar</label>
                <input
                  type="number"
                  min={1}
                  max={pendienteConsignacion(mermaTargetConsignacion)}
                  value={mermaForm.cantidad}
                  disabled={mermaSubmitting}
                  onChange={(e) =>
                    setMermaForm((prev) => ({
                      ...prev,
                      cantidad: Math.max(1, Math.min(pendienteConsignacion(mermaTargetConsignacion), Number(e.target.value) || 1)),
                    }))
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Observación o justificación (opcional)</label>
                <textarea
                  rows={2}
                  value={mermaForm.notas}
                  disabled={mermaSubmitting}
                  onChange={(e) => setMermaForm((prev) => ({ ...prev, notas: e.target.value }))}
                  placeholder="Ej: Frasco abierto para cata guiada de miel de Ulmo en mesón ferial..."
                  className="input-field"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                disabled={mermaSubmitting}
                onClick={() => {
                  setMermaModalOpen(false);
                  setMermaTargetConsignacion(null);
                }}
                className="flex-1 min-h-11 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={mermaSubmitting}
                onClick={handleRegistrarMerma}
                className="flex-1 min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-40"
              >
                {mermaSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar Descarga'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}