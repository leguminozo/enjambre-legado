'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Badge, HexagonLoader, ViewLoading, LoadingOverlay,
} from '@enjambre/ui';
import { toast } from '@enjambre/ui';
import { formatCLP } from '@enjambre/ui';
import { 
  CheckCircle, AlertCircle, RefreshCw, 
  History, Settings, FileText, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewShell } from '@/components/layout/ViewShell';
import { ToolActionRail } from '@/components/layout/ToolActionRail';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { EnjTableShell } from '@/components/layout/EnjTableShell';

// Types
interface Propuesta {
  propuesta_id: string;
  tipo_entidad: 'venta' | 'gasto';
  entidad_id: string;
  movimiento_id: string;
  confianza: number;
  detalles: string[];
  movimiento: {
    id: string;
    fecha_contable: string;
    monto: number;
    descripcion: string;
    cuenta_id: string;
    numero_operacion: string;
  };
  entidad: {
    id: string;
    numero?: string;
    fecha_emision?: string;
    fecha?: string;
    monto_total: number;
    estado: string;
    categoria?: string;
  };
}

interface HistorialItem {
  id: string;
  monto: number;
  concepto: string;
  fecha_conciliacion: string;
  tipo_conciliacion: 'manual' | 'automatico';
  confianza: number;
  movimientos: {
    fecha_contable: string;
    descripcion: string;
  };
  ventas?: { numero: string; monto_total: number };
  gastos?: { categoria: string; monto_total: number };
  reglas?: { nombre: string; tipo: string };
}

interface Regla {
  id: string;
  nombre: string;
  tipo: string;
  campo_primario: string;
  operador: string;
  valor_primario: string;
  activo: boolean;
  prioridad: number;
}

export function ConciliacionAutoView() {
  const [activeTab, setActiveTab] = useState<'propuestas' | 'historial' | 'reglas'>('propuestas');
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  // Queries
  const { data: propuestasData, isLoading: isLoadingPropuestas, isFetching: isFetchingPropuestas, refetch: refetchPropuestas } = useQuery({
    queryKey: ['conciliacion', 'propuestas'],
    queryFn: async () => {
      const res = await apiFetch('/api/banco-chile/conciliacion-auto/ejecutar', {
        method: 'POST',
        body: JSON.stringify({ limite: 50 })
      });
      if (!res.ok) throw new Error('Error al ejecutar propuestas');
      return res.json() as Promise<{ propuestas: Propuesta[], total_propuestas: number }>;
    }
  });

  const { data: historialData, isLoading: isLoadingHistorial, isFetching: isFetchingHistorial } = useQuery({
    queryKey: ['conciliacion', 'historial'],
    queryFn: async () => {
      const res = await apiFetch('/api/banco-chile/conciliacion-auto/historial?limite=20');
      if (!res.ok) throw new Error('Error al obtener historial');
      return res.json() as Promise<{ data: HistorialItem[] }>;
    },
    enabled: activeTab === 'historial'
  });

  const { data: reglasData, isLoading: isLoadingReglas, isFetching: isFetchingReglas } = useQuery({
    queryKey: ['conciliacion', 'reglas'],
    queryFn: async () => {
      const res = await apiFetch('/api/banco-chile/conciliacion-auto/reglas');
      if (!res.ok) throw new Error('Error al obtener reglas');
      return res.json() as Promise<{ data: Regla[] }>;
    },
    enabled: activeTab === 'reglas'
  });

  // Mutations
  const aceptarMutation = useMutation({
    mutationFn: async (propuesta: Propuesta) => {
      const res = await apiFetch('/api/banco-chile/conciliacion-auto/aceptar', {
        method: 'POST',
        body: JSON.stringify({
          propuesta_id: propuesta.propuesta_id,
          tipo_entidad: propuesta.tipo_entidad,
          entidad_id: propuesta.entidad_id,
          movimiento_id: propuesta.movimiento_id,
        })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al aceptar propuesta');
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Propuesta aceptada y conciliada', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['conciliacion'] });
    },
    onError: (err: any) => {
      toast(err.message, { type: 'error' });
    }
  });

  const rechazarMutation = useMutation({
    mutationFn: async (propuesta_id: string) => {
      const res = await apiFetch('/api/banco-chile/conciliacion-auto/rechazar', {
        method: 'POST',
        body: JSON.stringify({ propuesta_id, motivo: 'Rechazo manual' })
      });
      if (!res.ok) throw new Error('Error al rechazar propuesta');
      return res.json();
    },
    onSuccess: () => {
      toast('Propuesta rechazada', { type: 'info' });
      queryClient.invalidateQueries({ queryKey: ['conciliacion', 'propuestas'] });
    }
  });

  const propuestas = propuestasData?.propuestas || [];
  const historial = historialData?.data || [];
  const reglas = reglasData?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Banco Chile"
        title="Conciliación Automática"
        subtitle="Emparejamiento inteligente de movimientos del Banco de Chile con facturas y gastos."
        icon={<FileText size={20} />}
      />
      <ToolActionRail context="banco" current="/conciliacion" />

      <ResponsiveTabBar
        variant="pill"
        layoutId="conciliacion-tabs"
        tabs={[
          {
            id: 'propuestas',
            label: 'Propuestas',
            icon: <AlertCircle size={16} />,
            badge: propuestas.length > 0 ? propuestas.length : undefined,
          },
          { id: 'historial', label: 'Historial', icon: <History size={16} /> },
          { id: 'reglas', label: 'Reglas', icon: <Settings size={16} /> },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'propuestas' | 'historial' | 'reglas')}
      />

      <AnimatePresence mode="wait">
        {/* PESTAÑA: PROPUESTAS */}
        {activeTab === 'propuestas' && (
          <motion.div
            key="propuestas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <RefreshCw className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Motor de Conciliación</h3>
                  <p className="text-sm text-muted-foreground">Evaluando movimientos pendientes contra facturas y gastos.</p>
                </div>
              </div>
              <Button onClick={() => refetchPropuestas()} disabled={isFetchingPropuestas} variant="outline">
                {isFetchingPropuestas ? <HexagonLoader size="sm" className="mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Re-evaluar
              </Button>
            </div>

            {isLoadingPropuestas ? (
              <ViewLoading variant="view" label="Propuestas de conciliación" hideLabel />
            ) : propuestas.length === 0 ? (
              <div className="bg-surface-sunken border border-border rounded-xl p-12 text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">Todo al día</h3>
                <p className="text-muted-foreground">No hay movimientos pendientes que coincidan con las reglas actuales.</p>
              </div>
            ) : (
              <div className="space-y-4 relative">
                {isFetchingPropuestas ? <LoadingOverlay label="Re-evaluando propuestas" /> : null}
                <AnimatePresence>
                  {propuestas.map((propuesta) => (
                    <motion.div 
                      key={propuesta.propuesta_id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    >
                      <Card className="overflow-hidden border-border hover:border-primary/30 transition-colors">
                        <div className="bg-surface-sunken px-4 py-2 border-b border-border flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge variant={propuesta.confianza >= 90 ? 'success' : 'warning'} className="font-mono">
                              {propuesta.confianza}% Confianza
                            </Badge>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                              Emparejamiento Sugerido
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => rechazarMutation.mutate(propuesta.propuesta_id)}
                              disabled={rechazarMutation.isPending || aceptarMutation.isPending}
                            >
                              Rechazar
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              onClick={() => aceptarMutation.mutate(propuesta)}
                              disabled={aceptarMutation.isPending || rechazarMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Aprobar
                            </Button>
                          </div>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                          
                          {/* Banco */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground mb-3">
                              <FileText size={16} />
                              <span className="text-xs font-semibold uppercase">Movimiento Banco</span>
                            </div>
                            <p className="text-lg font-medium text-foreground leading-tight">
                              {propuesta.movimiento.descripcion}
                            </p>
                            <p className="text-2xl font-display text-primary">
                              {formatCLP(propuesta.movimiento.monto)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Op: {propuesta.movimiento.numero_operacion || 'N/A'}</span>
                              <span>•</span>
                              <span>{new Date(propuesta.movimiento.fecha_contable).toLocaleDateString('es-CL')}</span>
                            </div>
                          </div>

                          {/* Flecha */}
                          <div className="hidden md:flex justify-center items-center text-muted-foreground/30">
                            <ArrowRight className="w-8 h-8" />
                          </div>

                          {/* ERP */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground mb-3">
                              <FileText size={16} />
                              <span className="text-xs font-semibold uppercase">
                                Registro ERP ({propuesta.tipo_entidad})
                              </span>
                            </div>
                            <p className="text-lg font-medium text-foreground leading-tight">
                              {propuesta.entidad.numero ? `Folio #${propuesta.entidad.numero}` : propuesta.entidad.categoria || 'Registro Interno'}
                            </p>
                            <p className="text-2xl font-display text-foreground">
                              {formatCLP(propuesta.entidad.monto_total)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="default" className="text-[10px] py-0">{propuesta.entidad.estado}</Badge>
                              <span>•</span>
                              <span>{new Date(propuesta.entidad.fecha_emision || propuesta.entidad.fecha || '').toLocaleDateString('es-CL')}</span>
                            </div>
                          </div>

                        </div>
                        {propuesta.detalles.length > 0 && (
                          <div className="px-4 pb-4">
                            <div className="flex gap-2 flex-wrap">
                              {propuesta.detalles.map((d, i) => (
                                <span key={i} className="text-xs px-2 py-1 bg-accent/50 text-muted-foreground rounded-md">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* PESTAÑA: HISTORIAL */}
        {activeTab === 'historial' && (
          <motion.div
            key="historial"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Historial de Conciliaciones</CardTitle>
                <CardDescription>Registro de movimientos bancarios emparejados exitosamente.</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                {isFetchingHistorial && historial.length > 0 ? <LoadingOverlay label="Actualizando historial" /> : null}
                {isLoadingHistorial ? (
                  <ViewLoading variant="view" label="Historial" hideLabel />
                ) : historial.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay registros en el historial.</p>
                ) : (
                  <EnjTableShell>
                    <table className="w-full text-sm text-left data-table">
                      <thead className="text-xs text-muted-foreground uppercase bg-surface-sunken">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg">Fecha Conciliación</th>
                          <th className="px-4 py-3">Movimiento Banco</th>
                          <th className="px-4 py-3">Registro ERP</th>
                          <th className="px-4 py-3">Monto</th>
                          <th className="px-4 py-3">Método</th>
                          <th className="px-4 py-3 rounded-tr-lg">Confianza</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.map((item) => (
                          <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-sunken/50">
                            <td className="px-4 py-3 font-medium">
                              {new Date(item.fecha_conciliacion).toLocaleDateString('es-CL')}
                            </td>
                            <td className="px-4 py-3">
                              <span className="truncate max-w-[200px] block" title={item.movimientos?.descripcion}>
                                {item.movimientos?.descripcion}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {item.ventas?.numero ? `Venta #${item.ventas.numero}` : item.gastos?.categoria ? `Gasto: ${item.gastos.categoria}` : item.concepto}
                            </td>
                            <td className="px-4 py-3 font-display text-primary">
                              {formatCLP(item.monto)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="default" className="capitalize">
                                {item.tipo_conciliacion}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {item.confianza ? `${item.confianza}%` : 'Manual'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </EnjTableShell>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* PESTAÑA: REGLAS */}
        {activeTab === 'reglas' && (
          <motion.div
            key="reglas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Reglas de Automatización</CardTitle>
                  <CardDescription>Criterios lógicos para emparejar automáticamente transacciones.</CardDescription>
                </div>
                <Button variant="outline" disabled>
                  + Nueva Regla
                </Button>
              </CardHeader>
              <CardContent className="relative">
                {isFetchingReglas && reglas.length > 0 ? <LoadingOverlay label="Actualizando reglas" /> : null}
                {isLoadingReglas ? (
                  <ViewLoading variant="view" label="Reglas" hideLabel />
                ) : reglas.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay reglas configuradas.</p>
                ) : (
                  <div className="grid gap-4">
                    {reglas.map((regla) => (
                      <div key={regla.id} className="flex justify-between items-center p-4 rounded-lg border border-border bg-background">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground">{regla.nombre}</h4>
                            {regla.activo ? (
                              <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Activa</Badge>
                            ) : (
                              <Badge variant="default">Inactiva</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Aplica a: <span className="uppercase font-semibold text-foreground/80">{regla.tipo}</span> • Prioridad: {regla.prioridad}
                          </p>
                          <p className="text-xs font-mono bg-surface-sunken p-1.5 rounded mt-2 inline-block">
                            SI {regla.campo_primario} {regla.operador} {regla.valor_primario || '...'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
