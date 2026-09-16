'use client';

import { BarChart3, Bug, FlaskConical, Grid3X3, LayoutGrid, Link2, Pill, Plus, Share2, StickyNote } from 'lucide-react';
import { Button } from '@enjambre/ui';
import type { LayoutRed } from './LienzoSemantico';
import { cn } from '@/lib/cn';

interface DockEscenaProps {
  vista: 'red' | 'hojas';
  onVista?: (v: 'red' | 'hojas') => void;
  layout: LayoutRed;
  onLayout?: (l: LayoutRed) => void;
  onAnalisis?: () => void;
  onNuevaHoja?: () => void;
  onConectar?: () => void;
  conectando?: boolean;
  onNodo?: () => void;
  onVarroa?: () => void;
  onTratamiento?: () => void;
  onMuestra?: () => void;
}

const LAYOUT_ICON: Record<LayoutRed, React.ReactNode> = {
  radial: <Share2 className="size-3.5" />,
  cose: <Grid3X3 className="size-3.5" />,
  grid: <LayoutGrid className="size-3.5" />,
};

/** Dock flotante de la escena (patrón RSNSceneDock de Trama). */
export function DockEscena({ vista, onVista, layout, onLayout, onAnalisis, onNuevaHoja, onConectar, conectando, onNodo, onVarroa, onTratamiento, onMuestra }: DockEscenaProps) {
  return (
    <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-border/80 bg-background/90 backdrop-blur-xl shadow-2xl px-2 sm:px-3 py-2 max-w-[min(100vw-1.5rem,44rem)]">
      {onVista && (
        <div className="flex items-center rounded-xl border border-border/60 overflow-hidden">
          {(['red', 'hojas'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onVista(v)}
              className={cn(
                'px-2.5 sm:px-3 h-8 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                vista === v ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
              )}
            >
              {v === 'red' ? 'Red' : 'Hojas'}
            </button>
          ))}
        </div>
      )}
      {onLayout && (
        <div className="flex items-center rounded-xl border border-border/60 overflow-hidden">
          {(['radial', 'cose', 'grid'] as const).map((l) => (
            <button
              key={l}
              onClick={() => onLayout(l)}
              title={l}
              className={cn(
                'px-2 h-8 transition-colors',
                layout === l ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
              )}
            >
              {LAYOUT_ICON[l]}
            </button>
          ))}
        </div>
      )}
      {onConectar && (
        <Button
          variant={conectando ? 'primary' : 'outline'}
          size="sm"
          onClick={onConectar}
          className="h-8 rounded-xl text-[10px] uppercase tracking-widest font-bold px-2.5"
        >
          <Link2 className="size-3.5" />
        </Button>
      )}
      {onNodo && (
        <Button variant="outline" size="sm" onClick={onNodo} title="Nodo manual" className="h-8 rounded-xl text-[10px] uppercase tracking-widest font-bold px-2.5">
          <StickyNote className="size-3.5" />
        </Button>
      )}
      {onVarroa && (
        <Button variant="outline" size="sm" onClick={onVarroa} title="Monitoreo varroa" className="h-8 rounded-xl text-[10px] uppercase tracking-widest font-bold px-2.5">
          <Bug className="size-3.5" />
        </Button>
      )}
      {onTratamiento && (
        <Button variant="outline" size="sm" onClick={onTratamiento} title="Tratamiento" className="h-8 rounded-xl text-[10px] uppercase tracking-widest font-bold px-2.5">
          <Pill className="size-3.5" />
        </Button>
      )}
      {onMuestra && (
        <Button variant="outline" size="sm" onClick={onMuestra} title="Muestra de laboratorio" className="h-8 rounded-xl text-[10px] uppercase tracking-widest font-bold px-2.5">
          <FlaskConical className="size-3.5" />
        </Button>
      )}
      {onAnalisis && (
        <Button variant="outline" size="sm" onClick={onAnalisis} className="h-8 rounded-xl text-[10px] uppercase tracking-widest font-bold px-2.5">
          <BarChart3 className="size-3.5" />
        </Button>
      )}
      {onNuevaHoja && (
        <Button variant="primary" size="sm" onClick={onNuevaHoja} className="h-8 rounded-xl text-[10px] uppercase tracking-widest font-black px-3">
          <Plus className="size-3.5 mr-1" /> Nueva hoja
        </Button>
      )}
    </div>
  );
}
