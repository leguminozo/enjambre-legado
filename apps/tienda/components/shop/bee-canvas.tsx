'use client';

import React, { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react';

/**
 * Overlay 2D: abejas rústicas + racimos de celdas a escala de obrera.
 * El hueco/luz vive en HeroHuecoGL. Este canvas es transparente.
 */

const BEE_BODY = '#2a1f14';
const HONEY = '#c9a227';
const WING = '#f5f0e8';

type BeeCanvasProps = { live?: boolean; bees?: boolean };

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

export function BeeCanvas({ live = true, bees: beesOn = true }: BeeCanvasProps) {
  return (
    <BeeCanvasBoundary>
      <BeeCanvasInner live={live} beesOn={beesOn} />
    </BeeCanvasBoundary>
  );
}

interface CombCell {
  x: number;
  y: number;
  size: number;
  type: 'empty' | 'sealed' | 'honey' | 'pollen';
  opacity: number;
  color: string;
}
interface CombCluster {
  cx: number;
  cy: number;
  cells: CombCell[];
}

function BeeCanvasInner({ live, beesOn }: { live: boolean; beesOn: boolean }) {
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
    let sporeParticles: SporeParticle[] = [];
    let combClusters: CombCluster[] = [];

    function inText(x: number, y: number, pad = 1) {
      const cx = width * 0.5;
      const cy = height * 0.48;
      const rx = Math.min(width * 0.42, compact ? 290 : 440) * pad;
      const ry = (compact ? 155 : 185) * pad;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      return dx * dx + dy * dy < 1;
    }

    function rimPoint() {
      const cx = width * 0.5;
      const cy = height * 0.48;
      // Coincide con cavR = (0.78, 0.84) en NDC de HeroHuecoGL.
      // Reducido para que los panalitos se incrusten consolidada y profundamente dentro del tronco
      const rx = width * 0.39 * 0.82;
      const ry = height * 0.42 * 0.82;
      
      let angle = 0;
      let valid = false;
      // Evitar SOLO el tragaluz central superior (sin(angle) < -0.65)
      // Permitiendo que carguen panalitos en toda la zona alta (arriba a la izq y der)
      while (!valid) {
        angle = Math.random() * Math.PI * 2;
        if (Math.sin(angle) > -0.65) {
          valid = true;
        }
      }
      
      // Añadir un poco de ruido para que no sea un óvalo perfecto
      const noise = 1.0 + (Math.random() - 0.5) * 0.08;
      
      return {
        x: cx + rx * Math.cos(angle) * noise,
        y: cy + ry * Math.sin(angle) * noise
      };
    }

    function drawHexagon(x: number, y: number, r: number) {
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = x + r * Math.cos(angle);
        const hy = y + r * Math.sin(angle);
        if (i === 0) g.moveTo(hx, hy);
        else g.lineTo(hx, hy);
      }
      g.closePath();
    }

    function initComb() {
      combClusters = [];
      const n = compact ? 3 : 5;
      for (let i = 0; i < n; i++) {
        const o = rimPoint();
        const hex = 14 + Math.random() * 6;
        // rad 2 o 3 para crear racimos (incrustaciones) mucho más grandes y consolidadas
        const rad = Math.random() < 0.6 ? 2 : 3;
        const cells: CombCell[] = [];
        for (let q = -rad; q <= rad; q++) {
          const r1 = Math.max(-rad, -q - rad);
          const r2 = Math.min(rad, -q + rad);
          for (let r = r1; r <= r2; r++) {
            const hDist = (Math.abs(q) + Math.abs(r) + Math.abs(q+r)) / 2;
            // Forma de racimo orgánico (bordes irregulares)
            if (hDist + Math.random() * 1.5 > rad + 0.5) continue;
            
            const x = o.x + hex * Math.sqrt(3) * (q + r / 2);
            const y = o.y + hex * 1.5 * r;
            if (inText(x, y, 0.92)) continue;
            
            const typeRoll = Math.random();
            let type: CombCell['type'] = 'empty';
            if (typeRoll < 0.20) type = 'sealed';
            else if (typeRoll < 0.50) type = 'honey';
            else if (typeRoll < 0.65) type = 'pollen';
            
            let color = '';
            if (type === 'pollen') {
               const colors = ['#8f6a32', '#6b5420', '#4a5d3a'];
               color = colors[Math.floor(Math.random() * colors.length)];
            }

            cells.push({
              x, y, size: hex, type, color,
              opacity: Math.max(0.65, 1 - hDist / (rad + 1.8))
            });
          }
        }
        if (cells.length) combClusters.push({ cx: o.x, cy: o.y, cells });
      }
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
        const home = combClusters.length
          ? combClusters[Math.floor(Math.random() * combClusters.length)]
          : null;
        const origin = home ? { x: home.cx, y: home.cy } : rimPoint();
        this.x = origin.x + (Math.random() - 0.5) * 70;
        this.y = origin.y + (Math.random() - 0.5) * 70;
        if (inText(this.x, this.y)) {
          const p = rimPoint();
          this.x = p.x;
          this.y = p.y;
        }
        this.vx = (Math.random() - 0.5) * 1.8;
        this.vy = (Math.random() - 0.5) * 1.8;
        this.size = Math.random() * 2.2 + 1.6;
        this.wingAngle = Math.random() * Math.PI * 2;
        this.wingSpeed = Math.random() * 0.35 + 0.25;
        this.opacity = Math.random() * 0.3 + 0.7; // 0.7 to 1.0 (menos translúcidas)
        this.angle = 0;
      }

      update() {
        this.vx += (Math.random() - 0.5) * 0.15;
        this.vy += (Math.random() - 0.5) * 0.15;
        this.vx *= 0.985;
        this.vy *= 0.985;

        let nearest = Infinity;
        let tx = this.x;
        let ty = this.y;
        
        // ~30% de las abejas (las más pequeñas) explorarán la luz superior del tronco
        const isExplorer = this.size < 2.3;
        
        if (isExplorer) {
          tx = width * 0.5 + Math.sin(this.angle) * 100;
          ty = height * 0.15;
          const dx = tx - this.x;
          const dy = ty - this.y;
          nearest = Math.sqrt(dx * dx + dy * dy);
        } else {
          for (const cl of combClusters) {
            const dx = cl.cx - this.x;
            const dy = cl.cy - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearest) {
              nearest = dist;
              tx = cl.cx;
              ty = cl.cy;
            }
          }
        }

        if (nearest > (isExplorer ? 50 : 160) && nearest < Infinity) {
          const pull = isExplorer ? 0.015 : 0.03;
          this.vx += ((tx - this.x) / nearest) * pull;
          this.vy += ((ty - this.y) / nearest) * pull;
        }

        if (inText(this.x, this.y, 1.06)) {
          const dx = width * 0.5 - this.x;
          const dy = height * 0.48 - this.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          this.vx -= (dx / d) * 0.12;
          this.vy -= (dy / d) * 0.12;
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

        // Resplandor dorado (luz cálida en la penumbra)
        g.shadowColor = 'rgba(212, 165, 116, 0.6)';
        g.shadowBlur = 10;

        // Cuerpo (tono corteza oscura)
        g.fillStyle = '#2b1d14';
        g.beginPath();
        g.ellipse(0, 0, this.size * 2.5, this.size, 0, 0, Math.PI * 2);
        g.fill();

        // Rayas (ámbar miel)
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

    // Esporas / Polen flotando hacia arriba (sensación térmica cálida)
    class SporeParticle {
      x: number = 0;
      y: number = 0;
      size: number = 0;
      vy: number = 0;
      vx: number = 0;
      opacity: number = 0;
      life: number = 0;

      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 10;
        this.size = Math.random() * 2.5 + 0.5;
        this.vy = -(Math.random() * 0.2 + 0.05); // Flotando hacia arriba
        this.vx = (Math.random() - 0.5) * 0.3;   // Movimiento lateral leve (vapor)
        this.opacity = Math.random() * 0.4 + 0.1;
        this.life = Math.random() * 100 + 100;
      }

      update() {
        this.y += this.vy;
        this.x += this.vx;
        this.life--;
        if (this.y < -10 || this.life <= 0) {
          this.reset();
          this.y = height + 10;
        }
      }

      draw() {
        g.save();
        g.globalAlpha = this.opacity;
        g.shadowColor = '#d4a574';
        g.shadowBlur = 6; // Esporas brillantes
        g.fillStyle = '#e8c98a';
        g.beginPath();
        g.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    }

    function drawComb() {
      // Pass 1: Sombra base (propóleo/cera oscura) para fundir con el tronco
      g.save();
      g.shadowColor = 'rgba(5, 3, 1, 0.9)';
      g.shadowBlur = 30;
      g.fillStyle = '#060402';
      for (const cluster of combClusters) {
        for (const cell of cluster.cells) {
           drawHexagon(cell.x, cell.y, cell.size * 1.15);
           g.fill();
        }
      }
      g.restore();

      // Pass 2: Paredes de cera e interiores
      g.lineJoin = 'round';
      g.lineCap = 'round';
      
      for (const cluster of combClusters) {
        for (const cell of cluster.cells) {
          g.save();
          g.globalAlpha = cell.opacity;
          
          // Interior cera oscura
          g.fillStyle = '#120b05';
          drawHexagon(cell.x, cell.y, cell.size);
          g.fill();
          
          // Paredes orgánicas gruesas (no wireframe digital)
          g.strokeStyle = '#382512';
          g.lineWidth = cell.size * 0.25;
          g.stroke();
          
          // Contenido de la celda
          if (cell.type === 'sealed') {
             // Opérculo mate de cera
             g.fillStyle = '#59442a';
             drawHexagon(cell.x, cell.y, cell.size * 0.85);
             g.fill();
          } else if (cell.type === 'honey') {
             // Miel líquida con reflejo radial (brillo)
             const grad = g.createRadialGradient(
                 cell.x, cell.y - cell.size * 0.15, 0,
                 cell.x, cell.y, cell.size * 0.8
             );
             grad.addColorStop(0, 'rgba(232, 169, 49, 0.85)');
             grad.addColorStop(1, 'rgba(102, 64, 12, 0.75)');
             g.fillStyle = grad;
             drawHexagon(cell.x, cell.y, cell.size * 0.75);
             g.fill();
          } else if (cell.type === 'pollen') {
             // Masa sólida e irregular
             g.fillStyle = cell.color;
             drawHexagon(cell.x, cell.y, cell.size * 0.75);
             g.fill();
             // Sombra de relieve interior
             g.fillStyle = 'rgba(0,0,0,0.35)';
             drawHexagon(cell.x, cell.y + cell.size * 0.2, cell.size * 0.5);
             g.fill();
          }
          
          g.restore();
        }
      }
    }

    function spawnActors() {
      bees = [];
      sporeParticles = [];
      const nBees = compact ? 22 : 48;
      const nPart = compact ? 25 : 55;
      if (beesOn) {
        for (let i = 0; i < nBees; i++) bees.push(new Bee());
      }
      for (let i = 0; i < nPart; i++) sporeParticles.push(new SporeParticle());
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
      initComb();
    }

    function compose() {
      g.clearRect(0, 0, width, height);
      drawComb();
      for (const p of sporeParticles) {
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
    const interval = 1000 / (compact ? 24 : 30);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && live) animate();
      },
      { threshold: 0.01 },
    );
    observer.observe(surface);

    function animate(ts = 0) {
      if (!visible) return;
      const elapsed = ts - last;
      if (elapsed < interval) {
        raf = requestAnimationFrame(animate);
        return;
      }
      last = ts - (elapsed % interval);
      compose();
      if (live) raf = requestAnimationFrame(animate);
    }

    compose();
    if (live) animate();

    return () => {
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
      className="pointer-events-none absolute inset-0 z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
