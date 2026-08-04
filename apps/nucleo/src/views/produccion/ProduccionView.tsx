'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, ViewLoading, LoadingOverlay, Button, Label, Input, toast,
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
  // Lotes (bodega) + alertas de stock. Recolección e Inventario son herramientas propias.
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
        body: JSON.stringify({ producto_id: envasarProductoId, cantidad }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
        throw new Error(err.message || err.code || 'Error al envasar');
      }
      toast.success('Envasado: stock del producto actualizado');
      setEnvasandoLote(null);
      setEnvasarProductoId('');
      setEnvasarCantidad('');
      void queryClient.invalidateQueries({ queryKey: ['produccion', 'dashboard'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al envasar');
    } finally {
      setEnvasando(false);
    }
  };

  const productoEnvasar = productos.find((p) => p.id === envasarProductoId);
  const kgPreview = productoEnvasar?.peso_neto_g
    ? (parseInt(envasarCantidad || '0', 10) || 0) * (Number(productoEnvasar.peso_neto_g) / 1000)
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Producción"
        title="Lotes"
        subtitle="Miel en bodega: lotes, análisis de lab, envasado a frasco y pasaporte QR. El stock de tienda se gestiona en Inventario; las recolecciones en Recolección."
        icon={<Package size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="produccion-tabs"
        tabs={[
          { id: 'lotes', label: 'Lotes activos', icon: <Layers size={16} /> },
          { id: 'dashboard', label: 'Alertas de stock', icon: <Activity size={16} /> },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'dashboard' | 'lotes')}
      />

      {isLoading ? (
        <ViewLoading variant="view" label="Producción" hideLabel />
      ) : (
        <div className="relative">
          {isFetching && dashboardData ? <LoadingOverlay label="Actualizando producción" /> : null}
        <AnimatePresence mode="wait">
          {/* PESTAÑA: DASHBOARD & ALERTAS */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* KPIs operativos de miel viven en el Inicio (/inicio) */}

              {/* Tabla de Productos / Quiebres */}
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Quiebre de Stock</CardTitle>
                  <CardDescription>Cálculo de días de inventario restante cruzando Stock Actual vs Demanda de los últimos 30 días.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-sunken text-xs uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
                      <div className="col-span-4">Producto</div>
                      <div className="col-span-2 text-center">Stock Actual</div>
                      <div className="col-span-2 text-center">Demanda 30D</div>
                      <div className="col-span-2 text-center">Días Estimados</div>
                      <div className="col-span-2 text-center">Estado</div>
                    </div>
                    <div className="divide-y divide-border">
                      {[...productos].sort((a,b) => a.dias_stock_estimado - b.dias_stock_estimado).map((p) => {
                        const stock = Number(p.stock || 0);
                        const demanda = Number(p.demanda_30d || 0);
                        const dias = p.dias_stock_estimado;
                        
                        let badgeStatus: 'success' | 'warning' | 'danger' | 'default' = 'default';
                        let label = 'Estable';

                        if (dias === 999) {
                          label = 'Sin Movimiento';
                          badgeStatus = 'default';
                        } else if (dias <= 15) {
                          label = 'Crítico';
                          badgeStatus = 'danger';
                        } else if (dias <= 30) {
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

          {/* PESTAÑA: LOTES */}
          {activeTab === 'lotes' && (
            <motion.div
              key="lotes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {editingLote ? (
                <div className="space-y-4">
                  <Button variant="ghost" onClick={() => setEditingLote(null)} className="gap-2">
                    <ArrowLeft size={16} />
                    Volver a lotes
                  </Button>
                  <LoteComercialForm
                    lote={editingLote}
                    onSuccess={handleLoteSaved}
                    onCancel={() => setEditingLote(null)}
                  />
                </div>
              ) : envasandoLote ? (
                <div className="space-y-4">
                  <Button variant="ghost" onClick={() => setEnvasandoLote(null)} className="gap-2">
                    <ArrowLeft size={16} />
                    Volver a lotes
                  </Button>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PackagePlus size={18} className="text-primary" />
                        Envasar Lote → Frasco
                      </CardTitle>
                      <CardDescription>
                        Convierte kg del lote en frascos del producto destino: el stock sube y el
                        lote descuenta su peso. La trazabilidad del frasco apunta a este lote.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleEnvasar} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="envasar-producto">Producto destino</Label>
                          <select
                            id="envasar-producto"
                            value={envasarProductoId}
                            onChange={(e) => setEnvasarProductoId(e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">Selecciona producto</option>
                            {productos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombre} {p.peso_neto_g ? `(${p.peso_neto_g}g)` : ''} · stock {p.stock ?? 0}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="envasar-cantidad">Frascos</Label>
                          <Input
                            id="envasar-cantidad"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="0"
                            value={envasarCantidad}
                            onChange={(e) => setEnvasarCantidad(e.target.value)}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button type="submit" disabled={envasando}>
                            <PackagePlus size={16} className="mr-2" />
                            {envasando ? 'Envasando…' : 'Envasar'}
                          </Button>
                        </div>
                      </form>
                      <p className="text-xs text-muted-foreground mt-4">
                        Lote: <strong className="text-foreground">{Number(envasandoLote.kg_total ?? 0).toFixed(1)} kg</strong>
                        {kgPreview !== null && (
                          <> · se descontarán <strong className="text-foreground">{kgPreview.toFixed(2)} kg</strong></>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
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
              )}
            </motion.div>
          )}

        </AnimatePresence>
        </div>
      )}
    </div>
  );
}
