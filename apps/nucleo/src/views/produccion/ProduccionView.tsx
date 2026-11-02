'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, LoadingOverlay, Button, Label, Input, toast, ImmersiveModal,
  formatCLP, formatCalendarDate,
} from '@enjambre/ui';
import { 
  Package, Layers, PackagePlus, QrCode, Trash2, Edit3, AlertTriangle,
  ChevronDown, ChevronUp, Calculator,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewShell } from '@/components/layout/ViewShell';
import { LoteComercialForm } from '@/components/apicultor/LoteComercialForm';
import { AnalisisLaboratorioPanel } from '@/components/apicultor/AnalisisLaboratorioPanel';
import { LotePasaporteQR } from '@/components/apicultor/LotePasaporteQR';
import { cn } from '@/lib/cn';
import { ProduccionDashboardSkeleton } from '@/components/shared/skeletons';

interface LoteProduccionRow {
  id: string;
  nombre_lote?: string | null;
  codigo?: string;
  kg_total?: number;
  estado?: string | null;
  fecha_envasado?: string | null;
  created_at: string;
  variedad_floral?: string | null;
  metodo_extraccion?: string | null;
  analisis_humedad?: number | null;
  analisis_brix?: number | null;
  colmena_id?: string | null;
  notas?: string | null;
  cosecha_ids?: string[];
}

interface ProductoProduccionRow {
  id: string;
  nombre: string;
  stock?: number;
  peso_neto_g?: number | null;
  formato?: string | null;
  demanda_30d?: number;
  dias_stock_estimado: number;
}

interface ProduccionDashboardData {
  data: {
    lotes: LoteProduccionRow[];
    productos: ProductoProduccionRow[];
    stats: {
      productos_quiebre?: number;
    };
  };
}

interface EmpaqueSugerido {
  id: string;
  nombre: string;
  clase: string;
  stock: number;
  stock_minimo: number;
  unidad: string;
  costo_unitario: number;
  cantidad: number;
  activo: boolean;
}

export function ProduccionView() {
  const [editingLote, setEditingLote] = useState<LoteProduccionRow | null>(null);
  const [envasandoLote, setEnvasandoLote] = useState<LoteProduccionRow | null>(null);
  const [pasaporteLoteId, setPasaporteLoteId] = useState<string | null>(null);
  const [envasarProductoId, setEnvasarProductoId] = useState('');
  const [envasarCantidad, setEnvasarCantidad] = useState('');
  const [envasando, setEnvasando] = useState(false);
  // Triangulación 1: insumos de empaque
  const [empaquesSugeridos, setEmpaquesSugeridos] = useState<EmpaqueSugerido[]>([]);
  const [descontarEmpaques, setDescontarEmpaques] = useState(true);
  const [cantidadesEmpaque, setCantidadesEmpaque] = useState<Record<string, number>>({});
  const [loadingEmpaques, setLoadingEmpaques] = useState(false);
  const [empaquesPanelOpen, setEmpaquesPanelOpen] = useState(false);
  // Eliminación de lote virgen/huérfano
  const [loteAEliminar, setLoteAEliminar] = useState<LoteProduccionRow | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading, isFetching } = useQuery<ProduccionDashboardData>({
    queryKey: ['produccion', 'dashboard'],
    queryFn: async () => {
      const res = await apiFetch('/api/produccion/dashboard');
      if (!res.ok) throw new Error('Error al obtener datos de producción');
      return res.json() as Promise<ProduccionDashboardData>;
    },
  });

  const data = dashboardData?.data || { lotes: [], productos: [], stats: {} };
  const { lotes, productos } = data;
  const totalKgLotes = lotes.reduce((acc, l) => acc + Number(l.kg_total || 0), 0);

  // Cargar insumos sugeridos cuando cambia el producto seleccionado
  const cargarEmpaques = useCallback(async (productoId: string) => {
    if (!productoId) {
      setEmpaquesSugeridos([]);
      setCantidadesEmpaque({});
      return;
    }
    setLoadingEmpaques(true);
    try {
      const res = await apiFetch(`/api/produccion/lotes/empaques-sugeridos?producto_id=${productoId}`);
      if (!res.ok) {
        setEmpaquesSugeridos([]);
        return;
      }
      const json = await res.json() as { data: Omit<EmpaqueSugerido, 'cantidad'>[] };
      const items = (json.data || []).map((item) => ({ ...item, cantidad: 1 }));
      setEmpaquesSugeridos(items);
      // Inicializar cantidades: 1 unidad por frasco (ajustable)
      const cantidades: Record<string, number> = {};
      for (const it of items) {
        cantidades[it.id] = 1;
      }
      setCantidadesEmpaque(cantidades);
      if (items.length > 0) setEmpaquesPanelOpen(true);
    } catch {
      setEmpaquesSugeridos([]);
    } finally {
      setLoadingEmpaques(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void cargarEmpaques(envasarProductoId);
  }, [envasarProductoId, cargarEmpaques]);

  const handleSelectProducto = (productoId: string) => {
    setEnvasarProductoId(productoId);
    if (!productoId || !envasandoLote) {
      setEnvasarCantidad('');
      return;
    }
    const prod = productos.find((p) => p.id === productoId);
    const pG = Number(prod?.peso_neto_g ?? 0);
    const kg = Number(envasandoLote.kg_total ?? 0);
    if (pG > 0 && kg > 0) {
      const maxFrascos = Math.floor((kg * 1000) / pG);
      setEnvasarCantidad(maxFrascos > 0 ? String(maxFrascos) : '');
    } else {
      setEnvasarCantidad('');
    }
  };

  const handleLoteSaved = () => {
    setEditingLote(null);
    void queryClient.invalidateQueries({ queryKey: ['produccion', 'dashboard'] });
  };

  const handleEnvasar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!envasandoLote) return;
    const cantidad = parseInt(envasarCantidad, 10);
    if (!envasarProductoId || !cantidad || cantidad <= 0) {
      toast.error('Selecciona producto destino y una cantidad válida');
      return;
    }
    setEnvasando(true);
    try {
      // Construir lista de insumos a descontar
      const insumosDescuento = descontarEmpaques && empaquesSugeridos.length > 0
        ? empaquesSugeridos.map((it) => ({
            item_id: it.id,
            cantidad: (cantidadesEmpaque[it.id] ?? 1) * cantidad,
          })).filter((i) => i.cantidad > 0)
        : undefined;

      const res = await apiFetch(`/api/produccion/lotes/${envasandoLote.id}/envasar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: envasarProductoId,
          cantidad,
          insumos_descuento: insumosDescuento,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(error.message || 'Error al envasar lote');
      }

      const result = await res.json() as { data?: { insumos_descontados?: Array<{ error?: string }> } };
      const insumosConError = (result.data?.insumos_descontados ?? []).filter((i) => i.error);

      if (insumosConError.length > 0) {
        toast.success(`${cantidad} frascos envasados. Algunos insumos no pudieron descontarse automáticamente — revisa el inventario.`);
      } else if (descontarEmpaques && empaquesSugeridos.length > 0) {
        toast.success(`${cantidad} frascos envasados e insumos de bodega descontados correctamente.`);
      } else {
        toast.success(`Se envasaron ${cantidad} frascos con éxito.`);
      }

      setEnvasandoLote(null);
      setEnvasarProductoId('');
      setEnvasarCantidad('');
      setEmpaquesSugeridos([]);
      setCantidadesEmpaque({});
      setEmpaquesPanelOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['produccion', 'dashboard'] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al procesar el envasado');
    } finally {
      setEnvasando(false);
    }
  };

  const handleEliminarLote = async () => {
    if (!loteAEliminar) return;
    setEliminando(true);
    try {
      const res = await apiFetch(`/api/produccion/lotes/${loteAEliminar.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || 'No se pudo eliminar el lote');
      }
      toast.success('Lote eliminado correctamente');
      setLoteAEliminar(null);
      void queryClient.invalidateQueries({ queryKey: ['produccion', 'dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['produccion', 'lotes-lite'] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el lote');
    } finally {
      setEliminando(false);
    }
  };

  const lotesActivos = lotes.filter((l) => Number(l.kg_total || 0) > 0).length;

  const loteKgDisponible = Number(envasandoLote?.kg_total ?? 0);
  const productoSeleccionado = productos.find((p) => p.id === envasarProductoId);
  const pesoNetoG = Number(productoSeleccionado?.peso_neto_g ?? 0);
  const pesoKgUnitario = pesoNetoG > 0 ? pesoNetoG / 1000 : 0;
  const frascosEstimadosMaximos = pesoKgUnitario > 0 && loteKgDisponible > 0
    ? Math.floor(loteKgDisponible / pesoKgUnitario)
    : 0;
  const cantidadDeseada = parseInt(envasarCantidad, 10) || 0;
  const kgRequeridos = pesoKgUnitario > 0 ? cantidadDeseada * pesoKgUnitario : 0;
  const excedeLote = cantidadDeseada > 0 && kgRequeridos > (loteKgDisponible + 0.0001);
  const kgRestantes = Math.max(0, loteKgDisponible - kgRequeridos);
  const kgPreview = productoSeleccionado && envasarCantidad ? kgRequeridos : null;

  if (isLoading && lotes.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 relative">
        <ViewShell
          variant="compact"
          eyebrow="Operación Apícola"
          title="Lotes de Producción"
          subtitle="Miel en bodega: lotes, análisis de laboratorio, envasado a frasco y pasaporte QR."
          icon={<Layers size={20} />}
        />
        <ProduccionDashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {isFetching && !isLoading && <LoadingOverlay label="Actualizando producción..." />}

      <ViewShell
        variant="compact"
        eyebrow="Operación Apícola"
        title="Lotes de Producción"
        subtitle="Miel en bodega: lotes, análisis de laboratorio, envasado a frasco y pasaporte QR."
        icon={<Layers size={20} />}
      />

      {/* Resumen ejecutivo compacto: libera el primer pliegue de la pantalla */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 rounded-lg border border-border/80 bg-surface-sunken/40 text-sm">
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 divide-x divide-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <Package size={17} />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                Miel a Granel en Bodega
              </span>
              <span className="font-display text-lg font-medium text-foreground">
                {totalKgLotes.toFixed(1)} <span className="text-xs font-sans text-muted-foreground">kg</span>
              </span>
            </div>
          </div>

          <div className="pl-6 sm:pl-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-surface-raised flex items-center justify-center text-muted-foreground">
              <Layers size={17} />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                Lotes Activos
              </span>
              <span className="font-display text-lg font-medium text-foreground">
                {lotesActivos}{' '}
                <span className="text-xs font-sans text-muted-foreground font-normal">
                  de {lotes.length} registrados
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500/80" />
          <span>Trazabilidad apícola de origen</span>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="overflow-hidden border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-6 py-4 border-b border-border bg-surface-raised/40">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                Inventario de Lotes a Granel
              </h2>
              <p className="text-xs text-muted-foreground">
                Extracción, envasado y pasaporte digital. El cierre vincula análisis de laboratorio para certificar la trayectoria del frasco.
              </p>
            </div>
          </div>
          <CardContent className="p-0">
            {lotes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay lotes registrados.</p>
            ) : (
              <div className="flex flex-col">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-sunken text-xs uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
                  <div className="col-span-3">Lote</div>
                  <div className="col-span-2">Variedad</div>
                  <div className="col-span-2 text-center">Disponible</div>
                  <div className="col-span-2">Estado</div>
                  <div className="col-span-3 text-right">Acciones</div>
                </div>
                <div className="divide-y divide-border">
                  {lotes.map((lote) => {
                    const kgDisponible = Number(lote.kg_total || 0);
                    return (
                      <div key={lote.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 md:px-6 items-center hover:bg-surface-sunken/50 transition-colors">
                        <div className="col-span-1 md:col-span-3 flex flex-col">
                          <span className="font-medium text-foreground font-mono text-sm">
                            {lote.nombre_lote || lote.codigo || lote.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatCalendarDate(lote.created_at)}
                          </span>
                        </div>
                        <div className="col-span-1 md:col-span-2 text-sm text-muted-foreground">
                          {lote.variedad_floral || '—'}
                        </div>
                        <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                          <span className="text-xs text-muted-foreground md:hidden">Disponible:</span>
                          <span className={cn('font-medium', kgDisponible > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                            {kgDisponible.toFixed(1)} kg
                          </span>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <Badge variant={lote.estado === 'activo' ? 'success' : lote.estado === 'completado' ? 'default' : 'warning'}>
                            {lote.estado ?? 'activo'}
                          </Badge>
                        </div>
                        <div className="col-span-1 md:col-span-3 flex items-center justify-start md:justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs font-medium border-primary/40 hover:border-primary text-foreground"
                            disabled={kgDisponible <= 0}
                            onClick={() => { setEnvasandoLote(lote); setEnvasarProductoId(''); setEnvasarCantidad(''); }}
                          >
                            <PackagePlus size={14} className="text-primary" />
                            Envasar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                            title="Ver Pasaporte QR"
                            onClick={() => setPasaporteLoteId(lote.id)}
                          >
                            <QrCode size={14} />
                            <span className="hidden xl:inline">Pasaporte</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                            title="Editar lote"
                            onClick={() => setEditingLote(lote)}
                          >
                            <Edit3 size={14} />
                            <span className="hidden xl:inline">Editar</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title={
                              lote.fecha_envasado
                                ? 'No se puede eliminar un lote ya envasado'
                                : 'Eliminar lote'
                            }
                            disabled={Boolean(lote.fecha_envasado)}
                            onClick={() => setLoteAEliminar(lote)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal: Envasar Lote (Triangulación 1 — insumos de empaque) */}
      <ImmersiveModal
        open={Boolean(envasandoLote)}
        onClose={() => {
          setEnvasandoLote(null);
          setEmpaquesSugeridos([]);
          setEmpaquesPanelOpen(false);
          setEnvasarProductoId('');
          setEnvasarCantidad('');
        }}
        eyebrow="Producción"
        title={`Envasar Lote · ${envasandoLote?.nombre_lote || envasandoLote?.codigo || envasandoLote?.id.substring(0, 8).toUpperCase() || ''}`}
        size="md"
      >
        <form onSubmit={handleEnvasar} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Convierte kg del lote en frascos del producto destino: el stock del producto aumentará y el lote descontará su peso disponible para trazabilidad.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="envasar-producto">Producto destino</Label>
            <select
              id="envasar-producto"
              value={envasarProductoId}
              onChange={(e) => handleSelectProducto(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Selecciona producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.peso_neto_g ? `(${p.peso_neto_g}g)` : ''} · stock actual {p.stock ?? 0}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="envasar-cantidad">Cantidad de frascos</Label>
              {frascosEstimadosMaximos > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">Rendimiento máx: ~{frascosEstimadosMaximos} un.</span>
                  <button
                    type="button"
                    onClick={() => setEnvasarCantidad(String(frascosEstimadosMaximos))}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    Usar máx
                  </button>
                </div>
              )}
            </div>
            <Input
              id="envasar-cantidad"
              type="number"
              min="1"
              max={frascosEstimadosMaximos > 0 ? frascosEstimadosMaximos : undefined}
              step="1"
              placeholder="0"
              value={envasarCantidad}
              onChange={(e) => setEnvasarCantidad(e.target.value)}
              className={cn(excedeLote && 'border-destructive focus-visible:ring-destructive')}
              required
            />
            {frascosEstimadosMaximos > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-muted-foreground">Llenado rápido:</span>
                <button
                  type="button"
                  onClick={() => setEnvasarCantidad(String(frascosEstimadosMaximos))}
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer',
                    cantidadDeseada === frascosEstimadosMaximos
                      ? 'border-primary/50 bg-primary/10 text-primary font-medium'
                      : 'border-border bg-surface-sunken hover:bg-surface-raised text-muted-foreground hover:text-foreground'
                  )}
                >
                  100% ({frascosEstimadosMaximos})
                </button>
                {frascosEstimadosMaximos >= 2 && (
                  <button
                    type="button"
                    onClick={() => setEnvasarCantidad(String(Math.floor(frascosEstimadosMaximos / 2)))}
                    className={cn(
                      'text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer',
                      cantidadDeseada === Math.floor(frascosEstimadosMaximos / 2)
                        ? 'border-primary/50 bg-primary/10 text-primary font-medium'
                        : 'border-border bg-surface-sunken hover:bg-surface-raised text-muted-foreground hover:text-foreground'
                    )}
                  >
                    50% ({Math.floor(frascosEstimadosMaximos / 2)})
                  </button>
                )}
                {frascosEstimadosMaximos >= 4 && (
                  <button
                    type="button"
                    onClick={() => setEnvasarCantidad(String(Math.floor(frascosEstimadosMaximos / 4)))}
                    className={cn(
                      'text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer',
                      cantidadDeseada === Math.floor(frascosEstimadosMaximos / 4)
                        ? 'border-primary/50 bg-primary/10 text-primary font-medium'
                        : 'border-border bg-surface-sunken hover:bg-surface-raised text-muted-foreground hover:text-foreground'
                    )}
                  >
                    25% ({Math.floor(frascosEstimadosMaximos / 4)})
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-surface-sunken border border-border text-xs text-muted-foreground space-y-1.5">
            <div className="flex justify-between items-center">
              <span>Peso disponible en lote:</span>
              <strong className="text-foreground">{loteKgDisponible.toFixed(1)} kg</strong>
            </div>

            {productoSeleccionado && pesoNetoG > 0 && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calculator size={13} className="text-primary" />
                  Rendimiento estimado:
                </span>
                <span>
                  ~<strong className="text-foreground">{frascosEstimadosMaximos}</strong> frascos ({pesoNetoG}g c/u)
                </span>
              </div>
            )}

            {cantidadDeseada > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span>Materia prima requerida:</span>
                  <strong className={excedeLote ? 'text-destructive font-semibold' : 'text-primary'}>
                    {kgRequeridos.toFixed(2)} kg
                  </strong>
                </div>

                {!excedeLote ? (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Remanente posterior en lote:</span>
                    <span className="font-medium text-foreground">{kgRestantes.toFixed(2)} kg</span>
                  </div>
                ) : (
                  <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive text-[11px] mt-1 font-medium">
                    ⚠️ La cantidad ingresada excede los {loteKgDisponible.toFixed(1)} kg disponibles en {(kgRequeridos - loteKgDisponible).toFixed(2)} kg.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Triangulación 1: Panel de insumos de empaque */}
          {loadingEmpaques && envasarProductoId && (
            <p className="text-xs text-muted-foreground animate-pulse">Buscando insumos de empaque vinculados…</p>
          )}
          {!loadingEmpaques && empaquesSugeridos.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setEmpaquesPanelOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-sunken text-sm font-medium text-foreground hover:bg-surface-sunken/80 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Package size={14} className="text-primary" />
                  Insumos de bodega a descontar
                  <Badge variant="default" className="text-[10px] h-4 px-1.5">
                    {empaquesSugeridos.length}
                  </Badge>
                </span>
                {empaquesPanelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <AnimatePresence>
                {empaquesPanelOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={descontarEmpaques}
                          onChange={(e) => setDescontarEmpaques(e.target.checked)}
                          className="accent-[hsl(var(--primary))] w-4 h-4 rounded"
                        />
                        <span className="text-foreground font-medium">Descontar automáticamente de bodega de insumos</span>
                      </label>

                      {descontarEmpaques && (
                        <div className="space-y-2">
                          {empaquesSugeridos.map((it) => {
                            const cantPorFrasco = cantidadesEmpaque[it.id] ?? 1;
                            const cantTotal = cantPorFrasco * (parseInt(envasarCantidad, 10) || 0);
                            const quedaria = it.stock - cantTotal;
                            return (
                              <div key={it.id} className="flex items-center justify-between gap-3 text-xs">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">{it.nombre}</p>
                                  <p className="text-muted-foreground">
                                    Stock: {it.stock} {it.unidad} → quedarán{' '}
                                    <span className={quedaria < 0 ? 'text-destructive font-medium' : quedaria <= it.stock_minimo ? 'text-warning font-medium' : 'text-foreground'}>
                                      {quedaria} {it.unidad}
                                    </span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-muted-foreground">×frs:</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={cantPorFrasco}
                                    onChange={(e) => setCantidadesEmpaque((prev) => ({ ...prev, [it.id]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                                    className="w-16 h-7 text-xs text-center px-1"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setEnvasandoLote(null);
                setEmpaquesSugeridos([]);
                setEmpaquesPanelOpen(false);
                setEnvasarProductoId('');
                setEnvasarCantidad('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={envasando || excedeLote || !envasarProductoId || cantidadDeseada <= 0}
            >
              <PackagePlus size={16} className="mr-2" />
              {envasando ? 'Envasando…' : 'Envasar frascos'}
            </Button>
          </div>
        </form>
      </ImmersiveModal>

      {/* Modal: Pasaporte QR */}
      {pasaporteLoteId && (
        <ImmersiveModal
          open={Boolean(pasaporteLoteId)}
          onClose={() => setPasaporteLoteId(null)}
          eyebrow="Trazabilidad"
          title="Pasaporte de Lote"
          size="md"
        >
          <LotePasaporteQR loteId={pasaporteLoteId} />
        </ImmersiveModal>
      )}

      {/* Modal: Editar Lote */}
      <ImmersiveModal
        open={Boolean(editingLote)}
        onClose={() => setEditingLote(null)}
        eyebrow="Trazabilidad Comercial"
        title="Editar Lote"
        size="xl"
        bodyClassName="!p-0"
      >
        <div className="p-5 sm:p-6">
          {editingLote && (
            <>
              <LoteComercialForm
                lote={editingLote}
                onSuccess={handleLoteSaved}
                onCancel={() => setEditingLote(null)}
              />
              <AnalisisLaboratorioPanel loteId={(editingLote as { id: string }).id} />
            </>
          )}
        </div>
      </ImmersiveModal>

      {/* Modal: Confirmar eliminación de lote virgen/huérfano */}
      <ImmersiveModal
        open={Boolean(loteAEliminar)}
        onClose={() => !eliminando && setLoteAEliminar(null)}
        eyebrow="Operación Apícola"
        title={`Eliminar Lote · ${loteAEliminar?.nombre_lote || loteAEliminar?.codigo || loteAEliminar?.id.substring(0, 8).toUpperCase() || ''}`}
        size="md"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">¿Estás seguro de eliminar este lote?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Esta acción retirará <strong className="text-foreground">{loteAEliminar?.kg_total ?? 0} kg</strong> del disponible a granel en bodega. Solo se permite en lotes que no hayan sido envasados ni certificados.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={eliminando}
              onClick={() => setLoteAEliminar(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={eliminando}
              onClick={handleEliminarLote}
            >
              {eliminando ? 'Eliminando...' : 'Eliminar Lote'}
            </Button>
          </div>
        </div>
      </ImmersiveModal>
    </div>
  );
}
