'use client';

import { useState } from 'react';
import {
  Sliders,
  ScanLine,
  Droplets,
  Calendar,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  getReferenciaBotanica,
  formatVentanaFloracion,
} from '@/lib/botanica-referencia';

export interface EspecieData {
  id: string;
  nombre_cientifico: string;
  nombre_comun: string;
  familia: string | null;
  tbase_c?: number;
  t_base?: number;
  gdd_umbral: number | null;
  gdd_stddev: number | null;
  ventana_ini?: number | null;
  ventana_fin?: number | null;
  mes_inicio_floracion?: number | null;
  mes_fin_floracion?: number | null;
  fuente?: string;
  activo?: boolean;
  origen?: 'nativa' | 'endemica' | 'introducida' | 'naturalizada';
  habito?: string;
  relevancia_apicola?: string;
  monitoreo_activo?: boolean;
  foto_url?: string | null;
  perfil_melifero?: string | null;
}

export interface PronosticoData {
  id: string;
  nombreCientifico: string;
  nombreComun: string;
  tbase: number;
  gddUmbral: number | null;
  gddActual: number;
  gddProyectado16d: number | null;
  progreso: number | null;
  diasEstimados: number | null;
  enFloracion: boolean;
  enVentana: boolean;
  origen?: string;
  habito?: string;
  relevanciaApicola?: string;
  fotoUrl?: string | null;
}

export interface EspecieCardProps {
  especie: EspecieData;
  pronostico?: PronosticoData;
  onObservar: (especieId: string) => void;
  onCalibrar: (especie: EspecieData) => void;
  onToggleMonitoreo: (especie: EspecieData, e: React.MouseEvent) => void;
}

export function EspecieCard({
  especie,
  pronostico,
  onObservar,
  onCalibrar,
  onToggleMonitoreo,
}: EspecieCardProps) {
  const [imgError, setImgError] = useState(false);

  const ref = getReferenciaBotanica(especie.nombre_cientifico, especie.nombre_comun);

  // Selección de fotografía: BD > pronostico > mapa referencial curado
  const rawFoto = especie.foto_url || pronostico?.fotoUrl || ref?.fotoUrl || null;
  const fotoSrc = !imgError ? rawFoto : null;

  const perfilMelifero = especie.perfil_melifero || ref?.perfilMelifero || null;
  const ventanaTexto = formatVentanaFloracion(
    especie.ventana_ini ?? especie.mes_inicio_floracion,
    especie.ventana_fin ?? especie.mes_fin_floracion
  );

  const esNativa =
    especie.origen === 'nativa' ||
    especie.origen === 'endemica' ||
    !especie.origen;

  const gddActual = pronostico?.gddActual ?? 0;
  const gddUmbral = especie.gdd_umbral ?? pronostico?.gddUmbral ?? null;
  const progreso = pronostico?.progreso ?? (gddUmbral && gddActual ? Math.min(100, Math.round((gddActual / gddUmbral) * 100)) : null);
  const deltaGDD = gddUmbral ? Math.max(0, Math.round(gddUmbral - gddActual)) : null;

  // Relevancia apícola formateada con alta precisión
  const relevancia = especie.relevancia_apicola || pronostico?.relevanciaApicola || 'mixta';
  const relevanciaTexto =
    ref?.relevanciaLabel ||
    (relevancia === 'nectar'
      ? 'Néctar Abundante'
      : relevancia === 'polen'
      ? 'Aporte Polínico'
      : relevancia === 'propoleo'
      ? 'Resinas y Propóleo'
      : 'Néctar y Polen');

  return (
    <div className="card overflow-hidden border border-border bg-surface-raised rounded-2xl flex flex-col justify-between hover:border-border/80 transition-all duration-300 group shadow-sm">
      <div>
        {/* ── Banner Fotográfico Hero ── */}
        <div className="relative h-44 w-full bg-surface-sunken overflow-hidden">
          {fotoSrc ? (
            <img
              src={fotoSrc}
              alt={`${especie.nombre_comun} (${especie.nombre_cientifico})`}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-sunken via-surface-raised to-background text-muted-foreground p-4 text-center">
              <span className="text-3xl mb-1">{pronostico?.enFloracion ? '🌸' : '🌿'}</span>
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/80">
                Flora Nativa de Chiloé
              </span>
            </div>
          )}

          {/* Gradiente oscuro inferior para legibilidad del título */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

          {/* Badges superiores flotantes */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-auto">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md shadow-sm ${
                  esNativa
                    ? 'bg-primary/90 text-primary-foreground border border-primary/30'
                    : 'bg-warning/90 text-warning-foreground border border-warning/30'
                }`}
              >
                {ref?.origenLabel ?? (especie.origen === 'endemica' ? 'Endémica' : 'Nativa')}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-black/60 text-white/90 border border-white/15 backdrop-blur-md">
                {ref?.habitoLabel ?? especie.habito ?? 'Árbol'}
              </span>
            </div>

            {/* Estado Fenológico */}
            {pronostico?.enFloracion ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-success text-success-foreground shadow-md backdrop-blur-md border border-white/20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Floración Activa
              </span>
            ) : pronostico?.enVentana ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-warning text-warning-foreground shadow-md backdrop-blur-md whitespace-nowrap">
                Ventana Estacional
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => onToggleMonitoreo(especie, e)}
                title={especie.monitoreo_activo ? 'Monitoreo activo en oráculo' : 'Especie archivada'}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-black/60 text-white/80 border border-white/15 hover:bg-black/80 transition-colors backdrop-blur-md"
              >
                {especie.monitoreo_activo ? (
                  <>
                    <Eye size={11} className="text-primary" />
                    <span>Oráculo</span>
                  </>
                ) : (
                  <>
                    <EyeOff size={11} className="text-muted-foreground" />
                    <span>Archivada</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Nombre y Taxonomía sobre la imagen */}
          <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
            <h3 className="text-xl font-display font-semibold tracking-wide leading-tight drop-shadow-md">
              {especie.nombre_comun}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs italic text-white/90 font-mono drop-shadow">
                {especie.nombre_cientifico}
              </span>
              {especie.familia && (
                <span className="text-[10px] uppercase font-mono tracking-widest text-white/60 drop-shadow">
                  · {especie.familia}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Cuerpo de la Tarjeta ── */}
        <div className="p-4 space-y-3.5">
          {/* Perfil Melífero y Sensorial */}
          <div className="p-2.5 rounded-xl bg-surface-sunken border border-border/60 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-accent inline-flex items-center gap-1">
                <Droplets size={12} />
                {relevanciaTexto}
              </span>
              {ref?.mielColor && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  Miel: {ref.mielColor}
                </span>
              )}
            </div>
            {perfilMelifero && (
              <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                "{perfilMelifero}"
              </p>
            )}
          </div>

          {/* Ventana de Floración Calendario */}
          <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2.5">
            <span className="text-muted-foreground inline-flex items-center gap-1.5">
              <Calendar size={13} className="text-muted-foreground/80" />
              Ventana de floración
            </span>
            <span className="font-medium text-foreground">
              {ventanaTexto}
            </span>
          </div>

          {/* Dinámica Térmica GDD */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Dinámica Térmica (GDD)</span>
              <span className="font-mono text-xs font-semibold text-foreground">
                {gddActual}°d {gddUmbral ? `/ ${gddUmbral}°d` : ''}{' '}
                {progreso !== null && <span className="text-muted-foreground font-normal">({progreso}%)</span>}
              </span>
            </div>

            {/* Barra de Progreso Térmico */}
            <div className="w-full bg-surface-sunken h-2 rounded-full overflow-hidden border border-border/40">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  pronostico?.enFloracion
                    ? 'bg-success'
                    : (progreso ?? 0) >= 75
                    ? 'bg-warning'
                    : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, progreso ?? 0)}%` }}
              />
            </div>

            {/* Estado explicativo del progreso */}
            <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
              {pronostico?.enFloracion ? (
                <span className="text-success font-medium">
                  ✓ Umbral superado ({gddUmbral}°d) · Plena secreción de néctar y pecoreo en bosque.
                </span>
              ) : pronostico?.diasEstimados != null ? (
                <span>
                  Floración estimada en <strong className="text-foreground">~{pronostico.diasEstimados} días</strong> ({deltaGDD ? `-${deltaGDD}°d restantes` : ''}).
                </span>
              ) : deltaGDD != null ? (
                <span>
                  Faltan <strong className="text-foreground">{deltaGDD}°d</strong> de calor acumulado para apertura floral.
                </span>
              ) : (
                <span>Umbral térmico pendiente de calibración en terreno.</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Pie de la Tarjeta con Acciones ── */}
      <div className="p-4 pt-2 border-t border-border/50 flex items-center justify-between gap-2 bg-surface-raised/40">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block">
            Umbral Térmico
          </span>
          <span className="font-mono text-xs font-semibold text-foreground">
            {especie.gdd_umbral != null ? `${especie.gdd_umbral}°d` : 'Por calibrar'}
            {especie.gdd_stddev != null && (
              <span className="text-[10px] text-muted-foreground font-normal ml-0.5">
                ±{especie.gdd_stddev}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Botón Registrar Observación de Campo */}
          <button
            type="button"
            onClick={() => onObservar(especie.id)}
            className="btn btn-outline text-xs min-h-8 px-2.5 inline-flex items-center gap-1 hover:text-accent hover:border-accent/40"
            title="Registrar observación de floración en terreno para esta especie"
          >
            <ScanLine size={12} className="text-accent" />
            <span>+ Observar</span>
          </button>

          {/* Botón Calibrar Modelo */}
          <button
            type="button"
            onClick={() => onCalibrar(especie)}
            className="btn btn-outline text-xs min-h-8 px-2.5 inline-flex items-center gap-1"
            title="Calibrar umbral térmico con evidencia de campo"
          >
            <Sliders size={12} className="text-primary" />
            <span>Calibrar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
