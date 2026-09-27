'use client';

import React, { useEffect, useRef } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const { gsap } = await import('gsap');
      if (cancelled) return;

      // Usamos quickSetter para máximo rendimiento (evita reconciliación de React y optimiza el DOM)
      const setX = gsap.quickSetter(cursor, 'x', 'px');
      const setY = gsap.quickSetter(cursor, 'y', 'px');

      let mouseX = 0;
      let mouseY = 0;
      let cursorX = 0;
      let cursorY = 0;
      let animationFrameId: number;
      let isAnimating = false;

      const animate = () => {
        const dx = mouseX - cursorX;
        const dy = mouseY - cursorY;
        cursorX += dx * 0.15;
        cursorY += dy * 0.15;

        setX(cursorX - 10);
        setY(cursorY - 10);

        // Si el cursor ya alcanzó el destino, dormimos el loop RAF (0% CPU en reposo)
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
          cursorX = mouseX;
          cursorY = mouseY;
          setX(cursorX - 10);
          setY(cursorY - 10);
          isAnimating = false;
          return;
        }

        animationFrameId = requestAnimationFrame(animate);
      };

      const startAnimation = () => {
        if (!isAnimating) {
          isAnimating = true;
          animationFrameId = requestAnimationFrame(animate);
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        startAnimation();
      };

      const onMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('a, button, .hoverable, [role="button"]')) {
          gsap.to(cursor, {
            scale: 2,
            backgroundColor: 'rgba(var(--accent), 0.1)',
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true,
          });
        } else {
          gsap.to(cursor, {
            scale: 1,
            backgroundColor: 'transparent',
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true,
          });
        }
      };

      const initTimeout = setTimeout(() => {
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('mouseover', onMouseOver, { passive: true });
        startAnimation();
      }, 1500);

      cleanup = () => {
        clearTimeout(initTimeout);
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseover', onMouseOver);
      };
    })().catch(() => {
      // Chunk de gsap fallido: cursor nativo, sin animación.
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []); // Dependencia vacía: se suscribe una sola vez

  return (
    <div
      ref={cursorRef}
      className="fixed w-5 h-5 border border-accent rounded-full pointer-events-none z-[9997] mix-blend-difference hidden md:block"
      style={{ left: 0, top: 0, willChange: 'transform' }}
    />
  );
}
