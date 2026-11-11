'use client';

import React, { useMemo } from 'react';
import { Crown, Mic, Layers, X } from 'lucide-react';
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
        ? { label: 'Sin muestreo en bandeja sanitaria', colorClass: 'text-muted-foreground', dotClass: 'bg-muted-foreground' }
        : varroaLevel <= 1.5
            ? { label: `${varroaLevel}% · Nivel óptimo`, colorClass: 'text-emerald-500', dotClass: 'bg-emerald-500' }
            : varroaLevel <= 3
                ? { label: `${varroaLevel}% · Vigilancia`, colorClass: 'text-amber-500', dotClass: 'bg-amber-500' }
                : { label: `${varroaLevel}% · Umbral crítico`, colorClass: 'text-destructive', dotClass: 'bg-destructive' };

    // Mapa indexado O(1) para resolver la biología de cada cuadro sin escanear arrays en cada frame
    const cuadrosMap = useMemo(() => {
        const m = new Map<string, InspeccionCuadroRow>();
        for (const c of cuadrosRegistrados) {
            m.set(`${c.cuerpo}_${c.posicion}`, c);
        }
        return m;
    }, [cuadrosRegistrados]);

    // Helper para determinar el tipo de un cuadro en la cámara de cría
    const getCuadroCamaraInfo = (pos: number): { tipo: string; label: string; isSelected: boolean } => {
        const found = cuadrosMap.get(`camara_${pos}`);
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
        const found = cuadrosMap.get(`${cuerpoKey}_${pos}`);
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
        <div className="rounded-2xl border border-border/70 bg-surface-raised/40 p-4 sm:p-6 lg:p-7 space-y-6 shadow-md">
            {/* Cabecera de arquitectura Langstroth */}
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border/50 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Layers size={17} className="text-primary shrink-0" />
                        <span className="text-xs uppercase tracking-[0.16em] font-mono text-foreground font-bold">
                            Mapa de Campo · Anatomía Langstroth
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Estructura física viva cuadro por cuadro según telemetría del colmenar.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-surface-sunken border border-border text-foreground font-semibold shadow-xs">
                        {alzasCount > 0
                            ? `${alzasCount + 1} cuerpos (${alzasCount} ${alzasCount === 1 ? 'alza melaria' : 'alzas melarias'} + cría)`
                            : '1 cuerpo (cámara única)'}
                    </span>
                </div>
            </div>

            {/* Representación visual de gran tamaño y aire de la colmena Langstroth */}
            <div className="w-full space-y-2.5">
                {/* 1. Techo telescópico galvanizado */}
                <div className="relative w-full">
                    <div className="h-7 rounded-t-xl bg-surface-sunken border-t-2 border-x-2 border-border flex items-center justify-between px-4 sm:px-6 shadow-inner">
                        <span className="text-[10px] sm:text-[11px] font-mono tracking-wider text-muted-foreground uppercase font-semibold">
                            Techo telescópico · Madera & Cubierta de Zinc
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-border" />
                            <span className="w-2.5 h-2.5 rounded-full bg-border" />
                        </div>
                    </div>
                    {/* Entretecho / Cubierta interna con aislación térmica */}
                    <div className="h-2.5 bg-muted/90 border-x-2 border-border mx-2" title="Entretecho y aislamiento térmico" />
                </div>

                {/* 2. Cajones de Alzas Melarias (número exacto según colmena.alzas) */}
                {alzasCount > 0 ? (
                    <div className="space-y-2.5 w-full">
                        {Array.from({ length: alzasCount }, (_, i) => {
                            const alzaNum = alzasCount - i;
                            const cuerpoKey = `alza_${alzaNum}` as const;
                            return (
                                <div
                                    key={alzaNum}
                                    className="relative rounded-xl border-2 border-primary/30 bg-surface-raised p-4 sm:p-5 shadow-sm transition-all hover:border-primary/60"
                                >
                                    {/* Manija de madera central */}
                                    <div className="w-20 h-1.5 rounded-full bg-border/80 mx-auto mb-3" />

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <span className="text-sm font-bold text-primary uppercase font-mono tracking-wider flex items-center gap-2">
                                                    <Layers size={15} className="text-primary shrink-0" />
                                                    <span>Alza Melaria {alzaNum}</span>
                                                    {alzaNum === alzasCount && (
                                                        <span className="text-xs font-normal text-muted-foreground font-sans">· Nivel Superior</span>
                                                    )}
                                                </span>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {marcosMiel != null
                                                        ? `${marcosMiel} de 10 marcos con miel recolectable`
                                                        : '10 marcos melarios estandarizados'}
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono text-muted-foreground bg-surface-sunken px-2.5 py-1 rounded border border-border/60">
                                                Alza #{alzaNum}
                                            </span>
                                        </div>

                                        {/* Representación interactiva cuadro por cuadro (10 bastidores de miel) */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono px-1">
                                                <span>Marco 1</span>
                                                <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-sans">Haz clic en un marco para ver detalles o registrar inspección</span>
                                                <span>Marco 10</span>
                                            </div>
                                            <div
                                                className="grid grid-cols-10 gap-1.5 sm:gap-2.5 p-2 sm:p-3 rounded-xl bg-surface-sunken border border-border/70"
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
                                                                'h-24 sm:h-28 rounded-md flex flex-col items-center justify-between p-1 sm:p-1.5 transition-all cursor-pointer relative border group',
                                                                isSelected
                                                                    ? 'ring-2 ring-primary border-primary bg-primary/25 scale-[1.03] z-10 shadow-lg'
                                                                    : hasHoney
                                                                        ? 'bg-primary/10 border-primary/40 hover:bg-primary/20 hover:border-primary shadow-xs'
                                                                        : 'bg-muted/30 border-border/60 hover:bg-muted/60 hover:border-border'
                                                            )}
                                                            title={`Marco #${pos} · ${label}`}
                                                        >
                                                            {/* Cabezal de madera del marco */}
                                                            <div className="w-full flex items-center justify-between border-b border-border/40 pb-0.5">
                                                                <span className="text-[9px] sm:text-[10px] font-mono font-bold leading-none text-muted-foreground group-hover:text-foreground">
                                                                    #{pos}
                                                                </span>
                                                                <span className="w-1.5 h-1 bg-border rounded-xs" />
                                                            </div>

                                                            {/* Cuerpo central del panal (cera o miel) */}
                                                            <div
                                                                className={cn(
                                                                    'w-full flex-1 my-1 rounded-xs flex flex-col items-center justify-center p-0.5 transition-all',
                                                                    hasHoney
                                                                        ? 'bg-gradient-to-b from-amber-500/25 via-amber-500/40 to-amber-600/50 border border-amber-500/40 shadow-inner'
                                                                        : 'bg-muted/40 border border-dashed border-border/60'
                                                                )}
                                                            >
                                                                {hasHoney ? (
                                                                    <div className="flex flex-col items-center gap-0.5">
                                                                        <div className="w-2 h-2 rounded-full bg-amber-400/80 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                                                                        <span className="text-[8px] sm:text-[9px] font-mono font-bold text-amber-500 uppercase tracking-tighter">
                                                                            Miel
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[8px] font-mono text-muted-foreground/70">
                                                                        Cera
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Base inferior del marco */}
                                                            <div className="w-full text-center border-t border-border/40 pt-0.5">
                                                                <span className="text-[8px] sm:text-[9px] leading-none font-mono text-muted-foreground/90 truncate block">
                                                                    {hasHoney ? '100%' : 'Listo'}
                                                                </span>
                                                            </div>
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
                    <div className="w-full my-2.5 p-4 rounded-xl border-2 border-dashed border-border/70 bg-muted/20 text-center">
                        <span className="text-xs text-muted-foreground font-mono font-medium block">
                            Sin alzas melarias instaladas · Operación en cámara de cría única
                        </span>
                        <span className="text-[11px] text-muted-foreground/80 mt-1 block">
                            Las alzas melarias se colocarán cuando el nido basal complete 8–9 marcos cubiertos con abejas y postura activa.
                        </span>
                    </div>
                )}

                {/* 3. Rejilla Excluidora de Reina (solo cuando hay alzas instaladas) */}
                {alzasCount > 0 && (
                    <div className="w-full my-1.5">
                        <div
                            className="h-3.5 rounded-sm border-y-2 border-dashed border-primary/50 bg-primary/10 flex items-center justify-between px-4 sm:px-6 shadow-xs"
                            title="Rejilla excluidora de reina: previene postura en las alzas de miel"
                        >
                            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                                Rejilla excluidora de reina
                            </span>
                            <div className="flex gap-1.5">
                                {Array.from({ length: 16 }, (_, i) => (
                                    <span key={i} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Cámara de Cría Basal (Cajón permanente de postura y nido) */}
                <div className="w-full">
                    <div className="relative rounded-xl border-2 border-border/90 bg-surface-raised p-4 sm:p-5 shadow-md">
                        {/* Manija central de madera */}
                        <div className="w-20 h-1.5 rounded-full bg-border/80 mx-auto mb-3" />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                                        <Crown size={15} className="text-amber-500 shrink-0" />
                                    </div>
                                    <div>
                                        <span className="text-sm sm:text-base font-bold text-foreground font-display tracking-tight truncate block">
                                            Cámara de Cría Basal
                                        </span>
                                        <div className="text-xs text-muted-foreground font-datos">
                                            <span className="text-foreground font-semibold">{reinaActiva}</span>
                                            {marcosCria != null && (
                                                <span className="ml-1 text-[11px] text-muted-foreground">· {marcosCria}/10 cría activa</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-surface-sunken border border-border text-foreground font-medium shrink-0 font-datos">
                                        Vigor: {poblacion}
                                    </span>
                                    <span className="text-xs font-mono text-muted-foreground bg-surface-sunken px-2.5 py-1 rounded border border-border/60">
                                        Cuerpo Basal
                                    </span>
                                </div>
                            </div>

                            {/* Representación interactiva cuadro por cuadro (10 bastidores de cría y reservas) */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono px-1">
                                    <span>Marco 1 (Reserva Polen/Miel)</span>
                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-sans">Nido central & Reservas biológicas</span>
                                    <span>Marco 10 (Reserva Polen/Miel)</span>
                                </div>
                                <div
                                    className="grid grid-cols-10 gap-1.5 sm:gap-2.5 p-2 sm:p-3 rounded-xl bg-surface-sunken border border-border/70"
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
                                                    'h-24 sm:h-28 rounded-md flex flex-col items-center justify-between p-1 sm:p-1.5 transition-all cursor-pointer relative border group',
                                                    isSelected
                                                        ? 'ring-2 ring-primary border-primary bg-primary/25 scale-[1.03] z-10 shadow-lg'
                                                        : isBrood
                                                            ? 'bg-amber-400/10 dark:bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20'
                                                            : isReserve
                                                                ? 'bg-primary/10 border-primary/30 hover:bg-primary/20'
                                                                : 'bg-muted/30 border-border/60 hover:bg-muted/60 hover:border-border'
                                                )}
                                                title={`Marco #${pos} · ${label}`}
                                            >
                                                {/* Cabezal de madera del marco */}
                                                <div className="w-full flex items-center justify-between border-b border-border/40 pb-0.5">
                                                    {isQueenFrame ? (
                                                        <Crown size={11} className="text-amber-400 shrink-0" />
                                                    ) : (
                                                        <span className="text-[9px] sm:text-[10px] font-mono font-bold leading-none text-muted-foreground group-hover:text-foreground">
                                                            #{pos}
                                                        </span>
                                                    )}
                                                    <span className="w-1.5 h-1 bg-border rounded-xs" />
                                                </div>

                                                {/* Cuerpo central del panal (cría, reserva o cera) */}
                                                <div
                                                    className={cn(
                                                        'w-full flex-1 my-1 rounded-xs flex flex-col items-center justify-center p-0.5 transition-all',
                                                        isBrood
                                                            ? 'bg-gradient-to-b from-amber-600/30 via-yellow-700/30 to-amber-800/40 border border-amber-600/50 shadow-inner'
                                                            : isReserve
                                                                ? 'bg-gradient-to-b from-yellow-500/20 to-amber-500/30 border border-yellow-500/40'
                                                                : 'bg-muted/40 border border-dashed border-border/60'
                                                    )}
                                                >
                                                    {isQueenFrame ? (
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <div className="w-3.5 h-3.5 rounded-full bg-amber-400/20 border border-amber-400/60 flex items-center justify-center">
                                                                <Crown size={9} className="text-amber-400" />
                                                            </div>
                                                            <span className="text-[8px] font-mono font-bold text-amber-400 uppercase">
                                                                Reina
                                                            </span>
                                                        </div>
                                                    ) : isBrood ? (
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]" />
                                                            <span className="text-[8px] sm:text-[9px] font-mono font-bold text-amber-500 uppercase tracking-tighter">
                                                                Cría
                                                            </span>
                                                        </div>
                                                    ) : isReserve ? (
                                                        <span className="text-[8px] font-mono font-bold text-primary uppercase">
                                                            Polen
                                                        </span>
                                                    ) : (
                                                        <span className="text-[8px] font-mono text-muted-foreground/70">
                                                            Cera
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Base inferior del marco */}
                                                <div className="w-full text-center border-t border-border/40 pt-0.5">
                                                    <span className="text-[8px] sm:text-[9px] leading-none font-mono text-muted-foreground/90 truncate block">
                                                        {isQueenFrame ? 'Cámara' : isBrood ? 'Operculada' : isReserve ? 'Reserva' : 'Vacío'}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Piquera & Rampa de vuelo */}
                <div className="relative w-full mt-2">
                    <div className="h-5 rounded-xs bg-surface-sunken border-x-2 border-b-2 border-border flex items-center justify-between px-4 sm:px-6">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
                            Piquera frontal & Rampa de vuelo
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-1.5 bg-border rounded-full" />
                            <span className="w-12 h-2 bg-surface-sunken border border-border rounded-xs" />
                            <span className="w-4 h-1.5 bg-border rounded-full" />
                        </div>
                    </div>

                    {/* 6. Piso Sanitario y Bandeja Anti-Varroa (holgado, sin truncar) */}
                    <div className="mt-2 p-3 sm:p-3.5 rounded-b-xl border-2 border-border/80 bg-surface-sunken flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-3 h-3 rounded-full shrink-0 ${varroaStatus.dotClass}`} />
                            <span className="text-muted-foreground font-mono text-xs">
                                Bandeja sanitaria:
                            </span>
                            <span className={`font-semibold text-xs ${varroaStatus.colorClass}`}>
                                {varroaStatus.label}
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono shrink-0">
                            Fondo de Madera Langstroth
                        </span>
                    </div>
                </div>
            </div>

            {/* Panel de inspector de cuadro seleccionado si hay interacción */}
            {selectedCuadro && (
                <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary font-mono uppercase">
                                Cuadro #{selectedCuadro.posicion}
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-surface-sunken border border-border text-foreground font-mono font-medium">
                                {selectedCuadro.cuerpoLabel}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                            Estado: <strong className="text-foreground">{selectedCuadro.tipoLabel}</strong>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {onAccionCuadro && (
                            <button
                                type="button"
                                onClick={() => onAccionCuadro(selectedCuadro, 'dictar')}
                                className="btn btn-gold btn-sm text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
                                title="Dictar inspección para este marco con IA"
                            >
                                <Mic size={13} />
                                <span>Dictar marco</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => onSelectCuadro?.(null)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Cerrar selección"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
