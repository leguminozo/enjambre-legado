'use client';

import React, { useEffect, useRef } from 'react';

export function BeeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const style = getComputedStyle(document.documentElement);
    const hslToHex = (h: number, s: number, l: number): string => {
      s /= 100;
      l /= 100;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };
    const hslVar = (name: string): string => {
      const val = style.getPropertyValue(name).trim().split(/\s+/);
      if (val.length !== 3) return '#070707';
      return hslToHex(
        Number(val[0]),
        Number(val[1].replace('%', '')),
        Number(val[2].replace('%', '')),
      );
    };

    const inkHex = hslVar('--background');
    const goldHex = hslVar('--accent');
    const creamHex = hslVar('--foreground');

    let width: number;
    let height: number;
    const bees: Bee[] = [];
    const honeyParticles: HoneyParticle[] = [];

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    if (!canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    if (ctx) ctx.scale(dpr, dpr);
  }

  let resizeTimer: ReturnType<typeof setTimeout>;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  };

  window.addEventListener('resize', onResize);
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
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 2 + 1.5;
        this.wingAngle = 0;
        this.wingSpeed = Math.random() * 0.3 + 0.2;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.angle = 0;
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
      }

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
        this.size = Math.random() * 1.5 + 0.5;
        this.vy = Math.random() * 0.3 + 0.1;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.opacity = Math.random() * 0.3 + 0.1;
        this.life = Math.random() * 100 + 100;
      }

      update() {
        this.y += this.vy;
        this.x += this.vx;
        this.life--;
        
        if (this.y > height || this.life <= 0) {
          this.reset();
          this.y = -10;
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

    for (let i = 0; i < 25; i++) {
      bees.push(new Bee());
    }
    for (let i = 0; i < 40; i++) {
      honeyParticles.push(new HoneyParticle());
    }

    let animationFrameId: number;

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      
      const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width * 0.6);
      gradient.addColorStop(0, goldHex + '08');
      gradient.addColorStop(1, inkHex + '00');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      honeyParticles.forEach(p => {
        p.update();
        p.draw();
      });

      bees.forEach(bee => {
        bee.update();
        bee.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

  return () => {
    window.removeEventListener('resize', onResize);
    clearTimeout(resizeTimer);
    cancelAnimationFrame(animationFrameId);
  };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}
