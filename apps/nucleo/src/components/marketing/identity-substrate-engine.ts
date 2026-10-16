// ============================================================================
// identity-substrate-engine.ts — Motor Matemático y Físico de Sustrato Biológico
// Marca: La Obrera y el Zángano · Enjambre Legado (Chiloé 42°S)
// Arquitectura: 100% Client-Side Canvas 2D / 60 FPS / Cero Cómputo en Servidor
// ============================================================================

export type SubstrateMotorType =
  | 'reologia_miel'
  | 'enjambre_flujo'
  | 'geometria_panal'
  | 'lidar_fiordos'
  | 'filigrana_origen';

export type CameraDynamics = 'respiracion' | 'ken_burns' | 'barrido' | 'estatico';

export type GravitationalDynamics = 'orbita' | 'flujo_laminar' | 'cursor' | 'vortice';

export type SubstratePaletteId = 'ambar' | 'selva' | 'obsidiana' | 'cobre' | 'marfil' | 'ceniza';

export type BiologicalLayerPlan = 'background' | 'foreground' | 'entrelazado';

export type LayerBlendMode = 'screen' | 'lighter' | 'overlay' | 'source-over';

export interface SubstratePaletteConfig {
  id: SubstratePaletteId;
  label: string;
  sublabel: string;
  bgHex: string;
  cardHex: string;
  primaryHex: string;
  secondaryHex: string;
  glowHex: string;
  isLight?: boolean;
}

export const SUBSTRATE_PALETTES: Record<SubstratePaletteId, SubstratePaletteConfig> = {
  ambar: {
    id: 'ambar',
    label: 'Ámbar Ulmo',
    sublabel: 'Néctar dorado denso',
    bgHex: '#0C0804',
    cardHex: '#181008',
    primaryHex: '#D6AA5C',
    secondaryHex: '#E59840',
    glowHex: '#FCD34D',
    isLight: false,
  },
  selva: {
    id: 'selva',
    label: 'Selva Fría',
    sublabel: 'Musgo y dosel siempreverde',
    bgHex: '#040D07',
    cardHex: '#0A1C10',
    primaryHex: '#52B788',
    secondaryHex: '#2D6A4F',
    glowHex: '#74C69D',
    isLight: false,
  },
  obsidiana: {
    id: 'obsidiana',
    label: 'Obsidiana Carbón',
    sublabel: 'Noche volcánica y ceniza',
    bgHex: '#080808',
    cardHex: '#121212',
    primaryHex: '#F2EEE6',
    secondaryHex: '#8E9690',
    glowHex: '#FFFFFF',
    isLight: false,
  },
  cobre: {
    id: 'cobre',
    label: 'Cobre Austral',
    sublabel: 'Pátina de corteza de alerce',
    bgHex: '#0D0705',
    cardHex: '#1E0E0A',
    primaryHex: '#D97757',
    secondaryHex: '#9C4E34',
    glowHex: '#FB923C',
    isLight: false,
  },
  marfil: {
    id: 'marfil',
    label: 'Marfil de Cera',
    sublabel: 'Ficha clara y papel natural',
    bgHex: '#F7F4EB',
    cardHex: '#EDE8DC',
    primaryHex: '#B8860B',
    secondaryHex: '#8C6826',
    glowHex: '#D4AF37',
    isLight: true,
  },
  ceniza: {
    id: 'ceniza',
    label: 'Bruma Corcovado',
    sublabel: 'Atmósfera pluvial y niebla',
    bgHex: '#0A0D12',
    cardHex: '#121820',
    primaryHex: '#94A3B8',
    secondaryHex: '#64748B',
    glowHex: '#CBD5E1',
    isLight: false,
  },
};

export interface SubstrateParameters {
  flowSpeed: number; // 0.2 a 3.0 (default 1.0)
  turbulence: number; // 0.0 a 3.0 (default 1.0)
  populationDensity: number; // 50 a 400 (default 140)
  luminance: number; // 0.5 a 2.5 (default 1.2)
  fadePersistence: number; // 0.02 a 0.20 (fade de estelas)
  palette: SubstratePaletteId;
  motor: SubstrateMotorType;
  camera: CameraDynamics;
  gravity: GravitationalDynamics;
  blendMode: LayerBlendMode;
  layerPlan: BiologicalLayerPlan;
  layers: {
    organisms: boolean;
    hulls: boolean;
    particles: boolean;
    synapses: boolean;
    pulses: boolean;
    cameraMotion: boolean;
    brandSeal: boolean;
  };
}

export const DEFAULT_SUBSTRATE_PARAMS: SubstrateParameters = {
  flowSpeed: 1.0,
  turbulence: 1.0,
  populationDensity: 140,
  luminance: 1.2,
  fadePersistence: 0.07,
  palette: 'ambar',
  motor: 'reologia_miel',
  camera: 'respiracion',
  gravity: 'orbita',
  blendMode: 'screen',
  layerPlan: 'entrelazado',
  layers: {
    organisms: true,
    hulls: true,
    particles: true,
    synapses: true,
    pulses: true,
    cameraMotion: true,
    brandSeal: true,
  },
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  phase: number;
  energy: number;
  life: number;
  maxLife: number;
  history: Array<{ x: number; y: number }>;
}

interface Pulse {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

export class IdentitySubstrateSimulation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private params: SubstrateParameters;
  private particles: Particle[] = [];
  private pulses: Pulse[] = [];
  private tickCount = 0;
  private width = 1080;
  private height = 1350;
  private cursor = { x: 540, y: 675, active: false };
  private cameraOffset = { x: 0, y: 0, zoom: 1.0 };
  private brandText = {
    title: 'ENJAMBRE LEGADO',
    kicker: 'CHILOÉ 42°S // ESTÁNDAR DE ORIGEN',
    batchCode: 'LOTE 084 · ULMO VIRGEN',
  };

  constructor(canvas: HTMLCanvasElement, initialParams: SubstrateParameters = DEFAULT_SUBSTRATE_PARAMS) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not available');
    }
    this.ctx = context;
    this.params = { ...initialParams };
    this.resize(canvas.width || 1080, canvas.height || 1350);
    this.initParticles();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.particles.length === 0) {
      this.initParticles();
    }
  }

  public updateParameters(newParams: Partial<SubstrateParameters>): void {
    const prevMotor = this.params.motor;
    const prevDensity = this.params.populationDensity;

    this.params = {
      ...this.params,
      ...newParams,
      layers: {
        ...this.params.layers,
        ...(newParams.layers || {}),
      },
    };

    if (this.params.populationDensity !== prevDensity || this.params.motor !== prevMotor) {
      this.initParticles();
    }
  }

  public setBrandOverlay(data: { title?: string; kicker?: string; batchCode?: string }): void {
    this.brandText = {
      title: data.title ?? this.brandText.title,
      kicker: data.kicker ?? this.brandText.kicker,
      batchCode: data.batchCode ?? this.brandText.batchCode,
    };
  }

  public setCursor(x: number, y: number, active = true): void {
    this.cursor.x = x;
    this.cursor.y = y;
    this.cursor.active = active;
  }

  public triggerPulse(x?: number, y?: number): void {
    const px = x ?? this.width * (0.3 + Math.random() * 0.4);
    const py = y ?? this.height * (0.3 + Math.random() * 0.4);
    this.pulses.push({
      x: px,
      y: py,
      radius: 5,
      maxRadius: Math.min(this.width, this.height) * 0.45,
      alpha: 0.85,
      speed: 4.5 * this.params.flowSpeed,
    });
    // Limitar pulsos simultáneos para prevenir saturación de memoria
    if (this.pulses.length > 8) {
      this.pulses.shift();
    }
  }

  public resetSimulation(): void {
    this.tickCount = 0;
    this.pulses = [];
    this.initParticles();
    // Limpiar pantalla inmediatamente
    const palette = SUBSTRATE_PALETTES[this.params.palette];
    this.ctx.fillStyle = palette.bgHex;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  public getStats(): { tick: number; organismCount: number; width: number; height: number } {
    return {
      tick: this.tickCount,
      organismCount: this.particles.length,
      width: this.width,
      height: this.height,
    };
  }

  private initParticles(): void {
    this.particles = [];
    const count = Math.floor(this.params.populationDensity);
    for (let i = 0; i < count; i++) {
      const radius = 2 + Math.random() * 6;
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius,
        baseRadius: radius,
        phase: Math.random() * Math.PI * 2,
        energy: 0.5 + Math.random() * 0.5,
        life: Math.random() * 400,
        maxLife: 300 + Math.random() * 300,
        history: [],
      });
    }
  }

  public step(): void {
    this.tickCount++;
    this.updateCamera();
    this.updatePhysics();
    this.render();
  }

  private updateCamera(): void {
    if (!this.params.layers.cameraMotion) {
      this.cameraOffset = { x: 0, y: 0, zoom: 1.0 };
      return;
    }

    const t = this.tickCount * 0.015 * this.params.flowSpeed;

    switch (this.params.camera) {
      case 'respiracion':
        this.cameraOffset.zoom = 1.0 + Math.sin(t * 0.4) * 0.035;
        this.cameraOffset.x = Math.sin(t * 0.3) * (this.width * 0.015);
        this.cameraOffset.y = Math.cos(t * 0.25) * (this.height * 0.015);
        break;
      case 'ken_burns':
        this.cameraOffset.zoom = 1.0 + ((this.tickCount % 600) / 600) * 0.08;
        this.cameraOffset.x = ((this.tickCount % 600) / 600) * (this.width * 0.03);
        this.cameraOffset.y = ((this.tickCount % 600) / 600) * (this.height * 0.02);
        break;
      case 'barrido':
        this.cameraOffset.zoom = 1.02;
        this.cameraOffset.x = Math.sin(t * 0.2) * (this.width * 0.04);
        this.cameraOffset.y = Math.cos(t * 0.1) * (this.height * 0.01);
        break;
      case 'estatico':
      default:
        this.cameraOffset = { x: 0, y: 0, zoom: 1.0 };
        break;
    }
  }

  private updatePhysics(): void {
    const { flowSpeed, turbulence, gravity, motor } = this.params;
    const t = this.tickCount * 0.02 * flowSpeed;

    // Centro gravitacional principal y secundario
    const focus1X = this.width * 0.42;
    const focus1Y = this.height * 0.48;
    const focus2X = this.width * 0.58;
    const focus2Y = this.height * 0.52;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life++;
      if (p.life > p.maxLife) {
        p.life = 0;
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
        p.history = [];
      }

      // 1. Campo Vectorial base según Motor
      let fx = 0;
      let fy = 0;

      if (motor === 'reologia_miel') {
        // Dinámica de fluidos viscosos: flujo descendente suave con serpenteo en catenaria
        const wave = Math.sin(p.y * 0.005 + t) * Math.cos(p.x * 0.004 + t * 0.5);
        fx += wave * 1.8 * turbulence;
        fy += (1.4 + Math.sin(p.phase + t) * 0.6) * flowSpeed; // Densidad pesada hacia abajo
      } else if (motor === 'enjambre_flujo') {
        // Enjambre apícola: orientación solar (diagonal suave a 45°) + vórtices locales
        const angle = Math.sin(p.x * 0.003 + t) + Math.cos(p.y * 0.003 - t * 0.8);
        fx += (Math.cos(angle) * 2.2 + 0.6) * flowSpeed * turbulence;
        fy += (Math.sin(angle) * 2.2 - 0.4) * flowSpeed * turbulence;
      } else if (motor === 'geometria_panal') {
        // Relax Voronoi: pulsos de expansión y contracción hexagonal
        const hexAngle = Math.floor((p.phase + t * 0.2) * 6) * (Math.PI / 3);
        fx += Math.cos(hexAngle) * 0.8 * flowSpeed;
        fy += Math.sin(hexAngle) * 0.8 * flowSpeed;
      } else if (motor === 'lidar_fiordos') {
        // Curvas topográficas batimétricas de Chiloé
        const topo = Math.sin(p.x * 0.008 + p.y * 0.006 + t);
        fx += Math.cos(topo * Math.PI) * 1.5 * flowSpeed;
        fy += Math.sin(topo * Math.PI) * 1.5 * flowSpeed;
      } else if (motor === 'filigrana_origen') {
        // Spirograph / Guilloché: ondas armónicas sinusoidales cruzadas
        const k = 3.5;
        fx += Math.sin(t * 1.2 + p.phase * k) * 2.0 * flowSpeed;
        fy += Math.cos(t * 0.9 + p.phase * (k + 1)) * 2.0 * flowSpeed;
      }

      // 2. Gravitación ambiental
      if (gravity === 'orbita') {
        const dx1 = focus1X - p.x;
        const dy1 = focus1Y - p.y;
        const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) + 1;
        fx += (-dy1 / d1) * 1.6 + (dx1 / (d1 * d1)) * 120;

        const dx2 = focus2X - p.x;
        const dy2 = focus2Y - p.y;
        const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) + 1;
        fx += (-dy2 / d2) * 1.2 + (dx2 / (d2 * d2)) * 80;
      } else if (gravity === 'flujo_laminar') {
        fx += 1.8 * flowSpeed;
      } else if (gravity === 'vortice') {
        const cx = this.width * 0.5;
        const cy = this.height * 0.5;
        const dx = cx - p.x;
        const dy = cy - p.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 1;
        fx += (-dy / d) * 2.4 + (dx / d) * 0.25;
        fy += (dx / d) * 2.4 + (dy / d) * 0.25;
      } else if (gravity === 'cursor' && this.cursor.active) {
        const dx = this.cursor.x - p.x;
        const dy = this.cursor.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        if (dist < 320) {
          const force = (320 - dist) / 320;
          fx -= (dx / dist) * force * 4.5;
          fy -= (dy / dist) * force * 4.5;
        }
      }

      // Integración de velocidad y posición
      p.vx = p.vx * 0.92 + fx * 0.12;
      p.vy = p.vy * 0.92 + fy * 0.12;

      p.x += p.vx;
      p.y += p.vy;

      // Wrap-around de bordes suave con preservación de continuidad
      if (p.x < -40) {
        p.x = this.width + 30;
        p.history = [];
      } else if (p.x > this.width + 40) {
        p.x = -30;
        p.history = [];
      }
      if (p.y < -40) {
        p.y = this.height + 30;
        p.history = [];
      } else if (p.y > this.height + 40) {
        p.y = -30;
        p.history = [];
      }

      // Historial para estelas
      if (this.params.layers.particles && this.tickCount % 2 === 0) {
        p.history.push({ x: p.x, y: p.y });
        if (p.history.length > 8) {
          p.history.shift();
        }
      }
    }

    // Actualización de pulsos gravitacionales expansivos
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pulse = this.pulses[i];
      pulse.radius += pulse.speed;
      pulse.alpha = Math.max(0, pulse.alpha - 0.015);
      if (pulse.radius >= pulse.maxRadius || pulse.alpha <= 0) {
        this.pulses.splice(i, 1);
      }
    }
  }

  private render(): void {
    const { ctx, width, height, params, cameraOffset } = this;
    const palette = SUBSTRATE_PALETTES[params.palette];

    ctx.save();

    // 1. Persistencia de Estelas (Motion Blur procedimental)
    // Usamos el color de fondo con alpha bajo para crear el rastro orgánico
    ctx.fillStyle = palette.bgHex;
    ctx.globalAlpha = Math.min(1.0, Math.max(0.01, params.fadePersistence));
    ctx.fillRect(0, 0, width, height);

    // 2. Transformación de Cámara (Respiración / Zoom / Drift)
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraOffset.zoom, cameraOffset.zoom);
    ctx.translate(-width / 2 + cameraOffset.x, -height / 2 + cameraOffset.y);

    // Configurar modo de fusión para el sustrato biológico
    ctx.globalCompositeOperation = params.blendMode;

    // 3. Capa Hulls Envolventes (Membranas y campos de densidad difusos)
    if (params.layers.hulls) {
      this.renderHulls(palette);
    }

    // 4. Capa Sinapsis & Catenarias (Conexiones de red entre gotas/organismos)
    if (params.layers.synapses) {
      this.renderSynapses(palette);
    }

    // 5. Capa Pulsos Gravitacionales
    if (params.layers.pulses && this.pulses.length > 0) {
      this.renderPulses(palette);
    }

    // 6. Capa Organismos Vivos y Partículas de Pecoreo
    if (params.layers.organisms || params.layers.particles) {
      this.renderOrganisms(palette);
    }

    ctx.restore(); // Restaurar cámara

    // 7. Capa de Marca & Sello de Origen Oficial (si está activa)
    if (params.layers.brandSeal) {
      this.renderBrandWatermark(palette);
    }

    ctx.restore(); // Restaurar estado global
  }

  private renderHulls(palette: SubstratePaletteConfig): void {
    const { ctx, particles, params } = this;
    const stepSize = Math.max(8, Math.floor(particles.length / 12));

    ctx.save();
    ctx.globalAlpha = 0.08 * params.luminance;
    ctx.fillStyle = palette.secondaryHex;

    for (let i = 0; i < particles.length; i += stepSize) {
      const p1 = particles[i];
      const p2 = particles[(i + 3) % particles.length];
      const p3 = particles[(i + 7) % particles.length];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(p2.x, p2.y, p3.x, p3.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private renderSynapses(palette: SubstratePaletteConfig): void {
    const { ctx, particles, params } = this;
    const maxDist = params.motor === 'reologia_miel' ? 140 : 100;
    const maxDistSq = maxDist * maxDist;

    ctx.save();
    ctx.lineWidth = 1.0;

    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      // Evaluar contra un subconjunto cercano para optimizar rendimiento 60 FPS
      for (let j = i + 1; j < Math.min(particles.length, i + 16); j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const dist = Math.sqrt(distSq);
          const alpha = (1 - dist / maxDist) * 0.28 * params.luminance;
          ctx.strokeStyle = palette.primaryHex;
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

          ctx.beginPath();
          if (params.motor === 'reologia_miel') {
            // Curva viscosa con flecha elástica
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 + (dist * 0.18);
            ctx.moveTo(p1.x, p1.y);
            ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
          } else {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  private renderPulses(palette: SubstratePaletteConfig): void {
    const { ctx } = this;
    ctx.save();
    for (const pulse of this.pulses) {
      ctx.strokeStyle = palette.glowHex;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = pulse.alpha * 0.6;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Anillo secundario concéntrico tipo eco
      if (pulse.radius > 20) {
        ctx.lineWidth = 0.75;
        ctx.globalAlpha = pulse.alpha * 0.3;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.radius * 0.75, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private renderOrganisms(palette: SubstratePaletteConfig): void {
    const { ctx, particles, params } = this;
    const lum = params.luminance;

    ctx.save();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const pulseSize = Math.sin(p.phase + this.tickCount * 0.05) * 1.5;
      const currentRadius = Math.max(1, p.baseRadius + pulseSize);

      // Estelas
      if (params.layers.particles && p.history.length > 1) {
        ctx.strokeStyle = palette.secondaryHex;
        ctx.lineWidth = Math.max(0.6, currentRadius * 0.4);
        ctx.beginPath();
        for (let h = 0; h < p.history.length; h++) {
          const pt = p.history[h];
          const trailAlpha = ((h + 1) / p.history.length) * 0.3 * lum;
          ctx.globalAlpha = Math.min(1, Math.max(0, trailAlpha));
          if (h === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Núcleo del organismo / gota ámbar
      if (params.layers.organisms) {
        // Halo exterior
        const grad = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          currentRadius * 2.8,
        );
        grad.addColorStop(0, palette.glowHex);
        grad.addColorStop(0.4, palette.primaryHex);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.55 * lum;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Centro nítido de alta densidad
        ctx.fillStyle = palette.primaryHex;
        ctx.globalAlpha = 0.9 * lum;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private renderBrandWatermark(palette: SubstratePaletteConfig): void {
    const { ctx, width, height, brandText } = this;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // 1. Micro-retícula técnica en las esquinas
    ctx.strokeStyle = palette.primaryHex;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;

    const cornerMargin = 48;
    const cornerLength = 24;

    // Esquinas de calibración geométrica
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(cornerMargin, cornerMargin + cornerLength);
    ctx.lineTo(cornerMargin, cornerMargin);
    ctx.lineTo(cornerMargin + cornerLength, cornerMargin);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(width - cornerMargin - cornerLength, cornerMargin);
    ctx.lineTo(width - cornerMargin, cornerMargin);
    ctx.lineTo(width - cornerMargin, cornerMargin + cornerLength);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(cornerMargin, height - cornerMargin - cornerLength);
    ctx.lineTo(cornerMargin, height - cornerMargin);
    ctx.lineTo(cornerMargin + cornerLength, height - cornerMargin);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(width - cornerMargin - cornerLength, height - cornerMargin);
    ctx.lineTo(width - cornerMargin, height - cornerMargin);
    ctx.lineTo(width - cornerMargin, height - cornerMargin - cornerLength);
    ctx.stroke();

    // 2. Kicker Superior
    ctx.font = '500 13px ui-monospace, "JetBrains Mono", monospace';
    ctx.fillStyle = palette.primaryHex;
    ctx.globalAlpha = 0.85;
    ctx.textAlign = 'left';
    ctx.fillText(brandText.kicker, cornerMargin + 16, cornerMargin + 18);

    // 3. Código identificador de Lote / Coordenada
    ctx.textAlign = 'right';
    ctx.fillText(brandText.batchCode, width - cornerMargin - 16, cornerMargin + 18);

    // 4. Marca Central Inferior de Poder Silencioso
    ctx.textAlign = 'center';
    ctx.font = '300 24px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = palette.primaryHex;
    ctx.globalAlpha = 0.9;
    ctx.fillText(brandText.title, width / 2, height - cornerMargin - 8);

    ctx.font = '400 10px ui-monospace, "JetBrains Mono", monospace';
    ctx.globalAlpha = 0.55;
    ctx.fillText('CERTIFICADO DE ORIGEN VERIFICADO · FINISTERRE 42°S', width / 2, height - cornerMargin + 12);

    ctx.restore();
  }
}
