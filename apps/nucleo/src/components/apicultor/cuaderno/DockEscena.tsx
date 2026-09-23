'use client';

import { Link2, Plus, StickyNote } from 'lucide-react';
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

/** Dock flotante del Mapa vivo (patrón RSNSceneDock de Trama). */
export function DockEscena({ onConectar, conectando, onNodo, onNuevaHoja }: DockEscenaProps) {
  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/80 bg-background/90 backdrop-blur-xl shadow-2xl px-3 py-2">
      {onConectar && (
        <Button
          variant={conectando ? 'primary' : 'outline'}
          size="sm"
          onClick={onConectar}
          className={cn('h-8 rounded-xl text-[10px] uppercase tracking-widest font-bold px-3', conectando && 'animate-pulse')}
        >
          <Link2 className="size-3.5 mr-1.5" />
          {conectando ? 'Conectando…' : 'Conectar'}
        </Button>
      )}
      {onNodo && (
        <Button variant="outline" size="sm" onClick={onNodo} className="h-8 rounded-xl text-[10px] uppercase tracking-widest font-bold px-3">
          <StickyNote className="size-3.5 mr-1.5" /> Observación
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

