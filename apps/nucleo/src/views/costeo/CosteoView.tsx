'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, ViewLoading, LoadingOverlay, Button, ImmersiveModal, formatCLP,
} from '@enjambre/ui';
import { TrendingUp, BookOpen, Plus, Link2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { RecetaForm } from '@/components/costeo/RecetaForm';
import { cn } from '@/lib/cn';

interface MargenRow {
  nombre_producto?: string;
  producto_nombre?: string;
  producto_id?: string;
  costo_total?: number;
  costo?: number;
  precio_venta?: number;
  precio?: number;
  margen_bruto?: number;
  margen_clp?: number;
  margen_pct?: number;
}

interface RecetaRow {
  id: string;
  version: number;
  rendimiento_frascos: number;
  merma_pct: number;
  costo_empaque: number;
  producto_id?: string;
  productos?: { id?: string; nombre?: string; formato?: string; precio?: number };
}

/**
 * Costeo: solo Recetas + Rentabilidad.
 * Insumos / stock viven en Inventario (hub centralizado).
 */
export function CosteoView() {
  const [activeTab, setActiveTab] = useState<'recetas' | 'margenes'>('recetas');
  const [showRecetaModal, setShowRecetaModal] = useState(false);
  const apiFetch = useApiFetch();

  const { data: margenesData, isLoading: isLoadingMargenes, isFetching: isFetchingMargenes } = useQuery<{ data: MargenRow[] }>({
    queryKey: ['costeo', 'margenes'],
    queryFn: async () => {
      const res = await apiFetch('/api/costeo/margenes');
      if (!res.ok) throw new Error('Error al obtener márgenes');
      return res.json() as Promise<{ data: MargenRow[] }>;
    },
  });

  const { data: recetasData, isLoading: isLoadingRecetas, isFetching: isFetchingRecetas } = useQuery<{ data: RecetaRow[] }>({
    queryKey: ['costeo', 'recetas'],
    queryFn: async () => {
      const res = await apiFetch('/api/costeo/recetas');
      if (!res.ok) throw new Error('Error al obtener recetas');
      return res.json() as Promise<{ data: RecetaRow[] }>;
    },
  });

  const margenes = margenesData?.data || [];
  const recetas = recetasData?.data || [];

  const margenByProducto = useMemo(() => {
    const map = new Map<string, MargenRow>();
    for (const m of margenes) {
      const key =
        m.producto_id ||
        m.nombre_producto ||
        m.producto_nombre ||
        '';
      if (key) map.set(key, m);
      if (m.nombre_producto) map.set(m.nombre_producto, m);
      if (m.producto_nombre) map.set(m.producto_nombre, m);
    }
    return map;
  }, [margenes]);

  const resolveMargen = (r: RecetaRow): MargenRow | undefined => {
    if (r.producto_id && margenByProducto.has(r.producto_id)) {
      return margenByProducto.get(r.producto_id);
    }
    const nombre = r.productos?.nombre;
    if (nombre && margenByProducto.has(nombre)) return margenByProducto.get(nombre);
    return undefined;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Producción"
        title="Costeo"
        subtitle="Colección de recetas maestras y rentabilidad por fórmula. Los insumos se gestionan en Inventario."
        icon={<TrendingUp size={20} />}
        actions={
          <Link
            href="/produccion/inventario"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline min-h-11"
          >
            <Link2 size={16} />
            Ir a Inventario (insumos)
          </Link>
        }
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="costeo-tabs"
        tabs={[
          { id: 'recetas', label: 'Recetas', icon: <BookOpen size={16} /> },
          { id: 'margenes', label: 'Rentabilidad', icon: <TrendingUp size={16} /> },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'recetas' | 'margenes')}
      />

      <AnimatePresence mode="wait">
        {activeTab === 'recetas' && (
          <motion.div
            key="recetas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Colección de recetas</h2>
                <p className="text-sm text-muted-foreground">
                  Cada fórmula muestra rendimiento, merma y rentabilidad cuando hay costo calculado.
                </p>
              </div>
              <Button className="min-h-11 shrink-0" onClick={() => setShowRecetaModal(true)}>
                <Plus size={16} className="mr-1" /> Nueva receta
              </Button>
            </div>

            <div className="relative">
              {isFetchingRecetas && recetas.length > 0 ? (
                <LoadingOverlay label="Actualizando recetas" />
              ) : null}
              {isLoadingRecetas ? (
                <ViewLoading variant="view" label="Recetas" hideLabel />
              ) : recetas.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center space-y-3">
                    <p className="text-muted-foreground text-sm">
                      No hay recetas registradas. Crea la primera fórmula para visualizar la rentabilidad aquí mismo.
                    </p>
                    <Button onClick={() => setShowRecetaModal(true)}>
                      <Plus size={16} className="mr-1" /> Primera receta
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {recetas.map((r) => {
                    const m = resolveMargen(r);
                    const costo = Number(m?.costo_total ?? m?.costo ?? 0);
                    const precio = Number(
                      m?.precio_venta ?? m?.precio ?? r.productos?.precio ?? 0,
                    );
                    const margenBruto = Number(
                      m?.margen_bruto ?? m?.margen_clp ?? (precio > 0 && costo > 0 ? precio - costo : 0),
                    );
                    const margenPct = Number(
                      m?.margen_pct ??
                        (precio > 0 ? (margenBruto / precio) * 100 : 0),
                    );
                    const bar = Math.max(0, Math.min(100, margenPct));
                    const tone =
                      margenPct >= 40 ? 'success' : margenPct >= 20 ? 'warning' : 'danger';

                    return (
                      <Card
                        key={r.id}
                        className="overflow-hidden border-border/60 hover:border-primary/25 transition-colors"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <CardTitle className="text-base truncate">
                                {r.productos?.nombre || 'Producto'}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {r.productos?.formato
                                  ? `Formato ${r.productos.formato} · `
                                  : ''}
                                v{r.version}
                              </CardDescription>
                            </div>
                            <Badge variant="default">v{r.version}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                            <div className="rounded-lg bg-muted/40 px-2 py-2">
                              <div className="text-muted-foreground">Rendimiento</div>
                              <div className="font-semibold tabular-nums mt-0.5">
                                {r.rendimiento_frascos}
                              </div>
                            </div>
                            <div className="rounded-lg bg-muted/40 px-2 py-2">
                              <div className="text-muted-foreground">Merma</div>
                              <div className="font-semibold tabular-nums mt-0.5">
                                {r.merma_pct}%
                              </div>
                            </div>
                            <div className="rounded-lg bg-muted/40 px-2 py-2">
                              <div className="text-muted-foreground">Empaque</div>
                              <div className="font-semibold tabular-nums mt-0.5 text-[0.7rem]">
                                {formatCLP(r.costo_empaque)}
                              </div>
                            </div>
                          </div>

                          {precio > 0 || costo > 0 ? (
                            <div className="space-y-2 pt-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Rentabilidad</span>
                                <Badge
                                  variant={
                                    tone === 'success'
                                      ? 'success'
                                      : tone === 'warning'
                                        ? 'warning'
                                        : 'danger'
                                  }
                                >
                                  {margenPct.toFixed(1)}%
                                </Badge>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    tone === 'success' && 'bg-success',
                                    tone === 'warning' && 'bg-warning',
                                    tone === 'danger' && 'bg-destructive',
                                  )}
                                  style={{ width: `${bar}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[0.7rem] tabular-nums text-muted-foreground">
                                <span>Costo {formatCLP(costo)}</span>
                                <span>Venta {formatCLP(precio)}</span>
                                <span className="text-foreground font-medium">
                                  {formatCLP(margenBruto)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Sin margen calculado aún — completá costos de insumos en Inventario y
                              re-calculá.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

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
                <CardTitle>Rentabilidad comercial</CardTitle>
                <CardDescription>
                  Márgenes por producto. Los insumos y su stock se administran en Inventario; aquí se calcula la
                  lectura de rentabilidad.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative">
                {isFetchingMargenes && margenes.length > 0 ? (
                  <LoadingOverlay label="Actualizando márgenes" />
                ) : null}
                {isLoadingMargenes ? (
                  <ViewLoading variant="view" label="Márgenes" hideLabel />
                ) : margenes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No hay datos de rentabilidad. Crea recetas y mantén actualizados los costos de insumos en
                    Inventario.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {margenes.map((m, idx) => {
                      const costo = Number(m.costo_total || m.costo || 0);
                      const precio = Number(m.precio_venta || m.precio || 0);
                      const margenBruto = Number(
                        m.margen_bruto || m.margen_clp || precio - costo,
                      );
                      const margenPct = Number(
                        m.margen_pct || (precio > 0 ? (margenBruto / precio) * 100 : 0),
                      );
                      const bar = Math.max(0, Math.min(100, margenPct));
                      return (
                        <div
                          key={idx}
                          className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/20"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {m.nombre_producto || m.producto_nombre || 'Producto'}
                            </div>
                            <div className="h-2 mt-2 rounded-full bg-muted overflow-hidden max-w-md">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  margenPct >= 40
                                    ? 'bg-success'
                                    : margenPct >= 20
                                      ? 'bg-warning'
                                      : 'bg-destructive',
                                )}
                                style={{ width: `${bar}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm tabular-nums sm:justify-end">
                            <div>
                              <div className="text-[0.65rem] uppercase text-muted-foreground">
                                Costo
                              </div>
                              <div className="text-destructive font-medium">{formatCLP(costo)}</div>
                            </div>
                            <div>
                              <div className="text-[0.65rem] uppercase text-muted-foreground">
                                Venta
                              </div>
                              <div className="text-primary font-medium">{formatCLP(precio)}</div>
                            </div>
                            <div>
                              <div className="text-[0.65rem] uppercase text-muted-foreground">
                                Margen
                              </div>
                              <div className="font-medium">{formatCLP(margenBruto)}</div>
                            </div>
                            <div className="flex items-end">
                              <Badge
                                variant={
                                  margenPct >= 40
                                    ? 'success'
                                    : margenPct >= 20
                                      ? 'warning'
                                      : 'danger'
                                }
                              >
                                {margenPct.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <ImmersiveModal
        open={showRecetaModal}
        onClose={() => setShowRecetaModal(false)}
        eyebrow="Costeo"
        title="Nueva Receta Maestra"
        size="xl"
        bodyClassName="!p-0"
      >
        <div className="p-5 sm:p-6">
          <RecetaForm
            onSuccess={() => setShowRecetaModal(false)}
            onCancel={() => setShowRecetaModal(false)}
          />
        </div>
      </ImmersiveModal>
    </div>
  );
}
