import React from 'react';

export interface TerritorioLogoProps {
  className?: string;
  size?: number;
}

/**
 * Emblema oficial del Registro Territorial Apícola de Chiloé.
 * Sello de Proveniencia: hexágono territorial de custodia, floración
 * sagrada de Ulmo (Eucryphia cordifolia) en 4 pétalos simétricos y núcleo de cera virgen.
 */
export function TerritorioLogo({ className = 'w-8 h-8', size }: TerritorioLogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Emblema Registro Apícola de Chiloé"
    >
      {/* Hexágono territorial de custodia */}
      <polygon
        points="24,4 41.3,14 41.3,34 24,44 6.7,34 6.7,14"
        className="stroke-primary fill-primary/10"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />

      {/* Filete interior sutil */}
      <polygon
        points="24,7.5 38.3,15.7 38.3,32.3 24,40.5 9.7,32.3 9.7,15.7"
        className="stroke-primary/25 fill-none"
        strokeWidth="0.75"
        strokeLinejoin="round"
        strokeDasharray="1.5 2"
      />

      {/* Floración sagrada de Ulmo (4 Pétalos Geométricos en Cruz Botánica) */}
      {/* Pétalo Superior */}
      <path
        d="M24 24 C22 19.5 22 13.5 24 12.5 C26 13.5 26 19.5 24 24Z"
        className="stroke-primary fill-primary/20"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Pétalo Inferior */}
      <path
        d="M24 24 C22 28.5 22 34.5 24 35.5 C26 34.5 26 28.5 24 24Z"
        className="stroke-primary fill-primary/20"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Pétalo Izquierdo */}
      <path
        d="M24 24 C19.5 22 13.5 22 12.5 24 C13.5 26 19.5 26 24 24Z"
        className="stroke-primary fill-primary/20"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Pétalo Derecho */}
      <path
        d="M24 24 C28.5 22 34.5 22 35.5 24 C34.5 26 28.5 26 24 24Z"
        className="stroke-primary fill-primary/20"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Anillo botánico interior */}
      <circle
        cx="24"
        cy="24"
        r="4.2"
        className="stroke-primary/40 fill-none"
        strokeWidth="0.75"
        strokeDasharray="1 1.5"
      />

      {/* Núcleo de cera virgen central */}
      <circle cx="24" cy="24" r="1.5" className="fill-primary" />
    </svg>
  );
}
