import React from 'react';

export interface TerritorioLogoProps {
  className?: string;
  size?: number;
}

/**
 * Emblema oficial de la Red Territorial Apícola de Chiloé.
 * Sello biocultural hexagonal que combina la arquitectura de la colmena
 * con la abeja nativa y las nervaduras botánicas del bosque templado lluvioso.
 */
export function TerritorioLogo({ className = 'w-8 h-8', size }: TerritorioLogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Emblema Red Territorial Apícola de Chiloé"
    >
      {/* Celda hexagonal base */}
      <polygon
        points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5"
        className="stroke-primary fill-primary/10"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* Aro interior sutil */}
      <polygon
        points="24,6.5 39.5,15.2 39.5,32.8 24,41.5 8.5,32.8 8.5,15.2"
        className="stroke-primary/30 fill-none"
        strokeWidth="0.8"
        strokeLinejoin="round"
        strokeDasharray="2 2"
      />

      {/* Cuerpo de la abeja */}
      {/* Cabeza con corona */}
      <circle cx="24" cy="14" r="2.8" className="fill-primary" />
      <path
        d="M22 10.5 C22.5 11.5, 23.5 12, 24 12 C24.5 12, 25.5 11.5, 26 10.5"
        className="stroke-primary fill-none"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Tórax */}
      <ellipse cx="24" cy="20.5" rx="3.5" ry="3.8" className="fill-foreground" />

      {/* Abdomen rayado */}
      <path
        d="M20.5 25 C20.5 24, 27.5 24, 27.5 25 L26.5 34 C25.5 36.5, 22.5 36.5, 21.5 34 Z"
        className="fill-primary"
      />
      {/* Franjas del abdomen */}
      <line x1="21" y1="27" x2="27" y2="27" className="stroke-background" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="21.5" y1="29.5" x2="26.5" y2="29.5" className="stroke-background" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="22.5" y1="32" x2="25.5" y2="32" className="stroke-background" strokeWidth="1.2" strokeLinecap="round" />

      {/* Alas superiores con nervadura botánica */}
      {/* Ala izquierda */}
      <path
        d="M21 18.5 C13 13, 8 18, 14 24 C17.5 27.5, 20.5 22.5, 21 20"
        className="stroke-primary/90 fill-primary/15"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M13 17 C16 20, 19 21, 21 20"
        className="stroke-primary/40 fill-none"
        strokeWidth="0.8"
      />

      {/* Ala derecha */}
      <path
        d="M27 18.5 C35 13, 40 18, 34 24 C30.5 27.5, 27.5 22.5, 27 20"
        className="stroke-primary/90 fill-primary/15"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M35 17 C32 20, 29 21, 27 20"
        className="stroke-primary/40 fill-none"
        strokeWidth="0.8"
      />

      {/* Antenas */}
      <path
        d="M22.5 12.5 C21 10, 18.5 9.5, 17 10"
        className="stroke-primary fill-none"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M25.5 12.5 C27 10, 29.5 9.5, 31 10"
        className="stroke-primary fill-none"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
