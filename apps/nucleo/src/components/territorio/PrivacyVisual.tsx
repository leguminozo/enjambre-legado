import React from 'react';
import { Eye, Lock, MapPin, ShieldCheck } from 'lucide-react';

export interface PrivacyVisualProps {
  className?: string;
}

/**
 * Visualización comparativa de privacidad del Registro Apícola de Chiloé.
 * Ilustra la diferencia entre la zona difusa pública (~1 km) y la posición exacta privada.
 */
export function PrivacyVisual({ className = '' }: PrivacyVisualProps) {
  return (
    <div className={`w-full max-w-5xl mx-auto ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        {/* Panel 1: Público */}
        <div className="relative rounded-lg bg-surface-sunken/80 border border-border/70 p-4 sm:p-8 flex flex-col justify-between overflow-hidden ring-1 ring-border/30">
          <div className="flex items-center justify-between gap-4 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
              <Eye className="w-3.5 h-3.5" />
              Mapa público abierto
            </span>
            <span className="text-xs font-mono text-muted-foreground/70">~1.000 m radio</span>
          </div>

          {/* Mini-mapa esquemático SVG: Zona difusa */}
          <div className="relative w-full aspect-[16/10] rounded-md bg-background/90 border border-border/50 overflow-hidden mb-6 flex items-center justify-center p-4">
            {/* Curvas topográficas abstractas */}
            <svg
              className="absolute inset-0 w-full h-full stroke-border/40 fill-none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              viewBox="0 0 400 240"
              aria-hidden="true"
            >
              <path d="M-20 60 C80 40, 160 110, 240 80 C320 50, 360 120, 420 100" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M-20 140 C100 120, 180 190, 280 150 C380 110, 380 200, 420 180" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M-20 200 C60 170, 150 220, 260 190 C340 160, 370 230, 420 210" strokeWidth="1" />
            </svg>

            {/* Halo difuso de pecoreo público */}
            <div className="relative flex flex-col items-center justify-center">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-primary/10 border border-primary/30 border-dashed animate-pulse flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center text-xs text-primary font-mono text-center px-1">
                  Zona ~1 km
                </div>
              </div>
            </div>

            {/* Etiqueta de anonimización */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-muted-foreground/80 font-mono bg-background/80 px-2.5 py-1 rounded border border-border/40 backdrop-blur-sm">
              <span>Sin RUT ni nombres</span>
              <span className="text-primary font-medium">Zona aproximada</span>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-1.5 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary shrink-0" />
              Visualización pública anonimizada
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Radio aproximado de pecoreo (~1 km). La visualización cartográfica no asocia identidades, contactos ni coordenadas de precisión.
            </p>
          </div>
        </div>

        {/* Panel 2: Privado */}
        <div className="relative rounded-lg bg-surface-raised/80 border border-border/90 p-4 sm:p-8 flex flex-col justify-between overflow-hidden ring-1 ring-primary/20">
          <div className="flex items-center justify-between gap-4 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Cuaderno de manejo privado
            </span>
            <span className="text-xs font-mono text-primary">Acceso exclusivo</span>
          </div>

          {/* Mini-mapa esquemático SVG: Pin exacto georreferenciado */}
          <div className="relative w-full aspect-[16/10] rounded-md bg-background/90 border border-border/50 overflow-hidden mb-6 flex items-center justify-center p-4">
            {/* Curvas topográficas idénticas para paridad */}
            <svg
              className="absolute inset-0 w-full h-full stroke-border/40 fill-none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              viewBox="0 0 400 240"
              aria-hidden="true"
            >
              <path d="M-20 60 C80 40, 160 110, 240 80 C320 50, 360 120, 420 100" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M-20 140 C100 120, 180 190, 280 150 C380 110, 380 200, 420 180" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M-20 200 C60 170, 150 220, 260 190 C340 160, 370 230, 420 210" strokeWidth="1" />
            </svg>

            {/* Punto exacto georreferenciado con pin y tarjeta de detalle */}
            <div className="relative flex flex-col items-center justify-center z-10">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg ring-4 ring-primary/20">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-background animate-ping" />
              </div>
              <div className="mt-2 bg-surface-raised px-3 py-1 rounded-md border border-border/80 shadow-sm text-center">
                <p className="text-xs font-semibold text-foreground truncate max-w-[140px]">Tu Apiario (privado)</p>
                <p className="text-[10px] font-mono text-muted-foreground">42°XX&apos;S 73°XX&apos;W · ejemplo</p>
              </div>
            </div>

            {/* Etiqueta de control */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-foreground font-mono bg-background/80 px-2.5 py-1 rounded border border-border/40 backdrop-blur-sm">
              <span>Declaración SAG & Cuaderno</span>
              <span className="text-primary font-medium">Control exclusivo</span>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-1.5 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              Información de control privado
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Coordenadas GPS de precisión, bitácora de sanidad, registros fenológicos y documentación técnica para el SAG.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
