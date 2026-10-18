import React, { useId } from 'react';

export interface TerritorioLogoProps {
  className?: string;
  size?: number;
  variant?: 'cartografico' | 'tejuela' | 'botanico';
}

/**
 * Emblema oficial del Registro Territorial Apícola de Chiloé.
 *
 * Variantes de identidad:
 * - 'cartografico' (por defecto): Sello notarial y compás náutico de pecoreo insular con
 *   facetado bicromático (Oro Miel / Latón de navegación + Bosque Ulmo profundo).
 * - 'tejuela': Heráldica vernácula de madera de alerce y abeja guardiana dorada.
 * - 'botanico': Floración auténtica de Ulmo (Eucryphia cordifolia) en aspa diagonal de 45°
 *   con pistilos en oro miel sobre cáliz nativo.
 */
export function TerritorioLogo({
  className = 'w-8 h-8',
  size,
  variant = 'cartografico',
}: TerritorioLogoProps) {
  const rawId = useId();
  // Sanitizar el ID para uso seguro en atributos SVG url(#...)
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '') || 'enj';
  const gradOro = `oro-${id}`;
  const gradBosque = `bosque-${id}`;
  const gradAura = `aura-${id}`;
  const gradHex = `hex-${id}`;

  const commonProps = {
    viewBox: '0 0 48 48',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className,
    style: size ? { width: size, height: size } : undefined,
    'aria-label': 'Emblema Registro Apícola de Chiloé',
  };

  const defs = (
    <defs>
      {/* Oro miel cálido / Latón pulido de compás náutico */}
      <linearGradient id={gradOro} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F5D076" />
        <stop offset="50%" stopColor="#D49A3D" />
        <stop offset="100%" stopColor="#9E6B20" />
      </linearGradient>

      {/* Verde bosque nativo / Ciprés y Ulmo profundo */}
      <linearGradient id={gradBosque} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="60%" stopColor="#0D7355" />
        <stop offset="100%" stopColor="#064E3B" />
      </linearGradient>

      {/* Lente óptico interno y atmósfera del instrumento */}
      <radialGradient id={gradAura} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#D49A3D" stopOpacity="0.16" />
        <stop offset="60%" stopColor="#0D7355" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#064E3B" stopOpacity="0" />
      </radialGradient>

      {/* Fondo translúcido para la celda territorial */}
      <linearGradient id={gradHex} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0D7355" stopOpacity="0.14" />
        <stop offset="100%" stopColor="#052E23" stopOpacity="0.04" />
      </linearGradient>
    </defs>
  );

  if (variant === 'tejuela') {
    return (
      <svg {...commonProps}>
        {defs}
        {/* Silueta de tejuela de alerce en arco de escama tradicional */}
        <path
          d="M12 6 C12 5 13 4 14 4 L34 4 C35 4 36 5 36 6 L36 26 C36 36 24 44 24 44 C24 44 12 36 12 26 Z"
          stroke={`url(#${gradBosque})`}
          fill={`url(#${gradHex})`}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Bisel interior de la tejuela tallada a mano */}
        <path
          d="M15 8 L33 8 L33 24 C33 32 24 39.5 24 39.5 C24 39.5 15 32 15 24 Z"
          stroke={`url(#${gradOro})`}
          strokeOpacity="0.4"
          fill="none"
          strokeWidth="0.6"
        />
        {/* Síntesis estilizada de la abeja guardiana */}
        <circle cx="24" cy="14" r="2.2" fill={`url(#${gradOro})`} />
        <ellipse cx="24" cy="19" rx="2.8" ry="3.2" fill={`url(#${gradBosque})`} />
        <path d="M21.5 23 L26.5 23 L24 31 Z" fill={`url(#${gradOro})`} />
        {/* Alas en gota (morfología de hoja de bosque nativo) */}
        <path
          d="M21 17 C15 13 13 18 17 23 C19 24.5 21 21 21 19"
          stroke={`url(#${gradOro})`}
          fill={`url(#${gradOro})`}
          fillOpacity="0.25"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M27 17 C33 13 35 18 31 23 C29 24.5 27 21 27 19"
          stroke={`url(#${gradOro})`}
          fill={`url(#${gradOro})`}
          fillOpacity="0.25"
          strokeWidth="1"
          strokeLinecap="round"
        />
        {/* Antenas */}
        <path d="M22.5 12 C21.5 10 20 9.5 19 10" stroke={`url(#${gradBosque})`} fill="none" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M25.5 12 C26.5 10 28 9.5 29 10" stroke={`url(#${gradBosque})`} fill="none" strokeWidth="0.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'botanico') {
    return (
      <svg {...commonProps}>
        {defs}
        {/* Celda hexagonal protectora */}
        <polygon
          points="24,4 41.3,14 41.3,34 24,44 6.7,34 6.7,14"
          stroke={`url(#${gradBosque})`}
          fill={`url(#${gradHex})`}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {/* Bisel hexagonal interior */}
        <polygon
          points="24,6.5 39.1,15.2 39.1,32.8 24,41.5 8.9,32.8 8.9,15.2"
          stroke={`url(#${gradOro})`}
          strokeOpacity="0.3"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        {/* Flor de Ulmo: 4 pétalos anchos, redondeados, rotados a 45° */}
        <path
          d="M24 24 C25 18 31 14 34 17 C37 20 33 26 24 24Z"
          stroke={`url(#${gradBosque})`}
          fill="currentColor"
          className="text-primary/15"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M24 24 C30 25 34 31 31 34 C28 37 22 33 24 24Z"
          stroke={`url(#${gradBosque})`}
          fill="currentColor"
          className="text-primary/15"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M24 24 C23 30 17 34 14 31 C11 28 15 22 24 24Z"
          stroke={`url(#${gradBosque})`}
          fill="currentColor"
          className="text-primary/15"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M24 24 C18 23 14 17 17 14 C20 11 26 15 24 24Z"
          stroke={`url(#${gradBosque})`}
          fill="currentColor"
          className="text-primary/15"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Ramillete de estambres radiantes de Ulmo con pistilos en oro miel */}
        <circle cx="24" cy="24" r="2.6" fill={`url(#${gradOro})`} />
        <line x1="24" y1="20" x2="24" y2="17.5" stroke={`url(#${gradBosque})`} strokeWidth="1" strokeLinecap="round" />
        <line x1="24" y1="28" x2="24" y2="30.5" stroke={`url(#${gradBosque})`} strokeWidth="1" strokeLinecap="round" />
        <line x1="20" y1="24" x2="17.5" y2="24" stroke={`url(#${gradBosque})`} strokeWidth="1" strokeLinecap="round" />
        <line x1="28" y1="24" x2="30.5" y2="24" stroke={`url(#${gradBosque})`} strokeWidth="1" strokeLinecap="round" />
        <circle cx="24" cy="17" r="1" fill={`url(#${gradOro})`} />
        <circle cx="24" cy="31" r="1" fill={`url(#${gradOro})`} />
        <circle cx="17" cy="24" r="1" fill={`url(#${gradOro})`} />
        <circle cx="31" cy="24" r="1" fill={`url(#${gradOro})`} />
      </svg>
    );
  }

  // Por defecto: Sello Cartográfico Notarial de Alta Gama
  return (
    <svg {...commonProps}>
      {defs}

      {/* Aura central de lente óptico de navegación */}
      <circle cx="24" cy="24" r="12" fill={`url(#${gradAura})`} />

      {/* Anillo exterior notarial */}
      <circle
        cx="24"
        cy="24"
        r="21.5"
        stroke={`url(#${gradBosque})`}
        strokeWidth="1.3"
        strokeOpacity="0.9"
      />

      {/* Escala de agrimensura concéntrica discontinua en oro miel */}
      <circle
        cx="24"
        cy="24"
        r="18.8"
        stroke={`url(#${gradOro})`}
        strokeWidth="0.75"
        strokeDasharray="0.8 1.9"
        strokeOpacity="0.65"
      />

      {/* Marcas cardinales de agrimensura cartográfica */}
      {/* Marca Norte (Norte Magnético destacado en oro miel) */}
      <line
        x1="24"
        y1="1.5"
        x2="24"
        y2="5.5"
        stroke={`url(#${gradOro})`}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Marca Sur */}
      <line
        x1="24"
        y1="42.5"
        x2="24"
        y2="46.5"
        stroke={`url(#${gradBosque})`}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      {/* Marca Oeste */}
      <line
        x1="1.5"
        y1="24"
        x2="5.5"
        y2="24"
        stroke={`url(#${gradBosque})`}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      {/* Marca Este */}
      <line
        x1="42.5"
        y1="24"
        x2="46.5"
        y2="24"
        stroke={`url(#${gradBosque})`}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />

      {/* Puntos de precisión intercardinal (NE, SE, SO, NO) a 45° */}
      <circle cx="38.5" cy="9.5" r="0.65" fill={`url(#${gradOro})`} fillOpacity="0.6" />
      <circle cx="38.5" cy="38.5" r="0.65" fill={`url(#${gradOro})`} fillOpacity="0.6" />
      <circle cx="9.5" cy="38.5" r="0.65" fill={`url(#${gradOro})`} fillOpacity="0.6" />
      <circle cx="9.5" cy="9.5" r="0.65" fill={`url(#${gradOro})`} fillOpacity="0.6" />

      {/* Celda hexagonal de pecoreo territorial */}
      <polygon
        points="24,8.5 36.5,15.7 36.5,30.3 24,37.5 11.5,30.3 11.5,15.7"
        stroke={`url(#${gradBosque})`}
        fill={`url(#${gradHex})`}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Bisel concéntrico interior de la celda de pecoreo */}
      <polygon
        points="24,10.2 34.8,16.5 34.8,29.5 24,35.8 13.2,29.5 13.2,16.5"
        stroke={`url(#${gradOro})`}
        strokeWidth="0.5"
        strokeOpacity="0.25"
        strokeLinejoin="round"
      />

      {/* Aguja de rumbo / Rosa de pecoreo insular facetada */}
      {/* Aguja Norte — Faceta derecha (Luz boreal en Oro Miel) */}
      <polygon
        points="24,10.5 26.8,22 24,24"
        fill={`url(#${gradOro})`}
      />
      {/* Aguja Norte — Faceta izquierda (Penumbra en Verde Bosque profundo) */}
      <polygon
        points="24,10.5 21.2,22 24,24"
        fill={`url(#${gradBosque})`}
        fillOpacity="0.9"
        stroke="#052E23"
        strokeWidth="0.4"
        strokeLinejoin="round"
      />

      {/* Aguja Sur — Faceta izquierda (Sombra profunda) */}
      <polygon
        points="24,35.5 21.2,26 24,24"
        fill={`url(#${gradBosque})`}
        fillOpacity="0.75"
      />
      {/* Aguja Sur — Faceta derecha (Sombra carbón con filo bosque) */}
      <polygon
        points="24,35.5 26.8,26 24,24"
        fill="#052E23"
        stroke={`url(#${gradBosque})`}
        strokeOpacity="0.35"
        strokeWidth="0.4"
        strokeLinejoin="round"
      />

      {/* Rayos transversales este-oeste */}
      <line
        x1="14"
        y1="24"
        x2="34"
        y2="24"
        stroke={`url(#${gradOro})`}
        strokeWidth="0.75"
        strokeDasharray="1 1.8"
        strokeOpacity="0.45"
      />

      {/* Núcleo de origen y coordenada territorial */}
      <circle
        cx="24"
        cy="24"
        r="4.8"
        stroke={`url(#${gradOro})`}
        strokeWidth="0.8"
        strokeOpacity="0.75"
      />
      <circle
        cx="24"
        cy="24"
        r="3.2"
        stroke={`url(#${gradBosque})`}
        strokeWidth="0.6"
        strokeOpacity="0.6"
      />
      <circle
        cx="24"
        cy="24"
        r="1.6"
        fill={`url(#${gradOro})`}
      />
    </svg>
  );
}
