'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, ViewLoading, LoadingOverlay, Button, Label, Input, toast, ImmersiveModal,
} from '@enjambre/ui';
import { formatCLP } from '@enjambre/ui';
import { 
  Activity, Package, Layers, PackagePlus, QrCode, Truck,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { LoteComercialForm } from '@/components/apicultor/LoteComercialForm';
import { AnalisisLaboratorioPanel } from '@/components/apicultor/AnalisisLaboratorioPanel';
import { LotePasaporteQR } from '@/components/apicultor/LotePasaporteQR';
import { cn } from '@/lib/cn';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lotes'>('lotes');
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

  const lotesActivos = lotes.filter((l) => Number(l.kg_total || 0) > 0).length;
  const productosBajoMinimo = productos.filter((p) => (p.stock ?? 0) <= 5).length;

  const productoSeleccionado = productos.find((p) => p.id === envasarProductoId);
  const kgPreview = productoSeleccionado && envasarCantidad
    ? (Number(productoSeleccionado.peso_neto_g || 1000) / 1000) * (parseInt(envasarCantidad, 10) || 0)
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {isFetching && !isLoading && <LoadingOverlay label="Actualizando producción..." />}

      <ViewShell
        variant="compact"
        eyebrow="Operación Apícola"
        title="Lotes y Alertas de Producción"
        subtitle="Miel en bodega: lotes, análisis de lab, envasado a frasco y pasaporte QR."
        icon={<Layers size={20} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-surface-sunken/40">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Miel en Bodega (Lotes)
            </CardTitle>
            <Package size={16} className="text-primary" />
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="text-2xl font-display font-medium text-foreground">
              {totalKgLotes.toFixed(1)} <span className="text-sm font-sans text-muted-foreground">kg</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{lotesActivos} lote(s) con disponible</p>
          </CardContent>
        </Card>

        <Card className="bg-surface-sunken/40">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Total Lotes Registrados
            </CardTitle>
            <Layers size={16} className="text-primary" />
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="text-2xl font-display font-medium text-foreground">{lotes.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Trazabilidad apícola end-to-end</p>
          </CardContent>
        </Card>

        <Card className="bg-surface-sunken/40">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Alertas de Quiebre
            </CardTitle>
            <Activity size={16} className={productosBajoMinimo > 0 ? 'text-destructive' : 'text-primary'} />
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="text-2xl font-display font-medium text-foreground">
              {productosBajoMinimo} <span className="text-sm font-sans text-muted-foreground">prod.</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Stock crítico (&le; 5 unidades)</p>
          </CardContent>
        </Card>
      </div>

      <ResponsiveTabBar
        variant="pill"
        layoutId="produccion-tabs"
        tabs={[
          { id: 'lotes', label: 'Lotes de Miel (Bodega)', icon: <Package size={16} /> },
          { id: 'dashboard', label: 'Alertas de Stock & Proyección', icon: <Activity size={16} /> },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'dashboard' | 'lotes')}
      />

      {isLoading ? (
        <ViewLoading variant="view" label="Cargando producción..." />
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Proyección de Stock y Cobertura</CardTitle>
                    <CardDescription>
                      Estimación basada en las ventas de los últimos 30 días. Monitorea quiebres antes de que ocurran.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col">
                      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-sunken text-xs uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
                        <div className="col-span-3">Producto</div>
                        <div className="col-span-2 text-center">Stock Actual</div>
                        <div className="col-span-2 text-center">Demanda (30D)</div>
                        <div className="col-span-2 text-center">Días Cobertura</div>
                        <div className="col-span-1 text-center">Estado</div>
                        <div className="col-span-2 text-center">Acción</div>
                      </div>
                      <div className="divide-y divide-border">
                        {productos.map((p) => {
                          const stock = p.stock ?? 0;
                          const demanda = p.demanda_30d ?? 0;
                          const dias = p.dias_stock_estimado;
                          let badgeStatus: 'success' | 'warning' | 'destructive';
                          let label: string;
                          const enQuiebre = stock === 0 || dias < 15;

                          if (stock === 0) {
                            label = 'Agotado';
                            badgeStatus = 'destructive';
                          } else if (dias < 15) {
                            label = 'Riesgo Quiebre';
                            badgeStatus = 'destructive';
                          } else if (dias < 30) {
                            label = 'Atención';
                            badgeStatus = 'warning';
                          } else {
                            label = 'Saludable';
                            badgeStatus = 'success';
                          }

                          return (
                            <div key={p.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 md:px-6 items-center hover:bg-surface-sunken/50 transition-colors">
                              <div className="col-span-1 md:col-span-3 flex flex-col">
                                <span className="font-medium text-foreground">{p.nombre}</span>
                                {p.formato && <span className="text-xs text-muted-foreground">{p.formato}</span>}
                              </div>
                              <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                                <span className="text-xs text-muted-foreground md:hidden">Stock:</span>
                                <span className="font-display text-lg">{stock}</span>
                              </div>
                              <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                                <span className="text-xs text-muted-foreground md:hidden">Demanda 30D:</span>
                                <span className="text-muted-foreground">{demanda} und</span>
                              </div>
                              <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                                <span className="text-xs text-muted-foreground md:hidden">Días Est.:</span>
                                <span className="font-medium">{dias === 999 ? '∞' : `${dias} días`}</span>
                              </div>
                              <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center">
                                <span className="text-xs text-muted-foreground md:hidden">Estado:</span>
                                <Badge variant={badgeStatus}>{label}</Badge>
                              </div>
                              {/* Triangulación 5: Acciones operativas */}
                              <div className="col-span-1 md:col-span-2 flex flex-wrap items-center justify-start md:justify-center gap-1.5">
                                {enQuiebre && totalKgLotes > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 px-2 gap-1 border-primary/40 text-primary hover:bg-primary/10"
                                    onClick={() => {
                                      setEnvasandoLote(lotes.find((l) => Number(l.kg_total || 0) > 0) ?? null);
                                      setEnvasarProductoId(p.id);
                                    }}
                                  >
                                    <PackagePlus size={12} />
                                    Envasar
                                  </Button>
                                )}
                                {enQuiebre && (
                                  <Link
                                    href="/despacho/proveedores?filtro=urgentes"
                                    className="inline-flex items-center gap-1 text-xs h-7 px-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-surface-sunken transition-colors"
                                  >
                                    <Truck size={12} />
                                    Abastecer
                                  </Link>
                                )}
                                {!enQuiebre && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs h-7 px-2 gap-1 text-muted-foreground"
                                    onClick={() => {
                                      setEnvasandoLote(lotes.find((l) => Number(l.kg_total || 0) > 0) ?? null);
                                      setEnvasarProductoId(p.id);
                                    }}
                                  >
                                    <PackagePlus size={12} />
                                    Envasar
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'lotes' && (
              <motion.div
                key="lotes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Lotes de Producción</CardTitle>
                    <CardDescription>
                      Extracción, envasado y pasaporte QR del lote. Completar cierra con análisis de lab;
                      Firmar publica la trayectoria verificable del frasco.
                    </CardDescription>
                  </CardHeader>
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
                                    {new Date(lote.created_at).toLocaleDateString('es-CL')}
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
                                <div className="col-span-1 md:col-span-3 flex flex-wrap items-center justify-start md:justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="gap-1.5 text-xs"
                                    onClick={() => setPasaporteLoteId(lote.id)}
                                  >
                                    <QrCode size={14} />
                                    Pasaporte
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 text-xs"
                                    disabled={kgDisponible <= 0}
                                    onClick={() => { setEnvasandoLote(lote); setEnvasarProductoId(''); setEnvasarCantidad(''); }}
                                  >
                                    <PackagePlus size={14} />
                                    Envasar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs"
                                    onClick={() => setEditingLote(lote)}
                                  >
                                    Editar
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modal: Envasar Lote (Triangulación 1 — insumos de empaque) */}
      <ImmersiveModal
        open={Boolean(envasandoLote)}
        onClose={() => { setEnvasandoLote(null); setEmpaquesSugeridos([]); setEmpaquesPanelOpen(false); }}
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
              onChange={(e) => { setEnvasarProductoId(e.target.value); }}
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
            <Label htmlFor="envasar-cantidad">Cantidad de frascos</Label>
            <Input
              id="envasar-cantidad"
              type="number"
              min="1"
              step="1"
              placeholder="0"
              value={envasarCantidad}
              onChange={(e) => setEnvasarCantidad(e.target.value)}
              required
            />
          </div>

          <div className="p-3 rounded-lg bg-surface-sunken border border-border text-xs text-muted-foreground space-y-1">
            <div>
              Peso disponible en lote: <strong className="text-foreground">{Number(envasandoLote?.kg_total ?? 0).toFixed(1)} kg</strong>
            </div>
            {kgPreview !== null && (
              <div className="text-primary font-medium">
                Se descontarán {kgPreview.toFixed(2)} kg del disponible del lote.
              </div>
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
            <Button variant="outline" type="button" onClick={() => { setEnvasandoLote(null); setEmpaquesSugeridos([]); setEmpaquesPanelOpen(false); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={envasando}>
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
    </div>
  );
}
