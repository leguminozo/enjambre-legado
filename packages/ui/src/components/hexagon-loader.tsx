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
  const glowId = `enj-hex-glow-${rawId}`;

  const svgRef = useRef<SVGSVGElement>(null);
  const strokeRef = useRef<SVGPathElement>(null);
  const innerRef = useRef<SVGPathElement>(null);
  const innerRef2 = useRef<SVGPathElement>(null);
  const coreRef = useRef<SVGCircleElement>(null);

  const isTienda = context === 'tienda';
  const isCampo = context === 'campo';
  const isNucleo = context === 'nucleo';

  useGSAP(() => {
    // 1. Trazado del contorno (Light Trail)
    if (strokeRef.current) {
      gsap.fromTo(
        strokeRef.current,
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: -1,
          duration: isTienda ? 3.5 : 2.5,
          ease: 'power1.inOut',
          repeat: -1,
        }
      );
    }

    // 2. Rotación lenta y elegante del hexágono interno (Geometría Sagrada)
    if (innerRef.current) {
      gsap.to(innerRef.current, {
        rotation: 360,
        duration: isTienda ? 16 : 12,
        ease: 'none',
        repeat: -1,
      });
    }

    // Segundo hexágono interno con rotación inversa para Núcleo (Estética Red/Constelación)
    if (innerRef2.current && isNucleo) {
      gsap.to(innerRef2.current, {
        rotation: -360,
        duration: 20,
        ease: 'none',
        repeat: -1,
      });
    }

    // 3. Núcleo Existencial ("La Reina/El Origen") - Respiración orgánica
    if (coreRef.current) {
      gsap.fromTo(
        coreRef.current,
        { scale: 0.8, opacity: 0.2 },
        {
          scale: 1.25,
          opacity: 0.85,
          duration: 2.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        }
      );
    }

    // 4. Sutil flotación tridimensional general
    if (svgRef.current) {
      gsap.fromTo(
        svgRef.current,
        { y: -0.75 },
        {
          y: 0.75,
          duration: 3,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        }
      );
    }
  }, { scope: svgRef, dependencies: [context] });

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 48 56"
      data-size={size}
      className={`enj-hex-loader ${className}`.trim()}
      aria-hidden={ariaHidden}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Glow ultra-delicado y sofisticado, optimizado para GPU móviles */}
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={isTienda ? "0.6" : "1"} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. Hexágono de referencia/guía (Línea de fondo ultra-tenue) */}
      <path
        d={HEX_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.5}
        className="opacity-[0.07]"
      />

      {/* 2. Hexágonos Internos Concéntricos (Rotación e Interconexión) */}
      <path
        ref={innerRef}
        d={HEX_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={isTienda ? 0.4 : 0.6}
        // Campo usa líneas punteadas de estilo cartográfico/topográfico
        strokeDasharray={isCampo ? "2 3" : "none"}
        className={isTienda ? "opacity-15" : "opacity-20"}
        style={{
          transform: 'scale(0.58)',
          transformOrigin: '24px 28px',
        }}
      />

      {isNucleo && (
        <path
          ref={innerRef2}
          d={HEX_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.4}
          className="opacity-[0.12]"
          style={{
            transform: 'scale(0.38)',
            transformOrigin: '24px 28px',
          }}
        />
      )}

      {/* 3. Núcleo Existencial Central (El origen de la vida/miel) */}
      <circle
        ref={coreRef}
        cx="24"
        cy="28"
        r={1.2}
        fill="currentColor"
        className={isTienda ? "opacity-80" : "opacity-90"}
        style={{
          transformOrigin: '24px 28px',
        }}
      />

      {/* 4. Trazo animado principal (Light Trail / Órbita) */}
      <path
        ref={strokeRef}
        d={HEX_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={isTienda ? 0.75 : 1}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="0.3 0.7" // Trazado segmentado de luz flotante
        filter={`url(#${glowId})`}
        className={isTienda ? "opacity-75" : "opacity-90"}
      />
    </svg>
  );
}
