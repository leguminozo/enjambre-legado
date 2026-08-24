'use client';

import React, { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react';

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

export function BeeCanvas() {
  return (
    <BeeCanvasBoundary>
      <BeeCanvasInner />
    </BeeCanvasBoundary>
  );
}

// ─── Paleta del tronco húmedo ────────────────────────────────────────────────
const BEE_BODY   = '#2a1f14';  // corteza seca
const HONEY      = '#c9a227';  // néctar dorado
const WING       = '#f5f0e8';  // ala traslúcida
const SPORE_CLR  = '#e8c98a';  // espora / polen ascendente
const MOSS_CLR   = 'rgba(74, 93, 58,'; // verde musgo — base para gradients
const BG_DEEP    = '#060a04';  // verde-negro bosque

interface HoneycombCell {
  x: number;
  y: number;
  size: number;
  type: 'empty' | 'honey' | 'capped' | 'pollen';
  subType: number;
  opacity: number;
  drip: number;
}

function BeeCanvasInner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let compact = false;
    let bees: Bee[]             = [];
    let sporeParticles: Spore[] = [];
    let mistClouds: Mist[]      = [];
    let honeycombCells: HoneycombCell[] = [];

    function debouncedResize() {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(resize, 150);
    }

    // ── resize ────────────────────────────────────────────────────────────────
    function resize() {
      if (!canvas || !ctx) return;
      const parent = canvas.parentElement;
      width   = parent?.clientWidth  || window.innerWidth;
      height  = parent?.clientHeight || window.innerHeight;
      compact = width < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2);
      canvas.width  = width  * dpr;
      canvas.height = height * dpr;
      canvas.style.width  = width  + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!compact) initHoneycomb();
      else honeycombCells = [];
    }

    // ── Panal rústico en el tronco (parte baja del hero) ─────────────────────
    function initHoneycomb() {
      honeycombCells = [];
      const hexSize   = 15;
      const hexWidth  = hexSize * Math.sqrt(3);
      const hexHeight = hexSize * 1.5;
      const centerX   = width / 2;
      const baseY     = height * 0.62;
      const rows      = 7;
      const cols      = Math.floor(width / hexWidth) + 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = centerX + (col - cols / 2) * hexWidth + (row % 2) * (hexWidth / 2);
          const y = baseY + row * hexHeight;

          const dx = x - centerX;
          const dy = y - (baseY + 80);
          const dist    = Math.sqrt(dx * dx + dy * dy);
          const maxDist = width * 0.32 + row * 22;

          if (dist < maxDist) {
            const r = Math.random();
            let type: HoneycombCell['type'] = 'empty';
            let subType = 0;

            if (r < 0.14)       { type = 'honey';  subType = Math.random() > 0.5 ? 0 : 1; }
            else if (r < 0.22)  { type = 'capped'; }
            else if (r < 0.30)  { type = 'pollen'; subType = Math.floor(Math.random() * 3); }

            const drip = type === 'honey' && Math.random() < 0.18
              ? Math.random() * 28 + 14
              : 0;

            honeycombCells.push({
              x, y,
              size: hexSize + Math.random() * 2,
              type, subType,
              opacity: Math.max(0, 1 - dist / (maxDist * 1.08)),
              drip,
            });
          }
        }
      }
    }

    function drawHexPath(cx: number, cy: number, r: number) {
      if (!ctx) return;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    function drawTrunkBase() {
      if (!ctx) return;

      // Tierra cálida del tronco (gradiente radial desde el fondo central)
      const trunkGrad = ctx.createRadialGradient(
        width / 2, height * 0.85, 0,
        width / 2, height * 0.85, width * 0.65,
      );
      trunkGrad.addColorStop(0,   '#231508');   // madera seca interior
      trunkGrad.addColorStop(0.35, '#130b03');
      trunkGrad.addColorStop(0.7,  '#0a0c05');
      trunkGrad.addColorStop(1,    BG_DEEP);

      ctx.save();
      ctx.fillStyle = trunkGrad;
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.quadraticCurveTo(width * 0.12, height * 0.68, width / 2, height * 0.66);
      ctx.quadraticCurveTo(width * 0.88, height * 0.68, width,     height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Vetas de madera suaves
      ctx.save();
      ctx.strokeStyle = 'rgba(43,29,20,0.18)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) {
        const yOff = height * 0.72 + i * 20;
        ctx.beginPath();
        ctx.moveTo(width * 0.08, yOff);
        ctx.quadraticCurveTo(width / 2, yOff + 18, width * 0.92, yOff);
        ctx.stroke();
      }
      ctx.restore();

      // Manchas de musgo en los bordes laterales
      const mossL = ctx.createRadialGradient(width * 0.08, height * 0.82, 0, width * 0.08, height * 0.82, width * 0.32);
      mossL.addColorStop(0,   MOSS_CLR + '0.22)');
      mossL.addColorStop(1,   MOSS_CLR + '0)');
      ctx.fillStyle = mossL;
      ctx.fillRect(0, 0, width, height);

      const mossR = ctx.createRadialGradient(width * 0.92, height * 0.82, 0, width * 0.92, height * 0.82, width * 0.32);
      mossR.addColorStop(0,   MOSS_CLR + '0.22)');
      mossR.addColorStop(1,   MOSS_CLR + '0)');
      ctx.fillStyle = mossR;
      ctx.fillRect(0, 0, width, height);
    }

    function drawComb() {
      if (!ctx || honeycombCells.length === 0) return;

      honeycombCells.forEach((cell) => {
        ctx.save();
        ctx.globalAlpha = cell.opacity * 0.85;

        // Base de cera oscura
        ctx.fillStyle = '#2a1d10';
        drawHexPath(cell.x, cell.y, cell.size);
        ctx.fill();

        // Profundidad interna
        ctx.fillStyle = '#130a04';
        drawHexPath(cell.x, cell.y, cell.size * 0.82);
        ctx.fill();

        if (cell.type === 'honey') {
          const colors = cell.subType === 0
            ? { c1: 'rgba(245,215,130,0.92)', c2: 'rgba(201,128,42,0.72)' }
            : { c1: 'rgba(212,132,74,0.92)',  c2: 'rgba(122,60,20,0.72)'  };

          const hg = ctx.createRadialGradient(cell.x, cell.y, 0, cell.x, cell.y, cell.size);
          hg.addColorStop(0, colors.c1);
          hg.addColorStop(1, colors.c2);
          ctx.fillStyle = hg;
          drawHexPath(cell.x, cell.y, cell.size * 0.78);
          ctx.fill();

          // Velo de cera semisellado
          ctx.fillStyle = 'rgba(245,240,232,0.13)';
          drawHexPath(cell.x, cell.y - cell.size * 0.08, cell.size * 0.56);
          ctx.fill();

          // Goteo
          if (cell.drip > 0) {
            const swing = Math.sin(Date.now() / 2200 + cell.x * 0.01) * 1.8;
            ctx.strokeStyle = colors.c1;
            ctx.lineWidth   = 2.2;
            ctx.lineCap     = 'round';
            ctx.beginPath();
            ctx.moveTo(cell.x, cell.y + cell.size * 0.78);
            ctx.quadraticCurveTo(cell.x + swing, cell.y + cell.drip * 0.5, cell.x, cell.y + cell.drip + 4);
            ctx.stroke();
            ctx.fillStyle = colors.c1;
            ctx.beginPath();
            ctx.arc(cell.x, cell.y + cell.drip + 7, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (cell.type === 'capped') {
          ctx.fillStyle = '#4a3520';
          drawHexPath(cell.x, cell.y, cell.size * 0.78);
          ctx.fill();
          ctx.fillStyle = 'rgba(212,165,116,0.18)';
          drawHexPath(cell.x - cell.size * 0.08, cell.y - cell.size * 0.08, cell.size * 0.46);
          ctx.fill();
        } else if (cell.type === 'pollen') {
          const pollenColors: [string, string][] = [
            ['#e8c032', 'rgba(200,160,40,0.6)'],
            ['#c14a2a', 'rgba(100,30,10,0.6)'],
            ['#5a6b3a', 'rgba(40,50,20,0.6)'],
          ];
          const [fill, detail] = pollenColors[cell.subType] ?? pollenColors[0];
          ctx.fillStyle = fill;
          drawHexPath(cell.x, cell.y, cell.size * 0.68);
          ctx.fill();
          ctx.fillStyle = detail;
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(
              cell.x + (Math.random() - 0.5) * cell.size * 0.8,
              cell.y + (Math.random() - 0.5) * cell.size * 0.8,
              1.4, 0, Math.PI * 2,
            );
            ctx.fill();
          }
        }

        // Borde de cera rugoso
        ctx.strokeStyle = 'rgba(212,165,116,0.26)';
        ctx.lineWidth   = 0.8;
        drawHexPath(cell.x, cell.y, cell.size);
        ctx.stroke();

        ctx.restore();
      });
    }

    function drawWarmGlow(pulse: number) {
      if (!ctx) return;
      // Pulso muy lento: el tronco «respira» calor
      const alpha = 0.05 + Math.sin(pulse) * 0.018;
      const g = ctx.createRadialGradient(width / 2, height * 0.42, 0, width / 2, height * 0.42, width * 0.55);
      g.addColorStop(0,   `rgba(201,162,39,${alpha.toFixed(3)})`);
      g.addColorStop(0.6, `rgba(74,93,58,${(alpha * 0.4).toFixed(3)})`);
      g.addColorStop(1,   'rgba(6,10,4,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }

    // ── Clases de partículas ──────────────────────────────────────────────────

    class Mist {
      x = 0; y = 0; radius = 0;
      vx = 0; vy = 0; opacity = 0;

      constructor() { this.reset(); }
      reset() {
        this.x       = Math.random() * width;
        this.y       = Math.random() * height;
        this.radius  = Math.random() * 260 + 140;
        this.vx      = (Math.random() - 0.5) * 0.14;
        this.vy      = (Math.random() - 0.5) * 0.05;
        this.opacity = Math.random() * 0.028 + 0.008;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -this.radius) this.x = width  + this.radius;
        if (this.x > width  + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = height + this.radius;
        if (this.y > height + this.radius) this.y = -this.radius;
      }
      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        g.addColorStop(0, 'rgba(180,200,160,0.5)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class Spore {
      x = 0; y = 0; size = 0; vx = 0; vy = 0; opacity = 0; life = 0;

      constructor() { this.reset(true); }
      reset(init = false) {
        this.x       = Math.random() * width;
        this.y       = init ? Math.random() * height : height + 8;
        this.size    = Math.random() * 2.2 + 0.4;
        // Ascienden — sensación de calor contenido
        this.vy      = -(Math.random() * 0.22 + 0.06);
        this.vx      = (Math.random() - 0.5) * 0.28;
        this.opacity = Math.random() * 0.42 + 0.1;
        this.life    = Math.random() * 120 + 100;
      }
      update() {
        this.y    += this.vy;
        this.x    += this.vx;
        this.life--;
        if (this.y < -8 || this.life <= 0) this.reset();
      }
      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.shadowColor = SPORE_CLR;
        ctx.shadowBlur  = 5;
        ctx.fillStyle   = SPORE_CLR;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    type BeeLayer = 'bg' | 'mid' | 'fg';

    class Bee {
      x = 0; y = 0; vx = 0; vy = 0;
      size = 0; wingAngle = 0; wingSpeed = 0;
      opacity = 0; angle = 0; layer: BeeLayer;

      constructor(layer: BeeLayer = 'mid') {
        this.layer = layer;
        this.x = Math.random() * width;
        this.y = Math.random() * height * 0.75;
        this.wingAngle = Math.random() * Math.PI * 2;
        this.angle     = 0;

        if (layer === 'bg') {
          this.size      = Math.random() * 0.7 + 0.9;
          this.vx        = (Math.random() - 0.5) * 1.0;
          this.vy        = (Math.random() - 0.5) * 1.0;
          this.wingSpeed = Math.random() * 0.22 + 0.16;
          this.opacity   = Math.random() * 0.22 + 0.18;
        } else if (layer === 'fg') {
          this.size      = Math.random() * 1.4 + 3.5;
          this.vx        = (Math.random() - 0.5) * 2.2;
          this.vy        = (Math.random() - 0.5) * 2.0;
          this.wingSpeed = Math.random() * 0.38 + 0.28;
          this.opacity   = Math.random() * 0.28 + 0.62;
        } else {
          this.size      = Math.random() * 1.3 + 1.7;
          this.vx        = (Math.random() - 0.5) * 1.5;
          this.vy        = (Math.random() - 0.5) * 1.5;
          this.wingSpeed = Math.random() * 0.32 + 0.22;
          this.opacity   = Math.random() * 0.32 + 0.42;
        }
      }

      update() {
        const jitter = this.layer === 'fg' ? 0.09 : this.layer === 'bg' ? 0.06 : 0.11;
        this.vx += (Math.random() - 0.5) * jitter;
        this.vy += (Math.random() - 0.5) * jitter;
        this.vx *= 0.988;
        this.vy *= 0.988;

        // Punto de refugio: centro-bajo del hero (recoveco del tronco)
        const cx = width / 2;
        const cy = height * 0.42;
        const dx = cx - this.x;
        const dy = cy - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist > 260) {
          const pull = this.layer === 'bg' ? 0.018 : 0.026;
          this.vx += (dx / dist) * pull;
          this.vy += (dy / dist) * pull;
        }

        // Zona elíptica de exclusión de texto
        const textRX = Math.min(width * 0.36, 290);
        const textRY = 105;
        const textCY = cy + 30;
        const tdx = cx - this.x;
        const tdy = textCY - this.y;
        const normD = Math.sqrt((tdx * tdx) / (textRX * textRX) + (tdy * tdy) / (textRY * textRY));
        if (normD < 1.0) {
          const push = (1.0 - normD) * (this.layer === 'fg' ? 0.08 : 0.055);
          this.vx -= (tdx / dist) * push;
          this.vy -= (tdy / dist) * push;
          this.vx += (-tdy / dist) * 0.042;
          this.vy += (tdx  / dist) * 0.042;
        }

        const maxSpd = this.layer === 'fg' ? 2.8 : this.layer === 'bg' ? 1.3 : 2.0;
        const spd    = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (spd > maxSpd) { this.vx = (this.vx / spd) * maxSpd; this.vy = (this.vy / spd) * maxSpd; }

        this.x += this.vx;
        this.y += this.vy;
        this.wingAngle += this.wingSpeed;
        this.angle = Math.atan2(this.vy, this.vx);

        const pad = this.size * 10;
        if (this.x < -pad)          this.x = width  + pad;
        if (this.x > width  + pad)  this.x = -pad;
        if (this.y < -pad)          this.y = height + pad;
        if (this.y > height + pad)  this.y = -pad;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.opacity;

        // Halo cálido (luz contenida en el tronco)
        ctx.shadowColor = 'rgba(201,162,39,0.55)';
        ctx.shadowBlur  = 8;

        ctx.fillStyle = BEE_BODY;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 2.6, this.size * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur  = 0;
        ctx.fillStyle   = HONEY;
        ctx.globalAlpha = this.opacity * 0.88;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.rect(i * this.size * 0.75, -this.size * 0.85, this.size * 0.34, this.size * 1.7);
          ctx.fill();
        }

        ctx.globalAlpha = this.opacity * (this.layer === 'fg' ? 0.55 : 0.38);
        ctx.fillStyle   = WING;
        const wf = Math.sin(this.wingAngle) * 0.34;

        ctx.save();
        ctx.rotate(-0.44 + wf);
        ctx.beginPath();
        ctx.ellipse(-this.size, -this.size * 1.6, this.size * 2.2, this.size * 0.84, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.rotate(0.44 - wf);
        ctx.beginPath();
        ctx.ellipse(-this.size, this.size * 1.6, this.size * 2.2, this.size * 0.84, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
      }
    }

    // ── Inicializar ───────────────────────────────────────────────────────────
    window.addEventListener('resize', debouncedResize);
    resize();

    const cw = width || (typeof window !== 'undefined' ? window.innerWidth : 1024);
    const NUM_BEES   = cw < 768 ? 14 : 38;
    const NUM_SPORES = cw < 768 ? 30 : 65;
    const NUM_MIST   = cw < 768 ? 2  : 5;

    const numBg  = Math.floor(NUM_BEES * 0.32);
    const numFg  = Math.min(Math.floor(NUM_BEES * 0.08), 3);
    const numMid = NUM_BEES - numBg - numFg;
    for (let i = 0; i < numBg;  i++) bees.push(new Bee('bg'));
    for (let i = 0; i < numMid; i++) bees.push(new Bee('mid'));
    for (let i = 0; i < numFg;  i++) bees.push(new Bee('fg'));
    for (let i = 0; i < NUM_SPORES; i++) sporeParticles.push(new Spore());
    for (let i = 0; i < NUM_MIST;   i++) mistClouds.push(new Mist());

    // ── Loop de animación ─────────────────────────────────────────────────────
    let animationFrameId: number;
    let isVisible = true;
    let isAnimating = true;
    let lastFrameTime = 0;
    const targetFps     = cw < 768 ? 24 : 30;
    const frameInterval = 1000 / targetFps;
    let pulse = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !isAnimating) { isAnimating = true; animate(); }
        else if (!isVisible)           { isAnimating = false; }
      },
      { threshold: 0.01 },
    );
    observer.observe(canvas);
    animate();

    function animate(timestamp = 0) {
      if (!ctx || !isVisible) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        return;
      }
      const elapsed = timestamp - lastFrameTime;
      if (elapsed < frameInterval) { animationFrameId = requestAnimationFrame(animate); return; }
      lastFrameTime = timestamp - (elapsed % frameInterval);
      pulse += 0.004; // Pulso muy lento — el tronco respira

      ctx.clearRect(0, 0, width, height);

      // 1. Base del tronco cálido + musgo
      if (!compact) drawTrunkBase();

      // 2. Calor central pulsante
      drawWarmGlow(pulse);

      // 3. Panal rústico en el tronco
      if (!compact) drawComb();

      // 4. Niebla de musgo
      mistClouds.forEach((m) => { m.update(); m.draw(); });

      // 5. Esporas ascendentes (calor contenido)
      sporeParticles.forEach((p) => { p.update(); p.draw(); });

      // 6. Enjambre de abejas (resguardadas dentro)
      bees.forEach((bee) => { bee.update(); bee.draw(); });

      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', debouncedResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="bee-canvas"
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
