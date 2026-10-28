'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  ViewLoading,
  LoadingOverlay,
  Button,
  ImmersiveModal,
  formatCLP,
  MoneyInput,
  toast,
  SkeletonTable,
} from '@enjambre/ui';
import {
  TrendingUp,
  BookOpen,
  Plus,
  Link2,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Coins,
  CalendarDays,
  Eye,
  Pencil,
  Hammer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { RecetaForm } from '@/components/costeo/RecetaForm';
import { RecetaDetailModal } from '@/components/costeo/RecetaDetailModal';
import { RecetaProduccionModal } from '@/components/costeo/RecetaProduccionModal';
import { EscandalloTorta } from '@/components/costeo/EscandalloTorta';
import { TemporadaPanel } from '@/components/costeo/TemporadaPanel';
import type { RecipeDetail } from '@/lib/costeo-types';
import { cn } from '@/lib/cn';

interface MargenRow {
  recipe_id?: string;
  nombre_producto?: string;
  producto_nombre?: string;
  producto_id?: string;
  costo_total?: number | string;
  costo_frasco?: number | string;
  costo?: number;
  precio_venta?: number | string;
  precio?: number;
  margen_bruto?: number;
  margen_frasco?: number | string;
  margen_clp?: number;
  margen_pct?: number | string;
  rendimiento_frascos?: number;
}

interface RecetaRow {
  id: string;
  version: number;
  rendimiento_frascos: number;
  merma_pct: number;
  costo_empaque: number;
  producto_id?: string;
  productos?: { id?: string; nombre?: string; formato?: string; precio?: number; stock?: number };
}

type CosteoTab = 'recetas' | 'margenes' | 'escandallo' | 'temporada' | 'simulador';

export function CosteoView() {
  const [activeTab, setActiveTab] = useState<CosteoTab>('recetas');
  const [showRecetaModal, setShowRecetaModal] = useState(false);
  const [editingRecetaId, setEditingRecetaId] = useState<string | null>(null);
  const [selectedRecetaId, setSelectedRecetaId] = useState<string | null>(null);
  const [produccionReceta, setProduccionReceta] = useState<RecipeDetail | null>(null);
  const [escandalloRecetaId, setEscandalloRecetaId] = useState('');

  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  // Parámetros del simulador de escandallo unitario
  const [gramosMiel, setGramosMiel] = useState<number>(500);
  const [costoKiloMiel, setCostoKiloMiel] = useState<number>(6000);
  const [costoFrasco, setCostoFrasco] = useState<number>(850);
  const [costoTapa, setCostoTapa] = useState<number>(320);
  const [costoEtiqueta, setCostoEtiqueta] = useState<number>(450);
  const [costoManoObra, setCostoManoObra] = useState<number>(500);

  // Precios por canal para simulación
  const [precioWeb, setPrecioWeb] = useState<number>(14900);
  const [precioFeria, setPrecioFeria] = useState<number>(12000);
  const [precioClub, setPrecioClub] = useState<number>(10500);
  const [precioB2b, setPrecioB2b] = useState<number>(8500);

  const costoMielFrasco = Math.round((gramosMiel / 1000) * costoKiloMiel);
  const costoProduccionUnitario = costoMielFrasco + costoFrasco + costoTapa + costoEtiqueta + costoManoObra;

  const canales = [
    {
      id: 'web',
      nombre: 'Web D2C (Tienda)',
      precio: precioWeb,
      setPrecio: setPrecioWeb,
      comisionLabel: 'Pasarela 3.1%',
      comisionMonto: Math.round(precioWeb * 0.031),
      netoPercibido: Math.round(precioWeb * (1 - 0.031)) - costoProduccionUnitario,
      margenPct: precioWeb > 0 ? Math.round(((Math.round(precioWeb * (1 - 0.031)) - costoProduccionUnitario) / precioWeb) * 100) : 0,
    },
    {
      id: 'feria',
      nombre: 'Feria POS (Campo)',
      precio: precioFeria,
      setPrecio: setPrecioFeria,
      comisionLabel: 'Comisión Rep (15%) + POS (1.6%)',
      comisionMonto: Math.round(precioFeria * 0.166),
      netoPercibido: Math.round(precioFeria * (1 - 0.166)) - costoProduccionUnitario,
      margenPct: precioFeria > 0 ? Math.round(((Math.round(precioFeria * (1 - 0.166)) - costoProduccionUnitario) / precioFeria) * 100) : 0,
    },
    {
      id: 'club',
      nombre: 'Club Legado (Suscripción)',
      precio: precioClub,
      setPrecio: setPrecioClub,
      comisionLabel: 'Pasarela Recurrente 2.8%',
      comisionMonto: Math.round(precioClub * 0.028),
      netoPercibido: Math.round(precioClub * (1 - 0.028)) - costoProduccionUnitario,
      margenPct: precioClub > 0 ? Math.round(((Math.round(precioClub * (1 - 0.028)) - costoProduccionUnitario) / precioClub) * 100) : 0,
    },
    {
      id: 'b2b',
      nombre: 'B2B Mayorista / Mesa',
      precio: precioB2b,
      setPrecio: setPrecioB2b,
      comisionLabel: 'Directo / Factura ($0 pasarela)',
      comisionMonto: 0,
      netoPercibido: precioB2b - costoProduccionUnitario,
      margenPct: precioB2b > 0 ? Math.round(((precioB2b - costoProduccionUnitario) / precioB2b) * 100) : 0,
    },
  ];

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
      if (m.recipe_id) map.set(m.recipe_id, m);
      const key = m.producto_id || m.nombre_producto || m.producto_nombre || '';
      if (key && !map.has(key)) map.set(key, m);
      if (m.nombre_producto) map.set(m.nombre_producto, m);
      if (m.producto_nombre) map.set(m.producto_nombre, m);
    }
    return map;
  }, [margenes]);

  const resolveMargen = (r: RecetaRow): MargenRow | undefined => {
    if (r.id && margenByProducto.has(r.id)) {
      return margenByProducto.get(r.id);
    }
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
        eyebrow="Producción & Finanzas"
        title="Costeo & Escandallo"
        subtitle="Colección de fórmulas maestras, escandallo unitario por presentación y simulador de márgenes por canal comercial."
        icon={<TrendingUp size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="costeo-tabs"
        tabs={[
          { id: 'recetas', label: 'Recetas', icon: <BookOpen size={16} /> },
          { id: 'margenes', label: 'Rentabilidad', icon: <TrendingUp size={16} /> },
          { id: 'escandallo', label: 'Escandallo', icon: <Coins size={16} /> },
          { id: 'temporada', label: 'Temporadas', icon: <CalendarDays size={16} /> },
          { id: 'simulador', label: 'Escandallo & Canales', icon: <Calculator size={16} /> },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as CosteoTab)}
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
                <h2 className="text-base font-semibold">Colección de recetas maestras</h2>
                <p className="text-sm text-muted-foreground">
                  Fórmulas de producción con rendimiento, merma y rentabilidad unitaria real. Toca una receta para abrirla.
                </p>
              </div>
              <Button
                className="min-h-11 shrink-0"
                onClick={() => {
                  setEditingRecetaId(null);
                  setShowRecetaModal(true);
                }}
              >
                <Plus size={16} className="mr-1" /> Nueva receta
              </Button>
            </div>

            <div className="relative">
              {isFetchingRecetas && recetas.length > 0 ? (
                <LoadingOverlay label="Actualizando recetas" />
              ) : null}
              {isLoadingRecetas ? (
                <SkeletonTable rows={4} columns={5} />
              ) : recetas.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center space-y-3">
                    <p className="text-muted-foreground text-sm">
                      No hay recetas registradas. Crea la primera fórmula para visualizar la rentabilidad aquí mismo.
                    </p>
                    <Button
                      onClick={() => {
                        setEditingRecetaId(null);
                        setShowRecetaModal(true);
                      }}
                    >
                      <Plus size={16} className="mr-1" /> Primera receta
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {recetas.map((r) => {
                    const m = resolveMargen(r);
                    const precio = Number(
                      m?.precio_venta ?? m?.precio ?? r.productos?.precio ?? 0,
                    );

                    // Matemática unitaria corregida
                    let costoUnitario = Number(m?.costo_frasco ?? 0);
                    if (costoUnitario === 0 && Number(m?.costo_total || 0) > 0) {
                      costoUnitario = Math.ceil(Number(m?.costo_total) / Math.max(1, r.rendimiento_frascos));
                    }
                    if (costoUnitario === 0 && Number(m?.costo || 0) > 0) {
                      costoUnitario = Number(m?.costo);
                    }

                    const costoTotalLote = Number(m?.costo_total ?? (costoUnitario * r.rendimiento_frascos));
                    const margenUnitario = Number(
                      m?.margen_frasco ?? (precio > 0 && costoUnitario > 0 ? precio - costoUnitario : 0),
                    );
                    const margenPct = Number(
                      m?.margen_pct ?? (precio > 0 ? (margenUnitario / precio) * 100 : 0),
                    );
                    const bar = Math.max(0, Math.min(100, margenPct));
                    const tone =
                      margenPct >= 40 ? 'success' : margenPct >= 20 ? 'warning' : 'danger';

                    return (
                      <Card
                        key={r.id}
                        className="overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-md transition-all group flex flex-col justify-between"
                      >
                        <div
                          className="p-5 pb-3 cursor-pointer"
                          onClick={() => setSelectedRecetaId(r.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
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

                          <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3">
                            <div className="rounded-lg bg-muted/40 px-2 py-2">
                              <div className="text-muted-foreground text-[10px]">Rendimiento</div>
                              <div className="font-semibold tabular-nums mt-0.5">
                                {r.rendimiento_frascos === 1 ? '1 un. (unitario)' : `${r.rendimiento_frascos} un.`}
                              </div>
                            </div>
                            <div className="rounded-lg bg-muted/40 px-2 py-2">
                              <div className="text-muted-foreground text-[10px]">Merma</div>
                              <div className="font-semibold tabular-nums mt-0.5">
                                {r.merma_pct}%
                              </div>
                            </div>
                            <div className="rounded-lg bg-muted/40 px-2 py-2">
                              <div className="text-muted-foreground text-[10px]">Empaque</div>
                              <div className="font-semibold tabular-nums mt-0.5 text-[0.7rem]">
                                {formatCLP(r.costo_empaque)}
                              </div>
                            </div>
                          </div>

                          {precio > 0 || costoUnitario > 0 ? (
                            <div className="space-y-2 pt-3">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Rentabilidad unitaria</span>
                                <Badge variant={tone}>
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
                              <div className="flex justify-between text-[0.7rem] tabular-nums text-muted-foreground pt-0.5">
                                <span>Costo {formatCLP(costoUnitario)}</span>
                                <span>Venta {formatCLP(precio)}</span>
                                <span
                                  className={cn(
                                    'font-semibold',
                                    margenUnitario >= 0 ? 'text-foreground' : 'text-destructive',
                                  )}
                                >
                                  {formatCLP(margenUnitario)}
                                </span>
                              </div>
                              <div className="flex justify-between text-[10px] text-muted-foreground/80 border-t border-border/40 pt-1.5">
                                {r.rendimiento_frascos === 1 ? (
                                  <span>Fórmula por unidad individual</span>
                                ) : (
                                  <>
                                    <span>Total lote ({r.rendimiento_frascos} un): {formatCLP(costoTotalLote)}</span>
                                    <span>Venta lote: {formatCLP(precio * r.rendimiento_frascos)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground pt-3">
                              Sin margen calculado — completa costos de insumos en Inventario.
                            </p>
                          )}
                        </div>

                        {/* Botones de acción directa en la tarjeta */}
                        <div className="px-5 py-3 border-t border-border/60 bg-muted/10 flex items-center justify-between gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                            onClick={() => setSelectedRecetaId(r.id)}
                          >
                            <Eye size={13} className="mr-1" /> Ver detalles
                          </Button>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 px-2.5"
                              onClick={() => {
                                setEditingRecetaId(r.id);
                                setShowRecetaModal(true);
                              }}
                            >
                              <Pencil size={13} className="mr-1" /> Editar
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              className="text-xs h-8 px-2.5"
                              onClick={async () => {
                                try {
                                  const res = await apiFetch(`/api/costeo/recetas/${r.id}`);
                                  if (res.ok) {
                                    const json = await res.json();
                                    setProduccionReceta(json.data);
                                  }
                                } catch {
                                  toast.error('No se pudo abrir la orden de producción');
                                }
                              }}
                            >
                              <Hammer size={13} className="mr-1" /> Producir
                            </Button>
                          </div>
                        </div>
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
                <CardTitle>Rentabilidad comercial por producto</CardTitle>
                <CardDescription>
                  Márgenes unitarios por presentación y balance total por tanda de fabricación.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative">
                {isFetchingMargenes && margenes.length > 0 ? (
                  <LoadingOverlay label="Actualizando márgenes" />
                ) : null}
                {isLoadingMargenes ? (
                  <SkeletonTable rows={5} columns={6} />
                ) : margenes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No hay datos de rentabilidad. Crea recetas y mantén actualizados los costos de insumos en
                    Inventario.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {margenes.map((m, idx) => {
                      const rendimiento = Number(m.rendimiento_frascos || 1);
                      let costoUnitario = Number(m.costo_frasco ?? 0);
                      if (costoUnitario === 0 && Number(m.costo_total || 0) > 0) {
                        costoUnitario = Math.ceil(Number(m.costo_total) / Math.max(1, rendimiento));
                      }
                      if (costoUnitario === 0 && Number(m.costo || 0) > 0) {
                        costoUnitario = Number(m.costo);
                      }

                      const precio = Number(m.precio_venta || m.precio || 0);
                      const margenUnitario = Number(
                        m.margen_frasco ?? (precio > 0 && costoUnitario > 0 ? precio - costoUnitario : 0),
                      );
                      const margenPct = Number(
                        m.margen_pct ?? (precio > 0 ? (margenUnitario / precio) * 100 : 0),
                      );
                      const costoTotalLote = Number(m.costo_total ?? (costoUnitario * rendimiento));
                      const bar = Math.max(0, Math.min(100, margenPct));

                      return (
                        <div
                          key={idx}
                          className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {m.nombre_producto || m.producto_nombre || 'Producto'}
                              </span>
                              {m.recipe_id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-xs text-primary"
                                  onClick={() => setSelectedRecetaId(m.recipe_id!)}
                                >
                                  Ver receta
                                </Button>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Lote de {rendimiento} unidades · Costo total lote: {formatCLP(costoTotalLote)}
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
                                Costo Unitario
                              </div>
                              <div className="text-foreground font-medium">{formatCLP(costoUnitario)}</div>
                            </div>
                            <div>
                              <div className="text-[0.65rem] uppercase text-muted-foreground">
                                Venta Catálogo
                              </div>
                              <div className="text-primary font-medium">{formatCLP(precio)}</div>
                            </div>
                            <div>
                              <div className="text-[0.65rem] uppercase text-muted-foreground">
                                Margen Neto
                              </div>
                              <div className={cn('font-medium', margenUnitario >= 0 ? 'text-foreground' : 'text-destructive')}>
                                {formatCLP(margenUnitario)}
                              </div>
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

        {activeTab === 'escandallo' && (
          <motion.div
            key="escandallo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <h2 className="text-base font-semibold">Escandallo visual unitario</h2>
                <p className="text-sm text-muted-foreground">
                  Elige una receta para ver su breakdown real de costos.
                </p>
              </div>
              <select
                value={escandalloRecetaId}
                onChange={(e) => setEscandalloRecetaId(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary min-h-11"
              >
                <option value="">Seleccionar receta…</option>
                {recetas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.productos?.nombre || 'Producto'} · v{r.version}
                  </option>
                ))}
              </select>
            </div>
            {escandalloRecetaId ? (
              <EscandalloTorta
                recetaId={escandalloRecetaId}
                nombre={
                  recetas.find((r) => r.id === escandalloRecetaId)?.productos?.nombre || 'Producto'
                }
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  Selecciona una receta para visualizar su escandallo.
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === 'temporada' && (
          <motion.div
            key="temporada"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <TemporadaPanel />
          </motion.div>
        )}

        {activeTab === 'simulador' && (
          <motion.div
            key="simulador"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna Izquierda: Escandallo Unitario (BOM) */}
              <div className="lg:col-span-5 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Coins className="text-primary" size={18} />
                      Escandallo de Costo Unitario
                    </CardTitle>
                    <CardDescription>
                      Estructura de costos directos (BOM) por unidad terminada lista para la venta.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    {/* Parámetros de materia prima */}
                    <div className="space-y-3 p-3.5 rounded-xl bg-surface-sunken/60 border border-border">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-primary block">
                        1. Materia Prima (Miel de Bosque Nativo)
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-muted-foreground block mb-1">Formato / Presentación (g)</label>
                          <select
                            value={gramosMiel}
                            onChange={(e) => setGramosMiel(Number(e.target.value))}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                          >
                            <option value={250}>250 gramos</option>
                            <option value={500}>500 gramos</option>
                            <option value={1000}>1.000 gramos</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-muted-foreground block mb-1">Costo Miel / Kg ($)</label>
                          <MoneyInput
                            value={costoKiloMiel}
                            onValueChange={setCostoKiloMiel}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 text-[11px] border-t border-border/40 font-mono">
                        <span className="text-muted-foreground">Costo de miel neta:</span>
                        <span className="font-bold text-foreground">{formatCLP(costoMielFrasco)}</span>
                      </div>
                    </div>

                    {/* Parámetros de insumos secos */}
                    <div className="space-y-3 p-3.5 rounded-xl bg-surface-sunken/60 border border-border">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-accent-text block">
                        2. Empaque & Materiales
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-muted-foreground block mb-1">Envase / Frasco ($)</label>
                          <MoneyInput
                            value={costoFrasco}
                            onValueChange={setCostoFrasco}
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground block mb-1">Tapa + Precinto ($)</label>
                          <MoneyInput
                            value={costoTapa}
                            onValueChange={setCostoTapa}
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground block mb-1">Etiqueta Foil ($)</label>
                          <MoneyInput
                            value={costoEtiqueta}
                            onValueChange={setCostoEtiqueta}
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground block mb-1">Envasado & Merma ($)</label>
                          <MoneyInput
                            value={costoManoObra}
                            onValueChange={setCostoManoObra}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Resumen Total Unitario */}
                    <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-primary block">
                          Costo Unitario Total
                        </span>
                        <span className="text-xs text-muted-foreground">Por unidad terminada</span>
                      </div>
                      <div className="text-2xl font-bold font-mono text-primary">
                        {formatCLP(costoProduccionUnitario)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Columna Derecha: Simulador Multicanal */}
              <div className="lg:col-span-7 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Calculator className="text-primary" size={18} />
                        Simulador de Rentabilidad por Canal
                      </span>
                      <span className="text-xs font-mono font-normal text-muted-foreground">
                        Costo base: {formatCLP(costoProduccionUnitario)}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Ajusta los precios de venta para evaluar márgenes netos tras comisiones y tarifas operativas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {canales.map((canal) => {
                        const esPeligro = canal.netoPercibido <= 0;
                        const esEstrecho = canal.margenPct < 25 && !esPeligro;

                        return (
                          <div
                            key={canal.id}
                            className={`rounded-2xl border p-4 space-y-3 transition-all ${
                              esPeligro
                                ? 'border-destructive/60 bg-destructive/5'
                                : esEstrecho
                                ? 'border-warning/60 bg-warning/5'
                                : 'border-border bg-surface-sunken/40 hover:border-primary/40'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-sm text-foreground">{canal.nombre}</h4>
                                <span className="text-[10px] text-muted-foreground block">{canal.comisionLabel}</span>
                              </div>
                              <Badge
                                variant={
                                  esPeligro ? 'danger' : esEstrecho ? 'warning' : 'success'
                                }
                              >
                                {canal.margenPct}%
                              </Badge>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                                Precio Venta Público (CLP)
                              </label>
                              <MoneyInput
                                value={canal.precio}
                                onValueChange={canal.setPrecio}
                              />
                            </div>

                            <div className="pt-2 border-t border-border/60 text-xs space-y-1">
                              <div className="flex justify-between text-muted-foreground text-[11px]">
                                <span>Comisión comercial:</span>
                                <span className="font-mono">-{formatCLP(canal.comisionMonto)}</span>
                              </div>
                              <div className="flex justify-between text-muted-foreground text-[11px]">
                                <span>Costo producción unitario:</span>
                                <span className="font-mono">-{formatCLP(costoProduccionUnitario)}</span>
                              </div>
                              <div className="flex justify-between items-baseline font-semibold pt-1 border-t border-border/40 text-foreground">
                                <span>Margen Neto Unitario:</span>
                                <span className={`font-mono text-sm ${esPeligro ? 'text-destructive' : 'text-success'}`}>
                                  {formatCLP(canal.netoPercibido)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Creación / Edición de Receta */}
      <ImmersiveModal
        open={showRecetaModal}
        onClose={() => {
          setShowRecetaModal(false);
          setEditingRecetaId(null);
        }}
        eyebrow="Costeo"
        title={editingRecetaId ? 'Editar Receta Maestra' : 'Nueva Receta Maestra'}
        size="xl"
        bodyClassName="!p-0"
      >
        <div className="p-5 sm:p-6">
          <RecetaForm
            recetaId={editingRecetaId}
            onSuccess={() => {
              setShowRecetaModal(false);
              setEditingRecetaId(null);
            }}
            onCancel={() => {
              setShowRecetaModal(false);
              setEditingRecetaId(null);
            }}
          />
        </div>
      </ImmersiveModal>

      {/* Modal de Detalle de Receta */}
      <RecetaDetailModal
        recetaId={selectedRecetaId}
        isOpen={Boolean(selectedRecetaId)}
        onClose={() => setSelectedRecetaId(null)}
        onEdit={(id) => {
          setSelectedRecetaId(null);
          setEditingRecetaId(id);
          setShowRecetaModal(true);
        }}
        onProduccion={(r) => {
          setSelectedRecetaId(null);
          setProduccionReceta(r);
        }}
        onViewEscandallo={(id) => {
          setSelectedRecetaId(null);
          setEscandalloRecetaId(id);
          setActiveTab('escandallo');
        }}
      />

      {/* Modal de Registro de Producción de Lote */}
      <RecetaProduccionModal
        receta={produccionReceta}
        isOpen={Boolean(produccionReceta)}
        onClose={() => setProduccionReceta(null)}
      />
    </div>
  );
}
