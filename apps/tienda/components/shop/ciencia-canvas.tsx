'use client';

import React, { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { cn } from '@enjambre/ui';

interface CienciaCanvasProps {
  live?: boolean;
  className?: string;
}

class CienciaCanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('CienciaCanvas disabled:', error.message, info.componentStack);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function CienciaCanvas({ live = true, className }: CienciaCanvasProps) {
  return (
    <CienciaCanvasBoundary>
      <CienciaCanvasInner live={live} className={className} />
    </CienciaCanvasBoundary>
  );
}

interface NodePoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  isNodriza: boolean;
  pulsePhase: number;
}

function CienciaCanvasInner({ live = true, className }: CienciaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!live || reducedMotion) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let isVisible = true;
    let animId = 0;
    let width = 0;
    let height = 0;

    const pointer = { x: -1000, y: -1000, active: false };

    // Offscreen sprite para partículas nodriza
    const spriteSize = 48;
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = spriteSize;
    spriteCanvas.height = spriteSize;
    const sCtx = spriteCanvas.getContext('2d');
    if (sCtx) {
      const half = spriteSize / 2;
      const grad = sCtx.createRadialGradient(half, half, 0, half, half, half);
      grad.addColorStop(0, 'rgba(212, 165, 116, 0.75)');
      grad.addColorStop(0.3, 'rgba(201, 162, 39, 0.35)');
      grad.addColorStop(0.7, 'rgba(201, 162, 39, 0.08)');
      grad.addColorStop(1, 'rgba(201, 162, 39, 0)');
      sCtx.fillStyle = grad;
      sCtx.beginPath();
      sCtx.arc(half, half, half, 0, Math.PI * 2);
      sCtx.fill();
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Observar visibilidad para 0% CPU al scrollear
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = Boolean(entry && entry.isIntersecting);
      },
      { threshold: 0.05 },
    );
    observer.observe(container);

    const onVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Eventos de puntero suaves
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -1000;
      pointer.y = -1000;
    };
    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerleave', onPointerLeave, { passive: true });

    // Inicializar nodos
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const nodeCount = isMobile ? 22 : 42;
    const maxDist = isMobile ? 110 : 160;
    const nodes: NodePoint[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const isNodriza = i < (isMobile ? 3 : 6);
      nodes.push({
        x: Math.random() * (width || 800),
        y: Math.random() * (height || 600),
        vx: (Math.random() - 0.5) * (isNodriza ? 0.22 : 0.38),
        vy: (Math.random() - 0.5) * (isNodriza ? 0.22 : 0.38),
        radius: isNodriza ? 2.5 : 1.3,
        alpha: isNodriza ? 0.85 : Math.random() * 0.4 + 0.3,
        isNodriza,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    let lastTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      if (!isVisible) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Actualizar posiciones
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx * (dt * 60);
        n.y += n.vy * (dt * 60);
        n.pulsePhase += dt * 1.5;

        // Rebote suave en límites
        if (n.x < -10) n.x = width + 10;
        else if (n.x > width + 10) n.x = -10;
        if (n.y < -10) n.y = height + 10;
        else if (n.y > height + 10) n.y = -10;

        // Reacción sutil al puntero
        if (pointer.active) {
          const dx = n.x - pointer.x;
          const dy = n.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120 && dist > 1) {
            const force = (120 - dist) / 120;
            n.x += (dx / dist) * force * 0.8;
            n.y += (dy / dist) * force * 0.8;
          }
        }
      }

      // Dibujar líneas de triangulación botánica
      ctx.lineWidth = 0.75;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDist) {
            const ratio = 1 - dist / maxDist;
            const lineAlpha = ratio * (a.isNodriza || b.isNodriza ? 0.32 : 0.16);
            ctx.strokeStyle = `rgba(212, 165, 116, ${lineAlpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        // Conexión con puntero si está activo
        if (pointer.active) {
          const pDist = Math.hypot(a.x - pointer.x, a.y - pointer.y);
          if (pDist < maxDist * 0.9) {
            const pRatio = 1 - pDist / (maxDist * 0.9);
            ctx.strokeStyle = `rgba(201, 162, 39, ${(pRatio * 0.28).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      // Dibujar partículas
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.isNodriza) {
          // Sprite de halo pre-renderizado
          const pulse = 1 + Math.sin(n.pulsePhase) * 0.2;
          const drawSize = spriteSize * (n.radius / 2.5) * pulse;
          ctx.drawImage(
            spriteCanvas,
            n.x - drawSize / 2,
            n.y - drawSize / 2,
            drawSize,
            drawSize,
          );
          // Núcleo
          ctx.fillStyle = 'rgba(235, 198, 140, 0.95)';
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius * 0.9, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Partícula de polen / luz
          ctx.fillStyle = `rgba(212, 165, 116, ${n.alpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      observer.disconnect();
    };
  }, [live, reducedMotion]);

  if (reducedMotion) {
    return (
      <div
        className={cn('absolute inset-0 pointer-events-none select-none overflow-hidden', className)}
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.12)_0%,transparent_70%)]" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 pointer-events-none select-none overflow-hidden', className)}
      aria-hidden
    >
      {/* Resplandor focal sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(201,162,39,0.08)_0%,transparent_65%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}
