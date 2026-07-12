'use client';

import React, { useId, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

/** Hexágono regular centrado en viewBox 48×56 */
const HEX_PATH = 'M24 4 L41.32 14 L41.32 42 L24 52 L6.68 42 L6.68 14 Z';

export type HexagonLoaderSize = 'sm' | 'md' | 'lg';
export type HexagonContext = 'tienda' | 'campo' | 'nucleo' | 'default';

export function HexagonLoader({
  size = 'md',
  className = '',
  context = 'default',
  'aria-hidden': ariaHidden = true,
}: {
  size?: HexagonLoaderSize;
  className?: string;
  context?: HexagonContext;
  'aria-hidden'?: boolean;
}) {
  const rawId = useId().replace(/:/g, '');
  const clipId = `enj-hex-clip-${rawId}`;
  const glowId = `enj-hex-glow-${rawId}`;
  const fluidId = `enj-hex-fluid-${rawId}`;

  const svgRef = useRef<SVGSVGElement>(null);
  const strokeRef = useRef<SVGPathElement>(null);
  const fillRef = useRef<SVGRectElement>(null);

  useGSAP(() => {
    // Animación del trazo perimetral (fluida y orgánica)
    if (strokeRef.current) {
      gsap.to(strokeRef.current, {
        keyframes: [
          { strokeDashoffset: 1, opacity: 0, duration: 0 },
          { strokeDashoffset: 0, opacity: 1, duration: 1.2, ease: 'power2.inOut' },
          { strokeDashoffset: 0, opacity: 1, duration: 0.6 },
          { strokeDashoffset: -1, opacity: 0, duration: 1.2, ease: 'power2.inOut' }
        ],
        repeat: -1,
      });
    }

    // Animación del fluido ascendente
    if (fillRef.current) {
      gsap.to(fillRef.current, {
        keyframes: [
          { y: 56, scaleY: 0.1, opacity: 0, duration: 0 },
          { y: 0, scaleY: 1, opacity: context === 'tienda' ? 0.6 : 0.4, duration: 1.5, ease: 'power2.inOut' },
          { y: 0, scaleY: 1, opacity: context === 'tienda' ? 0.6 : 0.4, duration: 0.3 },
          { y: -56, scaleY: 0.1, opacity: 0, duration: 1.2, ease: 'power2.inOut' }
        ],
        repeat: -1,
        transformOrigin: '50% 100%'
      });
    }
    
    // Pequeño breathing effect general
    if (svgRef.current) {
      gsap.fromTo(svgRef.current, 
        { scale: 0.98 }, 
        { scale: 1.02, duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true }
      );
    }
  }, { scope: svgRef, dependencies: [context] });

  // Mutaciones contextuales
  const isTienda = context === 'tienda';
  const isCampo = context === 'campo';
  const isNucleo = context === 'nucleo';

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 48 56"
      data-size={size}
      className={`enj-hex-loader ${className}`.trim()}
      aria-hidden={ariaHidden}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={HEX_PATH} />
        </clipPath>
        
        {/* Glow estándar (Núcleo / Default) */}
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={isNucleo ? "1.5" : "0.65"} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Filtro Orgánico Fluido (Campo / Tienda) */}
        <filter id={fluidId} x="-50%" y="-50%" width="200%" height="200%">
          {isCampo && (
             <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
          )}
          {isTienda && (
             <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise" />
          )}
          {(isCampo || isTienda) && (
            <>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={isCampo ? "4" : "2"} xChannelSelector="R" yChannelSelector="G" result="displaced" />
              <feGaussianBlur stdDeviation={isTienda ? "1" : "0.5"} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="displaced" />
              </feMerge>
            </>
          )}
        </filter>
      </defs>

      {/* Base sutil */}
      <path 
        d={HEX_PATH} 
        fill="currentColor" 
        className="opacity-5" 
      />

      {/* Relleno ascendente (clip dentro del hexágono) */}
      <g clipPath={`url(#${clipId})`}>
        <rect
          ref={fillRef}
          x="0"
          y="0"
          width="48"
          height="56"
          fill="currentColor"
          filter={(isCampo || isTienda) ? `url(#${fluidId})` : undefined}
          style={{ transformBox: 'fill-box' }}
        />
      </g>

      {/* Contorno guía topográfico para campo, sólido sutil para el resto */}
      <path
        d={HEX_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        className={isCampo ? 'opacity-10 stroke-dashed' : 'opacity-[0.15]'}
        strokeDasharray={isCampo ? "2 4" : "none"}
      />

      {/* Trazo animado principal */}
      <path
        ref={strokeRef}
        d={HEX_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={isTienda ? 1.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1"
        filter={`url(#${isNucleo ? glowId : (isCampo || isTienda ? fluidId : glowId)})`}
        className="opacity-90"
      />
    </svg>
  );
}
