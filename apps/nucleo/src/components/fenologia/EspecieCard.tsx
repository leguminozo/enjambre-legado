'use client';

import { useState } from 'react';
import {
  Sliders,
  ScanLine,
  Droplets,
  Flower2,
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
  onToggleMonitoreo?: (especie: EspecieData, e: React.MouseEvent) => void;
}

export function EspecieCard({
  especie,
  pronostico,
  onObservar,
  onCalibrar,
}: EspecieCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const ref = getReferenciaBotanica(especie.nombre_cientifico, especie.nombre_comun);

  // Selección de fotografía: BD > pronostico > mapa referencial curado
  const rawFoto = especie.foto_url || pronostico?.fotoUrl || ref?.fotoUrl || null;
  const fotoSrc = !imgError ? rawFoto : null;

  const ventanaTexto = formatVentanaFloracion(
    especie.ventana_ini ?? especie.mes_inicio_floracion,
    especie.ventana_fin ?? especie.mes_fin_floracion
  );

  const gddActual = pronostico?.gddActual ?? 0;
  const gddUmbral = especie.gdd_umbral ?? pronostico?.gddUmbral ?? null;
  const progreso =
    pronostico?.progreso ??
    (gddUmbral && gddActual ? Math.min(100, Math.round((gddActual / gddUmbral) * 100)) : null);
  const deltaGDD = gddUmbral ? Math.max(0, Math.round(gddUmbral - gddActual)) : null;

  // Relevancia apícola formateada con alta precisión
  const relevancia = especie.relevancia_apicola || pronostico?.relevanciaApicola || 'mixta';
  const relevanciaTexto =
    ref?.relevanciaLabel ||
    (relevancia === 'nectar'
      ? 'Néctar Abundante'
      : relevancia === 'polen'
      ? 'Aporte Polínico'
      : 'Néctar y Polen');

  return (
    <div className="card overflow-hidden border border-border bg-card rounded-2xl flex flex-col justify-between hover:border-border/80 transition-all duration-300 group shadow-sm">
      <div>
        {/* ── Banner Fotográfico Hero ── */}
        <div className="relative h-40 w-full bg-surface-sunken overflow-hidden">
          {fotoSrc ? (
            <img
              src={fotoSrc}
              alt={especie.nombre_comun}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 ease-out ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : null}

          {/* Fallback botánico premium si no hay foto o mientras carga */}
          {(!fotoSrc || !imgLoaded) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-surface-sunken via-surface-raised to-background p-4 text-center">
              <span className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
                <Flower2 size={20} />
              </span>
              <span className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
                Bosque Nativo de Chiloé
              </span>
            </div>
          )}

          {/* Gradiente cinematográfico inferior para lectura perfecta del texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent pointer-events-none" />

          {/* ÚNICA etiqueta flotante de estado superior derecha */}
          <div className="absolute top-3 right-3 pointer-events-auto">
            {pronostico?.enFloracion ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-success/90 text-success-foreground shadow-lg backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-success-foreground animate-pulse" />
                Floración Activa
              </span>
            ) : pronostico?.enVentana ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-warning/90 text-warning-foreground shadow-lg backdrop-blur-md">
                En Temporada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-background/80 text-foreground/80 border border-border/40 backdrop-blur-md">
                Monitoreo GDD
              </span>
            )}
          </div>

          {/* Identidad botánica sobre la imagen (Limpia y Jerárquica) */}
          <div className="absolute bottom-3 left-3.5 right-3.5 text-foreground pointer-events-none">
            <h3 className="text-xl font-display font-medium tracking-wide leading-tight text-foreground drop-shadow-md">
              {especie.nombre_comun}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className="italic font-mono text-foreground/90 drop-shadow">
                {especie.nombre_cientifico}
              </span>
              {especie.familia && (
                <span className="text-muted-foreground text-[11px] font-sans drop-shadow">
                  · {especie.familia}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Cuerpo: Jerarquía Limpia y Espaciada ── */}
        <div className="p-4 space-y-3.5">
          {/* Fila 1: Atributos melíferos clave (Píldoras limpias) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface-sunken border border-border text-foreground font-medium text-[11px]">
              <Droplets size={12} className="text-primary shrink-0" />
              <span>{relevanciaTexto}</span>
            </span>

            {ref?.mielColor && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-surface-sunken border border-border text-muted-foreground text-[11px]">
                Miel: <strong className="text-foreground ml-1 font-normal">{ref.mielColor}</strong>
              </span>
            )}

            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-muted-foreground text-[11px]">
              {ref?.habitoLabel ?? especie.habito ?? 'Árbol'}
            </span>
          </div>

          {/* Fila 2: Ciclo Fenológico y Acumulación Térmica */}
          <div className="p-3 rounded-xl bg-surface-sunken/60 border border-border/50 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Ventana habitual: <strong className="text-foreground font-medium">{ventanaTexto}</strong>
              </span>
              <span className="font-mono text-[11px]">
                Umbral {gddUmbral ? `${gddUmbral}°d` : '—'}
              </span>
            </div>

            {/* Barra de Progreso Térmico */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted-foreground">Calor acumulado</span>
                <span className="text-foreground font-medium">
                  {gddActual}°d {gddUmbral ? `(${progreso ?? 0}%)` : ''}
                </span>
              </div>
              <div className="w-full bg-background h-1.5 rounded-full overflow-hidden border border-border/40">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pronostico?.enFloracion
                      ? 'bg-success'
                      : (progreso ?? 0) >= 75
                      ? 'bg-warning'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, progreso ?? 0)}%` }}
                />
              </div>
            </div>

            {/* Estado conciso sin redundancias */}
            <div className="text-[11px] leading-snug pt-0.5">
              {pronostico?.enFloracion ? (
                <span className="text-success font-medium">
                  ✓ En pleno pecoreo y flujo de néctar
                </span>
              ) : pronostico?.diasEstimados != null ? (
                <span className="text-foreground">
                  Apertura estimada en <strong>~{pronostico.diasEstimados} días</strong>
                  {deltaGDD ? ` (faltan ${deltaGDD}°d)` : ''}
                </span>
              ) : deltaGDD != null ? (
                <span className="text-muted-foreground">
                  Faltan <strong>{deltaGDD}°d</strong> para alcanzar umbral floral
                </span>
              ) : (
                <span className="text-muted-foreground italic">
                  Umbral pendiente de calibración en terreno
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Pie de Tarjeta: Botones en grilla 50/50 NUNCA apretados ── */}
      <div className="p-3.5 pt-2 border-t border-border/40 grid grid-cols-2 gap-2 bg-surface-raised/30">
        <button
          type="button"
          onClick={() => onObservar(especie.id)}
          className="btn btn-outline text-xs h-9 px-2 inline-flex items-center justify-center gap-1.5 w-full hover:border-primary/50 hover:bg-primary/5 text-foreground font-medium transition-colors"
          title="Registrar observación de floración en terreno"
        >
          <ScanLine size={13} className="text-primary shrink-0" />
          <span className="truncate">Observar</span>
        </button>

        <button
          type="button"
          onClick={() => onCalibrar(especie)}
          className="btn btn-outline text-xs h-9 px-2 inline-flex items-center justify-center gap-1.5 w-full hover:border-border text-muted-foreground hover:text-foreground transition-colors font-medium"
          title="Calibrar umbral GDD con datos de campo"
        >
          <Sliders size={13} className="shrink-0" />
          <span className="truncate">Calibrar</span>
        </button>
      </div>
    </div>
  );
}
