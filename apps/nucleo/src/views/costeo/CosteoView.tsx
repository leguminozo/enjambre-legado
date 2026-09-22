'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, ViewLoading, LoadingOverlay, Button, ImmersiveModal, formatCLP,
} from '@enjambre/ui';
import { TrendingUp, BookOpen, Plus, Link2, Calculator, AlertTriangle, CheckCircle2, Coins, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { RecetaForm } from '@/components/costeo/RecetaForm';
import { EscandalloTorta } from '@/components/costeo/EscandalloTorta';
import { TemporadaPanel } from '@/components/costeo/TemporadaPanel';
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
type CosteoTab = 'recetas' | 'margenes' | 'escandallo' | 'temporada' | 'simulador';

export function CosteoView() {
  const [activeTab, setActiveTab] = useState<CosteoTab>('recetas');
  const [showRecetaModal, setShowRecetaModal] = useState(false);
  const [escandalloRecetaId, setEscandalloRecetaId] = useState('');
  const apiFetch = useApiFetch();

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
        eyebrow="Producción & Finanzas"
        title="Costeo & Escandallo"
        subtitle="Colección de fórmulas maestras, escandallo unitario por frasco y simulador de márgenes por canal comercial."
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
                              Sin margen calculado aún — completa costos de insumos en Inventario y
                              recalcula.
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
                <h2 className="text-base font-semibold">Escandallo visual por frasco</h2>
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
                      Escandallo de Costo por Frasco
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
                          <label className="text-muted-foreground block mb-1">Formato Frasco (g)</label>
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
                          <input
                            type="number"
                            value={costoKiloMiel}
                            onChange={(e) => setCostoKiloMiel(Number(e.target.value))}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
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
                          <label className="text-muted-foreground block mb-1">Frasco Vidrio ($)</label>
                          <input
                            type="number"
                            value={costoFrasco}
                            onChange={(e) => setCostoFrasco(Number(e.target.value))}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground block mb-1">Tapa + Precinto ($)</label>
                          <input
                            type="number"
                            value={costoTapa}
                            onChange={(e) => setCostoTapa(Number(e.target.value))}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground block mb-1">Etiqueta Foil ($)</label>
                          <input
                            type="number"
                            value={costoEtiqueta}
                            onChange={(e) => setCostoEtiqueta(Number(e.target.value))}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground block mb-1">Envasado & Merma ($)</label>
                          <input
                            type="number"
                            value={costoManoObra}
                            onChange={(e) => setCostoManoObra(Number(e.target.value))}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
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
                        <span className="text-xs text-muted-foreground">Por frasco terminado</span>
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
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">$</span>
                                <input
                                  type="number"
                                  value={canal.precio}
                                  onChange={(e) => canal.setPrecio(Number(e.target.value))}
                                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-mono font-semibold text-foreground focus:outline-none focus:border-primary"
                                />
                              </div>
                            </div>

                            <div className="pt-2 border-t border-border/60 text-xs space-y-1">
                              <div className="flex justify-between text-muted-foreground text-[11px]">
                                <span>Comisión comercial:</span>
                                <span className="font-mono">-{formatCLP(canal.comisionMonto)}</span>
                              </div>
                              <div className="flex justify-between text-muted-foreground text-[11px]">
                                <span>Costo producción frasco:</span>
                                <span className="font-mono">-{formatCLP(costoProduccionUnitario)}</span>
                              </div>
                              <div className="flex justify-between items-baseline font-semibold pt-1 border-t border-border/40 text-foreground">
                                <span>Margen Neto Unitario:</span>
                                <span className={`font-mono text-sm ${esPeligro ? 'text-destructive' : 'text-success'}`}>
                                  {formatCLP(canal.netoPercibido)}
                                </span>
                              </div>
                            </div>

                            {esPeligro && (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-destructive">
                                <AlertTriangle size={12} /> ¡Alerta: Venta a pérdida!
                              </div>
                            )}
                            {esEstrecho && (
                              <div className="flex items-center gap-1.5 text-[10px] font-medium text-warning">
                                <AlertTriangle size={12} /> Margen bajo el estándar deseado (&lt;25%)
                              </div>
                            )}
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
