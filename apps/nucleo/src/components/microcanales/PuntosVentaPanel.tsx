'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, QrCode, RefreshCw } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, DataTable, Button,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea,
  Select, Badge, ViewLoading, QRCode, toast, type ColumnDef,
} from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import { useMicrocanalResource } from './use-microcanales';
import { FieldLabel } from './shared';
import {
  puntoVentaFormSchema, PUNTO_VENTA_TIPO_OPTIONS, PUNTO_ESTADO_OPTIONS, PUNTO_VENTA_TIPO_LABEL,
  type PuntoVentaRow, type PuntoVentaFormValues,
} from '@/lib/microcanales-types';
import { getUrlTienda } from '@/lib/publicUrls';

const DEFAULT_VALUES: PuntoVentaFormValues = {
  nombre: '', tipo: 'cafeteria', ciudad: undefined, contacto_nombre: undefined,
  contacto_email: undefined, estado: 'prospecto', publico: false, notas: undefined,
};

function PuntoVentaFormDialog({ open, onOpenChange, initial }: {
  open: boolean; onOpenChange: (v: boolean) => void; initial: PuntoVentaRow | null;
}) {
  const apiFetchDialog = useApiFetch();
  const { save } = useMicrocanalResource<PuntoVentaRow>('puntos-venta');

  const verPatenteDialog = async (p: PuntoVentaRow) => {
    try {
      const res = await apiFetchDialog(`/api/b2b/puntos-venta/${p.id}/patente`);
      if (!res.ok) throw new Error('Sin patente');
      const json = (await res.json()) as { data?: { url?: string } };
      if (json.data?.url) window.open(json.data.url, '_blank');
    } catch {
      toast('Sin patente adjunta', { type: 'error' });
    }
  };
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<PuntoVentaFormValues>({
      resolver: zodResolver(puntoVentaFormSchema) as never,
      defaultValues: DEFAULT_VALUES,
    });

  useEffect(() => {
    if (!open) return;
    reset(initial ? {
      nombre: initial.nombre, tipo: initial.tipo, ciudad: initial.ciudad ?? undefined,
      contacto_nombre: initial.contacto_nombre ?? undefined, contacto_email: initial.contacto_email ?? undefined,
      estado: initial.estado, publico: initial.publico, notas: initial.notas ?? undefined,
    } : DEFAULT_VALUES);
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? `Editar ${initial.nombre}` : 'Nuevo punto de venta'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate({ id: initial?.id, body: v }))} className="space-y-4">
          <Input label="Nombre *" placeholder="Café de Providencia…" {...register('nombre')} error={errors.nombre?.message} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel>Tipo *</FieldLabel>
              <Select value={watch('tipo')} onValueChange={(v) => setValue('tipo', v as PuntoVentaFormValues['tipo'])} options={PUNTO_VENTA_TIPO_OPTIONS} />
            </div>
            <Input label="Ciudad" placeholder="Santiago…" {...register('ciudad')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contacto" placeholder="Nombre de la persona" {...register('contacto_nombre')} />
            <Input label="Email de contacto" type="email" {...register('contacto_email')} error={errors.contacto_email?.message} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel>Estado</FieldLabel>
              <Select value={watch('estado')} onValueChange={(v) => setValue('estado', v as PuntoVentaFormValues['estado'])} options={PUNTO_ESTADO_OPTIONS} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={watch('publico')} onChange={(e) => setValue('publico', e.target.checked)} className="accent-primary" />
                Landing pública (QR activo)
              </label>
            </div>
          </div>
          <Textarea label="Notas" rows={2} {...register('notas')} />
          {initial && (initial.rut_empresa || initial.volumen_mensual_clp != null || initial.patente_path) && (
            <div className="rounded-xl border border-border bg-surface-sunken/50 p-3 text-xs space-y-1.5">
              <p className="font-semibold text-foreground">Solicitud de registro</p>
              {initial.rut_empresa && <p className="text-muted-foreground">RUT: <span className="text-foreground font-mono">{initial.rut_empresa}</span></p>}
              {initial.volumen_mensual_clp != null && (
                <p className="text-muted-foreground">
                  Volumen: <span className="text-foreground font-mono">${Number(initial.volumen_mensual_clp).toLocaleString('es-CL')}/mes</span>
                  {initial.tier_sugerido ? ` · ${initial.tier_sugerido}` : ''}
                </p>
              )}
              {initial.contrato_version && (
                <p className="text-muted-foreground">
                  Contrato {initial.contrato_version} aceptado
                  {initial.contrato_aceptado_at ? ` el ${new Date(initial.contrato_aceptado_at).toLocaleDateString('es-CL')}` : ''}
                </p>
              )}
              {initial.patente_path && (
                <button
                  type="button"
                  onClick={() => void verPatenteDialog(initial)}
                  className="text-primary hover:underline font-medium"
                >
                  Ver patente adjunta
                </button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Guardando…' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PuntosVentaPanel() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const { items, isLoading, save, remove } = useMicrocanalResource<PuntoVentaRow>('puntos-venta');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PuntoVentaRow | null>(null);
  const [qrTarget, setQrTarget] = useState<PuntoVentaRow | null>(null);

  const regenerar = async (p: PuntoVentaRow) => {
    if (!window.confirm(`¿Regenerar el código de ${p.nombre}? El QR del pendón dejará de funcionar.`)) return;
    const res = await apiFetch(`/api/b2b/puntos-venta/${p.id}/regenerar-codigo`, { method: 'POST' });
    if (!res.ok) return;
    queryClient.invalidateQueries({ queryKey: ['microcanales'] });
  };

  const activarYNotificar = async (p: PuntoVentaRow) => {
    if (!window.confirm(`¿Aprobar "${p.nombre}"? Se activa el punto, se invita al contacto y se avisa por correo.`)) return;
    try {
      const res = await apiFetch(`/api/b2b/puntos-venta/${p.id}/aprobar`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || 'No se pudo aprobar');
      }
      queryClient.invalidateQueries({ queryKey: ['microcanales'] });
      toast(`Local ${p.nombre} aprobado: credenciales y aviso en curso`, { type: 'success' });
      const text = encodeURIComponent(
        `¡Hola ${p.contacto_nombre || p.nombre}! Tu cuenta de punto de venta en La Obrera y el Zángano ha sido activada.\n\n` +
        `Tu código oficial es: *${p.codigo_acceso}*\n` +
        `Accede a tu portal mayorista y solicita tus Sets de Activación bonificados aquí:\n` +
        `${window.location.origin}/punto-de-venta/portal\n\n` +
        `¡Bienvenidos al bosque nativo!`
      );
      window.open(`https://wa.me/?text=${text}`, '_blank');
    } catch {
      toast('Error al activar el punto de venta', { type: 'error' });
    }
  };

  const columns: ColumnDef<PuntoVentaRow>[] = [
    { key: 'nombre', header: 'Local', sortable: true, render: (p) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{p.nombre}</span>
        <span className="text-xs text-muted-foreground">{p.ciudad ?? '—'}</span>
      </div>), csvValue: (p) => p.nombre },
    { key: 'tipo', header: 'Tipo', sortable: true, hideBelow: 480, render: (p) => <Badge variant="default">{PUNTO_VENTA_TIPO_LABEL[p.tipo] ?? p.tipo}</Badge>, csvValue: (p) => p.tipo },
    { key: 'tier', header: 'Tramo', sortable: false, hideBelow: 760, render: (p) => (
      <div className="flex flex-col text-xs">
        <span className="text-foreground font-medium">{p.tier_sugerido ?? '—'}</span>
        <span className="text-muted-foreground font-mono">
          {p.volumen_mensual_clp != null ? `$${Number(p.volumen_mensual_clp).toLocaleString('es-CL')}/mes` : ''}
        </span>
      </div>), csvValue: (p) => p.tier_sugerido ?? '' },
    { key: 'estado', header: 'Estado', sortable: true, render: (p) => (
      <Badge variant={p.estado === 'activo' ? 'success' : p.estado === 'pausado' ? 'warning' : 'default'}>{p.estado}</Badge>), csvValue: (p) => p.estado },
    { key: 'origen', header: 'Origen', sortable: true, hideBelow: 640, render: (p) => p.origen === 'autonomo' ? 'Autónomo' : 'Marca', csvValue: (p) => p.origen },
    { key: 'codigo_acceso', header: 'Código', sortable: true, hideBelow: 760, render: (p) => <span className="font-mono text-sm text-primary">{p.codigo_acceso}</span>, csvValue: (p) => p.codigo_acceso },
    { key: 'acciones', header: '', align: 'right', render: (p) => (
      <div className="flex items-center justify-end gap-1">
        {p.estado === 'prospecto' && (
          <Button
            variant="outline"
            size="sm"
            className="text-success border-success/40 hover:bg-success/10 text-xs px-2"
            onClick={() => activarYNotificar(p)}
          >
            Aprobar + WA
          </Button>
        )}
        <Button variant="ghost" size="sm" className="min-w-11" aria-label="QR" onClick={() => setQrTarget(p)}><QrCode size={16} /></Button>
        <Button variant="ghost" size="sm" className="min-w-11" aria-label="Regenerar código" onClick={() => regenerar(p)}><RefreshCw size={16} /></Button>
        <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar" onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil size={16} /></Button>
        <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
          onClick={() => { if (window.confirm(`¿Eliminar ${p.nombre}?`)) remove.mutate(p.id); }}>✕</Button>
      </div>),
    },
  ];

  if (isLoading) return <ViewLoading variant="view" label="Microcanales" hideLabel />;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle>Puntos de venta</CardTitle>
          <CardDescription>Cafeterías, tiendas, hoteles y ferias — con su código de acceso (QR del pendón) y origen de registro.</CardDescription>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} className="mr-1.5" /> Nuevo punto de venta
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable<PuntoVentaRow>
          columns={columns} rows={items} getId={(p) => p.id} sortable exportable columnsControl
          storageKey="microcanales-puntos" fullscreen fullscreenLabel="Puntos de venta — Microcanales"
          exportFilename="microcanales-puntos-venta" emptyState="Aún no hay puntos de venta."
        />
      </CardContent>
      <PuntoVentaFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />

      <Dialog open={qrTarget !== null} onOpenChange={(o) => { if (!o) setQrTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Display de Mostrador — {qrTarget?.nombre}</DialogTitle></DialogHeader>
          {qrTarget && (
            <div className="space-y-4">
              {/* Plantilla Editorial Imprimible */}
              <div id="printable-pendon" className="p-6 rounded-2xl border-2 border-primary/40 bg-surface-raised text-center space-y-4 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-medium">
                  La Obrera y el Zángano · Bosque Nativo
                </p>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Ritual de Cata en {qrTarget.nombre}
                </h3>
                <div className="p-3 bg-white rounded-xl inline-block shadow-inner mx-auto">
                  <QRCode
                    value={`${getUrlTienda()}/cata/${qrTarget.codigo_acceso}`}
                    size={160}
                    className="mx-auto"
                  />
                </div>
                <p className="text-xs text-foreground font-medium">
                  Escanea el código con tu celular
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  Evalúa las notas de textura y aroma de esta miel, obtén tu Pasaporte Sensorial y gana puntos de lealtad en este local.
                </p>
                <div className="pt-2 border-t border-border/50 text-[10px] font-mono text-muted-foreground">
                  CÓDIGO: {qrTarget.codigo_acceso}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Imprimir Display
                </Button>
                <Button variant="primary" size="sm" onClick={() => setQrTarget(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
