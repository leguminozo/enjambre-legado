'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  QrCode,
  Coffee,
  CheckCircle2,
  Sparkles,
  Sliders,
  Award,
  Building2,
  Store,
  ShieldCheck,
} from 'lucide-react';
import { QRCode } from '@enjambre/ui';
import { type SlideData, type SlideBlock } from './slide-studio-core';

export type TabletopSegment = 'cafeterias' | 'hoteles' | 'tiendas-gourmet';

export interface TabletopPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlide?: SlideData;
  partnerName?: string;
  defaultSegment?: TabletopSegment;
  partnerCode?: string;
}

export function TabletopPrintModal({
  isOpen,
  onClose,
  activeSlide,
  partnerName = '',
  defaultSegment = 'cafeterias',
  partnerCode = '',
}: TabletopPrintModalProps) {
  const [segmentMode, setSegmentMode] = useState<TabletopSegment>(defaultSegment);
  const [format, setFormat] = useState<'a6_mesa' | 'acrilico' | 'carta_a5'>('a6_mesa');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (isOpen && defaultSegment) {
      setSegmentMode(defaultSegment);
    }
  }, [isOpen, defaultSegment]);

  // Buscar bloque sensorial o crear uno por defecto
  const sensorialBlock: Extract<SlideBlock, { type: 'sensorial' }> = activeSlide?.blocks?.find(
    (b): b is Extract<SlideBlock, { type: 'sensorial' }> => b.type === 'sensorial',
  ) || {
    id: 'default-sensorial',
    type: 'sensorial',
    axisLabels: undefined,
    sweetness: 4,
    acidity: 3,
    flora: 5,
    body: 4,
    crystallization: 'Microcristales sedosos y untuosos',
    pairingNote: 'Armoniza con tueste medio lavado de Etiopía y cold brew cítrico. Servir bajo 40°C.',
  };

  // Buscar bloque QR o crear uno por defecto
  const qrBlock = activeSlide?.blocks?.find(
    (b): b is Extract<SlideBlock, { type: 'qr_code' }> => b.type === 'qr_code',
  ) || {
    type: 'qr_code' as const,
    destinationType: 'resena' as const,
    url: partnerCode
      ? `https://tienda.obrerayzangano.cl/cata/${partnerCode}`
      : 'https://tienda.obrerayzangano.cl/resenas/nueva?origen=mesa',
    title: 'CATA GUIADA EN MESA',
    subtitle: 'Escanea para evaluar el perfil botánico y activar tus beneficios.',
  };

  const targetQrUrl = partnerCode
    ? `https://tienda.obrerayzangano.cl/cata/${partnerCode}`
    : qrBlock.url;

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const printDimensions = {
    a6_mesa: 'print:w-[105mm] print:h-[148mm]',
    acrilico: 'print:w-[100mm] print:h-[150mm]',
    carta_a5: 'print:w-[148mm] print:h-[210mm]',
  }[format];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/85 backdrop-blur-sm animate-in fade-in print:p-0 print:bg-background print:static print:z-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[95vh] flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:max-h-none print:w-full print:max-w-none">
        {/* Cabecera modal (Oculta en impresión) */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">
                Lámina A6 de Mesa & Ficha Barista Imprimible
              </h3>
              <p className="text-[11px] text-muted-foreground font-mono">
                Maquetada en alta resolución para soporte A6 (105 × 148 mm), acrílicos o barra de servicio.
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
        <div className="flex flex-col gap-2.5 p-3 rounded-xl border border-border/70 bg-surface-sunken/40 text-xs font-mono shrink-0 print:hidden">
          {/* Selector de Segmento */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-semibold">Segmento:</span>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSegmentMode('cafeterias')}
                  className={`px-2.5 py-1 flex items-center gap-1.5 transition-colors ${
                    segmentMode === 'cafeterias'
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Coffee size={12} />
                  <span>Cafetería (Mesa/Barra)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSegmentMode('hoteles')}
                  className={`px-2.5 py-1 flex items-center gap-1.5 transition-colors ${
                    segmentMode === 'hoteles'
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 size={12} />
                  <span>Hotel (Amenity VIP)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSegmentMode('tiendas-gourmet')}
                  className={`px-2.5 py-1 flex items-center gap-1.5 transition-colors ${
                    segmentMode === 'tiendas-gourmet'
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Store size={12} />
                  <span>Tienda Gourmet (Display)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Formato y Estilo */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Formato:</span>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFormat('a6_mesa')}
                  className={`px-2 py-0.5 ${format === 'a6_mesa' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  A6 (105 × 148 mm)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('acrilico')}
                  className={`px-2 py-0.5 ${format === 'acrilico' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Acrílico 10 × 15 cm
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('carta_a5')}
                  className={`px-2 py-0.5 ${format === 'carta_a5' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Media Carta / A5
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Estilo:</span>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-2 py-0.5 ${theme === 'light' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Papel Marfil
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-2 py-0.5 ${theme === 'dark' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Obsidiana
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ÁREA IMPRIMIBLE (La que se estampa en papel / PDF) */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-2 print:p-0 print:overflow-visible">
          <div
            id="printable-tabletop-card"
            className={`w-full max-w-[420px] rounded-2xl border p-5 transition-all shadow-lg print:shadow-none print:rounded-none print:max-w-none ${printDimensions} print:p-4 print:mx-auto ${
              theme === 'light'
                ? 'bg-card text-foreground border-border'
                : 'bg-surface-sunken text-foreground border-border/80'
            }`}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {/* Header de la Ficha */}
            <div className="border-b pb-2.5 mb-3 flex items-center justify-between border-border/60">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-primary font-semibold block">
                  {partnerName
                    ? segmentMode === 'hoteles'
                      ? `HOSPEDAJE // ${partnerName.toUpperCase()}`
                      : segmentMode === 'tiendas-gourmet'
                        ? `SELECCIÓN EXCLUSIVA // ${partnerName.toUpperCase()}`
                        : `ALIANZA // ${partnerName.toUpperCase()}`
                    : segmentMode === 'hoteles'
                      ? 'PASAPORTE DE HABITACIÓN // HUESPED DISTINGUIDO'
                      : segmentMode === 'tiendas-gourmet'
                        ? 'DISPLAY VITRINA // GARANTÍA BOTÁNICA'
                        : 'DOCUMENTO DE MESA // BOSQUE NATIVO'}
                </span>
                <h4 className="font-serif text-lg font-bold tracking-tight text-foreground leading-tight">
                  OBRERA Y ZÁNGANO
                </h4>
              </div>
              <span className="font-mono text-[9px] text-muted-foreground">
                CHILOÉ · 42°S
              </span>
            </div>

            {/* SEGMENTO: CAFETERÍA (Mesa & Barra Barista) */}
            {segmentMode === 'cafeterias' && (
              <>
                <div className="space-y-1 mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary">
                    {activeSlide?.kickerLeft || 'RECOLECCIÓN SOBERANA'}
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-semibold leading-snug text-foreground">
                    {activeSlide?.title || 'Miel Cruda de Bosque Nativo'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                    {activeSlide?.subtitle || 'Memoria biológica de floración silvestre y enzimas intactas.'}
                  </p>
                </div>

                {/* Radar / Métricas Sensoriales Barista */}
                <div className="p-3 rounded-xl border border-border/70 bg-surface-sunken/40 space-y-2 mb-3 text-[10px] font-mono">
                  <div className="flex justify-between items-center text-primary font-semibold text-[9px] border-b pb-1 border-border/60">
                    <span>PARÁMETRO SENSORIAL</span>
                    <span>CALIBRACIÓN</span>
                  </div>

                  <div className="space-y-1">
                    {(
                      sensorialBlock.axisLabels || [
                        'Dulzura Enzimática',
                        'Acidez Floral Nativa',
                        'Complejidad Botánica',
                        'Cuerpo & Untuosidad',
                      ]
                    ).map((label, idx) => {
                      const values = [
                        sensorialBlock.sweetness,
                        sensorialBlock.acidity,
                        sensorialBlock.flora,
                        sensorialBlock.body,
                      ];
                      const val = values[idx] ?? 4;
                      return (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-muted-foreground">{label}</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <span
                                key={i}
                                className={`w-3 h-1.5 rounded-sm ${
                                  i <= val
                                    ? 'bg-primary'
                                    : 'bg-surface-sunken/80 border border-border/40'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {sensorialBlock.pairingNote && (
                    <div className="pt-2 border-t border-border/60 text-[9px] text-muted-foreground leading-tight">
                      <span className="font-semibold text-primary">Maridaje: </span>
                      {sensorialBlock.pairingNote}
                    </div>
                  )}
                </div>

                {/* Protocolo de Fidelización & QR ST-CATA */}
                <div className="p-3 rounded-xl border border-border/80 bg-surface-raised space-y-2 mb-3">
                  <div className="flex items-start gap-3">
                    <QRCode
                      value={targetQrUrl}
                      size={68}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                      className="p-1 bg-background border border-border rounded-lg shrink-0 shadow-sm"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={11} className="text-primary shrink-0" />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-primary font-bold block truncate">
                          {partnerCode ? `RITUAL EN ${partnerName.toUpperCase() || 'MESA'}` : qrBlock.title || 'CATA GUIADA EN MESA'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight font-sans">
                        {qrBlock.subtitle || 'Apunta la cámara para calificar el perfil botánico y activar tus beneficios.'}
                      </p>
                      <div className="pt-1 border-t border-border/50 flex flex-col gap-0.5 text-[9px] font-mono text-foreground/90">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-primary shrink-0" />
                          <span>1er timbre de bienvenida al registrar tu cata</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award size={10} className="text-primary shrink-0" />
                          <span>+25 puntos en Club Legado para tu próxima visita</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer de Autenticidad */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[8px] font-mono text-muted-foreground">
                  <span>ESTÁNDAR TÉRMICO &lt; 40°C · INVERTASA VIVA</span>
                  <span>obrerayzangano.cl</span>
                </div>
              </>
            )}

            {/* SEGMENTO: HOTEL (Pasaporte de Habitación & Amenity VIP) */}
            {segmentMode === 'hoteles' && (
              <>
                <div className="space-y-1 mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary">
                    CORTESÍA BOTÁNICA EXCLUSIVA
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-semibold leading-snug text-foreground">
                    Elixir Silvestre de Bosque Templado
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                    Miel cruda de origen 42°S en formato individual (25g/40g). Recolectada en frío para conservar su riqueza biológica intacta.
                  </p>
                </div>

                {/* 3 Pilares del Huésped */}
                <div className="p-3 rounded-xl border border-border/70 bg-surface-sunken/40 space-y-2 mb-3 text-[10px] font-mono">
                  <div className="text-primary font-semibold text-[9px] border-b pb-1 border-border/60">
                    BENEFICIOS BOTÁNICOS PARA TU ESTADÍA
                  </div>
                  <div className="space-y-1.5 text-muted-foreground leading-tight">
                    <div className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">1.</span>
                      <span>
                        <strong className="text-foreground">Enzimas Vivas Intactas:</strong> Invertasa y glucosa oxidasa sin pasteurización para vigor celular natural.
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">2.</span>
                      <span>
                        <strong className="text-foreground">Descanso Reparador:</strong> Fructosa silvestre pura que favorece la síntesis biológica del sueño profundo.
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">3.</span>
                      <span>
                        <strong className="text-foreground">Pureza de Lluvia Austral:</strong> Cero agroquímicos; néctar de ulmo y tiaca del archipiélago de Chiloé.
                      </span>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-border/60 text-[9px] text-muted-foreground">
                    <span className="text-primary font-semibold">Sugerencia: </span>
                    Degustar pura con cuchara o en infusión tibia (&lt;40°C).
                  </div>
                </div>

                {/* Experiencia Huésped & QR */}
                <div className="p-3 rounded-xl border border-border/80 bg-surface-raised space-y-2 mb-3">
                  <div className="flex items-start gap-3">
                    <QRCode
                      value={targetQrUrl}
                      size={68}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                      className="p-1 bg-background border border-border rounded-lg shrink-0 shadow-sm"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={11} className="text-primary shrink-0" />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-primary font-bold block truncate">
                          HISTORIA DEL LOTE & BIENVENIDA
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight font-sans">
                        Escanea para conocer el colmenar de origen de esta cortesía y activar tu beneficio exclusivo de huésped.
                      </p>
                      <div className="pt-1 border-t border-border/50 flex flex-col gap-0.5 text-[9px] font-mono text-foreground/90">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-primary shrink-0" />
                          <span>Pasaporte sensorial activado para tu estadía</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award size={10} className="text-primary shrink-0" />
                          <span>+25 puntos en Club Legado para tu retorno</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[8px] font-mono text-muted-foreground">
                  <span>CORTESÍA DE ALTA GAMA · CHILOÉ NATIVO</span>
                  <span>obrerayzangano.cl</span>
                </div>
              </>
            )}

            {/* SEGMENTO: TIENDA GOURMET (Display Vitrina / Shelf-Talker de Garantía) */}
            {segmentMode === 'tiendas-gourmet' && (
              <>
                <div className="space-y-1 mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary">
                    GARANTÍA DE PUREZA BOTÁNICA
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-semibold leading-snug text-foreground">
                    Miel Cruda de Bosque Nativo
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                    Certificación analítica de floración silvestre y extracción por centrifugado en frío.
                  </p>
                </div>

                {/* Tabla de Especificaciones de Vitrina */}
                <div className="p-3 rounded-xl border border-border/70 bg-surface-sunken/40 space-y-1.5 mb-3 text-[10px] font-mono">
                  <div className="flex justify-between items-center text-primary font-semibold text-[9px] border-b pb-1 border-border/60">
                    <span>ESPECIFICACIÓN DE CALIDAD</span>
                    <span>ESTÁNDAR VERIFICADO</span>
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Humedad de Partida</span>
                      <span className="text-foreground font-semibold">&lt; 17.5% (Codex &lt; 20%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estado Enzimático</span>
                      <span className="text-foreground font-semibold">Invertasa & Diastasa Vivas</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Índice HMF (Frescura)</span>
                      <span className="text-foreground font-semibold">&lt; 10 mg/kg (Cruda Fresca)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trazabilidad Territorial</span>
                      <span className="text-foreground font-semibold">Cordillera de Chiloé 42°S</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Filtrado Industrial</span>
                      <span className="text-foreground font-semibold">Cero ultrafiltrado / Sin calor</span>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-border/60 text-[9px] text-muted-foreground">
                    <span className="text-primary font-semibold">Conservación: </span>
                    15°C a 25°C protegida de la radiación solar directa.
                  </div>
                </div>

                {/* Sello Botánico & QR */}
                <div className="p-3 rounded-xl border border-border/80 bg-surface-raised space-y-2 mb-3">
                  <div className="flex items-start gap-3">
                    <QRCode
                      value={targetQrUrl}
                      size={68}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                      className="p-1 bg-background border border-border rounded-lg shrink-0 shadow-sm"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={11} className="text-primary shrink-0" />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-primary font-bold block truncate">
                          CERTIFICADO BOTÁNICO DE LOTE
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight font-sans">
                        Escanea para verificar el análisis de polen de la partida y conocer al apicultor de la colmena.
                      </p>
                      <div className="pt-1 border-t border-border/50 flex flex-col gap-0.5 text-[9px] font-mono text-foreground/90">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-primary shrink-0" />
                          <span>Sello de autenticidad y lote verificable en vivo</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award size={10} className="text-primary shrink-0" />
                          <span>+25 puntos en Club Legado al registrar frasco</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[8px] font-mono text-muted-foreground">
                  <span>PATRIMONIO BIOLÓGICO · RECOLECCIÓN SOBERANA</span>
                  <span>obrerayzangano.cl</span>
                </div>
              </>
            )}
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
