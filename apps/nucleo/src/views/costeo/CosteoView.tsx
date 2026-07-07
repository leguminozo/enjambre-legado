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
  TrendingUp, BookOpen, Leaf, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { EnjTableShell } from '@/components/layout/EnjTableShell';

export function CosteoView() {
  const [activeTab, setActiveTab] = useState<'margenes' | 'recetas' | 'insumos'>('margenes');
  const apiFetch = useApiFetch();

  const { data: margenesData, isLoading: isLoadingMargenes, isFetching: isFetchingMargenes } = useQuery({
    queryKey: ['costeo', 'margenes'],
    queryFn: async () => {
      const res = await apiFetch('/api/costeo/margenes');
      if (!res.ok) throw new Error('Error al obtener márgenes');
      return res.json();
    },
    enabled: activeTab === 'margenes'
  });

  const { data: recetasData, isLoading: isLoadingRecetas, isFetching: isFetchingRecetas } = useQuery({
    queryKey: ['costeo', 'recetas'],
    queryFn: async () => {
      const res = await apiFetch('/api/costeo/recetas');
      if (!res.ok) throw new Error('Error al obtener recetas');
      return res.json();
    },
    enabled: activeTab === 'recetas'
  });

  const { data: insumosData, isLoading: isLoadingInsumos, isFetching: isFetchingInsumos } = useQuery({
    queryKey: ['costeo', 'ingredientes'],
    queryFn: async () => {
      const res = await apiFetch('/api/costeo/ingredientes');
      if (!res.ok) throw new Error('Error al obtener insumos');
      return res.json();
    },
    enabled: activeTab === 'insumos'
  });

  const margenes = margenesData?.data || [];
  const recetas = recetasData?.data || [];
  const insumos = insumosData?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Finanzas"
        title="Costeo y Rentabilidad"
        subtitle="Análisis de márgenes comerciales, gestión de recetas maestras e insumos."
        icon={<TrendingUp size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="costeo-tabs"
        tabs={[
          { id: 'margenes', label: 'Rentabilidad', icon: <TrendingUp size={16} /> },
          { id: 'recetas', label: 'Recetas', icon: <BookOpen size={16} /> },
          { id: 'insumos', label: 'Insumos', icon: <Leaf size={16} /> },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'margenes' | 'recetas' | 'insumos')}
      />

      <AnimatePresence mode="wait">
        {/* PESTAÑA: MÁRGENES */}
        {activeTab === 'margenes' && (
          <motion.div
            key="margenes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>Márgenes de Comercialización</CardTitle>
                <CardDescription>Rentabilidad teórica por producto basada en el costo actual de los insumos.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative">
                {isFetchingMargenes && margenes.length > 0 ? <LoadingOverlay label="Actualizando márgenes" /> : null}
                {isLoadingMargenes ? (
                  <ViewLoading variant="view" label="Márgenes" hideLabel />
                ) : margenes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay datos de rentabilidad calculados.</p>
                ) : (
                  <EnjTableShell>
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-surface-sunken">
                        <tr>
                          <th className="px-4 py-3">Producto</th>
                          <th className="px-4 py-3">Costo Producción</th>
                          <th className="px-4 py-3">Precio Venta (Neto)</th>
                          <th className="px-4 py-3">Margen CLP</th>
                          <th className="px-4 py-3">Margen %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {margenes.map((m: any, idx: number) => {
                          const costo = Number(m.costo_total || m.costo || 0);
                          const precio = Number(m.precio_venta || m.precio || 0);
                          const margenBruto = Number(m.margen_bruto || m.margen_clp || (precio - costo));
                          const margenPct = Number(m.margen_pct || (precio > 0 ? (margenBruto / precio) * 100 : 0));
                          
                          return (
                            <tr key={idx} className="border-b border-border last:border-0 hover:bg-surface-sunken/50">
                              <td className="px-4 py-3 font-medium">
                                {m.nombre_producto || m.producto_nombre || 'Producto Desconocido'}
                              </td>
                              <td className="px-4 py-3 font-display text-destructive">
                                {formatCLP(costo)}
                              </td>
                              <td className="px-4 py-3 font-display text-primary">
                                {formatCLP(precio)}
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {formatCLP(margenBruto)}
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={margenPct >= 40 ? 'success' : margenPct >= 20 ? 'warning' : 'danger'}>
                                  {margenPct.toFixed(1)}%
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </EnjTableShell>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* PESTAÑA: RECETAS */}
        {activeTab === 'recetas' && (
          <motion.div
            key="recetas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recetas Maestras</CardTitle>
                <CardDescription>Formulaciones base para la producción y cálculo de mermas.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative">
                {isFetchingRecetas && recetas.length > 0 ? <LoadingOverlay label="Actualizando recetas" /> : null}
                {isLoadingRecetas ? (
                  <ViewLoading variant="view" label="Recetas" hideLabel />
                ) : recetas.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay recetas configuradas.</p>
                ) : (
                  <EnjTableShell>
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-surface-sunken">
                        <tr>
                          <th className="px-4 py-3">Producto Final</th>
                          <th className="px-4 py-3">Versión</th>
                          <th className="px-4 py-3">Rendimiento Base</th>
                          <th className="px-4 py-3">Merma Est.</th>
                          <th className="px-4 py-3">Costo Empaque</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recetas.map((r: any) => (
                          <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-sunken/50">
                            <td className="px-4 py-3 font-medium">
                              {r.productos?.nombre || 'Desconocido'} 
                              {r.productos?.formato && <span className="text-muted-foreground text-xs ml-2">({r.productos.formato})</span>}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="default">v{r.version}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              {r.rendimiento_frascos} frascos
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {r.merma_pct}%
                            </td>
                            <td className="px-4 py-3 font-display">
                              {formatCLP(r.costo_empaque)}
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

        {/* PESTAÑA: INSUMOS */}
        {activeTab === 'insumos' && (
          <motion.div
            key="insumos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Directorio de Insumos</CardTitle>
                <CardDescription>Materias primas y empaques utilizados en la regeneración.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative">
                {isFetchingInsumos && insumos.length > 0 ? <LoadingOverlay label="Actualizando insumos" /> : null}
                {isLoadingInsumos ? (
                  <ViewLoading variant="view" label="Insumos" hideLabel />
                ) : insumos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay insumos registrados.</p>
                ) : (
                  <EnjTableShell>
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-surface-sunken">
                        <tr>
                          <th className="px-4 py-3">Nombre</th>
                          <th className="px-4 py-3">Estado Default</th>
                          <th className="px-4 py-3">Categoría</th>
                          <th className="px-4 py-3">Precio Ref (por unidad)</th>
                          <th className="px-4 py-3">Proveedor Ref</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insumos.map((i: any) => (
                          <tr key={i.id} className="border-b border-border last:border-0 hover:bg-surface-sunken/50">
                            <td className="px-4 py-3 font-medium">
                              {i.nombre} <span className="text-xs text-muted-foreground ml-1">({i.unidad})</span>
                            </td>
                            <td className="px-4 py-3 capitalize">
                              <Badge variant="default">{i.estado_default}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              {i.categoria || '-'}
                            </td>
                            <td className="px-4 py-3 font-display">
                              {i.precio_ref ? formatCLP(i.precio_ref) : 'No definido'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {i.proveedor_ref_terceros?.nombre || 'Múltiples / General'}
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
      </AnimatePresence>
    </div>
  );
}
