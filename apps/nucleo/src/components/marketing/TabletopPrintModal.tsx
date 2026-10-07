'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  QrCode,
  Coffee,
  CheckCircle2,
  FileDown,
  Sparkles,
  Sliders,
  Award,
} from 'lucide-react';
import { QRCode } from '@enjambre/ui';
import { type SlideData, type SlideBlock } from './slide-studio-core';

export interface TabletopPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlide: SlideData;
  partnerName?: string;
}

export function TabletopPrintModal({
  isOpen,
  onClose,
  activeSlide,
  partnerName = '',
}: TabletopPrintModalProps) {
  const [format, setFormat] = useState<'acrilico' | 'carta_a5'>('acrilico');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Buscar bloque sensorial o crear uno por defecto
  const sensorialBlock = activeSlide.blocks?.find(
    (b): b is Extract<SlideBlock, { type: 'sensorial' }> => b.type === 'sensorial',
  ) || {
    type: 'sensorial' as const,
    sweetness: 4,
    acidity: 3,
    flora: 5,
    body: 4,
    crystallization: 'Microcristales sedosos y untuosos',
    pairingNote: 'Armoniza con tueste medio lavado de Etiopía y cold brew cítrico. Servir bajo 40°C.',
  };

  // Buscar bloque QR o crear uno por defecto
  const qrBlock = activeSlide.blocks?.find(
    (b): b is Extract<SlideBlock, { type: 'qr_code' }> => b.type === 'qr_code',
  ) || {
    type: 'qr_code' as const,
    destinationType: 'resena' as const,
    url: 'https://tienda.obrerayzangano.cl/resenas/nueva?origen=mesa',
    title: 'CATA GUIADA EN MESA',
    subtitle: 'Escanea para evaluar el perfil botánico y activar tus beneficios.',
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in print:p-0 print:bg-white print:static print:z-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[95vh] flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:max-h-none print:w-full print:max-w-none">
        {/* Cabecera modal (Oculta en impresión) */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">
                Ficha de Mesa & Carta Barista Imprimible
              </h3>
              <p className="text-[11px] text-muted-foreground font-mono">
                Maquetada en alta resolución para acrílicos de mesa (10×15 cm) o barra de filtrados.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost h-8 w-8 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Cerrar vista imprimible"
          >
            <X size={16} />
          </button>
        </div>

        {/* Controles de Configuración de Impresión (Ocultos en impresión) */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-surface-sunken/40 text-xs font-mono shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Formato:</span>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setFormat('acrilico')}
                className={`px-2.5 py-1 ${format === 'acrilico' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'}`}
              >
                Acrílico 10×15 cm
              </button>
              <button
                type="button"
                onClick={() => setFormat('carta_a5')}
                className={`px-2.5 py-1 ${format === 'carta_a5' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'}`}
              >
                Ficha A5 / Media Carta
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Estilo:</span>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-2.5 py-1 ${theme === 'light' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'}`}
              >
                Impresión Kraft/Blanco
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-2.5 py-1 ${theme === 'dark' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'}`}
              >
                Oscuro de Lujo
              </button>
            </div>
          </div>
        </div>

        {/* ÁREA IMPRIMIBLE (La que se estampa en papel / PDF) */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-2 print:p-0 print:overflow-visible">
          <div
            id="printable-tabletop-card"
            className={`w-full max-w-[420px] rounded-2xl border p-6 transition-all shadow-lg print:shadow-none print:border-black print:rounded-none print:max-w-none print:w-[100mm] print:h-[150mm] print:p-4 print:mx-auto ${
              theme === 'light'
                ? 'bg-amber-50/40 text-stone-900 border-stone-300'
                : 'bg-stone-950 text-stone-100 border-amber-900/40'
            }`}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {/* Header de la Ficha */}
            <div className="border-b pb-3 mb-3.5 flex items-center justify-between border-stone-300/60 dark:border-stone-800">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-amber-800 dark:text-amber-400 font-semibold block">
                  {partnerName ? `ALIANZA // ${partnerName.toUpperCase()}` : 'DOCUMENTO DE MESA // BOSQUE NATIVO'}
                </span>
                <h4 className="font-serif text-lg font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-tight">
                  OBRERA Y ZÁNGANO
                </h4>
              </div>
              <span className="font-mono text-[9px] text-stone-500 dark:text-stone-400">
                CHILOÉ · 42°S
              </span>
            </div>

            {/* Título de la Variedad */}
            <div className="space-y-1 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {activeSlide.kickerLeft || 'RECOLECCIÓN SOBERANA'}
              </span>
              <h3 className="font-serif text-base sm:text-lg font-semibold leading-snug">
                {activeSlide.title || 'Miel Cruda de Bosque Nativo'}
              </h3>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                {activeSlide.subtitle || 'Memoria biológica de floración silvestre y enzimas intactas.'}
              </p>
            </div>

            {/* Radar / Métricas Sensoriales Barista */}
            <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 space-y-2 mb-4 text-[10px] font-mono">
              <div className="flex justify-between items-center text-amber-900 dark:text-amber-400 font-semibold text-[9px] border-b pb-1 border-stone-200/60 dark:border-stone-800">
                <span>PARÁMETRO SENSORIAL</span>
                <span>CALIBRACIÓN</span>
              </div>

              <div className="space-y-1">
                {[
                  { label: 'Dulzura Enzimática', val: sensorialBlock.sweetness },
                  { label: 'Acidez Floral Nativa', val: sensorialBlock.acidity },
                  { label: 'Complejidad Botánica', val: sensorialBlock.flora },
                  { label: 'Cuerpo & Untuosidad', val: sensorialBlock.body },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-stone-600 dark:text-stone-400">{item.label}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className={`w-3 h-1.5 rounded-sm ${
                            i <= item.val
                              ? 'bg-amber-600 dark:bg-amber-400'
                              : 'bg-stone-200 dark:bg-stone-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {sensorialBlock.pairingNote && (
                <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 text-[9px] text-stone-700 dark:text-stone-300 leading-tight">
                  <span className="font-semibold text-amber-800 dark:text-amber-400">Maridaje: </span>
                  {sensorialBlock.pairingNote}
                </div>
              )}
            </div>

            {/* QR de Mesa para Escaneo */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70">
              <QRCode
                value={qrBlock.url}
                size={72}
                bgColor="#FFFFFF"
                fgColor="#000000"
                className="p-1 bg-white border border-stone-300 rounded-lg shrink-0 shadow-sm"
              />
              <div className="space-y-0.5 min-w-0">
                <span className="font-mono text-[9px] uppercase tracking-wider text-amber-800 dark:text-amber-400 font-bold block">
                  {qrBlock.title}
                </span>
                <p className="text-[10px] text-stone-600 dark:text-stone-400 leading-tight font-sans">
                  {qrBlock.subtitle || 'Apunta la cámara para calificar y acceder a beneficios del Club Legado.'}
                </p>
                <span className="text-[8px] font-mono text-stone-400 dark:text-stone-500 block pt-0.5 truncate">
                  {qrBlock.url}
                </span>
              </div>
            </div>

            {/* Footer de Autenticidad */}
            <div className="mt-3.5 pt-2 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between text-[8px] font-mono text-stone-500">
              <span>ESTÁNDAR TÉRMICO &lt; 40°C</span>
              <span>obrerayzangano.cl</span>
            </div>
          </div>
        </div>

        {/* Acciones de Footer (Ocultas en impresión) */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between shrink-0 print:hidden">
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm text-xs px-4">
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary btn-sm text-xs px-4 flex items-center gap-1.5 shadow-sm"
          >
            <Printer size={14} />
            <span>Imprimir / Guardar PDF (300 DPI)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
