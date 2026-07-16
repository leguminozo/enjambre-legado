'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast, ViewLoading } from '@enjambre/ui';
import { Calendar, Package, ClipboardCheck, Loader2, AlertTriangle, Tent } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';

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
  cantidad_entregada: number;
  cantidad_vendida: number;
  cantidad_devuelta: number;
  productos?: { nombre: string } | null;
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: c } = await supabase
          .from('participante_contrato')
          .select('id, tipo, estado, comision_base_pct, bono_puntualidad_clp, score_confianza')
          .eq('user_id', user.id)
          .eq('estado', 'activo')
          .maybeSingle();

        if (!c) {
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

        setEventos((evs ?? []) as EventoRow[]);

        const eventoIds = (evs ?? []).map((e: { id: string }) => e.id);
        if (eventoIds.length > 0) {
          const { data: cons } = await supabase
            .from('participante_consignacion')
            .select('id, evento_id, cantidad_entregada, cantidad_vendida, cantidad_devuelta, productos(nombre), participante_evento(nombre_evento, estado)')
            .in('evento_id', eventoIds);
          setConsignaciones((cons ?? []) as unknown as ConsignacionRow[]);
        }
      } catch (err) {
        toast(friendlyError(err, 'Error al cargar'), { type: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      const { data: cons } = await supabase
        .from('participante_consignacion')
        .select('id, evento_id, cantidad_entregada, cantidad_vendida, cantidad_devuelta, productos(nombre), participante_evento(nombre_evento, estado)')
        .in('evento_id', eventos.map((e) => e.id));
      setConsignaciones((cons ?? []) as unknown as ConsignacionRow[]);
    } catch (err) {
      toast(friendlyError(err, 'Error al registrar devolución'), { type: 'error' });
    } finally {
      setDevolucionLoading(null);
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
      toast('Arqueo registrado. El admin revisará diferencias.', { type: 'success' });
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
    return <ViewLoading variant="view" label="Mi feria" hideLabel />;
  }

  if (!contrato) {
    return (
      <div className="text-center py-20 space-y-4">
        <Calendar size={40} className="mx-auto text-muted-foreground opacity-40" />
        <p className="text-lg font-display">Sin contrato de feria activo</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Si participas en ferias como prestador independiente, el admin debe activar tu contrato primero.
        </p>
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

      <div className="p-4 rounded-xl bg-muted/30 border border-border text-xs flex gap-2">
        <AlertTriangle size={14} className="shrink-0" />
        <span>
          Prestación de servicios independiente. Los incentivos se liquidan con honorarios sujetos a revisión.
          No constituye relación laboral.
        </span>
      </div>

      <div className="card">
        <h2 className="font-display text-lg flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-accent" /> Mis eventos
        </h2>
        {eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Sin eventos programados.</p>
        ) : (
          <div className="space-y-2">
            {eventos.map((e) => (
              <div key={e.id} className="p-3 rounded-lg border border-border text-sm">
                <p className="font-medium">{e.nombre_evento}</p>
                <p className="text-xs text-muted-foreground">{e.estado}{e.ubicacion ? ` · ${e.ubicacion}` : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-display text-lg flex items-center gap-2 mb-4">
          <Package size={18} className="text-accent" /> Stock consignado
        </h2>
        <p className="text-xs text-muted-foreground mb-3">Unidades pendientes de rendir: <strong>{stockPendiente}</strong></p>
        {consignaciones.map((c) => {
          const pendiente = pendienteConsignacion(c);
          const enCurso = c.participante_evento?.estado === 'en_curso';
          return (
            <div key={c.id} className="text-sm py-2 border-b border-border last:border-0 space-y-2">
              <div className="flex justify-between gap-3">
                <span>{c.productos?.nombre}</span>
                <span className="font-mono text-xs shrink-0">
                  {c.cantidad_vendida}/{c.cantidad_entregada} vend · {c.cantidad_devuelta} dev · {pendiente} pend
                </span>
              </div>
              {enCurso && pendiente > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={pendiente}
                    className="input-field text-xs w-20"
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
                    className="btn btn-outline btn-sm"
                    disabled={devolucionLoading === c.id}
                    onClick={() => registerDevolucion(c.id, pendiente)}
                  >
                    {devolucionLoading === c.id ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      'Devolver a almacén'
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="font-display text-lg flex items-center gap-2 mb-4">
          <ClipboardCheck size={18} className="text-accent" /> Cierre de arqueo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select className="input-field text-sm" value={arqueoEventoId} onChange={(e) => setArqueoEventoId(e.target.value)}>
            <option value="">Evento a cerrar...</option>
            {eventos.filter((e) => e.estado === 'en_curso').map((e) => (
              <option key={e.id} value={e.id}>{e.nombre_evento}</option>
            ))}
          </select>
          <input type="number" className="input-field text-sm" placeholder="Stock teórico"
            value={arqueoForm.stock_teorico || ''} onChange={(e) => setArqueoForm({ ...arqueoForm, stock_teorico: Number(e.target.value) })} />
          <input type="number" className="input-field text-sm" placeholder="Stock contado"
            value={arqueoForm.stock_contado || ''} onChange={(e) => setArqueoForm({ ...arqueoForm, stock_contado: Number(e.target.value) })} />
          <input type="number" className="input-field text-sm" placeholder="Efectivo teórico CLP"
            value={arqueoForm.efectivo_teorico || ''} onChange={(e) => setArqueoForm({ ...arqueoForm, efectivo_teorico: Number(e.target.value) })} />
          <input type="number" className="input-field text-sm" placeholder="Efectivo contado CLP"
            value={arqueoForm.efectivo_contado || ''} onChange={(e) => setArqueoForm({ ...arqueoForm, efectivo_contado: Number(e.target.value) })} />
          <textarea className="input-field text-sm md:col-span-2" placeholder="Notas del cierre"
            value={arqueoForm.notas} onChange={(e) => setArqueoForm({ ...arqueoForm, notas: e.target.value })} />
        </div>
        <button type="button" className="btn btn-primary btn-sm mt-4" onClick={submitArqueo} disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" size={14} /> : 'Registrar arqueo'}
        </button>
      </div>
    </div>
  );
}