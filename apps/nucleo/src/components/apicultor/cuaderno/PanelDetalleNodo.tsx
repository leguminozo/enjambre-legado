'use client';

import { useState } from 'react';
import { Bug, Check, ClipboardList, Copy, FlaskConical, Grid3X3, Hexagon, MapPin, Pill, StickyNote, X } from 'lucide-react';
import { Button } from '@enjambre/ui';
import type { NodoRedCuaderno } from '@/lib/bitacora-types';
import { NODO_KIND_LABEL, ESTADO_COLMENA_LABEL, faseLabel } from './labels';
import { ORIGEN_LABEL, CUERPO_LABEL, TIPO_CUADRO_LABEL } from '../bitacora-labels';

const KIND_ICON: Record<NodoRedCuaderno['kind'], React.ReactNode> = {
  apiario: <MapPin className="size-4" />,
  colmena: <Hexagon className="size-4" />,
  hoja: <ClipboardList className="size-4" />,
  cuadro: <Grid3X3 className="size-4" />,
  tratamiento: <Pill className="size-4" />,
  muestra: <FlaskConical className="size-4" />,
  varroa: <Bug className="size-4" />,
  manual: <StickyNote className="size-4" />,
};

interface PanelDetalleNodoProps {
  nodo: NodoRedCuaderno | null;
  onClose: () => void;
  onEditar?: (nodo: NodoRedCuaderno) => void;
  onEliminar?: (nodo: NodoRedCuaderno) => void;
  onNuevaHoja?: (colmenaId: string) => void;
  onConectar?: (nodo: NodoRedCuaderno) => void;
  onAbrirColmena?: (colmenaId: string) => void;
  brechaDetalle?: string | null;
}

function estadoBadge(nodo: NodoRedCuaderno): string | null {
  if (nodo.kind === 'colmena') return nodo.estado ? ESTADO_COLMENA_LABEL[nodo.estado] ?? nodo.estado : null;
  if (nodo.kind === 'hoja') return nodo.estado ? faseLabel(nodo.estado) : null;
  if (nodo.kind === 'manual') return nodo.estado ? NODO_KIND_LABEL.manual : null;
  if (nodo.kind === 'cuadro' && nodo.estado) return CUERPO_LABEL[nodo.estado as keyof typeof CUERPO_LABEL] ?? nodo.estado;
  return null;
}

/** Panel de detalle + trazabilidad del nodo seleccionado (patrón NodeDetailPanel
 *  de Trama): de qué registro surge cada nodo y su cadena de origen. */
export function PanelDetalleNodo({ nodo, onClose, onEditar, onEliminar, onNuevaHoja, onConectar, onAbrirColmena, brechaDetalle }: PanelDetalleNodoProps) {
  const [copiado, setCopiado] = useState(false);

  if (!nodo) return null;

  const badge = estadoBadge(nodo);

  const copiarHash = async () => {
    if (!nodo.blockchain_hash) return;
    await navigator.clipboard.writeText(nodo.blockchain_hash);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1600);
  };

  const hashCorto = nodo.blockchain_hash ? `${nodo.blockchain_hash.slice(0, 10)}…${nodo.blockchain_hash.slice(-6)}` : null;

  return (
    <div className="absolute top-0 right-0 h-full w-[340px] max-w-[85vw] bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl z-30 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/60 border border-border/60 px-2 py-1 rounded-full">
            {KIND_ICON[nodo.kind]}
            {NODO_KIND_LABEL[nodo.kind]}
          </span>
          <Button variant="ghost" className="h-8 w-8" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div>
          <h3 className="font-display italic text-2xl leading-tight text-foreground break-words">{nodo.label}</h3>
          {badge && <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">{badge}</span>}
        </div>

        {(nodo.apiario_name || nodo.fecha) && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            {nodo.apiario_name && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">Apiario</p>
                <p className="text-foreground font-medium">{nodo.apiario_name}</p>
              </div>
            )}
            {nodo.fecha && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">Fecha</p>
                <p className="text-foreground font-medium font-mono">{nodo.fecha}</p>
              </div>
            )}
          </div>
        )}

        {nodo.descripcion && (
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70 mb-1">Notas</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{nodo.descripcion}</p>
          </div>
        )}

        {/* Trazabilidad: de qué surge y hacia dónde se ancla */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">Orígenes y anclaje</p>
          {nodo.kind === 'hoja' && (
            <p className="text-xs text-muted-foreground">
              Hoja de cuaderno registrada el <span className="text-foreground font-mono">{nodo.fecha}</span> en fase{' '}
              <span className="text-foreground">{nodo.estado ? faseLabel(nodo.estado) : '—'}</span>
              {nodo.created_at ? <> · creada {new Date(nodo.created_at).toLocaleDateString('es-CL')}</> : null}
              .
            </p>
          )}
          {nodo.kind === 'colmena' && (
            <div className="space-y-1.5">
              {nodo.origen_tipo && (
                <p className="text-xs text-muted-foreground">
                  Origen: <span className="text-foreground">{ORIGEN_LABEL[nodo.origen_tipo as keyof typeof ORIGEN_LABEL] ?? nodo.origen_tipo}</span>
                </p>
              )}
              {nodo.blockchain_hash && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground bg-background/80 border border-border/60 rounded px-1.5 py-0.5">{hashCorto}</span>
                  <button onClick={copiarHash} className="text-muted-foreground hover:text-foreground transition-colors" title="Copiar hash">
                    {copiado ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
              )}
              {!nodo.blockchain_hash && <p className="text-xs text-muted-foreground">Colmena sin anclaje blockchain registrado.</p>}
              {brechaDetalle && <p className="text-xs text-warning">{brechaDetalle}</p>}
            </div>
          )}
          {nodo.kind === 'tratamiento' && <p className="text-xs text-muted-foreground">Tratamiento fitosanitario registrado en la colmena.</p>}
          {nodo.kind === 'muestra' && <p className="text-xs text-muted-foreground">Muestra de laboratorio del apiario.</p>}
          {nodo.kind === 'varroa' && <p className="text-xs text-muted-foreground">Monitoreo de Varroa destructor.</p>}
          {nodo.kind === 'cuadro' && (
            <p className="text-xs text-muted-foreground">
              Cuadro individualizado {nodo.estado ? `(${CUERPO_LABEL[nodo.estado as keyof typeof CUERPO_LABEL] ?? nodo.estado})` : ''}.
            </p>
          )}
          {nodo.kind === 'manual' && (
            <p className="text-xs text-muted-foreground">
              Nodo manual de la red{nodo.created_at ? <> · creado {new Date(nodo.created_at).toLocaleDateString('es-CL')}</> : null}.
            </p>
          )}
          {nodo.kind === 'apiario' && <p className="text-xs text-muted-foreground">Apiario: contenedor del territorio.</p>}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {onEditar && (
            <Button variant="outline" size="sm" onClick={() => onEditar(nodo)}>
              Editar
            </Button>
          )}
          {onConectar && (
            <Button variant="outline" size="sm" onClick={() => onConectar(nodo)}>
              Conectar
            </Button>
          )}
          {nodo.kind === 'colmena' && onNuevaHoja && (
            <Button variant="outline" size="sm" onClick={() => onNuevaHoja(nodo.id)}>
              Nueva hoja
            </Button>
          )}
          {nodo.kind === 'colmena' && onAbrirColmena && (
            <Button variant="outline" size="sm" onClick={() => onAbrirColmena(nodo.id)}>
              Abrir ficha
            </Button>
          )}
          {onEliminar && (
            <Button variant="destructive" size="sm" onClick={() => onEliminar(nodo)}>
              Eliminar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
