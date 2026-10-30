'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Radio,
  TrendingUp,
  Users,
  Wallet,
  RefreshCw,
  Wifi,
  WifiOff,
  Filter,
  Package,
  PauseCircle,
  PlayCircle,
  Edit3,
  Eye,
} from 'lucide-react';
import { friendlyError, toast, formatCLP } from '@enjambre/ui';
import { supabase } from '@/lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ViewShell } from '@/components/layout/ViewShell';
import { EnjTableShell } from '@/components/layout/EnjTableShell';
import { ImmersiveModal } from '@enjambre/ui';

interface VentaFeriaRow {
  id: string;
  vendedor_id: string | null;
  total: number | null;
  metodo_pago: string | null;
  estado: string | null;
  created_at: string | null;
  participante_evento_id: string | null;
  productos: Array<{ producto_id: string; nombre?: string; cantidad: number; precio_unitario?: number }> | null;
}

interface VendedorLookup {
  id: string;
  full_name: string;
  email: string;
}

interface ProductoLookup {
  id: string;
  nombre: string;
}

interface EventoRow {
  id: string;
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: string;
  pausada_hasta: string | null;
  meta: { meta_ventas?: number; meta_ingresos?: number } | null;
}

interface ConsignacionRow {
  producto_id: string;
  cantidad_entregada: number;
  cantidad_vendida: number;
  cantidad_devuelta: number;
}

interface FeriaMonitorData {
  ventas: VentaFeriaRow[];
  vendedores: Record<string, VendedorLookup>;
  productos: Record<string, ProductoLookup>;
  eventos: EventoRow[];
  consignaciones: ConsignacionRow[];
}

const EMPTY_DATA: FeriaMonitorData = { ventas: [], vendedores: {}, productos: {}, eventos: [], consignaciones: [] };

const METODO_PAGO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  pos_terminal: 'POS Físico',
  mixto: 'Mixto',
  debit: 'Débito',
  debito: 'Débito',
};

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function formatTotal(n: number | null): string {
  return formatCLP(n ?? 0);
}

function resolveItems(
  productos: Array<{ producto_id: string; nombre?: string; cantidad: number; precio_unitario?: number }> | null,
  productosLookup: Record<string, ProductoLookup>,
): Array<{ nombre: string; cantidad: number; precio: number }> {
  if (!productos) return [];
  return productos.map((p) => ({
    nombre: p.nombre ?? productosLookup[p.producto_id]?.nombre ?? p.producto_id.slice(0, 8) + '…',
    cantidad: p.cantidad,
    precio: p.precio_unitario ?? 0,
  }));
}

export function FeriaMonitorView() {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [selectedEventoId, setSelectedEventoId] = useState<string | 'all'>('all');
  const [detailVenta, setDetailVenta] = useState<VentaFeriaRow | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery<FeriaMonitorData>({
    queryKey: ['feria-monitor', selectedEventoId],
    queryFn: async (): Promise<FeriaMonitorData> => {
      // 1. Ventas feria (últimas 200, filtradas por evento si hay selección)
      let ventasQuery = supabase
        .from('ventas')
        .select('id, vendedor_id, total, metodo_pago, estado, created_at, participante_evento_id, productos')
        .eq('origen', 'feria')
        .order('created_at', { ascending: false })
        .limit(200);

      if (selectedEventoId !== 'all') {
        ventasQuery = ventasQuery.eq('participante_evento_id', selectedEventoId);
      }

      const { data: ventasRaw, error: e1 } = await ventasQuery;
      if (e1) throw e1;
      const ventas = (ventasRaw as VentaFeriaRow[]) ?? [];

      // 2. Vendedores únicos
      const vendedorIds = Array.from(new Set(ventas.map((v) => v.vendedor_id).filter((id): id is string => id !== null)));
      const vendedores: Record<string, VendedorLookup> = {};
      if (vendedorIds.length) {
        const { data: profilesRaw } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', vendedorIds);
        for (const p of (profilesRaw as VendedorLookup[]) ?? []) {
          vendedores[p.id] = { id: p.id, full_name: p.full_name ?? '—', email: p.email ?? '' };
        }
      }

      // 3. Productos únicos en productos
      const productoIds = Array.from(
        new Set(ventas.flatMap((v) => (v.productos as Array<{ producto_id: string }> | null)?.map((i) => i.producto_id) ?? [])),
      );
      const productos: Record<string, ProductoLookup> = {};
      if (productoIds.length) {
        const { data: prodsRaw } = await supabase
          .from('productos')
          .select('id, nombre')
          .in('id', productoIds);
        for (const p of (prodsRaw as ProductoLookup[]) ?? []) {
          productos[p.id] = { id: p.id, nombre: p.nombre };
        }
      }

      // 4. Eventos activos/programados para dropdown
      const { data: eventosRaw } = await supabase
        .from('eventos')
        .select('id, nombre, fecha_inicio, fecha_fin, estado, pausada_hasta, meta')
        .in('estado', ['Programada', 'En curso'])
        .order('fecha_inicio', { ascending: false });
      const eventos = (eventosRaw as EventoRow[]) ?? [];

      // 5. Consignaciones del evento seleccionado (para stock restante)
      const consignaciones: ConsignacionRow[] = [];
      if (selectedEventoId !== 'all') {
        const { data: consRaw } = await supabase
          .from('participante_consignacion')
          .select('producto_id, cantidad_entregada, cantidad_vendida, cantidad_devuelta')
          .eq('evento_id', selectedEventoId);
        consignaciones.push(...((consRaw as ConsignacionRow[]) ?? []));
      }

      return { ventas, vendedores, productos, eventos, consignaciones };
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const monitor = data ?? EMPTY_DATA;

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('feria-monitor-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ventas' },
        (payload: { new: { origen?: string; participante_evento_id?: string } }) => {
          if (payload.new.origen !== 'feria') return;
          if (selectedEventoId !== 'all' && payload.new.participante_evento_id !== selectedEventoId) return;
          queryClient.invalidateQueries({ queryKey: ['feria-monitor', selectedEventoId] });
        },
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ventas' }, () => {
        queryClient.invalidateQueries({ queryKey: ['feria-monitor', selectedEventoId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['feria-monitor', selectedEventoId] });
      })
      .subscribe((status: string) => {
        setRealtimeStatus(status === 'SUBSCRIBED' ? 'live' : status === 'CHANNEL_ERROR' ? 'offline' : 'connecting');
      });

    return () => supabase.removeChannel(channel);
  }, [queryClient, selectedEventoId]);

  // KPIs computados
  const now = new Date().getTime();
  const last24h = useMemo(() => {
    return monitor.ventas.filter((v) => {
      if (!v.created_at) return false;
      return now - new Date(v.created_at).getTime() < 24 * 60 * 60 * 1000;
    });
  }, [monitor.ventas, now]);

  const totalIngresos = last24h.reduce((sum, v) => sum + (v.total ?? 0), 0);
  const vendedoresActivos = new Set(last24h.map((v) => v.vendedor_id).filter((id): id is string => id !== null)).size;
  const ticketPromedio = last24h.length ? totalIngresos / last24h.length : 0;
  const porMetodo = last24h.reduce<Record<string, number>>((acc, v) => {
    const m = v.metodo_pago ?? 'otro';
    acc[m] = (acc[m] ?? 0) + 1;
    return acc;
  }, {});

  // Stock consignado restante (solo si hay evento seleccionado)
  const stockRestante = useMemo(() => {
    if (selectedEventoId === 'all' || !monitor.consignaciones.length) return null;
    const map = new Map<string, { entregado: number; vendido: number; devuelto: number }>();
    for (const c of monitor.consignaciones) {
      const cur = map.get(c.producto_id) ?? { entregado: 0, vendido: 0, devuelto: 0 };
      cur.entregado += c.cantidad_entregada;
      cur.vendido += c.cantidad_vendida;
      cur.devuelto += c.cantidad_devuelta;
      map.set(c.producto_id, cur);
    }
    const arr = Array.from(map.entries()).map(([pid, v]) => ({
      producto_id: pid,
      nombre: monitor.productos[pid]?.nombre ?? pid,
      entregado: v.entregado,
      pendiente: Math.max(0, v.entregado - v.vendido - v.devuelto),
      vendido: v.vendido,
      devuelto: v.devuelto,
    }));
    return arr;
  }, [monitor.consignaciones, monitor.productos]);

  // Meta del evento seleccionado
  const metaEvento = selectedEventoId !== 'all'
    ? monitor.eventos.find((e) => e.id === selectedEventoId)?.meta
    : null;

  const ventasRecientes = monitor.ventas.slice(0, 50);

  // Mutations admin
  const pauseMut = useMutation({
    mutationFn: async ({ eventoId, pausarHasta }: { eventoId: string; pausarHasta?: string }) => {
      const res = await apiFetch(`/api/rep-ventas/admin/feria/${eventoId}/pause`, {
        method: 'POST',
        body: JSON.stringify({ pausar_hasta: pausarHasta }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast('Feria pausada', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['feria-monitor'] });
    },
    onError: (e) => toast(friendlyError(e, 'No se pudo pausar la feria'), { type: 'error' }),
  });

  const resumeMut = useMutation({
    mutationFn: async (eventoId: string) => {
      const res = await apiFetch(`/api/rep-ventas/admin/feria/${eventoId}/resume`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast('Feria reanudada', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['feria-monitor'] });
    },
    onError: (e) => toast(friendlyError(e, 'No se pudo reanudar la feria'), { type: 'error' }),
  });

  const metaMut = useMutation({
    mutationFn: async ({ eventoId, meta }: { eventoId: string; meta: { meta_ventas?: number; meta_ingresos?: number } }) => {
      const res = await apiFetch(`/api/rep-ventas/admin/feria/${eventoId}/meta`, {
        method: 'PATCH',
        body: JSON.stringify(meta),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast('Meta actualizada', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['feria-monitor'] });
    },
    onError: (e) => toast(friendlyError(e, 'No se pudo actualizar meta'), { type: 'error' }),
  });

  useEffect(() => {
    if (error) toast(friendlyError(error, 'No se pudo cargar el monitor de feria'), { type: 'error' });
  }, [error]);

  const handlePause = (evento: EventoRow) => {
    const hasta = prompt('Pausar hasta (ISO datetime, ej: 2026-07-12T20:00:00-04:00). Vacío = indefinida:');
    if (hasta === null) return;
    pauseMut.mutate({ eventoId: evento.id, pausarHasta: hasta || undefined });
  };

  const handleResume = (eventoId: string) => {
    if (confirm('Reanudar ventas para esta feria?')) resumeMut.mutate(eventoId);
  };

  const handleMetaEdit = (evento: EventoRow) => {
    const ventas = prompt('Meta de ventas (unidades):', String(evento.meta?.meta_ventas ?? ''));
    const ingresos = prompt('Meta de ingresos ($):', String(evento.meta?.meta_ingresos ?? ''));
    if (ventas === null || ingresos === null) return;
    metaMut.mutate({
      eventoId: evento.id,
      meta: {
        meta_ventas: ventas ? parseInt(ventas, 10) : undefined,
        meta_ingresos: ingresos ? parseInt(ingresos, 10) : undefined,
      },
    });
  };

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Operaciones en Terreno"
        title="Monitor de Feria"
        subtitle="Observación en vivo de ventas en feria"
        actions={
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-colors ${
                realtimeStatus === 'live'
                  ? 'bg-success/10 text-success border-success/30'
                  : realtimeStatus === 'offline'
                    ? 'bg-destructive/10 text-destructive border-destructive/30'
                    : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {realtimeStatus === 'offline' ? <WifiOff size={14} /> : <Wifi size={14} />}
                {realtimeStatus === 'live' && (
                  <div className="absolute inset-0 rounded-full bg-success/40 animate-ping" />
                )}
              </div>
              {realtimeStatus === 'live' ? 'En vivo' : realtimeStatus === 'offline' ? 'Sin señal' : 'Conectando'}
            </span>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-border hover:border-accent/50 text-muted-foreground hover:text-accent transition-colors"
              title="Refrescar"
              disabled={isFetching}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      {/* Filtro por evento + KPI meta */}
      <div className="card animate-in delay-1">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Filter size={14} />
              <span>Evento:</span>
            </label>
            <select
              value={selectedEventoId}
              onChange={(e) => setSelectedEventoId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 min-w-[280px]"
            >
              <option value="all">Todas las ferias activas</option>
              {monitor.eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nombre} ({ev.estado}) {ev.pausada_hasta && new Date(ev.pausada_hasta) > new Date() ? '⏸' : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedEventoId !== 'all' && metaEvento && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Meta ventas: <span className="font-semibold text-foreground">{metaEvento.meta_ventas ?? '—'}</span></span>
              <span>Meta ingresos: <span className="font-semibold text-foreground">{formatTotal(metaEvento.meta_ingresos ?? null)}</span></span>
              <button
                onClick={() => {
                  const ev = monitor.eventos.find((e) => e.id === selectedEventoId);
                  if (ev) handleMetaEdit(ev);
                }}
                className="btn btn-ghost btn-sm"
              >
                <Edit3 size={12} className="mr-1" /> Editar meta
              </button>
            </div>
          )}
        </div>
        {selectedEventoId !== 'all' && stockRestante && stockRestante.length && (
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Package size={14} />
                <span>Stock consignado restante</span>
              </div>
              <span className="text-xs text-muted-foreground">{stockRestante.length} productos</span>
            </div>
            <EnjTableShell>
              <table className="enj-table text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Producto</th>
                    <th className="text-right">Entregado</th>
                    <th className="text-right">Vendido</th>
                    <th className="text-right">Devuelto</th>
                    <th className="text-right font-semibold">Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {stockRestante.map((s) => (
                    <tr key={s.producto_id}>
                      <td className="text-foreground">{s.nombre}</td>
                      <td className="text-right tabular-nums">{s.entregado}</td>
                      <td className="text-right tabular-nums">{s.vendido}</td>
                      <td className="text-right tabular-nums">{s.devuelto}</td>
                      <td className={`text-right tabular-nums font-semibold ${s.pendiente <= 5 ? 'text-destructive' : s.pendiente <= 20 ? 'text-warning' : 'text-success'}`}>
                        {s.pendiente}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </EnjTableShell>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="stats-grid">
        {[
          { icon: <Wallet size={20} />, val: formatTotal(totalIngresos), label: 'Ingresos (24h)', accent: totalIngresos > 0 },
          { icon: <ShoppingBag size={20} />, val: String(last24h.length), label: 'Ventas (24h)', accent: last24h.length > 0 },
          { icon: <Users size={20} />, val: String(vendedoresActivos), label: 'Vendedores activos' },
          { icon: <TrendingUp size={20} />, val: formatTotal(Math.round(ticketPromedio)), label: 'Ticket promedio' },
        ].map((s, i) => (
          <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
            <div className="stat-header"><div className="stat-icon">{s.icon}</div></div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid-2-1">
        {/* Feed realtime */}
        <div className="card animate-in delay-2">
          <div className="section-header">
            <div>
              <div className="section-title flex items-center gap-2">
                <Radio size={18} className={realtimeStatus === 'live' ? 'text-success animate-pulse' : 'text-muted-foreground'} />
                Feed de ventas
              </div>
              <div className="section-subtitle">
                {monitor.ventas.length} venta(s) con origen feria {selectedEventoId !== 'all' ? `en evento seleccionado` : ''}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Cargando ventas…</div>
          ) : ventasRecientes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag size={20} className="opacity-50" />
              </div>
              Sin ventas en feria registradas.
              <br />
              Cuando un rep_ventas registre una venta en Campo POS, aparecerá aquí en tiempo real.
            </div>
          ) : (
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
              <AnimatePresence initial={false}>
                {ventasRecientes.map((v) => {
                  const vendedor = v.vendedor_id ? monitor.vendedores[v.vendedor_id] : null;
                  const itemsResolved = resolveItems(
                    v.productos as Array<{ producto_id: string; nombre?: string; cantidad: number; precio_unitario?: number }> | null,
                    monitor.productos
                  );
                  const itemsText = itemsResolved.map((i) => `${i.cantidad}x ${i.nombre}`).join(', ');

                  return (
                    <motion.div
                      key={v.id}
                      layout
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="group cursor-pointer bg-surface border border-border hover:border-accent/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                      onClick={() => setDetailVenta(v)}
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {vendedor?.full_name ?? 'Sin vendedor'}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                              v.estado === 'completada'
                                ? 'bg-success/10 text-success'
                                : v.estado === 'pendiente'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {v.estado ?? '—'}
                          </span>
                        </div>
                        <span className="font-bold text-base text-foreground tabular-nums">
                          {formatTotal(v.total)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-3 max-w-[85%] truncate" title={itemsText}>
                        {itemsText}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Wallet size={12} />
                            {v.metodo_pago ? (METODO_PAGO_LABEL[v.metodo_pago] ?? v.metodo_pago) : '—'}
                          </span>
                          <span className="flex items-center gap-1 text-success">
                            <Wifi size={12} />
                            synced
                          </span>
                        </div>
                        <span className="tabular-nums opacity-60 flex items-center gap-1">
                          <Eye size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          {timeAgo(v.created_at)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Sidebar: método de pago + vendedores + controles feria */}
        <div className="flex flex-col gap-6">
          <div className="card animate-in delay-3">
            <div className="section-header"><div className="section-title">Por método de pago (24h)</div></div>
            <div className="space-y-3 p-4">
              {Object.keys(porMetodo).length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">Sin ventas en 24h.</p>
              )}
              {Object.entries(porMetodo)
                .sort(([, a], [, b]) => b - a)
                .map(([metodo, count]) => {
                  const pct = last24h.length > 0 ? Math.round((count / last24h.length) * 100) : 0;
                  return (
                    <div key={metodo}>
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="text-foreground">{METODO_PAGO_LABEL[metodo] ?? metodo}</span>
                        <span className="text-muted-foreground tabular-nums">{count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="card animate-in delay-4">
            <div className="section-header">
              <div className="section-title">Vendedores activos (24h)</div>
              <div className="section-subtitle">{vendedoresActivos} rep_ventas con ventas recientes</div>
            </div>
            <div className="p-4 space-y-2">
              {vendedoresActivos === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">Sin vendedores con actividad reciente.</p>
              )}
              {(() => {
                const ventasPorVendedor = new Map<string, { count: number; total: number }>();
                for (const v of monitor.ventas) {
                  if (!v.vendedor_id) continue;
                  const cur = ventasPorVendedor.get(v.vendedor_id) ?? { count: 0, total: 0 };
                  cur.count += 1;
                  cur.total += v.total ?? 0;
                  ventasPorVendedor.set(v.vendedor_id, cur);
                }
                return Array.from(ventasPorVendedor.entries())
                  .map(([id, stat]) => ({ id, nombre: monitor.vendedores[id]?.full_name ?? '—', ...stat }))
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 8)
                  .map((v, i) => (
                    <div
                      key={v.id}
                      className={`flex items-center justify-between p-3 rounded-sm ${
                        i === 0 ? 'bg-accent/10 border border-accent/25' : 'bg-transparent border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground tabular-nums w-5">{i + 1}</span>
                        <span className="text-sm text-foreground font-medium truncate">{v.nombre}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold tabular-nums">{formatTotal(v.total)}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">{v.count} ventas</div>
                      </div>
                    </div>
                  ));
              })()}
            </div>
          </div>

          {/* Controles feria (solo si hay evento seleccionado) */}
          {selectedEventoId !== 'all' && (() => {
            const ev = monitor.eventos.find((e) => e.id === selectedEventoId);
            if (!ev) return null;
            const isPaused = ev.pausada_hasta && new Date(ev.pausada_hasta) > new Date();
            return (
              <div className="card animate-in delay-5 border-accent/25">
                <div className="section-header">
                  <div className="section-title flex items-center gap-2">
                    {isPaused ? <PauseCircle size={18} className="text-warning" /> : <PlayCircle size={18} className="text-success" />}
                    Control de feria: {ev.nombre}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">Estado:</span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${
                      isPaused
                        ? 'bg-warning/10 text-warning border-warning/30'
                        : 'bg-success/10 text-success border-success/30'
                    }`}>
                      {isPaused
                        ? `PAUSADA ${ev.pausada_hasta ? `hasta ${new Date(ev.pausada_hasta).toLocaleString()}` : '(indefinida)'}`
                        : 'ACTIVA'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {isPaused ? (
                      <button
                        onClick={() => handleResume(ev.id)}
                        disabled={resumeMut.isPending}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        {resumeMut.isPending ? 'Reanudando…' : 'Reanudar ventas'}
                        <PlayCircle size={14} className="ml-1" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePause(ev)}
                        disabled={pauseMut.isPending}
                        className="btn btn-warning btn-sm flex-1"
                      >
                        {pauseMut.isPending ? 'Pausando…' : 'Pausar ventas'}
                        <PauseCircle size={14} className="ml-1" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Drawer detalle venta */}
      <ImmersiveModal
        open={!!detailVenta}
        onClose={() => setDetailVenta(null)}
        eyebrow="Detalle de venta"
        title={detailVenta ? `Venta ${detailVenta.id.slice(0, 8)}…` : ''}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setDetailVenta(null)}>Cerrar</button>
          </>
        }
      >
        {detailVenta && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground block">Vendedor</span> <span className="font-medium">{monitor.vendedores[detailVenta.vendedor_id!]?.full_name ?? '—'}</span></div>
              <div><span className="text-muted-foreground block">Método</span> <span className="font-medium">{detailVenta.metodo_pago ? METODO_PAGO_LABEL[detailVenta.metodo_pago] : '—'}</span></div>
              <div><span className="text-muted-foreground block">Estado</span> <span className="font-medium">{detailVenta.estado ?? '—'}</span></div>
              <div><span className="text-muted-foreground block">Fecha</span> <span className="font-medium">{detailVenta.created_at ? new Date(detailVenta.created_at).toLocaleString() : '—'}</span></div>
              <div className="sm:col-span-2"><span className="text-muted-foreground block">Total</span> <span className="text-xl font-bold">{formatTotal(detailVenta.total)}</span></div>
              <div className="sm:col-span-2"><span className="text-muted-foreground block">Sync</span> <span className="font-medium text-success">Online (confirmado)</span></div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="font-medium mb-2">Items</div>
              <EnjTableShell>
                <table className="enj-table text-sm">
                  <thead><tr><th className="text-left">Producto</th><th className="text-right">Cant.</th><th className="text-right">Precio unit.</th><th className="text-right">Subtotal</th></tr></thead>
                  <tbody>
                    {resolveItems(detailVenta.productos as Array<{ producto_id: string; nombre?: string; cantidad: number; precio_unitario?: number }> | null, monitor.productos).map((item, i) => (
                      <tr key={i}>
                        <td className="text-foreground">{item.nombre}</td>
                        <td className="text-right tabular-nums">{item.cantidad}</td>
                        <td className="text-right tabular-nums">{formatTotal(item.precio)}</td>
                        <td className="text-right tabular-nums font-medium">{formatTotal(item.precio * item.cantidad)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </EnjTableShell>
            </div>
          </div>
        )}
      </ImmersiveModal>
    </div>
  );
}