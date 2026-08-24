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
  hasHoney: boolean;
  opacity: number;
  glow: number;
  glowSpeed: number;
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
    let honeyParticles: HoneyParticle[] = [];
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
      for (let n = 0; n < 24; n++) {
        const band = Math.random();
        let x = 0;
        let y = 0;
        if (band < 0.34) {
          x = width * (0.04 + Math.random() * 0.2);
          y = height * (0.18 + Math.random() * 0.55);
        } else if (band < 0.68) {
          x = width * (0.76 + Math.random() * 0.2);
          y = height * (0.18 + Math.random() * 0.55);
        } else if (band < 0.84) {
          x = Math.random() < 0.5
            ? width * (0.08 + Math.random() * 0.18)
            : width * (0.74 + Math.random() * 0.18);
          y = height * (0.08 + Math.random() * 0.16);
        } else {
          x = Math.random() < 0.5
            ? width * (0.1 + Math.random() * 0.22)
            : width * (0.68 + Math.random() * 0.22);
          y = height * (0.74 + Math.random() * 0.16);
        }
        if (!inText(x, y, 1.08)) return { x, y };
      }
      return { x: width * 0.12, y: height * 0.34 };
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
        const hex = 12 + Math.random() * 5;
        const rad = Math.random() < 0.55 ? 1 : 2;
        const cells: CombCell[] = [];
        for (let q = -rad; q <= rad; q++) {
          const r1 = Math.max(-rad, -q - rad);
          const r2 = Math.min(rad, -q + rad);
          for (let r = r1; r <= r2; r++) {
            const x = o.x + hex * Math.sqrt(3) * (q + r / 2);
            const y = o.y + hex * 1.5 * r;
            const d = Math.sqrt(q * q + r * r + q * r);
            if (d + Math.random() * 0.5 > rad * 1.15) continue;
            if (inText(x, y, 0.92)) continue;
            cells.push({
              x,
              y,
              size: hex,
              hasHoney: Math.random() < 0.34,
              opacity: Math.max(0.28, 1 - d / (rad + 1.2)),
              glow: Math.random() * 0.2,
              glowSpeed: (Math.random() * 0.004 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
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
        this.opacity = Math.random() * 0.45 + 0.45;
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
        if (nearest > 160 && nearest < Infinity) {
          this.vx += ((tx - this.x) / nearest) * 0.03;
          this.vy += ((ty - this.y) / nearest) * 0.03;
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

        g.fillStyle = BEE_BODY;
        g.beginPath();
        g.ellipse(0, 0, this.size * 2.6, this.size * 1.1, 0, 0, Math.PI * 2);
        g.fill();

        g.fillStyle = HONEY;
        g.globalAlpha = this.opacity * 0.85;
        for (let i = -1; i <= 1; i++) {
          g.beginPath();
          g.rect(i * this.size * 0.75, -this.size * 0.85, this.size * 0.35, this.size * 1.7);
          g.fill();
        }

        g.globalAlpha = this.opacity * 0.45;
        g.fillStyle = WING;
        const wingFlap = Math.sin(this.wingAngle) * 0.35;

        g.save();
        g.rotate(-0.45 + wingFlap);
        g.beginPath();
        g.ellipse(-this.size, -this.size * 1.6, this.size * 2.2, this.size * 0.85, 0.3, 0, Math.PI * 2);
        g.fill();
        g.restore();

        g.save();
        g.rotate(0.45 - wingFlap);
        g.beginPath();
        g.ellipse(-this.size, this.size * 1.6, this.size * 2.2, this.size * 0.85, -0.3, 0, Math.PI * 2);
        g.fill();
        g.restore();

        g.restore();
      }
    }

    class HoneyParticle {
      x = 0;
      y = 0;
      size = 0;
      vy = 0;
      vx = 0;
      opacity = 0;
      life = 0;

      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 10;
        this.size = Math.random() * 2 + 0.6;
        this.vy = -(Math.random() * 0.4 + 0.15);
        this.vx = (Math.random() - 0.5) * 0.25;
        this.opacity = Math.random() * 0.45 + 0.15;
        this.life = Math.random() * 140 + 100;
      }

      update() {
        this.y += this.vy;
        this.x += this.vx;
        this.life--;
        if (this.y < -10 || this.life <= 0) this.reset();
      }

      draw() {
        g.save();
        g.globalAlpha = this.opacity;
        g.fillStyle = HONEY;
        g.beginPath();
        g.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    }

    function drawComb() {
      for (const cluster of combClusters) {
        for (const cell of cluster.cells) {
          cell.glow += cell.glowSpeed;
          if (cell.glow >= 0.4 || cell.glow <= 0.04) cell.glowSpeed = -cell.glowSpeed;
          g.save();
          g.globalAlpha = cell.opacity * 0.9;
          g.fillStyle = '#120c07';
          drawHexagon(cell.x, cell.y, cell.size);
          g.fill();
          g.strokeStyle = 'rgba(201, 162, 39, 0.22)';
          g.lineWidth = 0.7;
          g.stroke();
          if (cell.hasHoney) {
            g.globalAlpha = Math.max(0, cell.glow) * cell.opacity;
            g.fillStyle = 'rgba(201, 162, 39, 0.38)';
            drawHexagon(cell.x, cell.y, cell.size * 0.62);
            g.fill();
          }
          g.restore();
        }
      }
    }

    function spawnActors() {
      bees = [];
      honeyParticles = [];
      const nBees = compact ? 22 : 48;
      const nPart = compact ? 25 : 55;
      if (beesOn) {
        for (let i = 0; i < nBees; i++) bees.push(new Bee());
      }
      for (let i = 0; i < nPart; i++) honeyParticles.push(new HoneyParticle());
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
      for (const p of honeyParticles) {
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
