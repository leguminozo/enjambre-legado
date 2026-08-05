'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Package,
  FlaskConical,
  Tag,
  Box,
  Hexagon,
  Droplets,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { Button } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { InventarioProductosPanel } from '@/components/produccion/InventarioProductosPanel';
import { InventarioItemsPanel } from '@/components/produccion/InventarioItemsPanel';
import { NuevoInventarioWizard } from '@/components/produccion/NuevoInventarioWizard';
import {
  INVENTARIO_CLASES,
  type InventarioClaseId,
  type InventarioItemClase,
} from '@/lib/inventario-types';
import { cn } from '@/lib/cn';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  package: Package,
  flask: FlaskConical,
  tag: Tag,
  box: Box,
  hexagon: Hexagon,
  droplets: Droplets,
};

/**
 * Hub Inventario: un solo lugar para productos, insumos, etiquetas, envases,
 * apícola y destilación. Entrada principal: «Nuevo inventario».
 */
export function InventarioView() {
  const apiFetch = useApiFetch();
  const [clase, setClase] = useState<InventarioClaseId>('insumo');
  const [alertasPorClase, setAlertasPorClase] = useState<Record<string, number>>({});
  const [alertasTotal, setAlertasTotal] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAlertas = useCallback(async () => {
    try {
      const res = await apiFetch('/api/inventario/alertas');
      const json = res.ok ? await res.json() : { meta: { total: 0, por_clase: {} } };
      const porClase = { ...((json.meta?.por_clase as Record<string, number>) ?? {}) };
      let total = Number(json.meta?.total ?? 0);

      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: prods } = await supabase
          .from('productos')
          .select('id, stock')
          .eq('visible', true);
        const prodAlertas = (prods ?? []).filter(
          (p: { stock: number | null }) => Number(p.stock ?? 0) < 10,
        ).length;
        if (prodAlertas > 0) {
          porClase.producto = prodAlertas;
          total += prodAlertas;
        }
      } catch {
        /* ignore */
      }

      setAlertasPorClase(porClase);
      setAlertasTotal(total);
    } catch {
      /* migración pendiente */
    }
  }, [apiFetch]);

  useEffect(() => {
    void loadAlertas();
  }, [loadAlertas, clase, refreshKey]);

  const meta = INVENTARIO_CLASES.find((c) => c.id === clase)!;

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-500 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <ViewShell
        variant="compact"
        eyebrow="Producción"
        title="Inventario"
        subtitle="Un solo lugar: productos de venta, insumos, etiquetas, envases, material apícola y destilación."
        icon={<Package size={20} />}
        actions={
          <Button
            className="min-h-11 gap-1.5 touch-manipulation"
            onClick={() => setWizardOpen(true)}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo inventario</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        }
      />

      {alertasTotal > 0 && (
        <div
          role="status"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3"
        >
          <AlertTriangle className="text-destructive shrink-0 mt-0.5" size={18} />
          <div className="min-w-0 text-sm">
            <div className="font-semibold text-destructive">
              {alertasTotal} alerta{alertasTotal === 1 ? '' : 's'} de reposición
            </div>
            <p className="text-muted-foreground text-xs mt-0.5">
              Stock en o bajo el mínimo. Revisá la categoría con badge rojo y planificá la compra.
            </p>
          </div>
        </div>
      )}

      <nav
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory"
        aria-label="Categorías de inventario"
      >
        {INVENTARIO_CLASES.map((c) => {
          const Icon = ICONS[c.icon] ?? Package;
          const active = clase === c.id;
          const alertN = alertasPorClase[c.id] ?? 0;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setClase(c.id)}
              className={cn(
                'snap-start shrink-0 inline-flex items-center gap-2 rounded-xl border px-3.5 min-h-11 text-sm font-medium transition-colors touch-manipulation',
                active
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/70 bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="whitespace-nowrap">{c.short}</span>
              {alertN > 0 && (
                <span className="tabular-nums text-[0.65rem] font-bold rounded-full bg-destructive/15 text-destructive px-1.5 py-0.5">
                  {alertN}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <p className="text-xs text-muted-foreground -mt-2 sm:hidden">{meta.description}</p>

      {clase === 'producto' ? (
        <InventarioProductosPanel key={`prod-${refreshKey}`} />
      ) : (
        <InventarioItemsPanel
          key={`${clase}-${refreshKey}`}
          clase={clase as InventarioItemClase}
          label={meta.label}
          description={meta.description}
          hideCreate
          onRequestCreate={() => setWizardOpen(true)}
        />
      )}

      <NuevoInventarioWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initialClase={clase !== 'producto' ? clase : null}
        onCreated={(c) => {
          setClase(c);
          setRefreshKey((k) => k + 1);
          void loadAlertas();
        }}
      />
    </div>
  );
}
