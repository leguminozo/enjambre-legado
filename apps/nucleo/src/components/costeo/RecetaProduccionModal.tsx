'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ImmersiveModal,
  Button,
  Badge,
  toast,
  formatCLP,
} from '@enjambre/ui';
import {
  Hammer,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { RecipeDetail } from '@/lib/costeo-types';
import { cn } from '@/lib/cn';

export interface RecetaProduccionModalProps {
  receta: RecipeDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecetaProduccionModal({
  receta,
  isOpen,
  onClose,
}: RecetaProduccionModalProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const [cantidadLotes, setCantidadLotes] = useState<number>(1);
  const [deducirInventario, setDeducirInventario] = useState<boolean>(true);
  const [notas, setNotas] = useState<string>('');

  const produccionMutation = useMutation({
    mutationFn: async () => {
      if (!receta) return;
      const res = await apiFetch(`/api/costeo/recetas/${receta.id}/producir`, {
        method: 'POST',
        body: JSON.stringify({
          cantidad_lotes: cantidadLotes,
          deducir_inventario: deducirInventario,
          notas: notas.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al registrar producción');
      }
      return res.json();
    },
    onSuccess: (data) => {
      const frascos = data.data?.frascos_producidos ?? cantidadLotes * (receta?.rendimiento_frascos ?? 0);
      toast.success(`Producción registrada: +${frascos} frascos añadidos al stock de catálogo.`);
      queryClient.invalidateQueries({ queryKey: ['costeo'] });
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Error al registrar producción');
    },
  });

  if (!isOpen || !receta) return null;

  const rendimiento = receta.rendimiento_frascos || 1;
  const frascosTotales = rendimiento * cantidadLotes;
  const prod = receta.productos;

  // Chequeo de insumos
  const insumosRequeridos = receta.lines.map((l) => {
    const ing = l.ingredients;
    const inv = l.inventario_item;
    const unit = l.unidad || ing?.unidad || 'unidad';
    const requerida = Number((Number(l.cantidad) * cantidadLotes).toFixed(2));
    const disponible = inv ? Number(inv.stock) : null;
    const suficiente = disponible === null || disponible >= requerida;

    return {
      nombre: ing?.nombre || 'Insumo',
      requerida,
      unit,
      disponible,
      suficiente,
      invItem: inv,
    };
  });

  const hayInsuficiente = insumosRequeridos.some((i) => !i.suficiente);

  return (
    <ImmersiveModal
      open={isOpen}
      onClose={onClose}
      eyebrow="Orden de Fabricación"
      title="Registrar Lote de Producción"
      size="lg"
    >
      <div className="space-y-6">
        {/* Parámetros de la orden de producción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Cantidad de lotes a elaborar
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={cantidadLotes}
              onChange={(e) => setCantidadLotes(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-3 flex flex-col justify-center">
            <div className="text-xs text-muted-foreground">Frascos terminados resultantes</div>
            <div className="text-xl font-bold font-mono text-primary mt-0.5">
              +{frascosTotales} <span className="text-sm font-normal text-foreground">unidades</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Stock catálogo pasará de {prod?.stock ?? 0} a {(prod?.stock ?? 0) + frascosTotales}
            </div>
          </div>
        </div>

        {/* Verificación de inventario operativo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Consumo estimado de insumos & envases
            </h4>
            <span className="text-xs text-muted-foreground">
              {insumosRequeridos.length} insumos en receta
            </span>
          </div>

          <div className="border border-border rounded-xl divide-y divide-border bg-card overflow-hidden">
            {insumosRequeridos.map((ins, idx) => (
              <div
                key={idx}
                className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{ins.nombre}</div>
                  <div className="text-muted-foreground">
                    {ins.disponible !== null ? (
                      <span className={ins.suficiente ? 'text-muted-foreground' : 'text-destructive font-semibold'}>
                        En bodega: {ins.disponible} {ins.unit}
                      </span>
                    ) : (
                      'Insumo sin stock vinculado'
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-semibold text-foreground">
                    {ins.requerida} {ins.unit}
                  </div>
                  {ins.disponible !== null && (
                    <Badge variant={ins.suficiente ? 'success' : 'danger'} className="text-[10px] mt-0.5">
                      {ins.suficiente ? 'Disponible' : 'Insuficiente'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hayInsuficiente && deducirInventario && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-2 text-xs text-destructive">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>
                Atención: Algunos insumos registran stock inferior al requerido en bodega. Puedes continuar si ya cuentas con el material físico o ajustar los lotes.
              </span>
            </div>
          )}
        </div>

        {/* Opciones adicionales */}
        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={deducirInventario}
              onChange={(e) => setDeducirInventario(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <span className="text-foreground">
              Deducir insumos automáticamente del Inventario Operativo
            </span>
          </label>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Notas del lote de producción (opcional)
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Elaboración partida especial primavera, lote 24A"
              className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={produccionMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => produccionMutation.mutate()}
            disabled={produccionMutation.isPending}
          >
            <Hammer size={16} className="mr-1.5" />
            {produccionMutation.isPending ? 'Procesando...' : `Confirmar producción (+${frascosTotales} frascos)`}
          </Button>
        </div>
      </div>
    </ImmersiveModal>
  );
}
