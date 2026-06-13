'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    // Usamos quickSetter para máximo rendimiento (evita reconciliación de React y optimiza el DOM)
    const setX = gsap.quickSetter(cursor, 'x', 'px');
    const setY = gsap.quickSetter(cursor, 'y', 'px');

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;

      setX(cursorX - 10);
      setY(cursorY - 10);

      animationFrameId = requestAnimationFrame(animate);
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, .hoverable, [role="button"]')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    let initTimeout = setTimeout(() => {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mouseover', onMouseOver, { passive: true });
      animationFrameId = requestAnimationFrame(animate);
    }, 1500);

    return () => {
      clearTimeout(initTimeout);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
    };
  }, []); // Dependencia vacía: se suscribe una sola vez

  // Actualizamos el scale por separado para no re-crear el efecto principal
  useEffect(() => {
    const cursor = cursorRef.current;
    if (cursor) {
      gsap.to(cursor, {
        scale: isHovering ? 2 : 1,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: true
      });
    }
  }, [isHovering]);

  return (
    <div
      ref={cursorRef}
      className={`fixed w-5 h-5 border border-accent rounded-full pointer-events-none z-[9997] mix-blend-difference hidden md:block ${
        isHovering ? 'bg-accent/10' : ''
      }`}
      style={{ left: 0, top: 0 }}
    />
  );
}
