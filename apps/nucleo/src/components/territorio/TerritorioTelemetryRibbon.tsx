'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  TrendingUp,
  Clock,
  Settings2,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import type { CensoStatsData } from '@/components/censo/CensoStats';
import type { CensoFase } from '@/lib/territorio-cms';

export interface TerritorioTelemetryRibbonProps {
  heroContent?: {
    censo_fase?: CensoFase;
    fecha_cierre?: string;
    meta_colmenas?: number;
    aviso_fase?: string;
  };
  onConfigurePhase?: () => void;
}

export function TerritorioTelemetryRibbon({
  heroContent,
  onConfigurePhase,
}: TerritorioTelemetryRibbonProps) {
  const [stats, setStats] = useState<CensoStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const res = await fetch('/api/censo-publico/stats');
        if (!res.ok) return;
        const json = (await res.json()) as { data?: CensoStatsData };
        if (!cancelled && json.data) {
          setStats(json.data);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const fase: CensoFase = heroContent?.censo_fase || 'convocatoria';
  const metaColmenas = Number(heroContent?.meta_colmenas) || 500;
  const colmenasActuales = stats?.colmenas_registradas ?? 0;
  const porcentajeMeta = Math.min(100, Math.round((colmenasActuales / metaColmenas) * 100));

  const fechaCierreStr = heroContent?.fecha_cierre || stats?.cierre || '2026-10-31';
  const diasRestantes = (() => {
    try {
      const target = new Date(`${fechaCierreStr}T23:59:59`);
      const diff = target.getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  })();

  const faseInfo = {
    convocatoria: {
      label: 'Fase 1 · Convocatoria Abierta',
      color: 'bg-primary/10 border-primary/30 text-primary',
      dot: 'bg-primary animate-pulse',
    },
    validacion: {
      label: 'Fase 2 · Validación Técnica SAG / GORE',
      color: 'bg-accent/10 border-accent/30 text-accent',
      dot: 'bg-accent animate-pulse',
    },
    cerrado_consulta: {
      label: 'Fase 3 · Censo Consolidado y Oficial',
      color: 'bg-surface-raised border-border text-muted-foreground',
      dot: 'bg-muted-foreground',
    },
  }[fase];

  return (
    <div className="z-10 shrink-0 border-b border-border/60 bg-surface-sunken/80 px-3 sm:px-4 py-2 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Lado izquierdo: Estado de fase y llamada */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Radio size={14} className="text-primary animate-pulse" />
            <span className="font-semibold tracking-tight">Telemetría Territorial</span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium ${faseInfo.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${faseInfo.dot}`} />
            <span>{faseInfo.label}</span>
          </div>

          {heroContent?.aviso_fase ? (
            <span className="hidden xl:inline text-muted-foreground truncate max-w-sm">
              · {heroContent.aviso_fase}
            </span>
          ) : null}
        </div>

        {/* Lado central: Métricas en vivo */}
        <div className="flex items-center gap-3 sm:gap-6 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Apiarios:</span>
            <span className="font-bold text-foreground">
              {loading ? '…' : (stats?.apiarios_activos ?? 0)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Colmenas:</span>
            <span className="font-bold text-foreground">
              {loading ? '…' : colmenasActuales}
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              / {metaColmenas} ({porcentajeMeta}%)
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-muted-foreground">Actores:</span>
            <span className="font-bold text-foreground">
              {loading ? '…' : (stats?.actores_activos ?? 0)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-primary">
            <Clock size={12} />
            <span>
              {fase === 'cerrado_consulta'
                ? 'Concluido'
                : `${diasRestantes} días`}
            </span>
          </div>
        </div>

        {/* Lado derecho: Accesos rápidos */}
        <div className="flex items-center gap-2">
          {onConfigurePhase && (
            <button
              type="button"
              onClick={onConfigurePhase}
              className="inline-flex min-h-7 items-center gap-1 px-2 py-1 rounded-md border border-border bg-background hover:bg-surface-raised text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              title="Ajustar fase del censo, meta de colmenas y fecha límite en el bloque Hero"
            >
              <Settings2 size={12} />
              <span>Gobernanza</span>
            </button>
          )}

          <Link
            href="/mapa-chiloe"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-7 items-center gap-1 px-2 py-1 rounded-md text-[11px] text-primary hover:underline transition-colors"
            title="Abrir mapa territorial público en pestaña nueva"
          >
            <span>Mapa Chiloé</span>
            <ExternalLink size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}
