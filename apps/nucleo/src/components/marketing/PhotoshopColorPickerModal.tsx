'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, Pipette, RotateCcw, Sliders } from 'lucide-react';
import { cn } from '@enjambre/ui';
import {
  hsbToHex,
  hexToHsb,
  hsbToRgb,
  rgbToHsb,
  rgbToHex,
  hexToRgb,
  getLuminance,
  SLIDE_THEMES,
  SLIDE_ACCENT_PALETTES,
} from './slide-studio-core';

export interface PhotoshopColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string; // Puede ser id de tema, id de acento o hex #...
  onApply: (colorValue: string, presetId?: string) => void;
  mode: 'background' | 'accent';
  title?: string;
}

export function PhotoshopColorPickerModal({
  isOpen,
  onClose,
  currentColor,
  onApply,
  mode,
  title,
}: PhotoshopColorPickerModalProps) {
  // Resuelve el color inicial a un HEX canónico
  const resolveInitialHex = useCallback(
    (color: string): { hex: string; presetId?: string } => {
      if (mode === 'background') {
        const theme = SLIDE_THEMES[color];
        if (theme) return { hex: theme.bgHex, presetId: color };
        if (color.startsWith('#')) return { hex: color };
        return { hex: '#0A0B0A', presetId: 'obsidiana' };
      } else {
        const pal = SLIDE_ACCENT_PALETTES[color];
        if (pal) return { hex: pal.hex, presetId: color };
        if (color.startsWith('#')) return { hex: color };
        return { hex: '#D6AA5C', presetId: 'oro' };
      }
    },
    [mode],
  );

  const initial = resolveInitialHex(currentColor);
  const initialHsb = hexToHsb(initial.hex);

  // Estados HSB interactivos
  const [h, setH] = useState(initialHsb.h);
  const [s, setS] = useState(initialHsb.s);
  const [b, setB] = useState(initialHsb.b);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(initial.presetId);

  // Hex inicial guardado para el cuadro comparativo "Actual"
  const [actualHex, setActualHex] = useState(initial.hex);

  // Sincronizar cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const res = resolveInitialHex(currentColor);
      const hsb = hexToHsb(res.hex);
      setH(hsb.h);
      setS(hsb.s);
      setB(hsb.b);
      setSelectedPresetId(res.presetId);
      setActualHex(res.hex);
    }
  }, [isOpen, currentColor, resolveInitialHex]);

  // Color actual generado en vivo
  const currentHex = hsbToHex(h, s, b).toUpperCase();
  const currentRgb = hsbToRgb(h, s, b);
  const isLightBackground = getLuminance(currentRgb.r, currentRgb.g, currentRgb.b) > 0.52;

  // Refs para interacciones de arrastre (pointer drag)
  const satValBoxRef = useRef<HTMLDivElement>(null);
  const hueBarRef = useRef<HTMLDivElement>(null);

  // Arrastre en el área 2D Saturación x Brillo
  const handleSatValPointer = (e: React.PointerEvent | PointerEvent) => {
    if (!satValBoxRef.current) return;
    const rect = satValBoxRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const newS = Math.round((x / rect.width) * 100);
    const newB = Math.round((1 - y / rect.height) * 100);

    setS(newS);
    setB(newB);
    setSelectedPresetId(undefined);
  };

  const onSatValPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    handleSatValPointer(e);

    const onPointerMove = (moveEvent: PointerEvent) => {
      handleSatValPointer(moveEvent);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Arrastre en la barra de Matiz (Hue rainbow)
  const handleHuePointer = (e: React.PointerEvent | PointerEvent) => {
    if (!hueBarRef.current) return;
    const rect = hueBarRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const newH = Math.round((y / rect.height) * 360) % 360;

    setH(newH);
    setSelectedPresetId(undefined);
  };

  const onHuePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    handleHuePointer(e);

    const onPointerMove = (moveEvent: PointerEvent) => {
      handleHuePointer(moveEvent);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Pipeta de pantalla nativa (EyeDropper API)
  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;
  const handleEyeDropper = async () => {
    if (hasEyeDropper) {
      try {
        const eye = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
        const res = await eye.open();
        if (res?.sRGBHex) {
          const hsb = hexToHsb(res.sRGBHex);
          setH(hsb.h);
          setS(hsb.s);
          setB(hsb.b);
          setSelectedPresetId(undefined);
        }
      } catch {
        // Cancelado por el usuario
      }
    }
  };

  // Atajo de teclado ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Presets canónicos según el modo
  const presets =
    mode === 'background'
      ? [
          { id: 'obsidiana', label: 'Obsidiana Carbón', hex: SLIDE_THEMES.obsidiana.bgHex },
          { id: 'marfil', label: 'Marfil Papel', hex: SLIDE_THEMES.marfil.bgHex },
          { id: 'selva', label: 'Selva Fría', hex: SLIDE_THEMES.selva.bgHex },
          { id: 'tierra', label: 'Tierra Alerce', hex: SLIDE_THEMES.tierra.bgHex },
        ]
      : Object.values(SLIDE_ACCENT_PALETTES).map((p) => ({
          id: p.id,
          label: p.label,
          hex: p.hex,
        }));

  const handleApply = () => {
    if (selectedPresetId) {
      onApply(selectedPresetId, selectedPresetId);
    } else {
      onApply(currentHex);
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[580px] rounded-2xl border border-border bg-card text-foreground shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado con estética Photoshop / Pro */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-sunken/60">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary/80 ring-2 ring-primary/20 shrink-0" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              {title || (mode === 'background' ? 'Selector de Color (Sustrato de Fondo)' : 'Selector de Color (Acento Editorial)')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
            title="Cerrar (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Fila de Muestras Canónicas de la Marca */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                Muestras Canónicas de Marca
              </span>
              {selectedPresetId && (
                <span className="text-[10px] font-mono text-primary font-medium">
                  {presets.find((p) => p.id === selectedPresetId)?.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {presets.map((p) => {
                const isSelected = selectedPresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPresetId(p.id);
                      const hsb = hexToHsb(p.hex);
                      setH(hsb.h);
                      setS(hsb.s);
                      setB(hsb.b);
                    }}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all shadow-2xs',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 bg-primary/10 text-foreground font-semibold'
                        : 'border-border bg-surface-sunken hover:border-primary/40 text-muted-foreground hover:text-foreground',
                    )}
                    title={`${p.label} (${p.hex})`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/40 shadow-xs shrink-0"
                      style={{ backgroundColor: p.hex }}
                    />
                    <span className="truncate max-w-[110px]">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Área Principal de Photoshop: Lienzo 2D, Slider Hue, Comparativa & Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
            {/* Lienzo 2D Saturación x Brillo (Columna Izquierda: 7 cols) */}
            <div className="sm:col-span-7 flex gap-3">
              {/* Cuadrante 2D (Photoshop Color Gradient) */}
              <div
                ref={satValBoxRef}
                onPointerDown={onSatValPointerDown}
                className="relative h-[210px] flex-1 rounded-xl cursor-crosshair overflow-hidden border border-border shadow-inner select-none touch-none"
                style={{ backgroundColor: `hsl(${h}, 100%, 50%)` }}
              >
                {/* Degradado blanco horizontal (Saturación) */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to right, #FFFFFF, rgba(255, 255, 255, 0))',
                  }}
                />
                {/* Degradado negro vertical (Brillo) */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, #000000, rgba(0, 0, 0, 0))',
                  }}
                />
                {/* Indicador de posición actual tipo mirilla Photoshop */}
                <div
                  className="absolute h-4 w-4 rounded-full border-2 border-white shadow-[0_0_2px_1px_rgba(0,0,0,0.8)] pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
                  style={{
                    left: `${s}%`,
                    top: `${100 - b}%`,
                  }}
                />
              </div>

              {/* Barra Vertical de Matiz (Hue Slider Arcoíris de 0° a 360°) */}
              <div
                ref={hueBarRef}
                onPointerDown={onHuePointerDown}
                className="relative w-8 h-[210px] rounded-xl cursor-pointer overflow-hidden border border-border shadow-inner select-none touch-none shrink-0"
                style={{
                  background:
                    'linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                }}
              >
                {/* Puntero indicador de matiz (flechas horizontales o anillo) */}
                <div
                  className="absolute left-0 right-0 h-2 -translate-y-1/2 border-y-2 border-white shadow-[0_0_2px_1px_rgba(0,0,0,0.8)] pointer-events-none"
                  style={{ top: `${(h / 360) * 100}%` }}
                />
              </div>
            </div>

            {/* Columna Derecha: Comparador Nuevo/Actual, Pipeta y Valores Numéricos (5 cols) */}
            <div className="sm:col-span-5 flex flex-col justify-between space-y-3">
              {/* Bloque Superior: Muestra Dual Nuevo vs Actual (Photoshop Style) & Pipeta */}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-border shadow-sm h-14">
                  {/* Nuevo */}
                  <div
                    className="flex-1 flex items-center justify-between px-2 text-[10px] font-mono font-semibold transition-colors"
                    style={{
                      backgroundColor: currentHex,
                      color: isLightBackground ? '#161916' : '#F2EEE6',
                    }}
                    title="Color nuevo seleccionado"
                  >
                    <span>nuevo</span>
                    <span className="text-[9px] opacity-75">{currentHex}</span>
                  </div>
                  {/* Actual */}
                  <button
                    type="button"
                    onClick={() => {
                      const hsb = hexToHsb(actualHex);
                      setH(hsb.h);
                      setS(hsb.s);
                      setB(hsb.b);
                      setSelectedPresetId(initial.presetId);
                    }}
                    className="flex-1 flex items-center justify-between px-2 text-[10px] font-mono hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: actualHex,
                      color: getLuminance(hexToRgb(actualHex).r, hexToRgb(actualHex).g, hexToRgb(actualHex).b) > 0.52 ? '#161916' : '#F2EEE6',
                    }}
                    title="Hacer clic para restaurar el color original"
                  >
                    <span>actual</span>
                    <RotateCcw size={10} className="opacity-60" />
                  </button>
                </div>

                {/* Botón de Pipeta Nativa de Pantalla */}
                {hasEyeDropper && (
                  <button
                    type="button"
                    onClick={handleEyeDropper}
                    className="h-14 w-12 rounded-xl border border-border bg-surface-sunken hover:bg-surface-raised flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-all shadow-xs shrink-0"
                    title="Muestrear cualquier color de la pantalla (Pipeta)"
                  >
                    <Pipette size={16} className="text-primary" />
                    <span className="text-[9px] font-mono">Pipeta</span>
                  </button>
                )}
              </div>

              {/* Panel de Entradas Numéricas Exactas (HSB, RGB, HEX) */}
              <div className="rounded-xl border border-border bg-surface-sunken/60 p-2.5 space-y-2">
                {/* HSB */}
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                  <div className="flex items-center gap-1 bg-card px-1.5 py-1 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground">H:</span>
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={h}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(360, Number(e.target.value) || 0));
                        setH(val);
                        setSelectedPresetId(undefined);
                      }}
                      className="w-full bg-transparent text-right font-medium text-foreground focus:outline-none p-0 text-xs font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">°</span>
                  </div>
                  <div className="flex items-center gap-1 bg-card px-1.5 py-1 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground">S:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={s}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                        setS(val);
                        setSelectedPresetId(undefined);
                      }}
                      className="w-full bg-transparent text-right font-medium text-foreground focus:outline-none p-0 text-xs font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                  <div className="flex items-center gap-1 bg-card px-1.5 py-1 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground">B:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={b}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                        setB(val);
                        setSelectedPresetId(undefined);
                      }}
                      className="w-full bg-transparent text-right font-medium text-foreground focus:outline-none p-0 text-xs font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                </div>

                {/* RGB */}
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                  <div className="flex items-center gap-1 bg-card px-1.5 py-1 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground">R:</span>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={currentRgb.r}
                      onChange={(e) => {
                        const newR = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                        const hsb = rgbToHsb(newR, currentRgb.g, currentRgb.b);
                        setH(hsb.h);
                        setS(hsb.s);
                        setB(hsb.b);
                        setSelectedPresetId(undefined);
                      }}
                      className="w-full bg-transparent text-right font-medium text-foreground focus:outline-none p-0 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-card px-1.5 py-1 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground">G:</span>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={currentRgb.g}
                      onChange={(e) => {
                        const newG = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                        const hsb = rgbToHsb(currentRgb.r, newG, currentRgb.b);
                        setH(hsb.h);
                        setS(hsb.s);
                        setB(hsb.b);
                        setSelectedPresetId(undefined);
                      }}
                      className="w-full bg-transparent text-right font-medium text-foreground focus:outline-none p-0 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-card px-1.5 py-1 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground">B:</span>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={currentRgb.b}
                      onChange={(e) => {
                        const newB = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                        const hsb = rgbToHsb(currentRgb.r, currentRgb.g, newB);
                        setH(hsb.h);
                        setS(hsb.s);
                        setB(hsb.b);
                        setSelectedPresetId(undefined);
                      }}
                      className="w-full bg-transparent text-right font-medium text-foreground focus:outline-none p-0 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* HEX Directo */}
                <div className="flex items-center gap-2 bg-card px-2.5 py-1.5 rounded-lg border border-border">
                  <span className="text-xs font-mono text-muted-foreground">#</span>
                  <input
                    type="text"
                    value={currentHex.replace('#', '')}
                    onChange={(e) => {
                      const val = e.target.value.trim().replace('#', '');
                      if (val.length === 6 || val.length === 3) {
                        const hsb = hexToHsb(`#${val}`);
                        setH(hsb.h);
                        setS(hsb.s);
                        setB(hsb.b);
                        setSelectedPresetId(undefined);
                      }
                    }}
                    maxLength={6}
                    className="w-full bg-transparent text-xs font-mono font-semibold uppercase text-foreground focus:outline-none tracking-wider"
                    placeholder="000000"
                  />
                  <span className="text-[10px] font-mono text-muted-foreground">HEX</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Acciones Inferior */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-sunken/40">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span
              className="h-3 w-3 rounded-full border border-black/30"
              style={{ backgroundColor: currentHex }}
            />
            <span className="font-semibold text-foreground">{currentHex}</span>
            <span className="text-[11px] hidden sm:inline">
              · {isLightBackground ? 'Ficha Clara' : 'Nocturno'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-xs h-8 px-3 rounded-xl text-xs font-mono border border-border text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="btn btn-primary btn-xs h-8 px-4 rounded-xl text-xs font-mono flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <Check size={13} />
              <span>OK / Aplicar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
