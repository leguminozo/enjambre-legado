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

const DEFAULT_VALUES: PuntoVentaFormValues = {
  nombre: '', tipo: 'cafeteria', ciudad: undefined, contacto_nombre: undefined,
  contacto_email: undefined, estado: 'prospecto', publico: false, notas: undefined,
};

function PuntoVentaFormDialog({ open, onOpenChange, initial }: {
  open: boolean; onOpenChange: (v: boolean) => void; initial: PuntoVentaRow | null;
}) {
  const { save } = useMicrocanalResource<PuntoVentaRow>('puntos-venta');
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
    try {
      await save.mutateAsync({
        id: p.id,
        body: {
          nombre: p.nombre,
          tipo: p.tipo,
          ciudad: p.ciudad,
          contacto_nombre: p.contacto_nombre,
          contacto_email: p.contacto_email,
          estado: 'activo',
          publico: true,
          notas: p.notas,
        },
      });
      toast(`Local ${p.nombre} activado exitosamente`, { type: 'success' });
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
                    value={`https://obrerayzangano.cl/cata/${qrTarget.codigo_acceso}`}
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
