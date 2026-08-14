'use client';

import React, { useEffect, useRef } from 'react';

interface HoneycombCell {
  x: number;
  y: number;
  glow: number;
  glowSpeed: number;
  maxGlow: number;
}

export function BeeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const BEE_BODY = '#2a1f14';
    const HONEY = '#c9a227';
    const HONEY_GLOW = 'rgba(201, 162, 39, 0.12)';
    const WING = '#f5f0e8';

    let width: number;
    let height: number;
    let bees: Bee[] = [];
    let honeyParticles: HoneyParticle[] = [];
    let honeycombCells: HoneycombCell[] = [];

    function debouncedResize() {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(resize, 150);
    }

    function initHoneycombGrid(w: number, h: number) {
      honeycombCells = [];
      const radius = Math.max(32, Math.min(w, h) * 0.045);
      const hexWidth = Math.sqrt(3) * radius;
      const hexHeight = 2 * radius;
      const vertDist = hexHeight * 0.75;

      const cols = Math.ceil(w / hexWidth) + 2;
      const rows = Math.ceil(h / vertDist) + 2;

      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
          const xOffset = (r % 2 !== 0) ? hexWidth / 2 : 0;
          const x = c * hexWidth + xOffset;
          const y = r * vertDist;

          // Solo activamos destellos en un porcentaje de celdas para mantener un look orgánico
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

      // Dibujar trama base de panal tenue
      ctx.strokeStyle = 'rgba(201, 162, 39, 0.04)';
      const hexWidth = Math.sqrt(3) * radius;
      const vertDist = radius * 1.5;
      const cols = Math.ceil(width / hexWidth) + 2;
      const rows = Math.ceil(height / vertDist) + 2;

      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
          const xOffset = (r % 2 !== 0) ? hexWidth / 2 : 0;
          const x = c * hexWidth + xOffset;
          const y = r * vertDist;
          drawHexagon(x, y, radius);
          ctx.stroke();
        }
      }

      // Dibujar celdas con destello de néctar resplandeciente
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
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      if (ctx) ctx.scale(dpr, dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      initHoneycombGrid(width, height);
    }

    window.addEventListener('resize', debouncedResize);
    resize();

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
        this.opacity = Math.random() * 0.45 + 0.45;
        this.angle = 0;
      }

      update() {
        // Dinámica de agitación aleatoria
        this.vx += (Math.random() - 0.5) * 0.15;
        this.vy += (Math.random() - 0.5) * 0.15;
        this.vx *= 0.985;
        this.vy *= 0.985;

        // Atracción suave al centro espacial (efecto colmena organizándose)
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

        // Cuerpo abeja marrón cálido cera (#2a1f14)
        ctx.fillStyle = BEE_BODY;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 2.6, this.size * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Franjas de néctar dorado (#c9a227)
        ctx.fillStyle = HONEY;
        ctx.globalAlpha = this.opacity * 0.85;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.rect(i * this.size * 0.75, -this.size * 0.85, this.size * 0.35, this.size * 1.7);
          ctx.fill();
        }

        // Alas translúcidas animadas con aleteo físico (#f5f0e8)
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
      x: number;
      y: number;
      size: number;
      vy: number;
      vx: number;
      opacity: number;
      life: number;

      constructor() {
        this.x = 0;
        this.y = 0;
        this.size = 0;
        this.vy = 0;
        this.vx = 0;
        this.opacity = 0;
        this.life = 0;
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.6;
        this.vy = -(Math.random() * 0.4 + 0.15); // Deriva ascendente tenue como polen
        this.vx = (Math.random() - 0.5) * 0.25;
        this.opacity = Math.random() * 0.45 + 0.15;
        this.life = Math.random() * 140 + 100;
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

    const NUM_BEES = width < 768 ? 22 : 48;
    const NUM_PARTICLES = width < 768 ? 25 : 55;

    bees = [];
    honeyParticles = [];

    for (let i = 0; i < NUM_BEES; i++) {
      bees.push(new Bee());
    }
    for (let i = 0; i < NUM_PARTICLES; i++) {
      honeyParticles.push(new HoneyParticle());
    }

    let animationFrameId: number;
    let isVisible = false;
    let lastFrameTime = 0;
    const targetFps = 30;
    const frameInterval = 1000 / targetFps;
    let isAnimating = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !isAnimating) {
          isAnimating = true;
          animate();
        } else if (!isVisible) {
          isAnimating = false;
        }
      },
      { threshold: 0.1 },
    );

    let initTimeout = setTimeout(() => {
      observer.observe(canvas);
    }, 500);

    function animate(timestamp = 0) {
      if (!ctx || !isVisible) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        return;
      }

      const elapsed = timestamp - lastFrameTime;
      if (elapsed < frameInterval) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = timestamp - (elapsed % frameInterval);

      ctx.clearRect(0, 0, width, height);

      // 1. Trama de Panal Hexagonal
      drawHoneycombMesh();

      // 2. Resplandor Ámbar Central
      drawCentralNectarGlow();

      // 3. Partículas de Néctar & Polen
      honeyParticles.forEach((p) => {
        p.update();
        p.draw();
      });

      // 4. Enjambre de Abejas
      bees.forEach((bee) => {
        bee.update();
        bee.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (initTimeout) clearTimeout(initTimeout);
      observer.disconnect();
      window.removeEventListener('resize', debouncedResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

