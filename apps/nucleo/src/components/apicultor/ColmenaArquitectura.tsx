'use client';

import React from 'react';
import { Crown, Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { ColmenaWithRelations, VarroaRow, InspeccionRow } from '@/lib/apicultor-types';
import type { InspeccionCuadrosEnHistorial } from '@/lib/bitacora-types';

interface ColmenaArquitecturaProps {
    colmena: ColmenaWithRelations;
    latestInspeccion?: InspeccionRow | InspeccionCuadrosEnHistorial | null;
    latestVarroa?: VarroaRow | null;
}

export function ColmenaArquitectura({ colmena, latestInspeccion, latestVarroa }: ColmenaArquitecturaProps) {
    const rawAlzas = typeof colmena.alzas === 'number' ? colmena.alzas : 0;
    const alzasCount = Math.max(0, Math.min(4, rawAlzas));

    const marcosCria = typeof latestInspeccion?.marcos_cria === 'number' ? latestInspeccion.marcos_cria : null;
    const marcosMiel = typeof latestInspeccion?.marcos_miel === 'number' ? latestInspeccion.marcos_miel : null;
    const reinaActiva = colmena.queen || (latestInspeccion?.reina ? 'Reina activa observada' : 'Reina presente');
    const poblacion = latestInspeccion?.poblacion || colmena.health || 'Normal';

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

    return (
        <div className="rounded-xl border border-border/60 bg-surface-raised/40 p-4 sm:p-5 space-y-4 shadow-sm">
            {/* Cabecera de arquitectura */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground font-semibold">
                            Anatomía & Arquitectura de Campo
                        </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Estructura física viva según telemetría del colmenar.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-surface-sunken border border-border/80 text-foreground font-medium">
                        {alzasCount > 0 ? `${alzasCount + 1} cuerpos (${alzasCount} ${alzasCount === 1 ? 'alza' : 'alzas'} + cría)` : '1 cuerpo (cámara única)'}
                    </span>
                </div>
            </div>

            {/* Representación visual vertical de la colmena Langstroth */}
            <div className="max-w-md mx-auto w-full pt-1 pb-2">
                {/* 1. Techo telescópico galvanizado */}
                <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px]">
                    <div className="h-4 rounded-t-lg bg-surface-sunken border-t border-x border-border/90 flex items-center justify-between px-3 shadow-inner">
                        <span className="text-[9px] font-mono tracking-tight text-muted-foreground uppercase">
                            Techo telescópico
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-border" />
                            <span className="w-1.5 h-1.5 rounded-full bg-border" />
                        </div>
                    </div>
                    {/* Entretecho / Cubierta interna */}
                    <div className="h-1.5 bg-muted/80 border-x border-border/80 mx-1" title="Entretecho y aislamiento térmico" />
                </div>

                {/* 2. Cajones de Alzas Melarias (número exacto según colmena.alzas) */}
                {alzasCount > 0 ? (
                    <div className="space-y-1 mx-auto w-full max-w-[276px] sm:max-w-[316px]">
                        {Array.from({ length: alzasCount }, (_, i) => {
                            const alzaNum = alzasCount - i;
                            return (
                                <div
                                    key={alzaNum}
                                    className="relative rounded-sm border border-primary/30 bg-surface-raised p-2.5 shadow-sm transition-all hover:border-primary/50"
                                >
                                    {/* Hendidura / Manija de madera central */}
                                    <div className="w-10 h-1 rounded-full bg-border/80 mx-auto mb-1.5" />

                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <span className="text-[10px] font-semibold text-primary uppercase font-mono tracking-wide flex items-center gap-1.5">
                                                <span>🍯 Alza Melaria {alzaNum}</span>
                                                {alzaNum === alzasCount && (
                                                    <span className="text-[9px] font-normal text-muted-foreground">· Superior</span>
                                                )}
                                            </span>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                                {marcosMiel != null
                                                    ? `${marcosMiel} de 10 marcos con miel`
                                                    : '10 marcos melarios estandarizados'}
                                            </div>
                                        </div>

                                        {/* Representación esquemática de los 10 cuadros de miel */}
                                        <div
                                            className="flex items-center gap-0.5 p-1 rounded bg-surface-sunken border border-border/50 shrink-0"
                                            title="10 marcos del alza melaria"
                                        >
                                            {Array.from({ length: 10 }, (_, frameIdx) => {
                                                const hasHoney = marcosMiel != null && frameIdx < marcosMiel;
                                                return (
                                                    <span
                                                        key={frameIdx}
                                                        className={`w-1 h-5 rounded-xs transition-colors ${
                                                            hasHoney
                                                                ? 'bg-primary shadow-[0_0_4px_hsl(var(--primary))]'
                                                                : 'bg-muted-foreground/30'
                                                        }`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mx-auto w-full max-w-[276px] sm:max-w-[316px] my-1 p-2 rounded-sm border border-dashed border-border/60 bg-muted/20 text-center">
                        <span className="text-[10px] text-muted-foreground font-mono">
                            Sin alzas melarias instaladas · Operación en cámara única
                        </span>
                    </div>
                )}

                {/* 3. Rejilla Excluidora de Reina (cuando hay alzas) */}
                {alzasCount > 0 && (
                    <div className="mx-auto w-full max-w-[274px] sm:max-w-[314px] my-0.5">
                        <div
                            className="h-2 rounded-xs border-y border-dashed border-primary/40 bg-primary/10 flex items-center justify-between px-2"
                            title="Rejilla excluidora de reina: previene postura en alzas de miel"
                        >
                            <span className="text-[8px] font-mono uppercase tracking-wider text-primary/90 font-medium">
                                Rejilla excluidora
                            </span>
                            <div className="flex gap-0.5">
                                {Array.from({ length: 8 }, (_, i) => (
                                    <span key={i} className="w-1.5 h-0.5 bg-primary/50 rounded-full" />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Cámara de Cría Basal (Cajón permanente de postura) */}
                <div className="mx-auto w-full max-w-[276px] sm:max-w-[316px]">
                    <div className="relative rounded-sm border-2 border-border/90 bg-surface-raised p-3 shadow-md">
                        {/* Manija central */}
                        <div className="w-12 h-1.5 rounded-full bg-border mx-auto mb-2" />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Crown size={13} className="text-primary shrink-0" />
                                    <span className="text-[11px] font-bold text-foreground font-display tracking-tight truncate">
                                        Cámara de Cría Basal
                                    </span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-sunken border border-border text-muted-foreground font-medium shrink-0">
                                    Vigor: {poblacion}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 text-xs">
                                <div className="text-[11px] text-muted-foreground min-w-0 truncate">
                                    <span className="text-foreground font-medium">{reinaActiva}</span>
                                    {marcosCria != null && (
                                        <span className="ml-1 text-[10px]">· {marcosCria}/10 cría activa</span>
                                    )}
                                </div>

                                {/* Representación esquemática de los 10 cuadros de cría y reservas */}
                                <div
                                    className="flex items-center gap-0.5 p-1 rounded bg-surface-sunken border border-border/50 shrink-0"
                                    title="10 marcos de la cámara de cría (reservas laterales + nido central)"
                                >
                                    {Array.from({ length: 10 }, (_, frameIdx) => {
                                        // Marcos 3 a 8 suelen ser el nido de cría central
                                        const isBroodZone = frameIdx >= 2 && frameIdx <= 7;
                                        const isBroodActive = marcosCria != null && isBroodZone && (frameIdx - 2) < marcosCria;
                                        const isSideReserve = frameIdx < 2 || frameIdx > 7;

                                        return (
                                            <span
                                                key={frameIdx}
                                                className={`w-1 h-6 rounded-xs transition-colors ${
                                                    isBroodActive
                                                        ? 'bg-amber-400 dark:bg-amber-500 shadow-[0_0_3px_rgba(245,158,11,0.6)]'
                                                        : isSideReserve
                                                            ? 'bg-primary/50'
                                                            : 'bg-muted-foreground/30'
                                                }`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Piquera & Rampa de vuelo */}
                <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px] mt-0.5">
                    {/* Hendidura oscura de vuelo */}
                    <div className="h-3 rounded-xs bg-surface-sunken border-x border-b border-border/90 flex items-center justify-between px-3">
                        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-tight">
                            Piquera frontal
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-0.5 bg-border rounded-full" />
                            <span className="w-6 h-1 bg-surface-sunken border border-border/80 rounded-xs" />
                            <span className="w-2 h-0.5 bg-border rounded-full" />
                        </div>
                    </div>

                    {/* 6. Piso Sanitario y Bandeja Anti-Varroa */}
                    <div className="mt-1 p-2 rounded-b-lg border border-border/70 bg-surface-sunken/60 flex items-center justify-between gap-2 text-[10px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${varroaStatus.dotClass}`} />
                            <span className="text-muted-foreground font-mono truncate">
                                Bandeja sanitaria:
                            </span>
                            <span className={`font-medium truncate ${varroaStatus.colorClass}`}>
                                {varroaStatus.label}
                            </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                            Base Langstroth
                        </span>
                    </div>
                </div>
            </div>

            {/* Parámetros biológicos resumidos en cuadrícula limpia */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/40 text-center font-mono">
                <div className="p-2 rounded-lg bg-surface-sunken border border-border/40">
                    <span className="text-[9px] text-muted-foreground block uppercase">Reina</span>
                    <span className="text-xs font-semibold text-foreground truncate block mt-0.5">
                        {colmena.queen ? '👑 Marcada' : '👑 Activa'}
                    </span>
                </div>
                <div className="p-2 rounded-lg bg-surface-sunken border border-border/40">
                    <span className="text-[9px] text-muted-foreground block uppercase">Marcos Cría</span>
                    <span className="text-xs font-semibold text-foreground block mt-0.5">
                        {marcosCria != null ? `${marcosCria} / 10` : '—'}
                    </span>
                </div>
                <div className="p-2 rounded-lg bg-surface-sunken border border-border/40">
                    <span className="text-[9px] text-muted-foreground block uppercase">Marcos Miel</span>
                    <span className="text-xs font-semibold text-primary block mt-0.5">
                        {marcosMiel != null ? `${marcosMiel} / 10` : '—'}
                    </span>
                </div>
                <div className="p-2 rounded-lg bg-surface-sunken border border-border/40">
                    <span className="text-[9px] text-muted-foreground block uppercase">Varroa</span>
                    <span className={`text-xs font-semibold block mt-0.5 ${varroaStatus.colorClass}`}>
                        {varroaLevel != null ? `${varroaLevel}%` : '—'}
                    </span>
                </div>
            </div>
        </div>
    );
}
