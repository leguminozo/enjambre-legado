'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// ============================================================================
// VERSIÓN HISTÓRICA 1: Commit dbf0c93 (9 de Mayo 2026) — Primer BeeCanvas
// ============================================================================
function BeeCanvas_dbf0c93() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    function resize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);

    class Bee {
      x = Math.random() * width;
      y = Math.random() * height;
      vx = (Math.random() - 0.5) * 1.5;
      vy = (Math.random() - 0.5) * 1.5;
      size = Math.random() * 2 + 1.5;
      wingAngle = 0;
      wingSpeed = Math.random() * 0.3 + 0.2;
      opacity = Math.random() * 0.5 + 0.3;
      angle = 0;

      update() {
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;
        this.vx *= 0.99;
        this.vy *= 0.99;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 2) {
          this.vx = (this.vx / speed) * 2;
          this.vy = (this.vy / speed) * 2;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.wingAngle += this.wingSpeed;
        this.angle = Math.atan2(this.vy, this.vx);

        if (this.x < -50) this.x = width + 50;
        if (this.x > width + 50) this.x = -50;
        if (this.y < -50) this.y = height + 50;
        if (this.y > height + 50) this.y = -50;

        const cx = width / 2;
        const cy = height / 2;
        const dx = cx - this.x;
        const dy = cy - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 200) {
          this.vx += (dx / dist) * 0.02;
          this.vy += (dy / dist) * 0.02;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 2.5, this.size, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#c9a227';
        ctx.globalAlpha = this.opacity * 0.8;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.rect(i * this.size * 0.8, -this.size * 0.8, this.size * 0.4, this.size * 1.6);
          ctx.fill();
        }

        ctx.globalAlpha = this.opacity * 0.3;
        ctx.fillStyle = '#f5f0e8';
        const wingFlap = Math.sin(this.wingAngle) * 0.3;

        ctx.save();
        ctx.rotate(-0.5 + wingFlap);
        ctx.beginPath();
        ctx.ellipse(-this.size, -this.size * 1.5, this.size * 2, this.size * 0.8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.rotate(0.5 - wingFlap);
        ctx.beginPath();
        ctx.ellipse(-this.size, this.size * 1.5, this.size * 2, this.size * 0.8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.restore();
      }
    }

    class HoneyParticle {
      x = Math.random() * width;
      y = Math.random() * height;
      size = Math.random() * 1.5 + 0.5;
      vy = Math.random() * 0.3 + 0.1;
      vx = (Math.random() - 0.5) * 0.2;
      opacity = Math.random() * 0.3 + 0.1;
      life = Math.random() * 100 + 100;

      update() {
        this.y += this.vy;
        this.x += this.vx;
        this.life--;
        if (this.y > height || this.life <= 0) {
          this.x = Math.random() * width;
          this.y = -10;
          this.life = Math.random() * 100 + 100;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#c9a227';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const bees = Array.from({ length: 25 }, () => new Bee());
    const honeyParticles = Array.from({ length: 40 }, () => new HoneyParticle());
    let animId: number;

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.6);
      gradient.addColorStop(0, 'rgba(201, 162, 39, 0.03)');
      gradient.addColorStop(1, 'rgba(5, 5, 5, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      honeyParticles.forEach((p) => {
        p.update();
        p.draw();
      });
      bees.forEach((b) => {
        b.update();
        b.draw();
      });
      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none w-full h-full" />;
}

// ============================================================================
// VERSIÓN HISTÓRICA 2: Commit 3587414 (7 de Junio 2026) — Landing Restructure
// ============================================================================
function BeeCanvas_3587414() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    function resize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);

    const inkHex = '#070707';
    const goldHex = '#c9a227';
    const creamHex = '#f5f0e8';

    class Bee {
      x = Math.random() * width;
      y = Math.random() * height;
      vx = (Math.random() - 0.5) * 1.5;
      vy = (Math.random() - 0.5) * 1.5;
      size = Math.random() * 2 + 1.5;
      wingAngle = 0;
      wingSpeed = Math.random() * 0.3 + 0.2;
      opacity = Math.random() * 0.5 + 0.3;
      angle = 0;

      update() {
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;
        this.vx *= 0.99;
        this.vy *= 0.99;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 2) {
          this.vx = (this.vx / speed) * 2;
          this.vy = (this.vy / speed) * 2;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.wingAngle += this.wingSpeed;
        this.angle = Math.atan2(this.vy, this.vx);

        if (this.x < -50) this.x = width + 50;
        if (this.x > width + 50) this.x = -50;
        if (this.y < -50) this.y = height + 50;
        if (this.y > height + 50) this.y = -50;

        const cx = width / 2;
        const cy = height / 2;
        const dx = cx - this.x;
        const dy = cy - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 200) {
          this.vx += (dx / dist) * 0.02;
          this.vy += (dy / dist) * 0.02;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = inkHex;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 2.5, this.size, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = goldHex;
        ctx.globalAlpha = this.opacity * 0.8;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.rect(i * this.size * 0.8, -this.size * 0.8, this.size * 0.4, this.size * 1.6);
          ctx.fill();
        }

        ctx.globalAlpha = this.opacity * 0.3;
        ctx.fillStyle = creamHex;
        const wingFlap = Math.sin(this.wingAngle) * 0.3;

        ctx.save();
        ctx.rotate(-0.5 + wingFlap);
        ctx.beginPath();
        ctx.ellipse(-this.size, -this.size * 1.5, this.size * 2, this.size * 0.8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.rotate(0.5 - wingFlap);
        ctx.beginPath();
        ctx.ellipse(-this.size, this.size * 1.5, this.size * 2, this.size * 0.8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.restore();
      }
    }

    class HoneyParticle {
      x = Math.random() * width;
      y = Math.random() * height;
      size = Math.random() * 1.5 + 0.5;
      vy = Math.random() * 0.3 + 0.1;
      vx = (Math.random() - 0.5) * 0.2;
      opacity = Math.random() * 0.3 + 0.1;
      life = Math.random() * 100 + 100;

      update() {
        this.y += this.vy;
        this.x += this.vx;
        this.life--;
        if (this.y > height || this.life <= 0) {
          this.x = Math.random() * width;
          this.y = -10;
          this.life = Math.random() * 100 + 100;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = goldHex;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const bees = Array.from({ length: 25 }, () => new Bee());
    const honeyParticles = Array.from({ length: 40 }, () => new HoneyParticle());
    let animId: number;

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.6);
      gradient.addColorStop(0, goldHex + '08');
      gradient.addColorStop(1, inkHex + '00');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      honeyParticles.forEach((p) => {
        p.update();
        p.draw();
      });
      bees.forEach((b) => {
        b.update();
        b.draw();
      });
      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none w-full h-full" />;
}

// ============================================================================
// VERSIÓN HISTÓRICA 3: Commit a7acbd6 (14 de Agosto 2026) — Honeycomb Mesh + Nectar Glow
// ============================================================================
function BeeCanvas_a7acbd6() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const BEE_BODY = '#2a1f14';
    const HONEY = '#c9a227';
    const HONEY_GLOW = 'rgba(201, 162, 39, 0.12)';
    const WING = '#f5f0e8';

    let width = 0;
    let height = 0;

    interface Cell {
      x: number;
      y: number;
      glow: number;
      glowSpeed: number;
      maxGlow: number;
    }
    let honeycombCells: Cell[] = [];

    function initHoneycombGrid(w: number, h: number) {
      honeycombCells = [];
      const radius = Math.max(32, Math.min(w, h) * 0.045);
      const hexWidth = Math.sqrt(3) * radius;
      const vertDist = radius * 1.5;
      const cols = Math.ceil(w / hexWidth) + 2;
      const rows = Math.ceil(h / vertDist) + 2;

      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
          const xOffset = r % 2 !== 0 ? hexWidth / 2 : 0;
          const x = c * hexWidth + xOffset;
          const y = r * vertDist;
          if (Math.random() < 0.35) {
            honeycombCells.push({
              x,
              y,
              glow: Math.random() * 0.2,
              glowSpeed: (Math.random() * 0.004 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
              maxGlow: Math.random() * 0.35 + 0.15,
            });
          }
        }
      }
    }

    function drawHexagon(x: number, y: number, r: number) {
      if (!ctx) return;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = x + r * Math.cos(angle);
        const hy = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
    }

    function drawHoneycombMesh() {
      if (!ctx || honeycombCells.length === 0) return;
      const radius = Math.max(32, Math.min(width, height) * 0.045);
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(201, 162, 39, 0.04)';
      const hexWidth = Math.sqrt(3) * radius;
      const vertDist = radius * 1.5;
      const cols = Math.ceil(width / hexWidth) + 2;
      const rows = Math.ceil(height / vertDist) + 2;

      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
          const xOffset = r % 2 !== 0 ? hexWidth / 2 : 0;
          const x = c * hexWidth + xOffset;
          const y = r * vertDist;
          drawHexagon(x, y, radius);
          ctx.stroke();
        }
      }

      honeycombCells.forEach((cell) => {
        cell.glow += cell.glowSpeed;
        if (cell.glow >= cell.maxGlow || cell.glow <= 0.02) {
          cell.glowSpeed = -cell.glowSpeed;
        }
        ctx.save();
        ctx.fillStyle = HONEY_GLOW;
        ctx.globalAlpha = Math.max(0, cell.glow);
        drawHexagon(cell.x, cell.y, radius - 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();
    }

    function drawCentralNectarGlow() {
      if (!ctx) return;
      ctx.save();
      const cx = width / 2;
      const cy = height * 0.45;
      const radius = Math.max(width, height) * 0.55;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, 'rgba(201, 162, 39, 0.09)');
      gradient.addColorStop(0.5, 'rgba(201, 162, 39, 0.03)');
      gradient.addColorStop(1, 'rgba(5, 5, 5, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      initHoneycombGrid(width, height);
    }
    window.addEventListener('resize', resize);
    resize();

    class Bee {
      x = Math.random() * width;
      y = Math.random() * height;
      vx = (Math.random() - 0.5) * 1.8;
      vy = (Math.random() - 0.5) * 1.8;
      size = Math.random() * 2.2 + 1.6;
      wingAngle = Math.random() * Math.PI * 2;
      wingSpeed = Math.random() * 0.35 + 0.25;
      opacity = Math.random() * 0.45 + 0.45;
      angle = 0;

      update() {
        this.vx += (Math.random() - 0.5) * 0.15;
        this.vy += (Math.random() - 0.5) * 0.15;
        this.vx *= 0.985;
        this.vy *= 0.985;

        const cx = width / 2;
        const cy = height * 0.45;
        const dx = cx - this.x;
        const dy = cy - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 180) {
          this.vx += (dx / dist) * 0.035;
          this.vy += (dy / dist) * 0.035;
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
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = BEE_BODY;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 2.6, this.size * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = HONEY;
        ctx.globalAlpha = this.opacity * 0.85;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.rect(i * this.size * 0.75, -this.size * 0.85, this.size * 0.35, this.size * 1.7);
          ctx.fill();
        }

        ctx.globalAlpha = this.opacity * 0.45;
        ctx.fillStyle = WING;
        const wingFlap = Math.sin(this.wingAngle) * 0.35;
        ctx.save();
        ctx.rotate(-0.45 + wingFlap);
        ctx.beginPath();
        ctx.ellipse(-this.size, -this.size * 1.6, this.size * 2.2, this.size * 0.85, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.rotate(0.45 - wingFlap);
        ctx.beginPath();
        ctx.ellipse(-this.size, this.size * 1.6, this.size * 2.2, this.size * 0.85, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.restore();
      }
    }

    class HoneyParticle {
      x = Math.random() * width;
      y = Math.random() * height;
      size = Math.random() * 2 + 0.6;
      vy = -(Math.random() * 0.4 + 0.15);
      vx = (Math.random() - 0.5) * 0.25;
      opacity = Math.random() * 0.45 + 0.15;
      life = Math.random() * 140 + 100;

      update() {
        this.y += this.vy;
        this.x += this.vx;
        this.life--;
        if (this.y < -10 || this.life <= 0) {
          this.x = Math.random() * width;
          this.y = height + 10;
          this.life = Math.random() * 140 + 100;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = HONEY;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const bees = Array.from({ length: 40 }, () => new Bee());
    const honeyParticles = Array.from({ length: 50 }, () => new HoneyParticle());
    let animId: number;

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      drawHoneycombMesh();
      drawCentralNectarGlow();
      honeyParticles.forEach((p) => {
        p.update();
        p.draw();
      });
      bees.forEach((b) => {
        b.update();
        b.draw();
      });
      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none w-full h-full" />;
}

// ============================================================================
// PÁGINA PRINCIPAL: Selector de Versiones Históricas Reales de Git
// ============================================================================
type HistoricalVersion = '3587414' | 'a7acbd6' | 'dbf0c93';

export default function HistoricalHeroPage() {
  const [version, setVersion] = useState<HistoricalVersion>('3587414');

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans">
      {/* Barra superior de selección de versión histórica de Git */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold">
            Versiones Históricas Reales (Git Log)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setVersion('3587414')}
            className={`px-3 py-1.5 rounded-full font-mono text-xs transition-colors border ${
              version === '3587414'
                ? 'bg-accent text-accent-foreground font-bold border-accent'
                : 'bg-surface-raised border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Commit 3587414 (7 Jun)
          </button>

          <button
            type="button"
            onClick={() => setVersion('a7acbd6')}
            className={`px-3 py-1.5 rounded-full font-mono text-xs transition-colors border ${
              version === 'a7acbd6'
                ? 'bg-accent text-accent-foreground font-bold border-accent'
                : 'bg-surface-raised border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Commit a7acbd6 (14 Ago - Hex Mesh)
          </button>

          <button
            type="button"
            onClick={() => setVersion('dbf0c93')}
            className={`px-3 py-1.5 rounded-full font-mono text-xs transition-colors border ${
              version === 'dbf0c93'
                ? 'bg-accent text-accent-foreground font-bold border-accent'
                : 'bg-surface-raised border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Commit dbf0c93 (9 May - Origen)
          </button>

          <Link
            href="/"
            className="ml-3 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            ← Versión Actual
          </Link>
        </div>
      </div>

      <main className="relative pt-12">
        <section className="relative h-[90vh] flex flex-col items-center justify-center text-center px-4">
          {/* Renderizado de la versión histórica real seleccionada */}
          {version === '3587414' && <BeeCanvas_3587414 />}
          {version === 'a7acbd6' && <BeeCanvas_a7acbd6 />}
          {version === 'dbf0c93' && <BeeCanvas_dbf0c93 />}

          <div className="absolute inset-0 bg-gradient-radial from-transparent to-background opacity-60 pointer-events-none" />

          <div className="relative z-10 max-w-4xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
            <span className="editorial-kicker mb-8 block">
              Miel Virgen del Sur del Mundo
            </span>
            <h1 className="font-display text-[clamp(3rem,8vw,7rem)] font-light leading-tight mb-6">
              La Obrera <br /> y el Zángano
            </h1>
            <p className="font-display italic text-[clamp(1.1rem,2.5vw,1.5rem)] text-muted-foreground tracking-wide max-w-2xl mx-auto">
              Desde el bosque húmedo de Chiloé, extractos de una geografía salvaje
            </p>
            <p className="mt-6 font-mono text-[clamp(0.65rem,1.2vw,0.8rem)] tracking-[0.3em] uppercase text-accent/60">
              Luz solar → Néctar → Miel virgen · Sin atajos industriales
            </p>
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
            <span className="text-editorial-xs uppercase tracking-widest text-muted-foreground [writing-mode:vertical-rl]">
              Descender
            </span>
            <div className="w-px h-12 bg-gradient-to-b from-accent to-transparent animate-bounce" />
          </div>
        </section>

        {/* Bitácora de lo que contenía cada commit exactamente */}
        <section className="py-16 px-6 max-w-4xl mx-auto border-t border-border/30">
          <h2 className="font-display text-2xl font-light text-foreground mb-6 text-center">
            Historial de Código Real en Git para BeeCanvas
          </h2>
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <div className={`p-4 rounded-lg border ${version === '3587414' ? 'border-accent bg-accent/5 text-foreground' : 'border-border bg-surface-raised/40'}`}>
              <p className="font-mono font-bold text-accent mb-1">Commit 3587414 (7 Jun 2026)</p>
              <p>Código exacto: 25 abejas con alas sinusoidales, 40 partículas de miel cayendo, y un único gradiente radial central tenue de luz ámbar (<code className="font-mono">goldHex + &apos;08&apos;</code>). Fondo plano oscuro.</p>
            </div>
            <div className={`p-4 rounded-lg border ${version === 'a7acbd6' ? 'border-accent bg-accent/5 text-foreground' : 'border-border bg-surface-raised/40'}`}>
              <p className="font-mono font-bold text-accent mb-1">Commit a7acbd6 (14 Ago 2026)</p>
              <p>Código exacto: Se introdujo la malla hexagonal viva (<code className="font-mono">drawHoneycombMesh</code>), destello individual de celdas con néctar (<code className="font-mono">HONEY_GLOW</code>), resplandor central volumétrico (<code className="font-mono">drawCentralNectarGlow</code>), 40 abejas y partículas ascendentes.</p>
            </div>
            <div className={`p-4 rounded-lg border ${version === 'dbf0c93' ? 'border-accent bg-accent/5 text-foreground' : 'border-border bg-surface-raised/40'}`}>
              <p className="font-mono font-bold text-accent mb-1">Commit dbf0c93 (9 May 2026)</p>
              <p>Código exacto: Primera versión original del BeeCanvas en el repositorio. Colores planos <code className="font-mono">#1a1a1a</code> (cuerpo), <code className="font-mono">#c9a227</code> (rayas) y <code className="font-mono">#f5f0e8</code> (alas).</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
