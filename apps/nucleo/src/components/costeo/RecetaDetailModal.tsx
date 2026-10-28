'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  Badge,
  Button,
  ImmersiveModal,
  ViewLoading,
  formatCLP,
  toast,
} from '@enjambre/ui';
import {
  BookOpen,
  Pencil,
  Trash2,
  PieChart,
  Hammer,
  AlertTriangle,
  Building2,
  Package,
  Layers,
  ArrowRight,
  TrendingUp,
  Boxes,
} from 'lucide-react';
import Link from 'next/link';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { RecipeDetail } from '@/lib/costeo-types';
import { cn } from '@/lib/cn';

export interface RecetaDetailModalProps {
  recetaId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (recetaId: string) => void;
  onProduccion: (receta: RecipeDetail) => void;
  onViewEscandallo: (recetaId: string) => void;
}

export function RecetaDetailModal({
  recetaId,
  isOpen,
  onClose,
  onEdit,
  onProduccion,
  onViewEscandallo,
}: RecetaDetailModalProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: RecipeDetail }>({
    queryKey: ['costeo', 'receta', recetaId],
    queryFn: async () => {
      const res = await apiFetch(`/api/costeo/recetas/${recetaId}`);
      if (!res.ok) throw new Error('Error al cargar la receta');
      return res.json() as Promise<{ data: RecipeDetail }>;
    },
    enabled: Boolean(recetaId && isOpen),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!recetaId) return;
      const res = await apiFetch(`/api/costeo/recetas/${recetaId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar la receta');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Receta desactivada correctamente');
      queryClient.invalidateQueries({ queryKey: ['costeo', 'recetas'] });
      queryClient.invalidateQueries({ queryKey: ['costeo', 'margenes'] });
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar la receta');
    },
  });

  if (!isOpen) return null;

  const receta = data?.data;
  const prod = receta?.productos;
  const costoCalc = receta?.costo_calculado;

  // Matemática normalizada unitaria vs lote
  const rendimiento = receta?.rendimiento_frascos ?? 1;
  const precioVenta = Number(prod?.precio ?? costoCalc?.precio_venta ?? 0);
  const costoUnitario = Number(costoCalc?.costo_por_frasco ?? 0);
  const costoTotalLote = Number(costoCalc?.costo_total_receta ?? (costoUnitario * rendimiento));
  const margenUnitario = precioVenta > 0 && costoUnitario > 0 ? precioVenta - costoUnitario : 0;
  const margenPct = precioVenta > 0 ? (margenUnitario / precioVenta) * 100 : 0;
  const ventaTotalLote = precioVenta * rendimiento;

  const tone = margenPct >= 40 ? 'success' : margenPct >= 20 ? 'warning' : 'danger';

  return (
    <ImmersiveModal
      open={isOpen}
      onClose={onClose}
      eyebrow={receta ? `Fórmula v${receta.version}` : 'Costeo'}
      title={receta ? `${prod?.nombre || 'Producto'} — Fórmula v${receta.version}` : 'Detalle de receta'}
      size="xl"
    >
      {isLoading || !receta ? (
        <div className="py-12">
          <ViewLoading variant="view" label="Cargando detalles de receta" hideLabel />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Header con Producto & Margen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-xs text-muted-foreground">Costo Unitario</div>
              <div className="text-lg font-bold font-mono text-foreground mt-0.5">
                {formatCLP(costoUnitario)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {rendimiento === 1 ? 'Fórmula unitaria (1 un.)' : `Preparación lote: ${formatCLP(costoTotalLote)}`}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-xs text-muted-foreground">Precio Catálogo</div>
              <div className="text-lg font-bold font-mono text-foreground mt-0.5">
                {formatCLP(precioVenta)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {rendimiento === 1 ? 'Precio de venta al público' : `Venta lote (${rendimiento} un.): ${formatCLP(ventaTotalLote)}`}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-xs text-muted-foreground">Margen Neto Unitario</div>
              <div className="text-lg font-bold font-mono text-foreground mt-0.5 flex items-center gap-1.5">
                <span>{formatCLP(margenUnitario)}</span>
              </div>
              <div className="mt-1">
                <Badge variant={tone}>{margenPct.toFixed(1)}%</Badge>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-xs text-muted-foreground">Stock en Catálogo</div>
              <div className="text-lg font-bold font-mono text-foreground mt-0.5">
                {prod?.stock ?? 0} <span className="text-xs font-normal text-muted-foreground">unid.</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Merma: {receta.merma_pct}% · Empaque: {formatCLP(receta.costo_empaque)}
              </div>
            </div>
          </div>

          {/* 2. Lista BOM de Insumos & Conexión a Inventario / Proveedores */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Boxes size={16} className="text-primary" />
                  Estructura de Insumos & Materiales (BOM)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ingredientes vinculados al inventario operativo y sus proveedores.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {receta.lines.length} insumos
              </Badge>
            </div>

            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
              {receta.lines.map((line, idx) => {
                const ing = line.ingredients;
                const inv = line.inventario_item;
                const proveedor = ing?.terceros;
                const lineUnit = line.unidad || ing?.unidad || 'unidad';
                const stockDisponible = inv ? Number(inv.stock) : null;
                const stockAlerta = stockDisponible !== null && stockDisponible < Number(line.cantidad);

                return (
                  <div
                    key={line.id || idx}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm">
                          {ing?.nombre || 'Insumo'}
                        </span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {line.estado}
                        </Badge>
                        {inv?.clase && (
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            {inv.clase}
                          </Badge>
                        )}
                      </div>

                      {/* Proveedor vinculado */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {proveedor ? (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Building2 size={12} />
                            {proveedor.nombre} {proveedor.rut ? `(${proveedor.rut})` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Building2 size={12} />
                            Sin proveedor asignado
                          </span>
                        )}

                        {/* Estado del stock en bodega */}
                        {stockDisponible !== null ? (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 font-mono',
                              stockAlerta ? 'text-destructive font-semibold' : 'text-muted-foreground font-medium',
                            )}
                          >
                            <Package size={12} />
                            Stock bodega: {stockDisponible} {inv?.unidad}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Package size={12} />
                            No enlazado a stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cantidades y costo */}
                    <div className="flex items-center gap-4 text-right tabular-nums self-end sm:self-center shrink-0">
                      <div>
                        <div className="text-xs text-muted-foreground">Cantidad en receta</div>
                        <div className="text-sm font-semibold text-foreground font-mono">
                          {line.cantidad} {lineUnit}
                        </div>
                      </div>

                      {ing?.precio_ref !== undefined && (
                        <div>
                          <div className="text-xs text-muted-foreground">Costo ref.</div>
                          <div className="text-sm font-mono text-muted-foreground">
                            {formatCLP(ing.precio_ref ?? 0)}/{ing?.unidad || lineUnit}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Acciones rápidas de operación */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas desactivar esta receta?')) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 size={14} className="mr-1.5" />
                Eliminar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onViewEscandallo(receta.id);
                }}
              >
                <PieChart size={14} className="mr-1.5" />
                Escandallo
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(receta.id);
                }}
              >
                <Pencil size={14} className="mr-1.5" />
                Editar receta
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onProduccion(receta);
                }}
              >
                <Hammer size={14} className="mr-1.5" />
                Registrar producción
              </Button>
            </div>
          </div>
        </div>
      )}
    </ImmersiveModal>
  );
}
