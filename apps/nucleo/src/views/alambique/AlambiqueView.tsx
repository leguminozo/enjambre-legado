'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  DataTable, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle,
  LoadingOverlay, QRCode, toast, formatCLP, formatCalendarDate, type ColumnDef,
} from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { ProduccionDashboardSkeleton } from '@/components/shared/skeletons';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical, Sprout, Droplets, LayoutDashboard, Plus, Pencil, Trash2,
  QrCode, ExternalLink, Package, Globe2,
} from 'lucide-react';
import { AlambiqueDashboard } from './AlambiqueDashboard';
import { PlantaForm } from './PlantaForm';
import { DestilacionForm } from './DestilacionForm';
import { ProductoForm } from './ProductoForm';
import {
  PARTE_USADA_LABEL, METODO_LABEL, ESTADO_DESTILACION_LABEL,
  TIPO_PRODUCTO_LABEL, DESTINO_LABEL,
  type PlantaRow, type DestilacionRow, type ProductoDestilacionRow, type DashboardData,
} from './alambique-types';

type Tab = 'dashboard' | 'plantas' | 'destilaciones' | 'productos';

const ESTADO_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  planificada: 'default',
  en_proceso: 'warning',
  finalizada: 'success',
  descartada: 'danger',
};

const fmtDate = (iso: string | null | undefined) => formatCalendarDate(iso);

export function AlambiqueView() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t === 'plantas' || t === 'destilaciones' || t === 'productos' || t === 'dashboard') setActiveTab(t);
  }, []);
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  /* ── Queries ── */
  const dashboardQuery = useQuery<{ data: DashboardData }>({
    queryKey: ['alambique', 'dashboard'],
    queryFn: async () => {
      const res = await apiFetch('/api/alambique/dashboard');
      if (!res.ok) throw new Error('Error al obtener métricas');
      return res.json();
    },
  });

  const plantasQuery = useQuery<{ data: PlantaRow[] }>({
    queryKey: ['alambique', 'plantas'],
    queryFn: async () => {
      const res = await apiFetch('/api/alambique/plantas');
      if (!res.ok) throw new Error('Error al cargar materias primas');
      return res.json();
    },
  });

  const destilacionesQuery = useQuery<{ data: DestilacionRow[] }>({
    queryKey: ['alambique', 'destilaciones'],
    queryFn: async () => {
      const res = await apiFetch('/api/alambique/destilaciones');
      if (!res.ok) throw new Error('Error al cargar destilaciones');
      return res.json();
    },
  });

  const productosQuery = useQuery<{ data: ProductoDestilacionRow[] }>({
    queryKey: ['alambique', 'productos'],
    queryFn: async () => {
      const res = await apiFetch('/api/alambique/productos');
      if (!res.ok) throw new Error('Error al cargar productos');
      return res.json();
    },
  });

  /* ── Estado de diálogos ── */
  const [plantaFormOpen, setPlantaFormOpen] = useState(false);
  const [plantaEditing, setPlantaEditing] = useState<PlantaRow | null>(null);
  const [destilacionFormOpen, setDestilacionFormOpen] = useState(false);
  const [destilacionEditing, setDestilacionEditing] = useState<DestilacionRow | null>(null);
  const [productoFormOpen, setProductoFormOpen] = useState(false);
  const [productoEditing, setProductoEditing] = useState<ProductoDestilacionRow | null>(null);
  const [qrTarget, setQrTarget] = useState<DestilacionRow | null>(null);

  /* ── Mutaciones de borrado ── */
  const deleteMutation = useMutation({
    mutationFn: async ({ resource, id }: { resource: 'plantas' | 'destilaciones' | 'productos'; id: string }) => {
      const res = await apiFetch(`/api/alambique/${resource}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al eliminar');
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Registro eliminado', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['alambique'] });
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  const confirmDelete = (label: string, resource: 'plantas' | 'destilaciones' | 'productos', id: string) => {
    if (!window.confirm(`¿Eliminar ${label}? Esta acción no se puede deshacer.`)) return;
    deleteMutation.mutate({ resource, id });
  };

  const isFetching = plantasQuery.isFetching || destilacionesQuery.isFetching || productosQuery.isFetching;

  /* ── Columnas ── */
  const plantaColumns: ColumnDef<PlantaRow>[] = [
    {
      key: 'nombre',
      header: 'Planta',
      sortable: true,
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{p.nombre_comun}</span>
          {p.nombre_cientifico && <span className="text-xs italic text-muted-foreground">{p.nombre_cientifico}</span>}
        </div>
      ),
      csvValue: (p) => `${p.nombre_comun} ${p.nombre_cientifico ?? ''}`,
    },
    { key: 'parte_usada', header: 'Parte', sortable: true, hideBelow: 480, render: (p) => PARTE_USADA_LABEL[p.parte_usada] ?? p.parte_usada, csvValue: (p) => PARTE_USADA_LABEL[p.parte_usada] ?? '' },
    { key: 'estado_material', header: 'Estado', sortable: true, hideBelow: 380, render: (p) => <span className="capitalize">{p.estado_material}</span> },
    { key: 'cantidad_kg', header: 'Cantidad', sortable: true, align: 'right', render: (p) => `${p.cantidad_kg.toLocaleString('es-CL')} kg`, csvValue: (p) => String(p.cantidad_kg) },
    { key: 'origen', header: 'Origen', sortable: true, hideBelow: 560, render: (p) => p.origen ?? '—' },
    { key: 'fecha_recoleccion', header: 'Recolección', sortable: true, hideBelow: 640, render: (p) => fmtDate(p.fecha_recoleccion) },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar"
            onClick={() => { setPlantaEditing(p); setPlantaFormOpen(true); }}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
            onClick={() => confirmDelete(`la materia prima "${p.nombre_comun}"`, 'plantas', p.id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const destilacionColumns: ColumnDef<DestilacionRow>[] = [
    {
      key: 'codigo',
      header: 'Código',
      sortable: true,
      render: (d) => <span className="font-mono text-sm font-medium text-primary">{d.codigo ?? d.id.slice(0, 8).toUpperCase()}</span>,
    },
    {
      key: 'planta',
      header: 'Planta',
      sortable: true,
      hideBelow: 420,
      render: (d) => d.planta?.nombre_comun ?? '—',
      csvValue: (d) => d.planta?.nombre_comun ?? '',
    },
    { key: 'metodo', header: 'Método', sortable: true, hideBelow: 520, render: (d) => METODO_LABEL[d.metodo] ?? d.metodo, csvValue: (d) => METODO_LABEL[d.metodo] ?? '' },
    { key: 'fecha_inicio', header: 'Fecha', sortable: true, hideBelow: 380, render: (d) => fmtDate(d.fecha_inicio), csvValue: (d) => fmtDate(d.fecha_inicio) },
    { key: 'carga_kg', header: 'Carga', sortable: true, align: 'right', render: (d) => `${d.carga_kg.toLocaleString('es-CL')} kg`, csvValue: (d) => String(d.carga_kg) },
    {
      key: 'rendimientos',
      header: 'Rendimientos',
      hideBelow: 640,
      render: (d) => (
        <div className="flex flex-col text-xs">
          <span>{d.rendimiento_hidrolato_ml != null ? `${d.rendimiento_hidrolato_ml.toLocaleString('es-CL')} ml hidrolato` : '—'}</span>
          <span className="text-muted-foreground">{d.rendimiento_aceite_ml != null ? `${d.rendimiento_aceite_ml} ml aceite` : ''}</span>
        </div>
      ),
      csvValue: (d) => `${d.rendimiento_hidrolato_ml ?? ''} ${d.rendimiento_aceite_ml ?? ''}`,
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      render: (d) => <Badge variant={ESTADO_BADGE[d.estado] ?? 'default'}>{ESTADO_DESTILACION_LABEL[d.estado] ?? d.estado}</Badge>,
      csvValue: (d) => d.estado,
    },
    {
      key: 'publico',
      header: 'QR',
      hideBelow: 760,
      render: (d) => (d.publico
        ? <Badge variant="success" className="gap-1"><Globe2 size={12} /> Público</Badge>
        : <span className="text-xs text-muted-foreground">—</span>),
      csvValue: (d) => (d.publico ? 'publico' : ''),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Ver QR"
            onClick={() => setQrTarget(d)}>
            <QrCode size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar"
            onClick={() => { setDestilacionEditing(d); setDestilacionFormOpen(true); }}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
            onClick={() => confirmDelete(`la destilación ${d.codigo ?? ''}`, 'destilaciones', d.id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const productoColumns: ColumnDef<ProductoDestilacionRow>[] = [
    { key: 'tipo', header: 'Tipo', sortable: true, render: (p) => <Badge variant="default">{TIPO_PRODUCTO_LABEL[p.tipo] ?? p.tipo}</Badge>, csvValue: (p) => TIPO_PRODUCTO_LABEL[p.tipo] ?? '' },
    {
      key: 'volumen',
      header: 'Envase',
      sortable: true,
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-medium">{p.volumen_ml.toLocaleString('es-CL')} ml</span>
          {p.envase && <span className="text-xs text-muted-foreground">{p.envase}</span>}
        </div>
      ),
      csvValue: (p) => `${p.volumen_ml} ${p.envase ?? ''}`,
    },
    { key: 'unidades', header: 'Unds', sortable: true, align: 'right', render: (p) => p.unidades, csvValue: (p) => String(p.unidades) },
    { key: 'fecha_envasado', header: 'Envasado', sortable: true, hideBelow: 480, render: (p) => fmtDate(p.fecha_envasado) },
    { key: 'destino', header: 'Destino', sortable: true, hideBelow: 560, render: (p) => DESTINO_LABEL[p.destino] ?? p.destino, csvValue: (p) => DESTINO_LABEL[p.destino] ?? '' },
    {
      key: 'destilacion',
      header: 'Destilación',
      hideBelow: 700,
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs text-primary">{p.destilacion?.codigo ?? '—'}</span>
          <span className="text-xs text-muted-foreground">{p.destilacion?.planta_nombre ?? ''}</span>
        </div>
      ),
      csvValue: (p) => `${p.destilacion?.codigo ?? ''} ${p.destilacion?.planta_nombre ?? ''}`,
    },
    {
      key: 'producto_venta',
      header: 'SKU catálogo',
      hideBelow: 640,
      render: (p) => p.producto_venta
        ? (
          <div className="flex flex-col">
            <span className="text-sm">{p.producto_venta.nombre}</span>
            <span className={`text-xs ${p.producto_venta.stock > 0 ? 'text-success' : 'text-destructive'}`}>
              stock catálogo {p.producto_venta.stock}
            </span>
          </div>
        )
        : <span className="text-xs text-muted-foreground">Sin vínculo</span>,
      csvValue: (p) => (p.producto_venta ? `${p.producto_venta.nombre} (${p.producto_venta.stock})` : ''),
    },
    { key: 'precio_sugerido_clp', header: 'Precio sug.', sortable: true, hideBelow: 420, align: 'right', render: (p) => (p.precio_sugerido_clp != null ? formatCLP(p.precio_sugerido_clp) : '—'), csvValue: (p) => String(p.precio_sugerido_clp ?? '') },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar"
            onClick={() => { setProductoEditing(p); setProductoFormOpen(true); }}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
            onClick={() => confirmDelete('este producto', 'productos', p.id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const plantas = plantasQuery.data?.data ?? [];
  const destilaciones = destilacionesQuery.data?.data ?? [];
  const productos = productosQuery.data?.data ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Alambique"
        title="Alambique"
        subtitle="Materia prima vegetal, corridas del alambique y envasados — la memoria del vapor hecha trazabilidad."
        icon={<FlaskConical size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="alambique-tabs"
        tabs={[
          { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
          { id: 'plantas', label: 'Materias Primas', icon: <Sprout size={16} /> },
          { id: 'destilaciones', label: 'Destilaciones', icon: <FlaskConical size={16} /> },
          { id: 'productos', label: 'Productos', icon: <Droplets size={16} /> },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as Tab)}
      />

      {plantasQuery.isLoading && destilacionesQuery.isLoading ? (
        <ProduccionDashboardSkeleton />
      ) : null}

      <div className="relative">
        {isFetching && plantas.length > 0 ? <LoadingOverlay label="Actualizando alambique" /> : null}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AlambiqueDashboard data={dashboardQuery.data?.data ?? { stats: { total_plantas: 0, total_destilaciones: 0, en_proceso: 0, total_hidrolato_ml: 0, total_aceite_ml: 0, rendimiento_ml_por_kg: 0 }, por_planta: [], ultimas: [] }} isLoading={dashboardQuery.isLoading} />
            </motion.div>
          )}

          {activeTab === 'plantas' && (
            <motion.div key="plantas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle>Materias primas</CardTitle>
                    <CardDescription>Plantas registradas antes de entrar al alambique.</CardDescription>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => { setPlantaEditing(null); setPlantaFormOpen(true); }}>
                    <Plus size={16} className="mr-1.5" /> Nueva materia prima
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <DataTable<PlantaRow>
                    columns={plantaColumns}
                    rows={plantas}
                    getId={(p) => p.id}
                    sortable
                    exportable
                    columnsControl
                    storageKey="alambique-plantas"
                    fullscreen
                    fullscreenLabel="Materias primas — Alambique"
                    exportFilename="alambique-materias-primas"
                    emptyState="Aún no hay materias primas registradas."
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'destilaciones' && (
            <motion.div key="destilaciones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle>Destilaciones</CardTitle>
                    <CardDescription>Corridas del alambique con sus variables y rendimientos.</CardDescription>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => { setDestilacionEditing(null); setDestilacionFormOpen(true); }}>
                    <Plus size={16} className="mr-1.5" /> Nueva destilación
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <DataTable<DestilacionRow>
                    columns={destilacionColumns}
                    rows={destilaciones}
                    getId={(d) => d.id}
                    sortable
                    exportable
                    columnsControl
                    storageKey="alambique-destilaciones"
                    fullscreen
                    fullscreenLabel="Destilaciones — Alambique"
                    exportFilename="alambique-destilaciones"
                    emptyState="Aún no hay destilaciones registradas."
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'productos' && (
            <motion.div key="productos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle>Productos envasados</CardTitle>
                    <CardDescription>Hidrolatos y aceites esenciales listos para venta o uso propio.</CardDescription>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => { setProductoEditing(null); setProductoFormOpen(true); }}>
                    <Plus size={16} className="mr-1.5" /> Nuevo producto
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <DataTable<ProductoDestilacionRow>
                    columns={productoColumns}
                    rows={productos}
                    getId={(p) => p.id}
                    sortable
                    exportable
                    columnsControl
                    storageKey="alambique-productos"
                    fullscreen
                    fullscreenLabel="Productos envasados — Alambique"
                    exportFilename="alambique-productos"
                    emptyState="Aún no hay productos envasados."
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Formularios */}
      <PlantaForm open={plantaFormOpen} onOpenChange={setPlantaFormOpen} initial={plantaEditing} />
      <DestilacionForm open={destilacionFormOpen} onOpenChange={setDestilacionFormOpen} initial={destilacionEditing} />
      <ProductoForm open={productoFormOpen} onOpenChange={setProductoFormOpen} initial={productoEditing} />

      {/* QR de trazabilidad */}
      <Dialog open={qrTarget !== null} onOpenChange={(open) => { if (!open) setQrTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode size={18} className="text-primary" />
              Trazabilidad — {qrTarget?.codigo ?? ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {qrTarget && (
              <QRCode value={`${window.location.origin}/alambique/${qrTarget.id}`} size={200} className="mx-auto" />
            )}
            <div className="text-center space-y-2">
              <p className="text-sm text-foreground break-all">
                {window.location.origin}/alambique/{qrTarget?.id}
              </p>
              {qrTarget?.publico ? (
                <>
                  <p className="text-xs text-muted-foreground">Página pública de trazabilidad habilitada.</p>
                  <Button variant="outline" size="sm" onClick={() => window.open(`/alambique/${qrTarget.id}`, '_blank', 'noreferrer')}>
                    <ExternalLink size={14} className="mr-1.5" /> Abrir página pública
                  </Button>
                </>
              ) : (
                <p className="text-xs text-warning bg-warning/10 border border-warning/20 rounded-lg p-3">
                  Esta destilación aún no es pública. Edítala y activa «Trazabilidad pública (QR)» para habilitar la página.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
