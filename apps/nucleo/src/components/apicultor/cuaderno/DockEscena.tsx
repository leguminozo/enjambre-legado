'use client';

import { Link2, Pill, Plus, Activity, StickyNote } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuItem } from '@enjambre/ui';
import type { LayoutRed } from './LienzoSemantico';
import { cn } from '@/lib/cn';

interface DockEscenaProps {
  vista?: 'red' | 'hojas';
  layout?: LayoutRed;
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
export function DockEscena({
  onConectar,
  conectando,
  onNodo,
  onNuevaHoja,
  onVarroa,
  onTratamiento,
  onMuestra,
  onAnalisis,
}: DockEscenaProps) {
  const tieneSanitarios = Boolean(onVarroa || onTratamiento || onMuestra);

  return (
    <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-border/80 bg-background/90 backdrop-blur-xl shadow-2xl px-2.5 py-1.5 sm:px-3 sm:py-2">
      {onConectar && (
        <Button
          variant={conectando ? 'primary' : 'outline'}
          size="sm"
          onClick={onConectar}
          className={cn('h-8 rounded-xl text-[10px] uppercase tracking-widest font-bold px-2.5 sm:px-3', conectando && 'animate-pulse')}
        >
          <Link2 className="size-3.5 mr-1" />
          {conectando ? 'Conectando…' : 'Conectar'}
        </Button>
      )}
      {onNodo && (
        <Button variant="outline" size="sm" onClick={onNodo} className="h-8 rounded-xl text-[10px] uppercase tracking-widest font-bold px-2.5 sm:px-3">
          <StickyNote className="size-3.5 mr-1" /> Observación
        </Button>
      )}
      {tieneSanitarios && (
        <DropdownMenu
          trigger={
            <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] uppercase tracking-widest font-bold px-2.5 sm:px-3">
              <Pill className="size-3.5 mr-1" /> Registro sanitario
            </Button>
          }
        >
          {onVarroa && <DropdownMenuItem onSelect={onVarroa}>Monitoreo varroa</DropdownMenuItem>}
          {onTratamiento && <DropdownMenuItem onSelect={onTratamiento}>Tratamiento</DropdownMenuItem>}
          {onMuestra && <DropdownMenuItem onSelect={onMuestra}>Muestra de laboratorio</DropdownMenuItem>}
        </DropdownMenu>
      )}
      {onAnalisis && (
        <Button variant="outline" size="sm" onClick={onAnalisis} className="h-8 rounded-xl text-[10px] uppercase tracking-widest font-bold px-2.5 sm:px-3">
          <Activity className="size-3.5 mr-1" /> Análisis
        </Button>
      )}
      {onNuevaHoja && (
        <Button variant="primary" size="sm" onClick={onNuevaHoja} className="h-8 rounded-xl text-[10px] uppercase tracking-widest font-black px-2.5 sm:px-3">
          <Plus className="size-3.5 mr-1" /> Nueva hoja
        </Button>
      )}
    </div>
  );
}
