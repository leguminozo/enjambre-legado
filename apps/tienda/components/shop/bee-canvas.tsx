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

// ─── Paleta de lujo biológica y orgánica ────────────────────────────────────
const BEE_DARK     = '#160e06';
const HONEY_GOLD   = '#d49b28';
const HONEY_GLOW   = 'rgba(212, 155, 40, 0.4)';
const WING_TINT    = 'rgba(240, 235, 225, 0.55)';
const SPORE_GOLD   = 'rgba(235, 195, 110, ';

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
    let bees: Bee[] = [];
    let sporeParticles: Spore[] = [];
    let combClusters: CombCluster[] = [];

    // Foco del rayo de luz cenital (origen del haz de sol)
    let lightX = 0;
    let lightY = 0;

    // Parallax suave con el ratón
    let mouseX = 0;
    let mouseY = 0;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let curParallaxX = 0;
    let curParallaxY = 0;

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas?.getBoundingClientRect();
      if (!rect) return;
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      // Normalizado de -1 a 1
      targetParallaxX = (mouseX / width - 0.5) * 2;
      targetParallaxY = (mouseY / height - 0.5) * 2;
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    function debouncedResize() {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(resize, 150);
    }

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

      // Posición del haz de luz natural en el tronco
      lightX = width * 0.5;
      lightY = height * 0.18; 

      initOrganicScatteredComb();
    }

    // ── Panales discretos y rústicos en las hendiduras del tronco ─────────────
    function initOrganicScatteredComb() {
      combClusters = [];
      const numClusters = compact ? 3 : 5;
      
      const textExclusionRX = Math.min(width * 0.38, 380);
      const textExclusionRY = 170;
      const centerCy = height * 0.46;
      
      for (let i = 0; i < numClusters; i++) {
        let angle = (Math.PI * 2 / numClusters) * i + (Math.random() * 0.4);
        const normAngle = ((angle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
        
        // Empujar hacia los laterales para respetar el título
        if ((normAngle > Math.PI*0.32 && normAngle < Math.PI*0.68) || 
            (normAngle > Math.PI*1.32 && normAngle < Math.PI*1.68)) {
            angle += 0.45; 
        }

        const distanceScale = 1.05 + Math.random() * 0.3;
        const cx = (width / 2) + Math.cos(angle) * textExclusionRX * distanceScale;
        const cy = centerCy + Math.sin(angle) * textExclusionRY * distanceScale;

        const cells: HoneycombCell[] = [];
        const hexSize = Math.random() * 3 + 8.5; // Escala perfecta para la abeja
        const gridRadius = Math.floor(Math.random() * 2) + 2; // Racimos orgánicos pequeños
        
        for (let q = -gridRadius; q <= gridRadius; q++) {
          const r1 = Math.max(-gridRadius, -q - gridRadius);
          const r2 = Math.min(gridRadius, -q + gridRadius);
          for (let r = r1; r <= r2; r++) {
            const x = cx + hexSize * Math.sqrt(3) * (q + r/2);
            const y = cy + hexSize * 1.5 * r;
            
            const distFromCenter = Math.sqrt(q*q + r*r + q*r);
            const noise = Math.random() * 1.8;
            
            if (distFromCenter + noise < gridRadius * 1.5) {
              const hasHoney = Math.random() < 0.35;
              cells.push({
                x, y,
                size: hexSize,
                hasHoney,
                opacity: Math.max(0.15, 1 - (distFromCenter / (gridRadius * 1.5))),
                drip: hasHoney && Math.random() > 0.75 ? Math.random() * 10 + 5 : 0
              });
            }
          }
        }
        combClusters.push({ cx, cy, cells });
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

    function drawClusters(pxOffset: number, pyOffset: number) {
      if (!ctx || combClusters.length === 0) return;

      combClusters.forEach(cluster => {
        cluster.cells.forEach(cell => {
          ctx.save();
          const drawX = cell.x + pxOffset * 0.5;
          const drawY = cell.y + pyOffset * 0.5;

          ctx.globalAlpha = cell.opacity * 0.85;

          // Pared de cera oscura
          ctx.fillStyle = '#0f0a05';
          drawHexPath(drawX, drawY, cell.size);
          ctx.fill();

          // Fondo interior de la celda
          ctx.fillStyle = '#060402';
          drawHexPath(drawX, drawY, cell.size * 0.76);
          ctx.fill();

          if (cell.hasHoney) {
            // Miel virgen atrapando el rayo de luz
            const hg = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, cell.size);
            hg.addColorStop(0, 'rgba(230, 165, 45, 0.7)');
            hg.addColorStop(0.7, 'rgba(180, 110, 20, 0.3)');
            hg.addColorStop(1, 'transparent');
            ctx.fillStyle = hg;
            drawHexPath(drawX, drawY, cell.size * 0.7);
            ctx.fill();

            // Goteo de néctar orgánico
            if (cell.drip > 0) {
              const swing = Math.sin(Date.now() / 2200 + cell.x) * 1.2;
              ctx.strokeStyle = HONEY_GOLD;
              ctx.lineWidth   = 1.2;
              ctx.lineCap     = 'round';
              ctx.beginPath();
              ctx.moveTo(drawX, drawY + cell.size * 0.7);
              ctx.quadraticCurveTo(drawX + swing, drawY + cell.drip * 0.5, drawX, drawY + cell.drip);
              ctx.stroke();
            }
          }

          // Borde finamente iluminado
          ctx.strokeStyle = 'rgba(212, 160, 60, 0.18)';
          ctx.lineWidth   = 0.6;
          drawHexPath(drawX, drawY, cell.size);
          ctx.stroke();

          ctx.restore();
        });
      });
    }

    // ── Partículas de polen y esporas flotando en el haz de sol ───────────────
    class Spore {
      x = 0; y = 0; size = 0; vx = 0; vy = 0; opacity = 0; life = 0;
      depth = 1;

      constructor() { this.reset(true); }
      reset(init = false) {
        this.x       = lightX + (Math.random() - 0.5) * (width * 0.6);
        this.y       = init ? Math.random() * height : height + 10;
        this.size    = Math.random() * 1.6 + 0.4;
        this.vy      = -(Math.random() * 0.22 + 0.06);
        this.vx      = (Math.random() - 0.5) * 0.18;
        this.opacity = 0;
        this.life    = Math.random() * 260 + 120;
        this.depth   = Math.random() * 0.8 + 0.4;
      }
      update() {
        this.y    += this.vy;
        this.x    += this.vx + Math.sin(Date.now() / 1500 + this.y * 0.05) * 0.08;
        this.life--;
        
        // Se iluminan cuando cruzan el haz del sol cenital
        const distToLight = Math.sqrt(Math.pow(this.x - lightX, 2) + Math.pow(this.y - lightY, 2));
        const maxDist = width * 0.4;
        const targetOpacity = distToLight < maxDist ? (1 - distToLight/maxDist) * 0.55 : 0.02;
        
        this.opacity += (targetOpacity - this.opacity) * 0.05;

        if (this.y < -10 || this.life <= 0) this.reset();
      }
      draw(pxOffset: number, pyOffset: number) {
        if (!ctx || this.opacity < 0.01) return;
        ctx.save();
        const drawX = this.x + pxOffset * this.depth;
        const drawY = this.y + pyOffset * this.depth;

        ctx.globalAlpha = this.opacity;
        ctx.shadowColor = HONEY_GOLD;
        ctx.shadowBlur  = 5;
        ctx.fillStyle   = SPORE_GOLD + `${this.opacity})`;
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    type BeeLayer = 'bg' | 'mid' | 'fg';

    class Bee {
      x = 0; y = 0; vx = 0; vy = 0;
      size = 0; wingAngle = 0; wingSpeed = 0;
      opacity = 0; angle = 0; layer: BeeLayer;
      depthFactor = 1;

      constructor(layer: BeeLayer = 'mid') {
        this.layer = layer;
        const spawnCluster = combClusters[Math.floor(Math.random() * combClusters.length)] || { cx: width/2, cy: height/2 };
        this.x = spawnCluster.cx + (Math.random() - 0.5) * 140;
        this.y = spawnCluster.cy + (Math.random() - 0.5) * 140;
        
        this.wingAngle = Math.random() * Math.PI * 2;
        this.angle     = 0;

        if (layer === 'bg') {
          this.size        = Math.random() * 0.5 + 0.9;
          this.wingSpeed   = Math.random() * 0.20 + 0.18;
          this.opacity     = Math.random() * 0.20 + 0.25;
          this.depthFactor = 0.3;
        } else if (layer === 'fg') {
          this.size        = Math.random() * 0.9 + 2.8;
          this.wingSpeed   = Math.random() * 0.35 + 0.28;
          this.opacity     = Math.random() * 0.25 + 0.70;
          this.depthFactor = 1.3;
        } else {
          this.size        = Math.random() * 0.8 + 1.6;
          this.wingSpeed   = Math.random() * 0.30 + 0.22;
          this.opacity     = Math.random() * 0.25 + 0.45;
          this.depthFactor = 0.8;
        }
      }

      update() {
        const jitter = this.layer === 'fg' ? 0.08 : this.layer === 'bg' ? 0.04 : 0.07;
        this.vx += (Math.random() - 0.5) * jitter;
        this.vy += (Math.random() - 0.5) * jitter;
        this.vx *= 0.985;
        this.vy *= 0.985;

        // Atracción al panal más cercano o al haz de sol
        let nearestDist = Infinity;
        let targetX = lightX;
        let targetY = lightY;
        
        if (combClusters.length > 0) {
          combClusters.forEach(cluster => {
            const dx = cluster.cx - this.x;
            const dy = cluster.cy - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
              nearestDist = dist;
              targetX = cluster.cx;
              targetY = cluster.cy;
            }
          });
        }

        if (nearestDist > 65) {
          const pull = this.layer === 'bg' ? 0.014 : 0.020;
          this.vx += ((targetX - this.x) / nearestDist) * pull;
          this.vy += ((targetY - this.y) / nearestDist) * pull;
        }

        // Zona elíptica de exclusión de texto
        const textCY = (height * 0.46) + 25; 
        const tdx = (width / 2) - this.x;
        const tdy = textCY - this.y;
        const textRX = Math.min(width * 0.38, 380);
        const textRY = 140;
        const normD = Math.sqrt((tdx * tdx) / (textRX * textRX) + (tdy * tdy) / (textRY * textRY));
        
        if (normD < 1.0) {
          const push = (1.0 - normD) * 0.07;
          const realDist = Math.sqrt(tdx*tdx + tdy*tdy) || 1;
          this.vx -= (tdx / realDist) * push;
          this.vy -= (tdy / realDist) * push;
          // Órbita fluida
          this.vx += (-tdy / realDist) * 0.024;
          this.vy += (tdx  / realDist) * 0.024;
        }

        const maxSpd = this.layer === 'fg' ? 2.2 : this.layer === 'bg' ? 1.0 : 1.6;
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

      draw(pxOffset: number, pyOffset: number) {
        if (!ctx) return;
        ctx.save();
        const drawX = this.x + pxOffset * this.depthFactor;
        const drawY = this.y + pyOffset * this.depthFactor;

        ctx.translate(drawX, drawY);
        ctx.rotate(this.angle);
        
        const distToLight = Math.sqrt(Math.pow(this.x - lightX, 2) + Math.pow(this.y - lightY, 2));
        const lightFactor = Math.max(0.4, 1 - (distToLight / (width * 0.55)));
        ctx.globalAlpha = this.opacity * lightFactor;

        // Cuerpo rústico oscuro
        ctx.fillStyle = BEE_DARK;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 2.5, this.size * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rayas sutiles de polen dorado
        ctx.fillStyle = HONEY_GOLD;
        ctx.globalAlpha = (this.opacity * lightFactor) * 0.85;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.rect(i * this.size * 0.72, -this.size * 0.82, this.size * 0.32, this.size * 1.64);
          ctx.fill();
        }

        // Alas traslúcidas vibrantes
        ctx.globalAlpha = (this.opacity * lightFactor) * (this.layer === 'fg' ? 0.55 : 0.4);
        ctx.fillStyle   = WING_TINT;
        const wf = Math.sin(this.wingAngle) * 0.36;

        ctx.save();
        ctx.rotate(-0.45 + wf);
        ctx.beginPath();
        ctx.ellipse(-this.size, -this.size * 1.5, this.size * 2.1, this.size * 0.8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.rotate(0.45 - wf);
        ctx.beginPath();
        ctx.ellipse(-this.size, this.size * 1.5, this.size * 2.1, this.size * 0.8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
      }
    }

    // ── Inicializar ───────────────────────────────────────────────────────────
    window.addEventListener('resize', debouncedResize);
    resize();

    const cw = width || (typeof window !== 'undefined' ? window.innerWidth : 1024);
    const NUM_BEES   = cw < 768 ? 12 : 28;
    const NUM_SPORES = cw < 768 ? 30 : 65;

    const numBg  = Math.floor(NUM_BEES * 0.3);
    const numFg  = Math.min(Math.floor(NUM_BEES * 0.12), 3);
    const numMid = NUM_BEES - numBg - numFg;
    
    for (let i = 0; i < numBg;  i++) bees.push(new Bee('bg'));
    for (let i = 0; i < numMid; i++) bees.push(new Bee('mid'));
    for (let i = 0; i < numFg;  i++) bees.push(new Bee('fg'));
    for (let i = 0; i < NUM_SPORES; i++) sporeParticles.push(new Spore());

    // ── Loop de animación cinemático ───────────────────────────────────────────
    let animationFrameId: number;
    let isVisible = true;
    let isAnimating = true;
    let lastFrameTime = 0;
    const targetFps     = cw < 768 ? 24 : 30;
    const frameInterval = 1000 / targetFps;

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

      // Lerp suave del parallax interactivo (3D Sutil)
      curParallaxX += (targetParallaxX * 18 - curParallaxX) * 0.05;
      curParallaxY += (targetParallaxY * 14 - curParallaxY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Panales rústicos naturales (Capa media con parallax)
      drawClusters(curParallaxX, curParallaxY);

      // 2. Partículas y esporas de polen flotando en el rayo de sol
      sporeParticles.forEach((p) => { 
        p.update(); 
        p.draw(curParallaxX, curParallaxY); 
      });

      // 3. Abejas nativas volando en capas de profundidad 3D
      bees.forEach((bee) => { 
        bee.update(); 
        bee.draw(curParallaxX, curParallaxY); 
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', debouncedResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="bee-canvas"
      className="absolute inset-0 z-10 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
