'use client';

import React, { useMemo, useState } from 'react';
import { Download, FileJson, Film, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn, friendlyError, toast } from '@enjambre/ui';
import {
  listExportTargets,
  resolveExportAvailability,
  type ExportFormatId,
  type ExportTarget,
} from './export-targets';
import { MOTION_SCOPES, MOTION_SCOPE_ORDER, type MotionScope } from './slide-motion';
import { downloadBlob, exportSlidePiece } from './slide-export-service';
import { seedFromContent } from './prng';
import type { SlideAspectRatio, SlideData } from './slide-studio-core';

interface SlideExportPanelProps {
  slides: SlideData[];
  aspectRatio: SlideAspectRatio;
}

function targetIcon(target: ExportTarget) {
  if (target.kind === 'video') return <Film size={12} className="shrink-0" />;
  if (target.kind === 'data') return <FileJson size={12} className="shrink-0" />;
  return <ImageIcon size={12} className="shrink-0" />;
}

export function SlideExportPanel({ slides, aspectRatio }: SlideExportPanelProps) {
  const [scope, setScope] = useState<MotionScope>('estatico');
  const [targetId, setTargetId] = useState<ExportFormatId>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const targets = useMemo(() => listExportTargets(scope), [scope]);
  const target = useMemo(
    () => targets.find((item) => item.id === targetId) ?? targets[0],
    [targets, targetId],
  );
  const availability = useMemo(() => resolveExportAvailability(target), [target]);

  const seed = useMemo(
    () =>
      seedFromContent(
        slides.map((slide) => slide.id).join('-'),
        slides.map((slide) => slide.title).join('-'),
        scope,
      ),
    [slides, scope],
  );

  const handleExport = async () => {
    if (!target) return;
    try {
      setIsExporting(true);
      setProgress(0);

      const outcome = await exportSlidePiece({
        slides,
        target,
        scope,
        aspectRatio,
        seed,
        baseName: 'oyz_lamina',
        onProgress: (value) => setProgress(Math.round(value * 100)),
      });

      downloadBlob(outcome.blob, outcome.filename);
      setProgress(100);
      toast.success(`${target.label} listo · ${outcome.filename}`);
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-3 space-y-3">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-xs text-foreground">
          <Film size={13} className="text-primary" />
          Alcance y Salida
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          Semilla {seed.toString(16).toUpperCase()}
        </span>
      </header>

      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
          Alcance de movimiento
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {MOTION_SCOPE_ORDER.map((id) => {
            const spec = MOTION_SCOPES[id];
            const isSelected = scope === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setScope(id)}
                title={spec.description}
                className={cn(
                  'p-2 rounded-lg border text-left transition-all flex flex-col gap-0.5',
                  isSelected
                    ? 'border-primary ring-1 ring-primary/40 bg-primary/10'
                    : 'border-border bg-surface-raised hover:bg-surface-sunken',
                )}
              >
                <span className="text-xs font-mono font-medium text-foreground truncate">
                  {spec.label}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight truncate">
                  {spec.sublabel}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug">
          {MOTION_SCOPES[scope].description}
        </p>
      </div>

      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
          Formato de salida
        </p>
        <div className="space-y-1">
          {targets.map((item) => {
            const itemAvailability = resolveExportAvailability(item);
            const isSelected = item.id === target.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!itemAvailability.available}
                onClick={() => setTargetId(item.id)}
                title={itemAvailability.available ? item.description : itemAvailability.reason}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-surface-raised text-muted-foreground hover:text-foreground',
                  !itemAvailability.available && 'opacity-40 cursor-not-allowed',
                )}
              >
                {targetIcon(item)}
                <span className="font-mono text-xs font-medium">{item.label}</span>
                <span className="text-[10px] truncate ml-auto hidden sm:inline">
                  {itemAvailability.available ? item.description : itemAvailability.reason}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || !availability.available || slides.length === 0}
          className="btn btn-primary btn-xs h-8 px-3 rounded-xl text-xs font-mono flex items-center gap-1.5 font-semibold"
        >
          {isExporting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Download size={13} />
          )}
          <span>{isExporting ? `Generando ${progress}%` : `Exportar ${target?.label ?? ''}`}</span>
        </button>
        {availability.reason && (
          <span className="text-[10px] text-muted-foreground leading-tight">{availability.reason}</span>
        )}
      </div>
    </section>
  );
}
