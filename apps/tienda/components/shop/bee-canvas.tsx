'use client';

import React, { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react';

/**
 * Hero: mirás un hueco. La madera es el marco (silueta + labio iluminado).
 * El volumen lo da la luz en el aire, no un fill marrón.
 *
 *   void     negro húmedo
 *   shaft    haz que nace fuera de cuadro (arriba)
 *   frame    exterior del óvalo irregular = corteza en sombra
 *   lip      12–20 px de luz wrapping en el borde interno
 *   log      leño cercano, solo la cresta musgosa se lee
 *   comb     racimos chicos en el labio (escala obrera)
 *   bees     el dibujo original (cuerpo oscuro, raya miel, ala)
 */

export const HERO_SCENE = {
  opening: { cx: 0.5, cy: 0.43, rx: 0.38, ry: 0.41 },
  light: { x: 0.5, y: -0.08, intensity: 0.22, rays: 7 },
  lip: { width: 18 },
  log: { cy: 0.86, rx: 0.62, ry: 0.16 },
  comb: { desktop: 5, compact: 3, hex: [12, 16] as const },
  bees: { desktop: 28, compact: 12 },
  spores: { desktop: 48, compact: 22 },
  fps: { desktop: 30, compact: 24 },
} as const;

const BEE_DARK = '#160e06';
const HONEY_GOLD = '#d49b28';
const WING_TINT = 'rgba(240, 235, 225, 0.55)';
const VOID = '#060807';

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

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface HoneycombCell {
  x: number;
  y: number;
  size: number;
  hasHoney: boolean;
  opacity: number;
  drip: number;
}
interface CombCluster {
  cx: number;
  cy: number;
  cells: HoneycombCell[];
}

function BeeCanvasInner({ live, beesOn }: { live: boolean; beesOn: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const S = HERO_SCENE;
    let width = 0;
    let height = 0;
    let compact = false;
    let rng = mulberry32(1);
    const rnd = (a: number, b: number) => a + rng() * (b - a);

    const staticBuf = document.createElement('canvas');
    const sctx = staticBuf.getContext('2d');
    if (!sctx) return;

    let bees: Bee[] = [];
    let spores: Spore[] = [];
    let combClusters: CombCluster[] = [];
    let lightX = 0;
    let lightY = 0;
    let mouseNX = 0;
    let mouseNY = 0;
    let px = 0;
    let py = 0;

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouseNX = ((e.clientX - rect.left) / width - 0.5) * 2;
      mouseNY = ((e.clientY - rect.top) / height - 0.5) * 2;
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    function openingPoint(t: number, scale = 1) {
      const cx = width * S.opening.cx;
      const cy = height * S.opening.cy;
      const rx = width * S.opening.rx * scale;
      const ry = height * S.opening.ry * scale;
      const wobble = 1 + 0.06 * Math.sin(t * 3.7) + 0.04 * Math.cos(t * 5.1);
      return {
        x: cx + Math.cos(t) * rx * wobble,
        y: cy + Math.sin(t) * ry * (wobble * 0.96),
      };
    }

    function openingPath(c: CanvasRenderingContext2D, scale = 1) {
      const steps = 36;
      c.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2 - Math.PI / 2;
        const p = openingPoint(t, scale);
        if (i === 0) c.moveTo(p.x, p.y);
        else c.lineTo(p.x, p.y);
      }
      c.closePath();
    }

    function inText(x: number, y: number, pad = 1) {
      const cx = width * 0.5;
      const cy = height * 0.48;
      const rx = Math.min(width * 0.4, compact ? 280 : 430) * pad;
      const ry = (compact ? 150 : 180) * pad;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      return dx * dx + dy * dy < 1;
    }

    function onLip(x: number, y: number) {
      const cx = width * S.opening.cx;
      const cy = height * S.opening.cy;
      const rx = width * S.opening.rx;
      const ry = height * S.opening.ry;
      const n = Math.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2);
      return n > 0.82 && n < 1.18;
    }

    function paintStatic() {
      rng = mulberry32((width * 17) ^ (height * 9));
      const c = sctx;
      c.setTransform(staticBuf.width / width, 0, 0, staticBuf.height / height, 0, 0);
      c.fillStyle = VOID;
      c.fillRect(0, 0, width, height);

      // Niebla lejana dentro del hueco (aire, no “escenario”)
      const fog = c.createRadialGradient(
        width * S.opening.cx,
        height * S.opening.cy,
        8,
        width * S.opening.cx,
        height * 0.2,
        Math.max(width, height) * 0.7,
      );
      fog.addColorStop(0, 'rgba(40, 48, 32, 0.22)');
      fog.addColorStop(0.4, 'rgba(12, 16, 12, 0.15)');
      fog.addColorStop(1, 'transparent');
      c.fillStyle = fog;
      c.fillRect(0, 0, width, height);

      // Marco: todo lo que NO es el hueco. Silueta, no pared ilustrada.
      c.save();
      c.beginPath();
      c.rect(0, 0, width, height);
      openingPath(c, 1);
      c.fillStyle = '#0b0d0c';
      c.fill('evenodd');
      c.restore();

      // Corteza apenas sugerida en el marco (estrías, no fill marrón)
      c.save();
      c.beginPath();
      c.rect(0, 0, width, height);
      openingPath(c, 1.02);
      c.clip('evenodd');
      c.strokeStyle = 'rgba(28, 22, 14, 0.55)';
      c.lineWidth = 1.2;
      for (let i = 0; i < 28; i++) {
        const x = rnd(0, width);
        c.beginPath();
        c.moveTo(x, 0);
        c.bezierCurveTo(x + rnd(-12, 12), height * 0.3, x + rnd(-16, 16), height * 0.65, x + rnd(-10, 10), height);
        c.stroke();
      }
      c.restore();

      // Labio interno: wrapping de luz. Esto ES el tronco que se lee.
      c.save();
      openingPath(c, 1);
      c.strokeStyle = 'rgba(18, 14, 10, 0.9)';
      c.lineWidth = S.lip.width * 1.6;
      c.stroke();
      const lipGrad = c.createRadialGradient(
        lightX,
        0,
        0,
        width * S.opening.cx,
        height * S.opening.cy,
        Math.max(width, height) * 0.5,
      );
      lipGrad.addColorStop(0, 'rgba(232, 196, 92, 0.55)');
      lipGrad.addColorStop(0.25, 'rgba(140, 96, 40, 0.28)');
      lipGrad.addColorStop(1, 'rgba(40, 28, 16, 0.05)');
      c.strokeStyle = lipGrad;
      c.lineWidth = S.lip.width;
      c.stroke();
      c.strokeStyle = 'rgba(210, 230, 190, 0.2)';
      c.lineWidth = 2.2;
      c.stroke();
      c.restore();

      // Musgo: solo sobre el labio, no blobs en una pared
      for (let i = 0; i < 40; i++) {
        const t = rnd(0, Math.PI * 2);
        const p = openingPoint(t, rnd(0.96, 1.06));
        const r = rnd(5, 16);
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, 'rgba(90, 140, 95, 0.45)');
        g.addColorStop(1, 'transparent');
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(p.x, p.y, r * rnd(0.7, 1.4), r * rnd(0.35, 0.7), t, 0, Math.PI * 2);
        c.fill();
      }

      // Leño de primer plano: elipse baja, cresta musgosa. Corta el hueco (más cerca).
      const lx = width * 0.5;
      const ly = height * S.log.cy;
      const lrx = width * S.log.rx;
      const lry = height * S.log.ry;
      c.save();
      c.beginPath();
      c.ellipse(lx, ly, lrx, lry, -0.08, 0, Math.PI * 2);
      const logFill = c.createLinearGradient(lx, ly - lry, lx, ly + lry);
      logFill.addColorStop(0, 'rgba(70, 100, 72, 0.55)');
      logFill.addColorStop(0.22, 'rgba(28, 22, 14, 0.92)');
      logFill.addColorStop(1, 'rgba(6, 7, 6, 0.98)');
      c.fillStyle = logFill;
      c.fill();
      c.clip();
      c.strokeStyle = 'rgba(20, 14, 8, 0.5)';
      for (let i = 0; i < 12; i++) {
        const y = ly - lry + (i / 12) * lry * 2;
        c.beginPath();
        c.moveTo(lx - lrx, y);
        c.bezierCurveTo(lx - lrx * 0.3, y + rnd(-8, 8), lx + lrx * 0.3, y + rnd(-8, 8), lx + lrx, y);
        c.stroke();
      }
      c.restore();
      c.save();
      c.strokeStyle = 'rgba(186, 214, 170, 0.28)';
      c.lineWidth = 2.5;
      c.beginPath();
      c.ellipse(lx, ly - lry * 0.15, lrx * 0.92, lry * 0.22, -0.08, Math.PI, 0);
      c.stroke();
      c.restore();
    }

    function hexPath(c: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        const hx = cx + r * Math.cos(a);
        const hy = cy + r * Math.sin(a);
        if (i === 0) c.moveTo(hx, hy);
        else c.lineTo(hx, hy);
      }
      c.closePath();
    }

    function initComb() {
      combClusters = [];
      const n = compact ? S.comb.compact : S.comb.desktop;
      for (let i = 0; i < n; i++) {
        const t = rnd(0, Math.PI * 2);
        const p = openingPoint(t, rnd(0.92, 1.08));
        if (inText(p.x, p.y, 0.95)) continue;
        const hex = rnd(S.comb.hex[0], S.comb.hex[1]);
        const rad = rng() < 0.55 ? 1 : 2;
        const cells: HoneycombCell[] = [];
        for (let q = -rad; q <= rad; q++) {
          const r1 = Math.max(-rad, -q - rad);
          const r2 = Math.min(rad, -q + rad);
          for (let r = r1; r <= r2; r++) {
            const x = p.x + hex * Math.sqrt(3) * (q + r / 2) + rnd(-1.2, 1.2);
            const y = p.y + hex * 1.5 * r + rnd(-1.2, 1.2);
            const d = Math.sqrt(q * q + r * r + q * r);
            if (d + rng() * 0.5 > rad * 1.15) continue;
            if (inText(x, y, 0.9)) continue;
            const hasHoney = rng() < 0.32;
            cells.push({
              x,
              y,
              size: hex,
              hasHoney,
              opacity: Math.max(0.22, 1 - d / (rad + 1.2)),
              drip: hasHoney && rng() > 0.8 ? rnd(4, 10) : 0,
            });
          }
        }
        if (cells.length) combClusters.push({ cx: p.x, cy: p.y, cells });
      }
    }

    function drawComb(c: CanvasRenderingContext2D, ox: number, oy: number, time: number) {
      combClusters.forEach((cluster) => {
        cluster.cells.forEach((cell) => {
          const x = cell.x + ox * 0.35;
          const y = cell.y + oy * 0.35;
          c.save();
          c.globalAlpha = cell.opacity * 0.88;
          c.fillStyle = '#0f0a05';
          hexPath(c, x, y, cell.size);
          c.fill();
          c.fillStyle = '#060402';
          hexPath(c, x, y, cell.size * 0.76);
          c.fill();
          if (cell.hasHoney) {
            const hg = c.createRadialGradient(x, y, 0, x, y, cell.size);
            hg.addColorStop(0, 'rgba(230, 165, 45, 0.65)');
            hg.addColorStop(0.7, 'rgba(180, 110, 20, 0.25)');
            hg.addColorStop(1, 'transparent');
            c.fillStyle = hg;
            hexPath(c, x, y, cell.size * 0.7);
            c.fill();
            if (cell.drip > 0) {
              const swing = Math.sin(time / 2200 + cell.x) * 1.1;
              c.strokeStyle = HONEY_GOLD;
              c.lineWidth = 1.15;
              c.lineCap = 'round';
              c.beginPath();
              c.moveTo(x, y + cell.size * 0.7);
              c.quadraticCurveTo(x + swing, y + cell.drip * 0.5, x, y + cell.drip);
              c.stroke();
            }
          }
          c.strokeStyle = 'rgba(212, 160, 60, 0.18)';
          c.lineWidth = 0.6;
          hexPath(c, x, y, cell.size);
          c.stroke();
          c.restore();
        });
      });
    }

    function drawShaft(c: CanvasRenderingContext2D, time: number) {
      c.save();
      c.globalCompositeOperation = 'screen';
      const pulse = 0.85 + 0.15 * Math.sin(time / 2200);
      for (let i = 0; i < S.light.rays; i++) {
        const u = i / (S.light.rays - 1) - 0.5;
        const x2 = width * S.opening.cx + u * width * S.opening.rx * 1.35;
        const y2 = height * 0.82;
        c.strokeStyle = `rgba(232, 196, 92, ${0.028 * pulse})`;
        c.lineWidth = width * 0.018 * (1 - Math.abs(u) * 0.4);
        c.beginPath();
        c.moveTo(lightX + u * 20, lightY);
        c.lineTo(x2, y2);
        c.stroke();
      }
      const core = c.createRadialGradient(lightX, height * 0.06, 0, lightX, height * 0.06, width * 0.26);
      core.addColorStop(0, `rgba(255, 228, 150, ${0.14 * S.light.intensity * 4 * pulse})`);
      core.addColorStop(0.4, `rgba(201, 162, 39, ${0.05 * pulse})`);
      core.addColorStop(1, 'transparent');
      c.fillStyle = core;
      c.fillRect(0, 0, width, height * 0.5);
      c.restore();
    }

    class Spore {
      x = 0;
      y = 0;
      size = 0;
      vx = 0;
      vy = 0;
      opacity = 0;
      life = 0;
      depth = 1;
      constructor() {
        this.reset(true);
      }
      reset(init = false) {
        this.x = lightX + (rng() - 0.5) * width * 0.2;
        this.y = init ? rng() * height * 0.65 : height * 0.82;
        this.size = rng() * 1.5 + 0.35;
        this.vy = -(rng() * 0.2 + 0.05);
        this.vx = (rng() - 0.5) * 0.14;
        this.opacity = 0;
        this.life = rng() * 240 + 100;
        this.depth = rng() * 0.7 + 0.4;
      }
      update() {
        this.y += this.vy;
        this.x += this.vx + Math.sin(Date.now() / 1500 + this.y * 0.04) * 0.07;
        this.life--;
        const dx = this.x - lightX;
        const dy = this.y - height * 0.08;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const target = dist < width * 0.26 ? (1 - dist / (width * 0.26)) * 0.48 : 0.02;
        this.opacity += (target - this.opacity) * 0.05;
        if (this.y < -10 || this.life <= 0) this.reset();
      }
      draw(c: CanvasRenderingContext2D, ox: number, oy: number) {
        if (this.opacity < 0.01) return;
        c.save();
        c.globalAlpha = this.opacity;
        c.fillStyle = `rgba(235, 195, 110, ${this.opacity})`;
        c.beginPath();
        c.arc(this.x + ox * this.depth, this.y + oy * this.depth, this.size, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    type BeeLayer = 'bg' | 'mid' | 'fg';
    class Bee {
      x = 0;
      y = 0;
      vx = 0;
      vy = 0;
      size = 0;
      wingAngle = 0;
      wingSpeed = 0;
      opacity = 0;
      angle = 0;
      layer: BeeLayer;
      depthFactor = 1;
      constructor(layer: BeeLayer) {
        this.layer = layer;
        const spawn = combClusters[Math.floor(rng() * Math.max(combClusters.length, 1))];
        const p = spawn
          ? { x: spawn.cx, y: spawn.cy }
          : openingPoint(rnd(0, Math.PI * 2), 1.02);
        this.x = p.x + (rng() - 0.5) * 56;
        this.y = p.y + (rng() - 0.5) * 56;
        if (inText(this.x, this.y)) {
          const q = openingPoint(rng() < 0.5 ? rnd(2.4, 3.7) : rnd(-0.4, 0.8), 1.05);
          this.x = q.x;
          this.y = q.y;
        }
        this.wingAngle = rng() * Math.PI * 2;
        if (layer === 'bg') {
          this.size = rng() * 0.5 + 0.9;
          this.wingSpeed = rng() * 0.2 + 0.18;
          this.opacity = rng() * 0.2 + 0.25;
          this.depthFactor = 0.35;
        } else if (layer === 'fg') {
          this.size = rng() * 0.85 + 2.7;
          this.wingSpeed = rng() * 0.34 + 0.28;
          this.opacity = rng() * 0.22 + 0.7;
          this.depthFactor = 1.25;
        } else {
          this.size = rng() * 0.75 + 1.55;
          this.wingSpeed = rng() * 0.28 + 0.22;
          this.opacity = rng() * 0.24 + 0.45;
          this.depthFactor = 0.8;
        }
      }
      update() {
        const jitter = this.layer === 'fg' ? 0.08 : this.layer === 'bg' ? 0.04 : 0.07;
        this.vx += (rng() - 0.5) * jitter;
        this.vy += (rng() - 0.5) * jitter;
        this.vx *= 0.985;
        this.vy *= 0.985;
        let nearest = Infinity;
        let tx = this.x;
        let ty = this.y;
        combClusters.forEach((cl) => {
          const dx = cl.cx - this.x;
          const dy = cl.cy - this.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < nearest) {
            nearest = d;
            tx = cl.cx;
            ty = cl.cy;
          }
        });
        if (nearest > 90 && nearest < Infinity) {
          const pull = this.layer === 'bg' ? 0.01 : 0.015;
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
        const max = this.layer === 'fg' ? 2.1 : this.layer === 'bg' ? 0.95 : 1.55;
        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (spd > max) {
          this.vx = (this.vx / spd) * max;
          this.vy = (this.vy / spd) * max;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.wingAngle += this.wingSpeed;
        this.angle = Math.atan2(this.vy, this.vx);
        const pad = this.size * 10;
        if (this.x < -pad) this.x = width + pad;
        if (this.x > width + pad) this.x = -pad;
        if (this.y < -pad) this.y = height + pad;
        if (this.y > height + pad) this.y = -pad;
      }
      draw(c: CanvasRenderingContext2D, ox: number, oy: number) {
        c.save();
        c.translate(this.x + ox * this.depthFactor, this.y + oy * this.depthFactor);
        c.rotate(this.angle);
        const dx = this.x - lightX;
        const dy = this.y - height * 0.1;
        const light = Math.max(0.4, 1 - Math.sqrt(dx * dx + dy * dy) / (width * 0.55));
        c.globalAlpha = this.opacity * light;
        c.fillStyle = BEE_DARK;
        c.beginPath();
        c.ellipse(0, 0, this.size * 2.5, this.size * 1.1, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = HONEY_GOLD;
        c.globalAlpha = this.opacity * light * 0.85;
        for (let i = -1; i <= 1; i++) {
          c.fillRect(i * this.size * 0.72, -this.size * 0.82, this.size * 0.32, this.size * 1.64);
        }
        c.globalAlpha = this.opacity * light * (this.layer === 'fg' ? 0.55 : 0.4);
        c.fillStyle = WING_TINT;
        const wf = Math.sin(this.wingAngle) * 0.36;
        c.save();
        c.rotate(-0.45 + wf);
        c.beginPath();
        c.ellipse(-this.size, -this.size * 1.5, this.size * 2.1, this.size * 0.8, 0.3, 0, Math.PI * 2);
        c.fill();
        c.restore();
        c.save();
        c.rotate(0.45 - wf);
        c.beginPath();
        c.ellipse(-this.size, this.size * 1.5, this.size * 2.1, this.size * 0.8, -0.3, 0, Math.PI * 2);
        c.fill();
        c.restore();
        c.restore();
      }
    }

    function spawnActors() {
      bees = [];
      spores = [];
      const nBees = compact ? S.bees.compact : S.bees.desktop;
      const nSp = compact ? S.spores.compact : S.spores.desktop;
      const nBg = Math.floor(nBees * 0.3);
      const nFg = Math.min(Math.floor(nBees * 0.12), 3);
      const nMid = nBees - nBg - nFg;
      if (beesOn) {
        for (let i = 0; i < nBg; i++) bees.push(new Bee('bg'));
        for (let i = 0; i < nMid; i++) bees.push(new Bee('mid'));
        for (let i = 0; i < nFg; i++) bees.push(new Bee('fg'));
      }
      for (let i = 0; i < nSp; i++) spores.push(new Spore());
    }

    function resize() {
      const parent = canvas.parentElement;
      width = parent?.clientWidth || window.innerWidth;
      height = parent?.clientHeight || window.innerHeight;
      compact = width < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      staticBuf.width = Math.max(1, Math.floor(width * dpr));
      staticBuf.height = Math.max(1, Math.floor(height * dpr));
      lightX = width * S.light.x;
      lightY = height * S.light.y;
      paintStatic();
      initComb();
    }

    function compose(time: number) {
      ctx.fillStyle = VOID;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(staticBuf, px * 0.25, py * 0.18, width, height);
      drawShaft(ctx, time);
      drawComb(ctx, px, py, time);
      spores.forEach((s) => {
        if (live) s.update();
        s.draw(ctx, px, py);
      });
      bees.forEach((b) => {
        if (live) b.update();
        b.draw(ctx, px, py);
      });
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
    const interval = 1000 / (compact ? S.fps.compact : S.fps.desktop);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && live) animate();
      },
      { threshold: 0.01 },
    );
    observer.observe(canvas);

    function animate(ts = 0) {
      if (!visible) return;
      const elapsed = ts - last;
      if (elapsed < interval) {
        raf = requestAnimationFrame(animate);
        return;
      }
      last = ts - (elapsed % interval);
      if (live) {
        px += (mouseNX * 14 - px) * 0.05;
        py += (mouseNY * 10 - py) * 0.05;
      }
      compose(ts);
      if (live) raf = requestAnimationFrame(animate);
    }

    compose(0);
    if (live) animate();

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
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
