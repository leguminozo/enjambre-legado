'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@enjambre/ui';

/**
 * Hero ilustrativo: hueco de árbol + luz de copa, todo en fragment shader.
 * Sin foto, sin paths rellenos. Si WebGL falla, el CSS de .hero-atmosphere cubre.
 * Optimizado:
 * - Resolución ambiental adaptativa (escalado bilineal GPU a ~0.65 DPR) reduciendo ~75% de carga GPU.
 * - Eliminación de funciones huérfanas en GLSL.
 * - Pausa estricta ante IntersectionObserver y visibilitychange (0% GPU fuera de foco).
 * - Aislamiento de capas CSS con contain: strict.
 */

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_res;
uniform float u_time;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f *= f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.05 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

float sdEllipse(vec2 p, vec2 r) {
  float k = length(p / r);
  return (k - 1.0) * min(r.x, r.y);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * u_res) / u_res.y;
  vec2 ndc = (frag / u_res) * 2.0 - 1.0;
  float t = u_time * 0.06;

  float n1 = fbm(uv * 1.4 + vec2(0.0, t * 0.25));
  float n2 = fbm(uv * 1.9 + vec2(4.7, -t * 0.18));
  vec2 warp = vec2((n1 - 0.5) * 0.05, (n2 - 0.5) * 0.04);
  vec2 w = uv + warp;

  vec2 cavC = vec2(0.0, 0.04);
  vec2 cavR = vec2(0.78, 0.84);
  float d = sdEllipse(ndc + warp * 1.2 - cavC, cavR);

  vec3 forest = vec3(0.018, 0.028, 0.022);
  forest += 0.018 * fbm(uv * 4.0 + 7.0) * vec3(0.5, 0.8, 0.45);

  float canopy = fbm(vec2(uv.x * 3.2, (uv.y - 0.78) * 6.0 + 2.0));
  float leaves = smoothstep(0.62, 1.12, uv.y) * smoothstep(0.32, 0.78, canopy);

  vec2 grainUv = vec2(w.x * 14.0 + sin(w.y * 18.0) * 0.35, w.y * 2.4);
  float grain = fbm(grainUv);
  float rings = 0.5 + 0.5 * sin((length((w - cavC) * vec2(1.7, 0.55)) + grain * 0.12) * 34.0);
  vec3 wood = mix(vec3(0.08, 0.045, 0.022), vec3(0.22, 0.12, 0.048), grain);
  wood = mix(wood, vec3(0.05, 0.03, 0.016), rings * 0.45);
  float moss = smoothstep(0.62, 0.9, fbm(w * 6.0 + 21.0)) * smoothstep(0.0, 0.7, -w.y);
  wood = mix(wood, vec3(0.045, 0.09, 0.04), moss * 0.4);

  vec3 voidCol = vec3(0.008, 0.01, 0.009);
  vec3 honey = vec3(0.79, 0.64, 0.16);
  vec3 cream = vec3(0.95, 0.86, 0.55);

  float inside = smoothstep(0.05, -0.04, d);
  float wall = smoothstep(0.22, 0.0, abs(d + 0.03));
  float openTop = smoothstep(0.28, 0.82, ndc.y);
  float sides = smoothstep(0.12, 0.48, abs(ndc.x));
  wall *= sides * (1.0 - openTop * 0.9);

  vec2 light = vec2(0.0, 1.22);
  vec2 toL = light - uv;
  vec2 ld = toL / max(length(toL), 0.001);

  float cone = abs(uv.x) / (0.045 + max(0.0, 1.05 - uv.y) * 0.16);
  float shaft = smoothstep(1.05, 0.12, cone);
  shaft *= smoothstep(-0.35, 0.95, uv.y);
  shaft *= 0.55 + 0.45 * fbm(vec2(uv.x * 9.0, uv.y * 3.2 - t * 2.0));
  shaft *= inside;

  float vol = 0.0;
  vec2 rp = ndc + warp * 1.2;
  for (int i = 0; i < 5; i++) {
    rp += vec2(0.0, 0.07);
    float dd = sdEllipse(rp - cavC, cavR);
    vol += shaft * smoothstep(0.04, -0.1, dd) * 0.18;
  }

  vec2 nrm = normalize((ndc - cavC) / (cavR * cavR));
  float ndl = max(0.0, dot(nrm, ld));
  float rim = wall * ndl * (0.25 + 0.75 * smoothstep(-0.1, 0.7, ndc.y));

  float hole = length((uv - vec2(0.0, 0.98)) / vec2(0.11, 0.045));
  float sky = smoothstep(1.4, 0.12, hole) * (1.0 - leaves * 0.7);

  vec3 col = forest;
  col = mix(col, vec3(0.012, 0.02, 0.014), leaves);
  col = mix(col, voidCol, inside);
  vec3 wallCol = wood * (0.7 + grain * 0.35 + ndl * 0.4);
  col = mix(col, wallCol, wall);

  col += cream * rim * 0.18;
  col += cream * shaft * 0.18;
  col += honey * vol * 0.16;
  col += cream * sky * 0.75;
  col += honey * inside * smoothstep(0.15, -0.85, uv.y) * 0.03;

  float dust = pow(noise(frag * 0.32 + vec2(t * 12.0, -t * 17.0)), 18.0);
  col += cream * dust * shaft * 0.9;

  vec2 ts = uv / vec2(0.62, 0.36);
  float scrim = exp(-dot(ts, ts));
  col = mix(col, col * vec3(0.72, 0.7, 0.62), scrim * 0.22);

  vec2 q = frag / u_res;
  col *= 0.55 + 0.45 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.3);
  col += (hash(frag + fract(t * 2.7)) - 0.5) * 0.025;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('HeroHuecoGL shader:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function link(gl: WebGLRenderingContext) {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, 'a_pos');
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('HeroHuecoGL program:', gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

export function HeroHuecoGL({ live = true }: { live?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const opts: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    };
    const gl =
      canvas.getContext('webgl', opts) ||
      (canvas.getContext('experimental-webgl', opts) as WebGLRenderingContext | null);
    if (!gl) {
      canvas.style.display = 'none';
      return;
    }
    const surface = canvas;
    const glCtx = gl;

    const prog = link(glCtx);
    if (!prog) {
      surface.style.display = 'none';
      return;
    }

    const buf = glCtx.createBuffer();
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buf);
    glCtx.bufferData(glCtx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), glCtx.STATIC_DRAW);
    glCtx.useProgram(prog);
    glCtx.enableVertexAttribArray(0);
    glCtx.vertexAttribPointer(0, 2, glCtx.FLOAT, false, 0, 0);

    const uRes = glCtx.getUniformLocation(prog, 'u_res');
    const uTime = glCtx.getUniformLocation(prog, 'u_time');

    let raf = 0;
    let visible = true;
    let last = 0;
    let isCleanedUp = false;
    const interval = 1000 / 24;
    const t0 = performance.now();

    function resize() {
      const parent = surface.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;
      // Para un fondo ambiental difuso de niebla y luz crepuscular, un dpr de 0.5 a 0.65
      // con escalado bilineal nativo por hardware ofrece un acabado suave,
      // eliminando ~75% del conteo de píxeles evaluados en el fragment shader.
      const dpr = Math.min(window.devicePixelRatio || 1, width < 768 ? 0.5 : 0.65);
      const targetW = Math.min(1280, Math.max(1, Math.floor(width * dpr)));
      const targetH = Math.min(720, Math.max(1, Math.floor(height * dpr)));
      surface.width = targetW;
      surface.height = targetH;
      surface.style.width = `${width}px`;
      surface.style.height = `${height}px`;
      glCtx.viewport(0, 0, surface.width, surface.height);
    }

    function draw(ts: number) {
      if (isCleanedUp) return;
      glCtx.uniform2f(uRes, surface.width, surface.height);
      glCtx.uniform1f(uTime, (ts - t0) * 0.001);
      glCtx.drawArrays(glCtx.TRIANGLES, 0, 3);
    }

    function tick(ts = 0) {
      if (!visible || isCleanedUp || (typeof document !== 'undefined' && document.hidden)) return;
      const elapsed = ts - last;
      if (elapsed < interval) {
        raf = requestAnimationFrame(tick);
        return;
      }
      last = ts - (elapsed % interval);
      draw(ts);
      if (live && !isCleanedUp) raf = requestAnimationFrame(tick);
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (visible && live && !isCleanedUp) {
        last = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const ro = new ResizeObserver(resize);
    if (surface.parentElement) ro.observe(surface.parentElement);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && live && !isCleanedUp) {
          last = performance.now();
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.01 },
    );
    io.observe(surface);

    resize();
    draw(performance.now());
    setMounted(true);
    if (live) raf = requestAnimationFrame(tick);

    const onLost = (e: Event) => {
      e.preventDefault();
      isCleanedUp = true;
      cancelAnimationFrame(raf);
      surface.style.display = 'none';
    };
    surface.addEventListener('webglcontextlost', onLost);

    return () => {
      isCleanedUp = true;
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      cancelAnimationFrame(raf);
      surface.removeEventListener('webglcontextlost', onLost);
      glCtx.deleteBuffer(buf);
      glCtx.deleteProgram(prog);
    };
  }, [live]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="hero-hueco-gl"
      className={cn(
        'absolute inset-0 h-full w-full pointer-events-none transition-opacity duration-700 ease-out',
        mounted ? 'opacity-100' : 'opacity-0',
      )}
      style={{ contain: 'strict', willChange: 'transform' }}
      aria-hidden
    />
  );
}
