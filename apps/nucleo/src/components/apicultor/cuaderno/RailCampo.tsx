'use client';

import { FlaskConical, Link2, Pill, Plus, StickyNote, Bug } from 'lucide-react';
import { Button } from '@enjambre/ui';

interface RailCampoProps {
  onNuevaHoja?: () => void;
  onVarroa?: () => void;
  onTratamiento?: () => void;
  onMuestra?: () => void;
  onNodo?: () => void;
  onConectar?: () => void;
  conectando?: boolean;
  suficiencia?: { registradas: number; total: number };
}

/** Rail de campo (patrón RSNFieldRail de Trama): acciones rápidas de captura. */
export function RailCampo({ onNuevaHoja, onVarroa, onTratamiento, onMuestra, onNodo, onConectar, conectando, suficiencia }: RailCampoProps) {
  const pct = suficiencia && suficiencia.total > 0 ? Math.round((suficiencia.registradas / suficiencia.total) * 100) : 0;
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-2.5 flex flex-wrap items-center gap-2">
      {onNuevaHoja && (
        <Button variant="primary" size="sm" onClick={onNuevaHoja} className="rounded-lg text-[10px] uppercase tracking-widest font-black">
          <Plus className="size-3.5 mr-1" /> Nueva hoja
        </Button>
      )}
      {onVarroa && (
        <Button variant="outline" size="sm" onClick={onVarroa} className="rounded-lg text-[10px] uppercase tracking-widest font-bold">
          <Bug className="size-3.5 mr-1" /> Varroa
        </Button>
      )}
      {onTratamiento && (
        <Button variant="outline" size="sm" onClick={onTratamiento} className="rounded-lg text-[10px] uppercase tracking-widest font-bold">
          <Pill className="size-3.5 mr-1" /> Tratamiento
        </Button>
      )}
      {onMuestra && (
        <Button variant="outline" size="sm" onClick={onMuestra} className="rounded-lg text-[10px] uppercase tracking-widest font-bold">
          <FlaskConical className="size-3.5 mr-1" /> Muestra
        </Button>
      )}
      {onNodo && (
        <Button variant="outline" size="sm" onClick={onNodo} className="rounded-lg text-[10px] uppercase tracking-widest font-bold">
          <StickyNote className="size-3.5 mr-1" /> Observación
        </Button>
      )}
      {onConectar && (
        <Button
          variant={conectando ? 'primary' : 'outline'}
          size="sm"
          onClick={onConectar}
          className="rounded-lg text-[10px] uppercase tracking-widest font-bold"
        >
          <Link2 className="size-3.5 mr-1" /> {conectando ? 'Conectando…' : 'Conectar'}
        </Button>
      )}
      {suficiencia && (
        <div className="ml-auto flex items-center gap-2 min-w-[11rem]">
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
            {suficiencia.registradas}/{suficiencia.total} colmenas
          </span>
          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
