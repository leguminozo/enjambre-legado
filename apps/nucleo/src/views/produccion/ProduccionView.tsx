'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Spinner
} from '@enjambre/ui';
import { formatCLP } from '@enjambre/ui';
import { 
  Activity, Package, AlertTriangle, Layers, Calendar, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ProduccionView() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lotes'>('dashboard');
  const apiFetch = useApiFetch();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['produccion', 'dashboard'],
    queryFn: async () => {
      const res = await apiFetch('/api/produccion/dashboard');
      if (!res.ok) throw new Error('Error al obtener datos de producción');
      return res.json();
    },
  });

  const data = dashboardData?.data || { lotes: [], productos: [], stats: {} };
  const { lotes, productos, stats } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">Producción e Inventario</h1>
          <p className="text-muted-foreground mt-1">
            Control de lotes de miel, envasado y proyecciones de quiebre de stock basado en demanda real.
          </p>
        </div>
        
        <div className="flex bg-surface-sunken p-1 rounded-lg border border-border w-fit">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'dashboard' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity size={16} />
            Alertas de Stock
          </button>
          <button
            onClick={() => setActiveTab('lotes')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'lotes' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers size={16} />
            Lotes Activos
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Spinner className="w-8 h-8 text-primary" /></div>
      ) : (
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-surface-sunken">
                        <tr>
                          <th className="px-4 py-3">Producto</th>
                          <th className="px-4 py-3 text-center">Stock Actual</th>
                          <th className="px-4 py-3 text-center">Demanda 30D</th>
                          <th className="px-4 py-3 text-center">Días Estimados</th>
                          <th className="px-4 py-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...productos].sort((a,b) => a.dias_stock_estimado - b.dias_stock_estimado).map((p: any) => {
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
                            <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-sunken/50">
                              <td className="px-4 py-3 font-medium">
                                {p.nombre} {p.formato && <span className="text-xs text-muted-foreground">({p.formato})</span>}
                              </td>
                              <td className="px-4 py-3 text-center font-display text-lg">
                                {stock}
                              </td>
                              <td className="px-4 py-3 text-center text-muted-foreground">
                                {demanda} und
                              </td>
                              <td className="px-4 py-3 text-center font-medium">
                                {dias === 999 ? '∞' : `${dias} días`}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant={badgeStatus}>{label}</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-surface-sunken">
                          <tr>
                            <th className="px-4 py-3">Código Lote</th>
                            <th className="px-4 py-3">Producto/Destino</th>
                            <th className="px-4 py-3">Fecha</th>
                            <th className="px-4 py-3">Kg Iniciales</th>
                            <th className="px-4 py-3">Rendimiento Estimado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lotes.map((l: any) => {
                            const kg = Number(l.kg_total || 0);
                            const productoKg = l.productos ? (Number(l.productos.peso_neto_g || 1000) / 1000) : null;
                            const rendimiento = productoKg ? Math.floor(kg / productoKg) : null;

                            return (
                              <tr key={l.id} className="border-b border-border last:border-0 hover:bg-surface-sunken/50">
                                <td className="px-4 py-3 font-mono font-medium text-primary">
                                  {l.codigo || l.id.substring(0,8).toUpperCase()}
                                </td>
                                <td className="px-4 py-3">
                                  {l.productos?.nombre || 'General / Sin Asignar'}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground flex items-center gap-1">
                                  <Calendar size={14} />
                                  {new Date(l.created_at).toLocaleDateString('es-CL')}
                                </td>
                                <td className="px-4 py-3 font-display">
                                  {kg.toFixed(1)} kg
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {rendimiento ? `~${rendimiento} frascos` : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
