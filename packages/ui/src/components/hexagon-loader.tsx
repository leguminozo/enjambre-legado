'use client';

import React, { useId } from 'react';

/** Hexágono regular centrado en viewBox 48×56 */
const HEX_PATH = 'M24 4 L41.32 14 L41.32 42 L24 52 L6.68 42 L6.68 14 Z';

const SIZE_MAP = {
  sm: 'w-7',
  md: 'w-10',
  lg: 'w-[3.25rem]',
} as const;

export type HexagonLoaderSize = keyof typeof SIZE_MAP;

export function HexagonLoader({
  size = 'md',
  className = '',
  'aria-hidden': ariaHidden = true,
}: {
  size?: HexagonLoaderSize;
  className?: string;
  'aria-hidden'?: boolean;
}) {
  const rawId = useId().replace(/:/g, '');
  const clipId = `enj-hex-clip-${rawId}`;
  const glowId = `enj-hex-glow-${rawId}`;
  const sizeClass = SIZE_MAP[size];

  return (
    <svg
      viewBox="0 0 48 56"
      className={`enj-hex-loader shrink-0 aspect-[48/56] ${sizeClass} ${className}`.trim()}
      aria-hidden={ariaHidden}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={HEX_PATH} />
        </clipPath>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.65" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Base sutil */}
      <path d={HEX_PATH} fill="currentColor" className="enj-hex-loader-base" />

      {/* Relleno ascendente (clip dentro del hexágono) */}
      <g clipPath={`url(#${clipId})`}>
        <rect
          x="0"
          y="0"
          width="48"
          height="56"
          fill="currentColor"
          className="enj-hex-loader-fill-rect"
        />
      </g>

      {/* Contorno guía */}
      <path
        d={HEX_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        className="enj-hex-loader-track"
      />

      {/* Trazo animado */}
      <path
        d={HEX_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1"
        filter={`url(#${glowId})`}
        className="enj-hex-loader-stroke"
      />
    </svg>
  );
}