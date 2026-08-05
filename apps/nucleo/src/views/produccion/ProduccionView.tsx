'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, ViewLoading, LoadingOverlay, Button, Label, Input, toast, ImmersiveModal,
} from '@enjambre/ui';
import { formatCLP } from '@enjambre/ui';
import { 
  Activity, Package, Calendar, Layers, ClipboardCheck, ArrowLeft, PackagePlus, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { LoteComercialForm } from '@/components/apicultor/LoteComercialForm';
import { LotePasaporteQR } from '@/components/apicultor/LotePasaporteQR';

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
  analisis_hmf?: number | null;
  lab_nombre?: string | null;
  lab_fecha?: string | null;
  canal_destino?: string | null;
  relato_publico?: string | null;
  publico?: boolean | null;
  productos?: {
    nombre?: string;
    peso_neto_g?: number;
  } | null;
}

interface ProductoProduccionRow {
  id: string;
  nombre: string;
  formato?: string;
  stock?: number;
  peso_neto_g?: number;
  demanda_30d?: number;
  dias_stock_estimado: number;
}

interface ProduccionDashboardData {
  data: {
    lotes: LoteProduccionRow[];
    productos: ProductoProduccionRow[];
    stats: {
      total_kg_lotes?: number;
      lotes_criticos?: number;
      productos_quiebre?: number;
    };
  };
}

export function ProduccionView() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lotes'>('lotes');
  const [editingLote, setEditingLote] = useState<LoteProduccionRow | null>(null);
  const [envasandoLote, setEnvasandoLote] = useState<LoteProduccionRow | null>(null);
  const [pasaporteLoteId, setPasaporteLoteId] = useState<string | null>(null);
  const [envasarProductoId, setEnvasarProductoId] = useState('');
  const [envasarCantidad, setEnvasarCantidad] = useState('');
  const [envasando, setEnvasando] = useState(false);
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
      const res = await apiFetch(`/api/produccion/lotes/${envasandoLote.id}/envasar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: envasarProductoId,
          unidades: cantidad,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Error al envasar lote');
      }

      toast.success(`Se envasaron ${cantidad} frascos con éxito`);
      setEnvasandoLote(null);
      setEnvasarProductoId('');
      setEnvasarCantidad('');
      void queryClient.invalidateQueries({ queryKey: ['produccion', 'dashboard'] });
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el envasado');
    } finally {
      setEnvasando(false);
    }
  };

  const totalKgLotes = lotes.reduce((acc, l) => acc + Number(l.kg_total || 0), 0);
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
        subtitle="Miel en bodega: lotes, análisis de lab, envasado a frasco y pasaporte QR. El stock de tienda se gestiona en Inventario; las recolecciones en Recolección."
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
                        <div className="col-span-4">Producto</div>
                        <div className="col-span-2 text-center">Stock Actual</div>
                        <div className="col-span-2 text-center">Demanda (30D)</div>
                        <div className="col-span-2 text-center">Días Cobertura</div>
                        <div className="col-span-2 text-center">Estado</div>
                      </div>
                      <div className="divide-y divide-border">
                        {productos.map((p) => {
                          const stock = p.stock ?? 0;
                          const demanda = p.demanda_30d ?? 0;
                          const dias = p.dias_stock_estimado;
                          let badgeStatus: 'success' | 'warning' | 'destructive' = 'success';
                          let label = 'Saludable';

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
                              <div className="col-span-1 md:col-span-4 flex flex-col">
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
                              <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                                <span className="text-xs text-muted-foreground md:hidden">Estado:</span>
                                <Badge variant={badgeStatus}>{label}</Badge>
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
                      Firmar publica la cadena de custodia verificable del frasco.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {lotes.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No hay lotes registrados.</p>
                    ) : (
                      <div className="flex flex-col">
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-sunken text-xs uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
                          <div className="col-span-3">Código Lote</div>
                          <div className="col-span-2">Producto/Destino</div>
                          <div className="col-span-2">Fecha</div>
                          <div className="col-span-1 text-right">Kg</div>
                          <div className="col-span-1">Estado</div>
                          <div className="col-span-3"></div>
                        </div>
                        <div className="divide-y divide-border">
                          {lotes.map((l) => {
                            const kg = Number(l.kg_total || 0);
                            const productoKg = l.productos ? (Number(l.productos.peso_neto_g || 1000) / 1000) : null;
                            const rendimiento = productoKg ? Math.floor(kg / productoKg) : null;
                            const nombreLote = l.nombre_lote?.trim() || l.codigo || l.id.substring(0, 8).toUpperCase();
                            const open = pasaporteLoteId === l.id;

                            return (
                              <div key={l.id} className="flex flex-col">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 md:px-6 items-center hover:bg-surface-sunken/50 transition-colors">
                                  <div className="col-span-1 md:col-span-3 flex flex-col">
                                    <span className="font-mono font-medium text-primary text-sm">
                                      {nombreLote}
                                    </span>
                                    {l.variedad_floral && (
                                      <span className="text-xs text-muted-foreground">{l.variedad_floral}</span>
                                    )}
                                  </div>
                                  <div className="col-span-1 md:col-span-2 flex flex-col text-sm">
                                    <span>{l.productos?.nombre || 'General / Sin Asignar'}</span>
                                    {rendimiento && (
                                      <span className="text-xs text-muted-foreground">~{rendimiento} frascos</span>
                                    )}
                                  </div>
                                  <div className="col-span-1 md:col-span-2 flex justify-between md:justify-start items-center text-sm text-muted-foreground">
                                    <span className="text-xs text-muted-foreground md:hidden">Fecha:</span>
                                    <div className="flex items-center gap-1.5">
                                      <Calendar size={14} className="hidden md:block" />
                                      <span>{new Date(l.created_at).toLocaleDateString('es-CL')}</span>
                                    </div>
                                  </div>
                                  <div className="col-span-1 md:col-span-1 flex justify-between md:justify-end items-center">
                                    <span className="text-xs text-muted-foreground md:hidden">Kg:</span>
                                    <span className="font-display">{kg.toFixed(1)} kg</span>
                                  </div>
                                  <div className="col-span-1 md:col-span-1 flex items-center gap-2">
                                    <Badge variant={l.publico ? 'success' : l.estado && l.estado !== 'activo' ? 'warning' : 'default'}>
                                      {l.publico ? 'Publicado' : l.estado || 'Activo'}
                                    </Badge>
                                  </div>
                                  <div className="col-span-2 md:col-span-3 flex flex-wrap justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setPasaporteLoteId(open ? null : l.id)}
                                      className="gap-1.5 text-xs"
                                    >
                                      <QrCode size={14} />
                                      Pasaporte
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingLote(l)}
                                      className="gap-1.5 text-xs"
                                    >
                                      <ClipboardCheck size={14} />
                                      Completar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEnvasandoLote(l)}
                                      className="gap-1.5 text-xs"
                                    >
                                      <PackagePlus size={14} />
                                      Envasar
                                    </Button>
                                  </div>
                                </div>
                                {open && (
                                  <div className="px-4 md:px-6 pb-4 border-t border-border/40 bg-primary/5">
                                    <div className="pt-3 text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                                      <QrCode size={12} className="text-primary" />
                                      Pasaporte verificable del lote
                                    </div>
                                    <LotePasaporteQR loteId={l.id} />
                                  </div>
                                )}
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

          <ImmersiveModal
            open={Boolean(envasandoLote)}
            onClose={() => setEnvasandoLote(null)}
            eyebrow="Envasado de Miel"
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
                  onChange={(e) => setEnvasarProductoId(e.target.value)}
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" type="button" onClick={() => setEnvasandoLote(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={envasando}>
                  <PackagePlus size={16} className="mr-2" />
                  {envasando ? 'Envasando…' : 'Envasar frascos'}
                </Button>
              </div>
            </form>
          </ImmersiveModal>

          <ImmersiveModal
            open={Boolean(editingLote)}
            onClose={() => setEditingLote(null)}
            eyebrow="Trazabilidad Comercial"
            title={`Editar Lote · ${editingLote?.nombre_lote || editingLote?.codigo || ''}`}
            size="lg"
          >
            {editingLote && (
              <LoteComercialForm
                lote={editingLote}
                onSuccess={handleLoteSaved}
                onCancel={() => setEditingLote(null)}
              />
            )}
          </ImmersiveModal>
        </div>
      )}
    </div>
  );
}
