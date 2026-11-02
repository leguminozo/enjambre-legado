'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Search, Wine } from 'lucide-react';
import { Badge, Button, Card, CardContent, EmptyState, Input, Select } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { ProduccionDashboardSkeleton } from '@/components/shared/skeletons';
import { useHidromielLotes } from '@/components/hidromiel/use-hidromiel-data';
import { NuevoLoteModal } from '@/components/hidromiel/NuevoLoteModal';
import { DetalleLotePanel } from '@/components/hidromiel/DetalleLotePanel';
import { calcularABV } from '@/lib/hidromiel';
import { formatDate } from '@/lib/format';
import type { HidromielLote } from '@/components/hidromiel/types';

const ESTADO_VARIANTE: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'gold' | 'info'> = {
  fermentando: 'info',
  embotellado: 'default',
  carbonatando: 'warning',
  listo: 'success',
  degustado: 'gold',
  descartada: 'destructive',
};

function estadoVariant(estado: string): 'default' | 'success' | 'warning' | 'destructive' | 'gold' | 'info' {
  return ESTADO_VARIANTE[estado.toLowerCase()] ?? 'default';
}

const ESTADOS_FINALES = new Set(['listo', 'degustado', 'descartada']);

/**
 * Hidromiel: herramienta libre de construcción de procesos fermentativos.
 * Cada lote es un lienzo — estado, mediciones, receta y etapas en texto libre,
 * con instrumentos científicos (priming, ABV, costos) que nunca obligan.
 */
export function HidromielView() {
  const { lotes, isLoading, error, queryClient } = useHidromielLotes();
  const [showNuevo, setShowNuevo] = useState(false);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const stats = useMemo(() => {
    const porEstado = new Map<string, number>();
    for (const l of lotes) {
      porEstado.set(l.estado, (porEstado.get(l.estado) ?? 0) + 1);
    }
    const activos = lotes.filter((l) => !ESTADOS_FINALES.has(l.estado.toLowerCase())).length;
    const listos = lotes.filter((l) => ESTADOS_FINALES.has(l.estado.toLowerCase()) && l.estado.toLowerCase() !== 'descartada').length;
    return { total: lotes.length, activos, listos, porEstado };
  }, [lotes]);

  // Filtros derivados de los datos reales (nunca un catálogo impuesto).
  const opcionesEstado = useMemo(() => {
    const unicos = Array.from(new Set(lotes.map((l) => l.estado.toLowerCase())));
    return [{ value: 'todos', label: 'Todos los estados' }, ...unicos.map((e) => ({ value: e, label: e }))];
  }, [lotes]);

  const lotesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return lotes.filter((l) => {
      if (filtroEstado !== 'todos' && l.estado.toLowerCase() !== filtroEstado) return false;
      if (!q) return true;
      return (
        (l.nombre ?? '').toLowerCase().includes(q) ||
        (l.codigo ?? '').toLowerCase().includes(q) ||
        (l.miel_lote?.variedad_floral ?? '').toLowerCase().includes(q)
      );
    });
  }, [lotes, filtroEstado, busqueda]);

  if (isLoading) {
    return <ProduccionDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <ViewShell
        variant="compact"
        eyebrow="PRODUCCIÓN"
        title="Hidromiel"
        greeting="Fermentador del bosque"
        subtitle="Lotes de fermentación: construye tu proceso, mide, registra y traza la miel."
        icon={<Wine className="w-6 h-6" />}
        actions={
          <Button onClick={() => setShowNuevo(true)}>
            <Plus className="w-4 h-4" /> Nuevo lote
          </Button>
        }
      />

      {error ? (
        <EmptyState
          title="No se pudo cargar"
          description={error instanceof Error ? error.message : 'Error desconocido'}
          action={
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['hidromiel'] })}>
              Reintentar
            </Button>
          }
        />
      ) : lotes.length === 0 ? (
        <EmptyState
          icon={<Wine className="w-8 h-8 text-muted-foreground" />}
          title="Todavía no hay lotes"
          description="Crea tu primer lote de hidromiel: solo agua y miel, o lo que tu proceso pida."
          action={
            <Button onClick={() => setShowNuevo(true)}>
              <Plus className="w-4 h-4" /> Nuevo lote
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-surface-sunken px-4 py-3 text-center">
              <p className="text-2xl font-bold text-foreground font-display">{stats.total}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Lotes</p>
            </div>
            <div className="rounded-2xl bg-surface-sunken px-4 py-3 text-center">
              <p className="text-2xl font-bold text-foreground font-display">{stats.activos}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">En proceso</p>
            </div>
            <div className="rounded-2xl bg-surface-sunken px-4 py-3 text-center">
              <p className="text-2xl font-bold text-foreground font-display">{stats.listos}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Listos / degustados</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, código o variedad floral…"
                aria-label="Buscar lotes"
              />
            </div>
            <div className="w-48">
              <Select value={filtroEstado} onValueChange={setFiltroEstado} options={opcionesEstado} />
            </div>
          </div>

          {lotesFiltrados.length === 0 ? (
            <EmptyState
              icon={<Search className="w-8 h-8 text-muted-foreground" />}
              title="Nada por aquí"
              description="Ningún lote coincide con la búsqueda o el filtro."
            />
          ) : (
          <div className="space-y-2">
            {lotesFiltrados.map((lote) => {
              const expandido = expandidoId === lote.id;
              const abv =
                lote.densidad_inicial != null && lote.densidad_final != null
                  ? calcularABV(lote.densidad_inicial, lote.densidad_final)
                  : null;
              return (
                <div key={lote.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandidoId(expandido ? null : lote.id)}
                    className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-surface-raised/60 transition-colors"
                  >
                    <span className="text-muted-foreground shrink-0">
                      {expandido ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground shrink-0 w-24">{lote.codigo ?? '—'}</span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-display italic text-foreground truncate block">
                        {lote.nombre ?? 'Lote sin nombre'}
                      </span>
                      {lote.miel_lote?.variedad_floral && (
                        <span className="text-xs text-muted-foreground truncate block">
                          Miel de {lote.miel_lote.variedad_floral}
                          {lote.miel_lote.nombre_lote ? ` · ${lote.miel_lote.nombre_lote}` : ''}
                        </span>
                      )}
                    </span>
                    {lote.volumen_litros != null && (
                      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                        {lote.volumen_litros.toLocaleString('es-CL')} L
                      </span>
                    )}
                    {abv !== null && (
                      <span className="text-xs font-semibold text-foreground shrink-0 hidden md:block">
                        {abv.toLocaleString('es-CL', { maximumFractionDigits: 1 })}% vol
                      </span>
                    )}
                    {lote.n_botellas != null && (
                      <span className="text-xs text-muted-foreground shrink-0 hidden lg:block">
                        {lote.n_botellas} bot.
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                      {formatDate(lote.fecha_inicio)}
                    </span>
                    <Badge variant={estadoVariant(lote.estado)} className="capitalize shrink-0">
                      {lote.estado}
                    </Badge>
                  </button>

                  {expandido && <DetalleLotePanel loteId={lote.id} onClose={() => setExpandidoId(null)} onDeleted={() => setExpandidoId(null)} />}
                </div>
              );
            })}
          </div>
          )}
        </>
      )}

      <NuevoLoteModal
        open={showNuevo}
        onClose={() => setShowNuevo(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['hidromiel'] });
        }}
      />
    </div>
  );
}
