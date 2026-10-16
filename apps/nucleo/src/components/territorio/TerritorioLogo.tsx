import React from 'react';

export interface TerritorioLogoProps {
  className?: string;
  size?: number;
  variant?: 'cartografico' | 'tejuela' | 'botanico';
}

/**
 * Emblema oficial del Registro Territorial Apícola de Chiloé.
 *
 * Variantes de identidad:
 * - 'cartografico' (por defecto): Sello notarial y compás náutico de pecoreo insular.
 * - 'tejuela': Heráldica vernácula de madera de alerce y abeja guardiana.
 * - 'botanico': Floración auténtica de Ulmo (Eucryphia cordifolia) en aspa diagonal de 45°.
 */
export function TerritorioLogo({
  className = 'w-8 h-8',
  size,
  variant = 'cartografico',
}: TerritorioLogoProps) {
  const commonProps = {
    viewBox: '0 0 48 48',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className,
    style: size ? { width: size, height: size } : undefined,
    'aria-label': 'Emblema Registro Apícola de Chiloé',
  };

  if (variant === 'tejuela') {
    return (
      <svg {...commonProps}>
        {/* Silueta de tejuela de alerce en arco de escama tradicional */}
        <path
          d="M12 6 C12 5 13 4 14 4 L34 4 C35 4 36 5 36 6 L36 26 C36 36 24 44 24 44 C24 44 12 36 12 26 Z"
          className="stroke-primary fill-primary/10"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Bisel interior de la tejuela tallada a mano */}
        <path
          d="M15 8 L33 8 L33 24 C33 32 24 39.5 24 39.5 C24 39.5 15 32 15 24 Z"
          className="stroke-primary/35 fill-none"
          strokeWidth="0.6"
        />
        {/* Síntesis estilizada de la abeja guardiana */}
        <circle cx="24" cy="14" r="2.2" className="fill-primary" />
        <ellipse cx="24" cy="19" rx="2.8" ry="3.2" className="fill-primary" />
        <path d="M21.5 23 L26.5 23 L24 31 Z" className="fill-primary" />
        {/* Alas en gota (morfología de hoja de bosque nativo) */}
        <path
          d="M21 17 C15 13 13 18 17 23 C19 24.5 21 21 21 19"
          className="stroke-primary fill-primary/15"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <path
          d="M27 17 C33 13 35 18 31 23 C29 24.5 27 21 27 19"
          className="stroke-primary fill-primary/15"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        {/* Antenas */}
        <path d="M22.5 12 C21.5 10 20 9.5 19 10" className="stroke-primary fill-none" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M25.5 12 C26.5 10 28 9.5 29 10" className="stroke-primary fill-none" strokeWidth="0.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'botanico') {
    return (
      <svg {...commonProps}>
        {/* Celda hexagonal protectora */}
        <polygon
          points="24,4 41.3,14 41.3,34 24,44 6.7,34 6.7,14"
          className="stroke-primary fill-primary/5"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Flor de Ulmo: 4 pétalos anchos, redondeados, rotados a 45° (NO ortogonales = NUNCA cruz médica) */}
        <path
          d="M24 24 C25 18 31 14 34 17 C37 20 33 26 24 24Z"
          className="stroke-primary fill-primary/20"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d="M24 24 C30 25 34 31 31 34 C28 37 22 33 24 24Z"
          className="stroke-primary fill-primary/20"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d="M24 24 C23 30 17 34 14 31 C11 28 15 22 24 24Z"
          className="stroke-primary fill-primary/20"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d="M24 24 C18 23 14 17 17 14 C20 11 26 15 24 24Z"
          className="stroke-primary fill-primary/20"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        {/* Ramillete de estambres radiantes de Ulmo (el centro melífero) */}
        <circle cx="24" cy="24" r="2.5" className="fill-primary" />
        <line x1="24" y1="20" x2="24" y2="18" className="stroke-primary" strokeWidth="1" strokeLinecap="round" />
        <line x1="24" y1="28" x2="24" y2="30" className="stroke-primary" strokeWidth="1" strokeLinecap="round" />
        <line x1="20" y1="24" x2="18" y2="24" className="stroke-primary" strokeWidth="1" strokeLinecap="round" />
        <line x1="28" y1="24" x2="30" y2="24" className="stroke-primary" strokeWidth="1" strokeLinecap="round" />
        <circle cx="24" cy="17.5" r="0.8" className="fill-primary" />
        <circle cx="24" cy="30.5" r="0.8" className="fill-primary" />
        <circle cx="17.5" cy="24" r="0.8" className="fill-primary" />
        <circle cx="30.5" cy="24" r="0.8" className="fill-primary" />
      </svg>
    );
  }

  // Por defecto: Sello Cartográfico Notarial
  return (
    <svg {...commonProps}>
      {/* Anillo exterior notarial */}
      <circle cx="24" cy="24" r="21" className="stroke-primary" strokeWidth="1.4" />
      <circle
        cx="24"
        cy="24"
        r="18.5"
        className="stroke-primary/60"
        strokeWidth="0.6"
        strokeDasharray="0.8 1.8"
      />

      {/* Marcas cardinales de agrimensura cartográfica */}
      <line x1="24" y1="2" x2="24" y2="5" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="43" x2="24" y2="46" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="24" x2="5" y2="24" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="43" y1="24" x2="46" y2="24" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />

      {/* Celda hexagonal de pecoreo territorial */}
      <polygon
        points="24,9.5 35.5,16 35.5,29.5 24,36 12.5,29.5 12.5,16"
        className="stroke-primary fill-primary/10"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Aguja de rumbo / Rosa de pecoreo insular */}
      {/* Aguja Norte (faceta con sombra heráldica) */}
      <polygon points="24,11 26.5,22 24,24" className="fill-primary" />
      <polygon
        points="24,11 21.5,22 24,24"
        className="fill-primary/30 stroke-primary"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />

      {/* Aguja Sur */}
      <polygon points="24,34.5 21.5,26 24,24" className="fill-primary" />
      <polygon
        points="24,34.5 26.5,26 24,24"
        className="fill-primary/30 stroke-primary"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />

      {/* Rayos transversales este-oeste */}
      <line
        x1="15"
        y1="24"
        x2="33"
        y2="24"
        className="stroke-primary/60"
        strokeWidth="0.8"
        strokeDasharray="1 1.5"
      />

      {/* Núcleo de origen y coordenada territorial */}
      <circle cx="24" cy="24" r="2" className="fill-primary" />
      <circle cx="24" cy="24" r="4.5" className="stroke-primary/50" strokeWidth="0.7" />
    </svg>
  );
}
