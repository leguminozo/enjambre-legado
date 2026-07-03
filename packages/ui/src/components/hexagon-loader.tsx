'use client';

import React from 'react';

const HEX_PATH = 'M24 4 L41.32 14 L41.32 42 L24 52 L6.68 42 L6.68 14 Z';

const SIZE_MAP = {
  sm: { box: 28, className: 'h-7 w-7' },
  md: { box: 40, className: 'h-10 w-10' },
  lg: { box: 56, className: 'h-14 w-14' },
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
  const { box, className: sizeClass } = SIZE_MAP[size];

  return (
    <svg
      viewBox="0 0 48 56"
      width={box}
      height={box * (56 / 48)}
      className={`enj-hex-loader text-accent ${sizeClass} ${className}`.trim()}
      aria-hidden={ariaHidden}
    >
      <path
        d={HEX_PATH}
        fill="currentColor"
        className="enj-hex-loader-fill"
        opacity={0.12}
      />
      <path
        d={HEX_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.2}
      />
      <path
        d={HEX_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1"
        className="enj-hex-loader-stroke"
      />
    </svg>
  );
}