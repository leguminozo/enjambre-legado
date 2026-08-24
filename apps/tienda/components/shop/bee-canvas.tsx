'use client';

import React, { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react';

/**
 * Overlay 2D: abejas rústicas + racimos de celdas a escala de obrera.
 * El hueco/luz vive en HeroHuecoGL. Este canvas es transparente.
 */

import { cn } from '@enjambre/ui';

const BEE_BODY = '#2a1f14';
const HONEY = '#c9a227';
const WING = '#f5f0e8';

type BeeCanvasProps = { live?: boolean; bees?: boolean; className?: string };

class BeeCanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('BeeCanvas disabled:', error.message, info.componentStack);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function BeeCanvas({ live = true, bees: beesOn = true, className }: BeeCanvasProps) {
  return (
    <BeeCanvasBoundary>
      <BeeCanvasInner live={live} beesOn={beesOn} className={className} />
    </BeeCanvasBoundary>
  );
}

function BeeCanvasInner({ live, beesOn, className }: { live: boolean; beesOn: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const surface = canvas;
    const ctx = surface.getContext('2d');
    if (!ctx) return;
    const g = ctx;

    let width = 0;
    let height = 0;
    let compact = false;
    let bees: Bee[] = [];
    let ingredients: FloatingIngredient[] = [];

    function inText(x: number, y: number, pad = 1) {
      const cx = width * 0.5;
      const cy = height * 0.48;
      const rx = Math.min(width * 0.42, compact ? 290 : 440) * pad;
      const ry = (compact ? 155 : 185) * pad;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      return dx * dx + dy * dy < 1;
    }

    class Bee {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      wingAngle: number;
      wingSpeed: number;
      opacity: number;
      angle: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1.8;
        this.vy = (Math.random() - 0.5) * 1.8;
        this.size = Math.random() * 2.2 + 1.6;
        this.wingAngle = Math.random() * Math.PI * 2;
        this.wingSpeed = Math.random() * 0.35 + 0.25;
        this.opacity = Math.random() * 0.3 + 0.7; 
        this.angle = 0;
      }

      update() {
        this.vx += (Math.random() - 0.5) * 0.15;
        this.vy += (Math.random() - 0.5) * 0.15;
        this.vx *= 0.985;
        this.vy *= 0.985;

        // Atracción hacia el centro de la pantalla (donde están los textos)
        const cx = width * 0.5;
        const cy = height * 0.48;
        const dx = cx - this.x;
        const dy = cy - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Las abejas viajan hacia los textos
        if (dist > 150) {
          this.vx += (dx / dist) * 0.025;
          this.vy += (dy / dist) * 0.025;
        }

        // Repulsión en el borde del texto: crea un halo alrededor del texto
        if (inText(this.x, this.y, 1.08)) {
          this.vx -= (dx / dist) * 0.18;
          this.vy -= (dy / dist) * 0.18;
        }

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 2.4) {
          this.vx = (this.vx / speed) * 2.4;
          this.vy = (this.vy / speed) * 2.4;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.wingAngle += this.wingSpeed;
        this.angle = Math.atan2(this.vy, this.vx);

        if (this.x < -60) this.x = width + 60;
        if (this.x > width + 60) this.x = -60;
        if (this.y < -60) this.y = height + 60;
        if (this.y > height + 60) this.y = -60;
      }

      draw() {
        g.save();
        g.translate(this.x, this.y);
        g.rotate(this.angle);
        g.globalAlpha = this.opacity;

        // Resplandor dorado
        g.shadowColor = 'rgba(212, 165, 116, 0.6)';
        g.shadowBlur = 10;

        // Cuerpo
        g.fillStyle = '#2b1d14';
        g.beginPath();
        g.ellipse(0, 0, this.size * 2.5, this.size, 0, 0, Math.PI * 2);
        g.fill();

        // Rayas
        g.fillStyle = '#d4a574';
        g.globalAlpha = this.opacity * 0.9;
        for (let i = -1; i <= 1; i++) {
          g.beginPath();
          g.rect(i * this.size * 0.8, -this.size * 0.8, this.size * 0.4, this.size * 1.6);
          g.fill();
        }

        // Alas
        g.shadowBlur = 0;
        g.globalAlpha = this.opacity * 0.3;
        g.fillStyle = '#f5f0e8';
        const wingFlap = Math.sin(this.wingAngle) * 0.3;

        g.save();
        g.rotate(-0.5 + wingFlap);
        g.beginPath();
        g.ellipse(-this.size, -this.size * 1.5, this.size * 2, this.size * 0.8, 0.3, 0, Math.PI * 2);
        g.fill();
        g.restore();

        g.save();
        g.rotate(0.5 - wingFlap);
        g.beginPath();
        g.ellipse(-this.size, this.size * 1.5, this.size * 2, this.size * 0.8, -0.3, 0, Math.PI * 2);
        g.fill();
        g.restore();

        g.restore();
      }
    }

    // Ingredientes macroscópicos flotantes (Polen, Ámbar, Cacao Nibs, Avellana Chilena)
    class FloatingIngredient {
      x: number = 0;
      y: number = 0;
      size: number = 0;
      vy: number = 0;
      vx: number = 0;
      opacity: number = 0;
      rotation: number = 0;
      vrot: number = 0;
      type: 'pollen' | 'amber' | 'cacao' | 'hazelnut' = 'pollen';
      color: string = '';
      
      // Para polen (textura rugosa)
      bumps: {x: number, y: number, r: number}[] = [];
      // Para ámbar/cacao (geometría irregular)
      points: {x: number, y: number}[] = [];

      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 40;
        this.vy = -(Math.random() * 0.25 + 0.1); 
        this.vx = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.6 + 0.3;
        this.rotation = Math.random() * Math.PI * 2;
        this.vrot = (Math.random() - 0.5) * 0.015;

        const roll = Math.random();
        if (roll < 0.45) {
           this.type = 'pollen';
           this.size = Math.random() * 2.5 + 1.5; 
           const colors = ['#e8c98a', '#d4a574', '#a07830', '#6b5420', '#4a5d3a'];
           this.color = colors[Math.floor(Math.random() * colors.length)];
           this.bumps = [];
           const numBumps = Math.floor(Math.random() * 3) + 4;
           for(let i=0; i<numBumps; i++) {
             const angle = (Math.PI * 2 / numBumps) * i;
             const dist = this.size * 0.45;
             this.bumps.push({
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                r: this.size * 0.55
             });
           }
        } else if (roll < 0.65) {
           this.type = 'amber';
           this.size = Math.random() * 5 + 3; 
           this.generatePolygon(5, 7);
        } else if (roll < 0.85) {
           this.type = 'cacao';
           this.size = Math.random() * 4 + 2.5;
           this.generatePolygon(5, 9);
        } else {
           this.type = 'hazelnut';
           this.size = Math.random() * 4 + 2.5;
        }
      }

      generatePolygon(minPts: number, maxPts: number) {
         this.points = [];
         const num = Math.floor(Math.random() * (maxPts - minPts + 1)) + minPts;
         for(let i=0; i<num; i++) {
            const angle = (Math.PI * 2 / num) * i;
            const rad = this.size * (0.7 + Math.random() * 0.3);
            this.points.push({ x: Math.cos(angle) * rad, y: Math.sin(angle) * rad });
         }
      }

      update() {
        this.y += this.vy;
        this.x += this.vx;
        this.rotation += this.vrot;
        if (this.y < -40) {
          this.reset();
          this.y = height + 40;
        }
      }

      draw() {
        g.save();
        g.translate(this.x, this.y);
        g.rotate(this.rotation);
        g.globalAlpha = this.opacity;

        if (this.type === 'pollen') {
           g.shadowColor = 'rgba(0,0,0,0.5)';
           g.shadowBlur = 4;
           g.fillStyle = this.color;
           g.beginPath();
           for(const b of this.bumps) {
              g.moveTo(b.x + b.r, b.y);
              g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
           }
           g.fill();
           
           // Brillo esférico suave para dar volumen al polen
           g.globalAlpha = this.opacity * 0.4;
           g.fillStyle = '#ffffff';
           g.beginPath();
           for(const b of this.bumps) {
              g.moveTo(b.x - b.r*0.2 + b.r*0.3, b.y - b.r*0.2);
              g.arc(b.x - b.r*0.2, b.y - b.r*0.2, b.r*0.3, 0, Math.PI * 2);
           }
           g.fill();
        } else if (this.type === 'amber') {
           const grad = g.createRadialGradient(
               -this.size * 0.2, -this.size * 0.2, 0,
               0, 0, this.size
           );
           grad.addColorStop(0, 'rgba(255, 210, 90, 0.95)');
           grad.addColorStop(1, 'rgba(140, 70, 10, 0.85)');
           
           g.shadowColor = 'rgba(212, 165, 116, 0.5)';
           g.shadowBlur = 15;
           g.fillStyle = grad;
           
           g.beginPath();
           g.moveTo(this.points[0].x, this.points[0].y);
           for(let i=1; i<this.points.length; i++) {
              g.lineTo(this.points[i].x, this.points[i].y);
           }
           g.closePath();
           g.fill();
           
           // Reflejo especular de cristal
           g.shadowBlur = 0;
           g.fillStyle = 'rgba(255, 255, 255, 0.7)';
           g.beginPath();
           g.arc(-this.size * 0.35, -this.size * 0.35, this.size * 0.12, 0, Math.PI * 2);
           g.fill();
        } else if (this.type === 'cacao') {
           // Nibs de cacao (rocas oscuras, bordes duros, textura mate)
           g.shadowColor = 'rgba(0,0,0,0.8)';
           g.shadowBlur = 8;
           g.fillStyle = '#22120d';
           
           g.beginPath();
           g.moveTo(this.points[0].x, this.points[0].y);
           for(let i=1; i<this.points.length; i++) {
              g.lineTo(this.points[i].x, this.points[i].y);
           }
           g.closePath();
           g.fill();
           
           // Highlight sutil (aristas)
           g.shadowBlur = 0;
           g.strokeStyle = 'rgba(255,255,255,0.08)';
           g.lineWidth = 0.5;
           g.stroke();
           
           // Textura de fractura interior
           g.fillStyle = '#110805';
           g.beginPath();
           g.moveTo(this.points[0].x * 0.5, this.points[0].y * 0.5);
           g.lineTo(this.points[2].x * 0.5, this.points[2].y * 0.5);
           if (this.points[4]) g.lineTo(this.points[4].x * 0.5, this.points[4].y * 0.5);
           g.fill();
        } else if (this.type === 'hazelnut') {
           // Avellana chilena tostada (corteza cóncava tipo "cuenco")
           g.shadowColor = 'rgba(0,0,0,0.6)';
           g.shadowBlur = 8;
           
           // Borde exterior (óvalo tostado claro)
           g.fillStyle = '#e5a873';
           g.beginPath();
           g.ellipse(0, 0, this.size, this.size * 0.85, 0, 0, Math.PI * 2);
           g.fill();
           
           // Fondo interior cóncavo (gradiente oscuro para dar profundidad)
           g.shadowBlur = 0;
           const grad = g.createRadialGradient(0, this.size*0.2, 0, 0, 0, this.size);
           grad.addColorStop(0, '#3e1704'); // Muy profundo/oscuro adentro
           grad.addColorStop(1, '#b05527'); // Naranja tostado hacia el borde
           g.fillStyle = grad;
           
           g.beginPath();
           g.ellipse(0, 0, this.size * 0.85, this.size * 0.7, 0, 0, Math.PI * 2);
           g.fill();
        }
        g.restore();
      }
    }

    function spawnActors() {
      bees = [];
      ingredients = [];
      const nBees = compact ? 22 : 48;
      const nPart = compact ? 15 : 35; // Menos partículas porque son macro y detalladas
      if (beesOn) {
        for (let i = 0; i < nBees; i++) bees.push(new Bee());
      }
      for (let i = 0; i < nPart; i++) ingredients.push(new FloatingIngredient());
    }

    function resize() {
      const parent = surface.parentElement;
      width = parent?.clientWidth || window.innerWidth;
      height = parent?.clientHeight || window.innerHeight;
      compact = width < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2);
      surface.width = width * dpr;
      surface.height = height * dpr;
      surface.style.width = `${width}px`;
      surface.style.height = `${height}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function compose() {
      g.clearRect(0, 0, width, height);
      for (const p of ingredients) {
        if (live) p.update();
        p.draw();
      }
      for (const bee of bees) {
        if (live) bee.update();
        bee.draw();
      }
    }

    function debouncedResize() {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        resize();
        spawnActors();
      }, 150);
    }

    window.addEventListener('resize', debouncedResize);
    resize();
    spawnActors();

    let raf = 0;
    let visible = true;
    let last = 0;
    let isCleanedUp = false;
    const interval = 1000 / (compact ? 24 : 30);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && live && !isCleanedUp) animate();
      },
      { threshold: 0.01 },
    );
    observer.observe(surface);

    function animate(ts = 0) {
      if (!visible || isCleanedUp) return;
      const elapsed = ts - last;
      if (elapsed < interval) {
        raf = requestAnimationFrame(animate);
        return;
      }
      last = ts - (elapsed % interval);
      compose();
      if (live && !isCleanedUp) raf = requestAnimationFrame(animate);
    }

    compose();
    if (live) animate();

    return () => {
      isCleanedUp = true;
      observer.disconnect();
      window.removeEventListener('resize', debouncedResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      cancelAnimationFrame(raf);
    };
  }, [live, beesOn]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="bee-canvas"
      className={cn('pointer-events-none absolute inset-0 z-10', className)}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
