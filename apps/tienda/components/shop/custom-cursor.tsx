'use client';

import React, { useEffect, useRef, useState } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      
      if (cursor) {
        cursor.style.left = `${cursorX - 10}px`;
        cursor.style.top = `${cursorY - 10}px`;
      }
      
      requestAnimationFrame(animate);
    };

    const onMouseEnter = () => setIsHovering(true);
    const onMouseLeave = () => setIsHovering(false);

    window.addEventListener('mousemove', onMouseMove);
    animate();

    const hoverables = document.querySelectorAll('a, button, .hoverable');
    hoverables.forEach((el) => {
      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      hoverables.forEach((el) => {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
      });
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`fixed w-5 h-5 border border-[#c9a227] rounded-full pointer-events-none z-[9997] transition-transform duration-150 mix-blend-difference hidden md:block ${
        isHovering ? 'scale-[2] bg-[rgba(201,162,39,0.1)]' : ''
      }`}
      style={{ left: '-100px', top: '-100px' }}
    />
  );
}
