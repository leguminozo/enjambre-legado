'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, ViewLoading, LoadingOverlay,
} from '@enjambre/ui';
import { formatCLP } from '@enjambre/ui';
import { 
  Activity, Package, AlertTriangle, Layers, Calendar, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { EnjTableShell } from '@/components/layout/EnjTableShell';

interface LoteProduccionRow {
  id: string;
  codigo?: string;
  kg_total?: number;
  created_at: string;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lotes'>('dashboard');
  const apiFetch = useApiFetch();

  const { data: dashboardData, isLoading, isFetching } = useQuery<ProduccionDashboardData>({
    queryKey: ['produccion', 'dashboard'],
    queryFn: async () => {
      const res = await apiFetch('/api/produccion/dashboard');
      if (!res.ok) throw new Error('Error al obtener datos de producción');
      return res.json() as Promise<ProduccionDashboardData>;
    },
  });

  const data = dashboardData?.data || { lotes: [], productos: [], stats: {} };
  const { lotes, productos, stats } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Inventario"
        title="Producción e Inventario"
        subtitle="Control de lotes de miel, envasado y proyecciones de quiebre de stock basado en demanda real."
        icon={<Package size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="produccion-tabs"
        tabs={[
          { id: 'dashboard', label: 'Alertas de Stock', icon: <Activity size={16} /> },
          { id: 'lotes', label: 'Lotes Activos', icon: <Layers size={16} /> },
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
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-surface-sunken border-border">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl text-primary">
                      <BarChart2 size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Miel en Lotes</p>
                      <p className="text-3xl font-display mt-1">{stats.total_kg_lotes?.toFixed(1) || 0} kg</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-surface-sunken border-border">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="bg-warning/10 p-3 rounded-xl text-warning">
                      <Layers size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Lotes Críticos (&lt;50kg)</p>
                      <p className="text-3xl font-display mt-1">{stats.lotes_criticos || 0}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-surface-sunken border-border">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="bg-danger/10 p-3 rounded-xl text-destructive">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Riesgo de Quiebre</p>
                      <p className="text-3xl font-display mt-1 text-destructive">{stats.productos_quiebre || 0}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

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
              <Card>
                <CardHeader>
                  <CardTitle>Lotes de Producción</CardTitle>
                  <CardDescription>Registro de lotes de extracción y su rendimiento.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {lotes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No hay lotes registrados.</p>
                  ) : (
                    <div className="flex flex-col">
                      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-sunken text-xs uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
                        <div className="col-span-3">Código Lote</div>
                        <div className="col-span-3">Producto/Destino</div>
                        <div className="col-span-2">Fecha</div>
                        <div className="col-span-2 text-right">Kg Iniciales</div>
                        <div className="col-span-2 text-right">Rendimiento Estimado</div>
                      </div>
                      <div className="divide-y divide-border">
                        {lotes.map((l) => {
                          const kg = Number(l.kg_total || 0);
                          const productoKg = l.productos ? (Number(l.productos.peso_neto_g || 1000) / 1000) : null;
                          const rendimiento = productoKg ? Math.floor(kg / productoKg) : null;

                          return (
                            <div key={l.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 md:px-6 items-center hover:bg-surface-sunken/50 transition-colors">
                              <div className="col-span-1 md:col-span-3 flex justify-between md:justify-start items-center">
                                <span className="text-xs text-muted-foreground md:hidden">Lote:</span>
                                <span className="font-mono font-medium text-primary">
                                  {l.codigo || l.id.substring(0,8).toUpperCase()}
                                </span>
                              </div>
                              <div className="col-span-1 md:col-span-3 flex flex-col text-sm">
                                <span className="md:hidden text-xs text-muted-foreground">Destino:</span>
                                <span>{l.productos?.nombre || 'General / Sin Asignar'}</span>
                              </div>
                              <div className="col-span-1 md:col-span-2 flex justify-between md:justify-start items-center text-sm text-muted-foreground">
                                <span className="text-xs text-muted-foreground md:hidden">Fecha:</span>
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={14} className="hidden md:block"/>
                                  <span>{new Date(l.created_at).toLocaleDateString('es-CL')}</span>
                                </div>
                              </div>
                              <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center">
                                <span className="text-xs text-muted-foreground md:hidden">Kg Iniciales:</span>
                                <span className="font-display">{kg.toFixed(1)} kg</span>
                              </div>
                              <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center">
                                <span className="text-xs text-muted-foreground md:hidden">Rendimiento:</span>
                                <span className="text-muted-foreground text-sm">
                                  {rendimiento ? `~${rendimiento} frascos` : '-'}
                                </span>
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
    </div>
  );
}
