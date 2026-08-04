'use client';

import { ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@enjambre/ui';
import type { HojaCuaderno } from '@/lib/bitacora-types';
import { BRECHA_HOJA_LABEL, faseLabel, varroaToken } from './labels';
import { cn } from '@/lib/cn';

interface HojaCardProps {
  hoja: HojaCuaderno;
  onVer: (id: string) => void;
  onEditar: (hoja: HojaCuaderno) => void;
  onEliminar: (hoja: HojaCuaderno) => void;
}

/** Tarjeta de hoja (patrón StudyCard de Trama): cada estudio del cuaderno. */
export function HojaCard({ hoja, onVer, onEditar, onEliminar }: HojaCardProps) {
  const brechas = hoja.brechas ?? [];
  const sinVarroa = !brechas.includes('sin_varroa');
  const varroaColor = sinVarroa ? varroaToken(hoja.varroa) : null;

  return (
    <div className="group rounded-2xl border border-border/60 bg-card overflow-hidden flex flex-col hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
      <div className="px-5 pt-5 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('size-2 rounded-full', hoja.fase === 'alza' ? 'bg-success' : hoja.fase === 'cosecha' ? 'bg-warning' : 'bg-primary')} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{hoja.fase ? faseLabel(hoja.fase) : 'Sin fase'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" className="h-7 w-7 text-muted-foreground/50 hover:text-foreground" onClick={() => onEditar(hoja)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" className="h-7 w-7 text-muted-foreground/50 hover:text-destructive" onClick={() => onEliminar(hoja)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        <button onClick={() => onVer(hoja.id)} className="block w-full text-left">
          <h3 className="font-display text-2xl leading-tight text-foreground">
            {hoja.colmena?.name ?? 'Colmena'} <span className="text-muted-foreground">· {hoja.date}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {hoja.apiario_name ?? 'Sin apiario'}
            {hoja.colmena?.origen_tipo ? ` · origen: ${hoja.colmena.origen_tipo}` : ''}
          </p>
        </button>

        {hoja.notes && <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{hoja.notes}</p>}
      </div>

      {/* Métricas: cría/miel, varroa, población */}
      <div className="px-5 grid grid-cols-4 gap-2">
        {[
          { label: 'Cría', value: `${hoja.marcos_cria ?? 0}` },
          { label: 'Miel', value: `${hoja.marcos_miel ?? 0}` },
          {
            label: 'Varroa',
            value: sinVarroa ? String(hoja.varroa ?? 0) : '—',
            tone: varroaColor,
          },
          { label: 'Pobl.', value: hoja.poblacion?.[0] ?? '—' },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">{s.label}</p>
            <p
              className={cn(
                'text-lg font-bold font-mono tabular-nums leading-none',
                s.tone === 'success' && 'text-success',
                s.tone === 'warning' && 'text-warning',
                s.tone === 'destructive' && 'text-destructive',
              )}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Lo que no se dice: brechas */}
      {brechas.length > 0 && (
        <div className="px-5 pt-3 flex flex-wrap gap-1.5">
          {brechas.map((b) => (
            <span key={b} className="text-[9px] font-bold uppercase tracking-wider text-warning bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded-full">
              {BRECHA_HOJA_LABEL[b] ?? b}
            </span>
          ))}
        </div>
      )}

      <div className="px-5 py-3 mt-auto flex items-center justify-between border-t border-border/40 mt-3">
        <span className="text-[10px] font-semibold text-muted-foreground">
          {hoja.cuadros_count} cuadro{hoja.cuadros_count === 1 ? '' : 's'} · {hoja.tratamientos_count} tratamiento{hoja.tratamientos_count === 1 ? '' : 's'}
        </span>
        <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase tracking-widest font-bold text-primary" onClick={() => onVer(hoja.id)}>
          Abrir <ArrowUpRight className="size-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
