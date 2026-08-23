'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Move, Maximize2 } from 'lucide-react';

interface TerritorioHeroMapProps {
  mapaVacio?: boolean;
}

/**
 * Contenedor del mapa en el Hero con Touch Guard.
 * En pantallas táctiles móviles, el mapa no captura el gesto de scroll vertical
 * a menos que el usuario toque explícitamente para interactuar o abrir pantalla completa.
 */
export function TerritorioHeroMap({ mapaVacio }: TerritorioHeroMapProps) {
  const [isInteracting, setIsInteracting] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-lg bg-surface-sunken ring-1 ring-border/50 shadow-md">
      <iframe
        src="/mapa-chiloe?embed=1"
        title="Mapa apícola público de Chiloé: zonas aproximadas, sin nombres"
        loading="lazy"
        className={`w-full h-[min(52vh,450px)] sm:h-[500px] lg:h-[540px] bg-surface-sunken border-0 transition-opacity duration-200 ${
          isInteracting ? 'pointer-events-auto' : 'pointer-events-none sm:pointer-events-auto'
        }`}
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Capa de protección de scroll táctil en móvil */}
      {!isInteracting && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsInteracting(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsInteracting(true);
            }
          }}
          aria-label="Tocar para interactuar con el mapa de Chiloé"
          className="sm:hidden absolute inset-0 bg-background/15 backdrop-blur-[0.5px] flex items-center justify-center p-4 cursor-pointer transition-all hover:bg-background/25"
        >
          <div className="bg-background/95 border border-border/80 text-foreground px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium active:scale-95 transition-transform">
            <Move className="w-3.5 h-3.5 text-primary" />
            <span>Toca para explorar el mapa</span>
          </div>
        </div>
      )}

      {isInteracting && (
        <div className="sm:hidden absolute top-3 right-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={() => setIsInteracting(false)}
            className="bg-background/95 text-foreground border border-border/70 text-[11px] px-3 py-1.5 rounded-md shadow-md font-medium"
          >
            Bloquear scroll
          </button>
          <Link
            href="/mapa-chiloe"
            className="bg-primary text-primary-foreground text-[11px] px-3 py-1.5 rounded-md shadow-md font-medium flex items-center gap-1"
          >
            <Maximize2 className="w-3 h-3" />
            Ampliar
          </Link>
        </div>
      )}

      {mapaVacio && (
        <div className="absolute bottom-0 inset-x-0 p-3 pointer-events-none">
          <p className="mx-auto max-w-md bg-background/95 backdrop-blur-sm px-3 py-2 text-center text-xs text-muted-foreground ring-1 ring-border/40 rounded-md shadow-sm">
            El censo está en su fase inicial. Las zonas se irán incorporando a medida que los apicultores completen su inscripción.
          </p>
        </div>
      )}
    </div>
  );
}
