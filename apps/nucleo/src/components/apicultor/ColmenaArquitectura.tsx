'use client';

import React, { useState } from 'react';
import { Crown, Sparkles, ShieldCheck, AlertTriangle, Check, Layers, ChevronRight, X } from 'lucide-react';
import type { ColmenaWithRelations, VarroaRow, InspeccionRow } from '@/lib/apicultor-types';
import type { InspeccionCuadrosEnHistorial, InspeccionCuadroRow, TipoCuadro, CuerpoCuadro } from '@/lib/bitacora-types';
import { cn } from '@/lib/cn';

export interface SelectedCuadroInfo {
    cuerpo: CuerpoCuadro | `alza_${number}`;
    cuerpoLabel: string;
    posicion: number;
    tipo: TipoCuadro | 'cria' | 'miel' | 'polen' | 'vacio' | 'cera_labrada';
    tipoLabel: string;
    notas?: string | null;
}

interface ColmenaArquitecturaProps {
    colmena: ColmenaWithRelations;
    latestInspeccion?: InspeccionRow | InspeccionCuadrosEnHistorial | null;
    latestVarroa?: VarroaRow | null;
    selectedCuadro?: SelectedCuadroInfo | null;
    onSelectCuadro?: (cuadro: SelectedCuadroInfo | null) => void;
    onAccionCuadro?: (cuadro: SelectedCuadroInfo, accion: 'dictar' | 'manual') => void;
}

const TIPO_CUADRO_LABELS: Record<string, string> = {
    cria_abierta: 'Cría abierta (larvas / huevos)',
    cria_cerrada: 'Cría operculada',
    cria: 'Nido de cría activa',
    miel: 'Miel operculada / néctar',
    polen: 'Pan de abejas / polen',
    cera_labrada: 'Cera labrada (panal listo)',
    cera_estampada: 'Cera estampada',
    vacio: 'Marco vacío',
};

export function ColmenaArquitectura({
    colmena,
    latestInspeccion,
    latestVarroa,
    selectedCuadro,
    onSelectCuadro,
    onAccionCuadro,
}: ColmenaArquitecturaProps) {
    const rawAlzas = typeof colmena.alzas === 'number' ? colmena.alzas : 0;
    const alzasCount = Math.max(0, Math.min(4, rawAlzas));

    const marcosCria = typeof latestInspeccion?.marcos_cria === 'number' ? latestInspeccion.marcos_cria : null;
    const marcosMiel = typeof latestInspeccion?.marcos_miel === 'number' ? latestInspeccion.marcos_miel : null;
    const reinaActiva = colmena.queen || (latestInspeccion?.reina ? 'Reina activa observada' : 'Reina presente');
    const poblacion = latestInspeccion?.poblacion || colmena.health || 'Normal';

    // Lista de cuadros registrados en la inspección si existen
    const cuadrosRegistrados: InspeccionCuadroRow[] = (latestInspeccion && 'inspeccion_cuadros' in latestInspeccion && Array.isArray((latestInspeccion as InspeccionCuadrosEnHistorial).inspeccion_cuadros))
        ? ((latestInspeccion as InspeccionCuadrosEnHistorial).inspeccion_cuadros ?? [])
        : [];

    // Nivel de varroa de la última medición (del registro específico o de la inspección)
    const varroaLevel = typeof latestVarroa?.level === 'number'
        ? latestVarroa.level
        : typeof latestInspeccion?.varroa === 'number'
            ? latestInspeccion.varroa
            : null;

    const varroaStatus = varroaLevel == null
        ? { label: 'Sin muestreo en bandeja', colorClass: 'text-muted-foreground', dotClass: 'bg-muted-foreground' }
        : varroaLevel <= 1.5
            ? { label: `${varroaLevel}% · Nivel óptimo`, colorClass: 'text-emerald-500', dotClass: 'bg-emerald-500' }
            : varroaLevel <= 3
                ? { label: `${varroaLevel}% · Vigilancia`, colorClass: 'text-amber-500', dotClass: 'bg-amber-500' }
                : { label: `${varroaLevel}% · Umbral crítico`, colorClass: 'text-destructive', dotClass: 'bg-destructive' };

    // Helper para determinar el tipo de un cuadro en la cámara de cría
    const getCuadroCamaraInfo = (pos: number): { tipo: string; label: string; isSelected: boolean } => {
        const found = cuadrosRegistrados.find(c => c.cuerpo === 'camara' && c.posicion === pos);
        let tipo = found?.tipo ?? '';
        if (!tipo) {
            if (pos === 1 || pos === 10) {
                tipo = 'polen';
            } else if (marcosCria != null && pos >= 2 && (pos - 2) < marcosCria) {
                tipo = 'cria_cerrada';
            } else {
                tipo = 'cera_labrada';
            }
        }
        const label = TIPO_CUADRO_LABELS[tipo] ?? tipo;
        const isSelected = selectedCuadro?.cuerpo === 'camara' && selectedCuadro?.posicion === pos;
        return { tipo, label, isSelected };
    };

    // Helper para determinar el tipo de un cuadro en un alza melaria
    const getCuadroAlzaInfo = (alzaIdx: number, pos: number): { tipo: string; label: string; isSelected: boolean } => {
        const cuerpoKey = `alza_${alzaIdx}` as const;
        const found = cuadrosRegistrados.find(c => c.cuerpo === cuerpoKey && c.posicion === pos);
        let tipo = found?.tipo ?? '';
        if (!tipo) {
            if (marcosMiel != null && pos <= marcosMiel) {
                tipo = 'miel';
            } else {
                tipo = 'cera_labrada';
            }
        }
        const label = TIPO_CUADRO_LABELS[tipo] ?? tipo;
        const isSelected = selectedCuadro?.cuerpo === cuerpoKey && selectedCuadro?.posicion === pos;
        return { tipo, label, isSelected };
    };

    const handleCuadroClick = (info: SelectedCuadroInfo) => {
        if (selectedCuadro?.cuerpo === info.cuerpo && selectedCuadro?.posicion === info.posicion) {
            onSelectCuadro?.(null);
        } else {
            onSelectCuadro?.(info);
        }
    };

    return (
        <div className="rounded-2xl border border-border/70 bg-surface-raised/50 p-4 sm:p-6 space-y-5 shadow-md">
            {/* Cabecera ampliada de arquitectura y mapa de campo */}
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border/50 pb-3.5">
                <div>
                    <div className="flex items-center gap-2">
                        <Layers size={16} className="text-primary shrink-0" />
                        <span className="text-xs uppercase tracking-[0.16em] font-mono text-foreground font-bold">
                            Mapa de Campo · Anatomía Langstroth
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Estructura viva cuadro por cuadro según telemetría del colmenar.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-surface-sunken border border-border text-foreground font-semibold shadow-xs">
                        {alzasCount > 0
                            ? `${alzasCount + 1} cuerpos (${alzasCount} ${alzasCount === 1 ? 'alza melaria' : 'alzas melarias'} + cría)`
                            : '1 cuerpo (cámara única)'}
                    </span>
                </div>
            </div>

            {/* Representación visual de gran tamaño de la colmena Langstroth */}
            <div className="w-full max-w-[460px] sm:max-w-[490px] mx-auto pt-1 pb-1">
                {/* 1. Techo telescópico galvanizado */}
                <div className="relative w-full">
                    <div className="h-6 rounded-t-xl bg-surface-sunken border-t-2 border-x-2 border-border flex items-center justify-between px-4 shadow-inner">
                        <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase font-semibold">
                            Techo telescópico · Madera & Zinc
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-border" />
                            <span className="w-2 h-2 rounded-full bg-border" />
                        </div>
                    </div>
                    {/* Entretecho / Cubierta interna con aislación térmica */}
                    <div className="h-2 bg-muted/90 border-x-2 border-border mx-1.5" title="Entretecho y aislamiento térmico" />
                </div>

                {/* 2. Cajones de Alzas Melarias (número exacto según colmena.alzas) */}
                {alzasCount > 0 ? (
                    <div className="space-y-1.5 w-full">
                        {Array.from({ length: alzasCount }, (_, i) => {
                            const alzaNum = alzasCount - i;
                            const cuerpoKey = `alza_${alzaNum}` as const;
                            return (
                                <div
                                    key={alzaNum}
                                    className="relative rounded-lg border-2 border-primary/30 bg-surface-raised p-3 sm:p-3.5 shadow-sm transition-all hover:border-primary/60"
                                >
                                    {/* Hendidura / Manija de madera central */}
                                    <div className="w-16 h-1.5 rounded-full bg-border mx-auto mb-2" />

                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <span className="text-xs font-bold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
                                                    <Layers size={13} className="text-primary shrink-0" />
                                                    <span>Alza Melaria {alzaNum}</span>
                                                    {alzaNum === alzasCount && (
                                                        <span className="text-[10px] font-normal text-muted-foreground font-sans">· Superior</span>
                                                    )}
                                                </span>
                                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                                    {marcosMiel != null
                                                        ? `${marcosMiel} de 10 marcos con miel recolectable`
                                                        : '10 marcos melarios estandarizados'}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-mono text-muted-foreground bg-surface-sunken px-2 py-0.5 rounded border border-border/60">
                                                Alza #{alzaNum}
                                            </span>
                                        </div>

                                        {/* Representación interactiva cuadro por cuadro (10 bastidores de miel) */}
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono px-1">
                                                <span>Cuadro 1</span>
                                                <span className="text-[8px] uppercase tracking-wider text-muted-foreground/80">Toca un cuadro para inspeccionar</span>
                                                <span>Cuadro 10</span>
                                            </div>
                                            <div
                                                className="grid grid-cols-10 gap-1 sm:gap-1.5 p-1.5 rounded-lg bg-surface-sunken border border-border/70"
                                                title="10 bastidores melarios: haz clic para ver o accionar"
                                            >
                                                {Array.from({ length: 10 }, (_, frameIdx) => {
                                                    const pos = frameIdx + 1;
                                                    const { tipo, label, isSelected } = getCuadroAlzaInfo(alzaNum, pos);
                                                    const hasHoney = tipo === 'miel';

                                                    return (
                                                        <button
                                                            key={pos}
                                                            type="button"
                                                            onClick={() => handleCuadroClick({
                                                                cuerpo: cuerpoKey,
                                                                cuerpoLabel: `Alza Melaria ${alzaNum}`,
                                                                posicion: pos,
                                                                tipo: tipo as TipoCuadro,
                                                                tipoLabel: label,
                                                            })}
                                                            className={cn(
                                                                'h-12 sm:h-14 rounded-sm flex flex-col items-center justify-between py-1 transition-all cursor-pointer relative border',
                                                                isSelected
                                                                    ? 'ring-2 ring-primary border-primary bg-primary/25 scale-105 z-10 shadow-md'
                                                                    : hasHoney
                                                                        ? 'bg-primary/20 border-primary/40 hover:bg-primary/30 hover:border-primary'
                                                                        : 'bg-muted/40 border-border/60 hover:bg-muted/70 hover:border-border'
                                                            )}
                                                            title={`Marco #${pos} · ${label}`}
                                                        >
                                                            <span className="text-[8px] font-mono font-bold leading-none text-muted-foreground">
                                                                {pos}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'w-1.5 h-6 rounded-xs',
                                                                    hasHoney
                                                                        ? 'bg-primary shadow-[0_0_4px_hsl(var(--primary))]'
                                                                        : 'bg-border'
                                                                )}
                                                            />
                                                            <span className="text-[7px] leading-none text-muted-foreground/80 font-mono">
                                                                {hasHoney ? 'M' : '·'}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="w-full my-2 p-3.5 rounded-lg border-2 border-dashed border-border/70 bg-muted/20 text-center">
                        <span className="text-xs text-muted-foreground font-mono font-medium block">
                            Sin alzas melarias instaladas · Operación en cámara de cría única
                        </span>
                        <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                            Las alzas melarias se colocarán cuando el nido basal complete 8–9 marcos cubiertos.
                        </span>
                    </div>
                )}

                {/* 3. Rejilla Excluidora de Reina (solo cuando hay alzas) */}
                {alzasCount > 0 && (
                    <div className="w-full my-1">
                        <div
                            className="h-3 rounded-xs border-y-2 border-dashed border-primary/50 bg-primary/10 flex items-center justify-between px-3 shadow-xs"
                            title="Rejilla excluidora de reina: previene postura en las alzas de miel"
                        >
                            <span className="text-[9px] font-mono uppercase tracking-wider text-primary font-bold">
                                Rejilla excluidora de reina
                            </span>
                            <div className="flex gap-1">
                                {Array.from({ length: 12 }, (_, i) => (
                                    <span key={i} className="w-1.5 h-1 bg-primary/60 rounded-full" />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Cámara de Cría Basal (Cajón permanente de postura) */}
                <div className="w-full">
                    <div className="relative rounded-lg border-2 border-border bg-surface-raised p-3.5 sm:p-4 shadow-md">
                        {/* Manija central */}
                        <div className="w-16 h-1.5 rounded-full bg-border mx-auto mb-2.5" />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Crown size={15} className="text-primary shrink-0" />
                                    <span className="text-sm font-bold text-foreground font-display tracking-tight truncate">
                                        Cámara de Cría Basal
                                    </span>
                                </div>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-sunken border border-border text-muted-foreground font-medium shrink-0 font-datos">
                                    Vigor: {poblacion}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 text-xs">
                                <div className="text-xs text-muted-foreground min-w-0 truncate font-datos">
                                    <span className="text-foreground font-semibold">{reinaActiva}</span>
                                    {marcosCria != null && (
                                        <span className="ml-1 text-[11px] text-muted-foreground">· {marcosCria}/10 cría activa</span>
                                    )}
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground bg-surface-sunken px-2 py-0.5 rounded border border-border/60">
                                    Cuerpo Basal
                                </span>
                            </div>

                            {/* Representación interactiva cuadro por cuadro (10 bastidores de cría y reservas) */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono px-1">
                                    <span>Marco 1 (Reserva)</span>
                                    <span className="text-[8px] uppercase tracking-wider text-muted-foreground/80">Nido central & Reservas</span>
                                    <span>Marco 10 (Reserva)</span>
                                </div>
                                <div
                                    className="grid grid-cols-10 gap-1 sm:gap-1.5 p-1.5 rounded-lg bg-surface-sunken border border-border/70"
                                    title="10 bastidores de la cámara de cría: haz clic para ver o accionar"
                                >
                                    {Array.from({ length: 10 }, (_, frameIdx) => {
                                        const pos = frameIdx + 1;
                                        const { tipo, label, isSelected } = getCuadroCamaraInfo(pos);
                                        const isBrood = tipo === 'cria' || tipo === 'cria_abierta' || tipo === 'cria_cerrada';
                                        const isReserve = tipo === 'polen' || pos === 1 || pos === 10;
                                        const isQueenFrame = pos === 5 && Boolean(reinaActiva);

                                        return (
                                            <button
                                                key={pos}
                                                type="button"
                                                onClick={() => handleCuadroClick({
                                                    cuerpo: 'camara',
                                                    cuerpoLabel: 'Cámara de Cría Basal',
                                                    posicion: pos,
                                                    tipo: tipo as TipoCuadro,
                                                    tipoLabel: label,
                                                })}
                                                className={cn(
                                                    'h-14 sm:h-16 rounded-sm flex flex-col items-center justify-between py-1 transition-all cursor-pointer relative border',
                                                    isSelected
                                                        ? 'ring-2 ring-primary border-primary bg-primary/25 scale-105 z-10 shadow-md'
                                                        : isBrood
                                                            ? 'bg-amber-400/20 dark:bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30'
                                                            : isReserve
                                                                ? 'bg-primary/15 border-primary/30 hover:bg-primary/25'
                                                                : 'bg-muted/40 border-border/60 hover:bg-muted/70 hover:border-border'
                                                )}
                                                title={`Marco #${pos} · ${label}`}
                                            >
                                                <div className="flex items-center justify-center w-full">
                                                    {isQueenFrame ? (
                                                        <Crown size={9} className="text-primary shrink-0" />
                                                    ) : (
                                                        <span className="text-[8px] font-mono font-bold leading-none text-muted-foreground">
                                                            {pos}
                                                        </span>
                                                    )}
                                                </div>

                                                <span
                                                    className={cn(
                                                        'w-1.5 h-7 rounded-xs',
                                                        isBrood
                                                            ? 'bg-amber-400 dark:bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.6)]'
                                                            : isReserve
                                                                ? 'bg-primary/60'
                                                                : 'bg-border'
                                                    )}
                                                />

                                                <span className="text-[7px] leading-none text-muted-foreground/80 font-mono">
                                                    {isBrood ? 'C' : isReserve ? 'P' : '·'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Piquera & Rampa de vuelo */}
                <div className="relative w-full mt-1">
                    <div className="h-4 rounded-xs bg-surface-sunken border-x-2 border-b-2 border-border flex items-center justify-between px-4">
                        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
                            Piquera frontal & Rampa de vuelo
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-1 bg-border rounded-full" />
                            <span className="w-8 h-1.5 bg-surface-sunken border border-border rounded-xs" />
                            <span className="w-3 h-1 bg-border rounded-full" />
                        </div>
                    </div>

                    {/* 6. Piso Sanitario y Bandeja Anti-Varroa */}
                    <div className="mt-1.5 p-2.5 rounded-b-xl border-2 border-border/80 bg-surface-sunken flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${varroaStatus.dotClass}`} />
                            <span className="text-muted-foreground font-mono text-[11px] truncate">
                                Bandeja sanitaria:
                            </span>
                            <span className={`font-semibold text-xs truncate ${varroaStatus.colorClass}`}>
                                {varroaStatus.label}
                            </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            Fondo Langstroth
                        </span>
                    </div>
                </div>
            </div>

            {/* Panel de inspector de cuadro seleccionado si hay interacción */}
            {selectedCuadro && (
                <div className="p-3.5 rounded-xl border border-primary/40 bg-primary/5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary font-mono uppercase">
                                Cuadro #{selectedCuadro.posicion}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-sunken border border-border text-foreground font-mono">
                                {selectedCuadro.cuerpoLabel}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            Estado: <strong className="text-foreground">{selectedCuadro.tipoLabel}</strong>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {onAccionCuadro && (
                            <button
                                type="button"
                                onClick={() => onAccionCuadro(selectedCuadro, 'dictar')}
                                className="btn btn-gold btn-sm text-xs py-1 px-2.5 flex items-center gap-1.5"
                                title="Dictar inspección para este marco"
                            >
                                <Sparkles size={12} />
                                <span>Dictar cuadro</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => onSelectCuadro?.(null)}
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Cerrar selección"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>
            )}

            {/* Parámetros biológicos resumidos en cuadrícula limpia */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border/50 text-center font-mono">
                <div className="p-2.5 rounded-xl bg-surface-sunken border border-border/50">
                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">Reina</span>
                    <span className="text-xs sm:text-sm font-bold text-foreground truncate block mt-0.5">
                        <Crown size={12} className="inline mr-1 text-accent" />
                        {colmena.queen ? 'Marcada' : 'Activa'}
                    </span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-sunken border border-border/50">
                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">Marcos Cría</span>
                    <span className="text-xs sm:text-sm font-bold text-foreground block mt-0.5">
                        {marcosCria != null ? `${marcosCria} / 10` : '—'}
                    </span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-sunken border border-border/50">
                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">Marcos Miel</span>
                    <span className="text-xs sm:text-sm font-bold text-primary block mt-0.5">
                        {marcosMiel != null ? `${marcosMiel} / 10` : '—'}
                    </span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-sunken border border-border/50">
                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">Varroa</span>
                    <span className={`text-xs sm:text-sm font-bold block mt-0.5 ${varroaStatus.colorClass}`}>
                        {varroaLevel != null ? `${varroaLevel}%` : '—'}
                    </span>
                </div>
            </div>
        </div>
    );
}
