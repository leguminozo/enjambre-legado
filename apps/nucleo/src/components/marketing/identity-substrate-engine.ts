// ============================================================================
// identity-substrate-engine.ts — Motor Matemático y Físico de Sustrato Biológico
// Marca: La Obrera y el Zángano · Enjambre Legado (Chiloé 42°S)
// Arquitectura: 100% Client-Side Canvas 2D / 60 FPS / Cero Cómputo en Servidor
// ============================================================================

import { resolveTokenColor } from '@enjambre/ui/design-tokens';
import { createStream, type RandomStream } from './prng';
import { CurlField, distributeParticles } from './substrate-field';

export type SubstrateMotorType =
  | 'obrera_zangano'
  | 'hueco_bosque'
  | 'radar_constelacion'
  | 'floracion_bosque'
  | 'cristalizacion_miel'
  | 'alambique_hidromiel'
  | 'reologia_miel'
  | 'enjambre_flujo'
  | 'geometria_panal'
  | 'lidar_fiordos'
  | 'filigrana_origen';

export type CameraDynamics = 'respiracion' | 'ken_burns' | 'barrido' | 'estatico';

export type GravitationalDynamics = 'orbita' | 'flujo_laminar' | 'cursor' | 'vortice' | 'curl';

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
    get bgHex() {
      return resolveTokenColor('--enj-substrate-ambar-bg', '#0C0804');
    },
    get cardHex() {
      return resolveTokenColor('--enj-substrate-ambar-card', '#181008');
    },
    get primaryHex() {
      return resolveTokenColor('--enj-substrate-ambar-primary', '#D6AA5C');
    },
    get secondaryHex() {
      return resolveTokenColor('--enj-substrate-ambar-secondary', '#E59840');
    },
    get glowHex() {
      return resolveTokenColor('--enj-substrate-ambar-glow', '#FCD34D');
    },
    isLight: false,
  },
  selva: {
    id: 'selva',
    label: 'Selva Fría',
    sublabel: 'Musgo y dosel siempreverde',
    get bgHex() {
      return resolveTokenColor('--enj-substrate-selva-bg', '#040D07');
    },
    get cardHex() {
      return resolveTokenColor('--enj-substrate-selva-card', '#0A1C10');
    },
    get primaryHex() {
      return resolveTokenColor('--enj-substrate-selva-primary', '#52B788');
    },
    get secondaryHex() {
      return resolveTokenColor('--enj-substrate-selva-secondary', '#2D6A4F');
    },
    get glowHex() {
      return resolveTokenColor('--enj-substrate-selva-glow', '#74C69D');
    },
    isLight: false,
  },
  obsidiana: {
    id: 'obsidiana',
    label: 'Obsidiana Carbón',
    sublabel: 'Noche volcánica y ceniza',
    get bgHex() {
      return resolveTokenColor('--enj-substrate-obsidiana-bg', '#080808');
    },
    get cardHex() {
      return resolveTokenColor('--enj-substrate-obsidiana-card', '#121212');
    },
    get primaryHex() {
      return resolveTokenColor('--enj-substrate-obsidiana-primary', '#F2EEE6');
    },
    get secondaryHex() {
      return resolveTokenColor('--enj-substrate-obsidiana-secondary', '#8E9690');
    },
    get glowHex() {
      return resolveTokenColor('--enj-substrate-obsidiana-glow', '#FFFFFF');
    },
    isLight: false,
  },
  cobre: {
    id: 'cobre',
    label: 'Cobre Austral',
    sublabel: 'Pátina de corteza de alerce',
    get bgHex() {
      return resolveTokenColor('--enj-substrate-cobre-bg', '#0D0705');
    },
    get cardHex() {
      return resolveTokenColor('--enj-substrate-cobre-card', '#1E0E0A');
    },
    get primaryHex() {
      return resolveTokenColor('--enj-substrate-cobre-primary', '#D97757');
    },
    get secondaryHex() {
      return resolveTokenColor('--enj-substrate-cobre-secondary', '#9C4E34');
    },
    get glowHex() {
      return resolveTokenColor('--enj-substrate-cobre-glow', '#FB923C');
    },
    isLight: false,
  },
  marfil: {
    id: 'marfil',
    label: 'Marfil de Cera',
    sublabel: 'Ficha clara y papel natural',
    get bgHex() {
      return resolveTokenColor('--enj-substrate-marfil-bg', '#F7F4EB');
    },
    get cardHex() {
      return resolveTokenColor('--enj-substrate-marfil-card', '#EDE8DC');
    },
    get primaryHex() {
      return resolveTokenColor('--enj-substrate-marfil-primary', '#B8860B');
    },
    get secondaryHex() {
      return resolveTokenColor('--enj-substrate-marfil-secondary', '#8C6826');
    },
    get glowHex() {
      return resolveTokenColor('--enj-substrate-marfil-glow', '#D4AF37');
    },
    isLight: true,
  },
  ceniza: {
    id: 'ceniza',
    label: 'Bruma Corcovado',
    sublabel: 'Atmósfera pluvial y niebla',
    get bgHex() {
      return resolveTokenColor('--enj-substrate-ceniza-bg', '#0A0D12');
    },
    get cardHex() {
      return resolveTokenColor('--enj-substrate-ceniza-card', '#121820');
    },
    get primaryHex() {
      return resolveTokenColor('--enj-substrate-ceniza-primary', '#94A3B8');
    },
    get secondaryHex() {
      return resolveTokenColor('--enj-substrate-ceniza-secondary', '#64748B');
    },
    get glowHex() {
      return resolveTokenColor('--enj-substrate-ceniza-glow', '#CBD5E1');
    },
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
  customColor?: string;
  motor: SubstrateMotorType;
  camera: CameraDynamics;
  gravity: GravitationalDynamics;
  blendMode: LayerBlendMode;
  layerPlan: BiologicalLayerPlan;
  seed: number;
  transparentBackground: boolean;
  fieldInfluence: number;
  fieldScale: number;
  fieldOctaves: number;
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

export const DEFAULT_SUBSTRATE_SEED = 42;

export const DEFAULT_SUBSTRATE_PARAMS: SubstrateParameters = {
  flowSpeed: 1.0,
  turbulence: 1.0,
  populationDensity: 140,
  luminance: 1.2,
  fadePersistence: 0.07,
  palette: 'ambar',
  motor: 'obrera_zangano',
  camera: 'respiracion',
  gravity: 'orbita',
  blendMode: 'screen',
  layerPlan: 'entrelazado',
  seed: DEFAULT_SUBSTRATE_SEED,
  transparentBackground: false,
  fieldInfluence: 0.45,
  fieldScale: 2.4,
  fieldOctaves: 3,
  layers: {
    organisms: true,
    hulls: true,
    particles: true,
    synapses: true,
    pulses: true,
    cameraMotion: true,
    brandSeal: false,
  },
};

// ── Interfaces de Entidades ──────────────────────────────────────────────────

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

interface BeeEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  wingAngle: number;
  wingSpeed: number;
  opacity: number;
  angle: number;
  isDrone: boolean;
}

interface BotanicalEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vrot: number;
  opacity: number;
  type: 'pollen' | 'amber' | 'cacao' | 'hazelnut';
  color: string;
  bumps?: Array<{ x: number; y: number; r: number }>;
  points?: Array<{ x: number; y: number }>;
}

interface HoneyDropEntity {
  x: number;
  y: number;
  vy: number;
  radius: number;
  stretch: number;
  phase: number;
}

interface HexCellEntity {
  cx: number;
  cy: number;
  radius: number;
  phase: number;
  fillDepth: number;
}

interface DustMoteEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

// Nuevas entidades inspiradas en tienda y cata:
interface RadarAxisEntity {
  label: string;
  angle: number;
  value: number;
  targetValue: number;
  speed: number;
}

interface BlossomEntity {
  x: number;
  y: number;
  size: number;
  petals: number;
  bloomProgress: number;
  rotation: number;
  dewDropSize: number;
}

interface PetalDriftEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vrot: number;
  wobblePhase: number;
  alpha: number;
}

interface CrystalFlakeEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vrot: number;
  alpha: number;
}

interface BubbleEntity {
  x: number;
  y: number;
  vy: number;
  radius: number;
  wobblePhase: number;
  alpha: number;
}

// ── Sprites Acelerados en Memoria ───────────────────────────────────────────

function createGoldGlowSprite(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const size = 128;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const half = size * 0.5;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, 'rgba(240, 192, 108, 0.85)');
  grad.addColorStop(0.3, 'rgba(214, 165, 95, 0.40)');
  grad.addColorStop(0.65, 'rgba(214, 165, 95, 0.10)');
  grad.addColorStop(1, 'rgba(214, 165, 95, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(half, half, half, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function createDarkShadowSprite(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const half = size * 0.5;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(half, half, half, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

export class IdentitySubstrateSimulation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private params: SubstrateParameters;
  private particles: Particle[] = [];
  private bees: BeeEntity[] = [];
  private botanicals: BotanicalEntity[] = [];
  private dustMotes: DustMoteEntity[] = [];
  private honeyDrops: HoneyDropEntity[] = [];
  private hexCells: HexCellEntity[] = [];
  private radarAxes: RadarAxisEntity[] = [];
  private blossoms: BlossomEntity[] = [];
  private fallingPetals: PetalDriftEntity[] = [];
  private crystalFlakes: CrystalFlakeEntity[] = [];
  private bubbles: BubbleEntity[] = [];
  private pulses: Pulse[] = [];
  private tickCount = 0;
  private width = 1080;
  private height = 1350;
  private cursor = { x: 540, y: 675, active: false };
  private cameraOffset = { x: 0, y: 0, zoom: 1.0 };
  private stream: RandomStream;
  private streamRespawn: RandomStream;
  private readonly field: CurlField;
  private readonly fieldSample = { x: 0, y: 0 };
  private goldGlow: HTMLCanvasElement | null = null;
  private darkShadow: HTMLCanvasElement | null = null;

  private static readonly FIELD_INTERVAL = 6;
  private frameCostMs = 0;
  private qualityTier = 0;
  private qualityStreak = 0;
  private static readonly FRAME_BUDGET_MS = 11;
  private static readonly QUALITY_STREAK = 24;
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
    this.stream = createStream(this.params.seed, 'sustrato');
    this.streamRespawn = createStream(this.params.seed, 'reaparicion');
    this.field = new CurlField({
      seed: this.params.seed,
      scale: this.params.fieldScale,
      octaves: this.params.fieldOctaves,
    });
    this.goldGlow = createGoldGlowSprite();
    this.darkShadow = createDarkShadowSprite();
    this.resize(canvas.width || 1080, canvas.height || 1350);
    this.initParticles();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.field.setBounds(width, height);
    this.initParticles();
  }

  public updateParameters(newParams: Partial<SubstrateParameters>): void {
    const prevMotor = this.params.motor;
    const prevDensity = this.params.populationDensity;
    const prevSeed = this.params.seed;
    const prevScale = this.params.fieldScale;

    this.params = {
      ...this.params,
      ...newParams,
      layers: {
        ...this.params.layers,
        ...(newParams.layers || {}),
      },
    };

    if (this.params.seed !== prevSeed) {
      this.stream = createStream(this.params.seed, 'sustrato');
      this.streamRespawn = createStream(this.params.seed, 'reaparicion');
      this.field.setSeed(this.params.seed);
    }

    if (this.params.fieldScale !== prevScale) {
      this.field.setScale(this.params.fieldScale);
    }

    if (
      this.params.populationDensity !== prevDensity ||
      this.params.motor !== prevMotor ||
      this.params.seed !== prevSeed
    ) {
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
    const px = x ?? this.width * (0.3 + this.stream.next() * 0.4);
    const py = y ?? this.height * (0.3 + this.stream.next() * 0.4);
    this.pulses.push({
      x: px,
      y: py,
      radius: 5,
      maxRadius: Math.min(this.width, this.height) * 0.45,
      alpha: 0.85,
      speed: 4.5 * this.params.flowSpeed,
    });
    if (this.pulses.length > 8) {
      this.pulses.shift();
    }
  }

  public getActivePalette(): SubstratePaletteConfig {
    const base = SUBSTRATE_PALETTES[this.params.palette] || SUBSTRATE_PALETTES.ambar;
    if (this.params.customColor) {
      return {
        ...base,
        primaryHex: this.params.customColor,
        secondaryHex: this.params.customColor,
        glowHex: this.params.customColor,
      };
    }
    return base;
  }

  public resetSimulation(): void {
    this.tickCount = 0;
    this.pulses = [];
    this.initParticles();
    const palette = this.getActivePalette();
    this.ctx.fillStyle = palette.bgHex;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  public getStats(): {
    tick: number;
    organismCount: number;
    width: number;
    height: number;
    frameCostMs: number;
    qualityTier: number;
  } {
    let count = this.particles.length;
    if (this.params.motor === 'obrera_zangano') {
      count = this.bees.length + this.botanicals.length;
    } else if (this.params.motor === 'hueco_bosque') {
      count = this.dustMotes.length;
    } else if (this.params.motor === 'radar_constelacion') {
      count = this.radarAxes.length + this.particles.length;
    } else if (this.params.motor === 'floracion_bosque') {
      count = this.blossoms.length + this.fallingPetals.length;
    } else if (this.params.motor === 'cristalizacion_miel') {
      count = this.crystalFlakes.length + this.particles.length;
    } else if (this.params.motor === 'alambique_hidromiel') {
      count = this.bubbles.length;
    } else if (this.params.motor === 'reologia_miel') {
      count = this.honeyDrops.length + this.particles.length;
    } else if (this.params.motor === 'geometria_panal') {
      count = this.hexCells.length;
    }

    return {
      tick: this.tickCount,
      organismCount: count,
      width: this.width,
      height: this.height,
      frameCostMs: this.frameCostMs,
      qualityTier: this.qualityTier,
    };
  }

  private initParticles(): void {
    this.particles = [];
    this.bees = [];
    this.botanicals = [];
    this.dustMotes = [];
    this.honeyDrops = [];
    this.hexCells = [];
    this.radarAxes = [];
    this.blossoms = [];
    this.fallingPetals = [];
    this.crystalFlakes = [];
    this.bubbles = [];

    const count = Math.floor(this.params.populationDensity * this.densityFactor());
    if (count <= 0) return;

    // 1. Partículas base distribuidas con distancia mínima
    const minDistance = Math.max(18, Math.sqrt((this.width * this.height) / count) * 0.55);
    const positions = distributeParticles(
      this.width,
      this.height,
      count,
      minDistance,
      this.stream,
    );

    for (let i = 0; i < count; i++) {
      const radius = 2 + this.stream.next() * 6;
      const position = positions[i];
      this.particles.push({
        x: position.x,
        y: position.y,
        vx: (this.stream.next() - 0.5) * 2,
        vy: (this.stream.next() - 0.5) * 2,
        radius,
        baseRadius: radius,
        phase: this.stream.next() * Math.PI * 2,
        energy: 0.5 + this.stream.next() * 0.5,
        life: this.stream.next() * 400,
        maxLife: 300 + this.stream.next() * 300,
        history: [],
      });
    }

    // 2. Abejas & Ingredientes Botánicos (Obrera & Zángano / Enjambre)
    if (this.params.motor === 'obrera_zangano' || this.params.motor === 'enjambre_flujo') {
      const beeCount = Math.max(16, Math.min(48, Math.floor(count * 0.28)));
      for (let i = 0; i < beeCount; i++) {
        const isDrone = this.stream.next() < 0.24;
        this.bees.push({
          x: this.stream.next() * this.width,
          y: this.stream.next() * this.height,
          vx: (this.stream.next() - 0.5) * 2.2,
          vy: (this.stream.next() - 0.5) * 2.2,
          size: isDrone ? 4.2 + this.stream.next() * 2.2 : 2.5 + this.stream.next() * 1.6,
          wingAngle: this.stream.next() * Math.PI * 2,
          wingSpeed: isDrone ? 0.24 + this.stream.next() * 0.12 : 0.36 + this.stream.next() * 0.18,
          opacity: 0.85 + this.stream.next() * 0.15,
          angle: 0,
          isDrone,
        });
      }

      const botCount = Math.max(22, Math.min(65, Math.floor(count * 0.42)));
      const pollenColors = ['#e8c98a', '#d4a574', '#a07830', '#6b5420', '#4a5d3a'];
      for (let i = 0; i < botCount; i++) {
        const roll = this.stream.next();
        let type: 'pollen' | 'amber' | 'cacao' | 'hazelnut' = 'pollen';
        let size = 2.5 + this.stream.next() * 3.5;
        let color = pollenColors[Math.floor(this.stream.next() * pollenColors.length)];
        let bumps: Array<{ x: number; y: number; r: number }> | undefined;
        let points: Array<{ x: number; y: number }> | undefined;

        if (roll < 0.48) {
          type = 'pollen';
          size = 2.5 + this.stream.next() * 3.5;
          const numBumps = Math.floor(this.stream.next() * 3) + 4;
          bumps = [];
          for (let b = 0; b < numBumps; b++) {
            const angle = ((Math.PI * 2) / numBumps) * b;
            const dist = size * 0.45;
            bumps.push({
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              r: size * 0.55,
            });
          }
        } else if (roll < 0.74) {
          type = 'amber';
          size = 4.5 + this.stream.next() * 6.5;
          const numPts = Math.floor(this.stream.next() * 3) + 5;
          points = [];
          for (let p = 0; p < numPts; p++) {
            const angle = ((Math.PI * 2) / numPts) * p;
            const rad = size * (0.7 + this.stream.next() * 0.35);
            points.push({ x: Math.cos(angle) * rad, y: Math.sin(angle) * rad });
          }
        } else if (roll < 0.88) {
          type = 'cacao';
          size = 3.5 + this.stream.next() * 4.0;
          color = '#261711';
          const numPts = Math.floor(this.stream.next() * 4) + 5;
          points = [];
          for (let p = 0; p < numPts; p++) {
            const angle = ((Math.PI * 2) / numPts) * p;
            const rad = size * (0.65 + this.stream.next() * 0.35);
            points.push({ x: Math.cos(angle) * rad, y: Math.sin(angle) * rad });
          }
        } else {
          type = 'hazelnut';
          size = 4.0 + this.stream.next() * 4.5;
          color = '#873d1b';
        }

        this.botanicals.push({
          x: this.stream.next() * this.width,
          y: this.stream.next() * this.height,
          vx: (this.stream.next() - 0.5) * 0.35,
          vy: -(0.15 + this.stream.next() * 0.35),
          size,
          rotation: this.stream.next() * Math.PI * 2,
          vrot: (this.stream.next() - 0.5) * 0.02,
          opacity: 0.65 + this.stream.next() * 0.35,
          type,
          color,
          bumps,
          points,
        });
      }
    }

    // 3. Hueco de Bosque & Motas de Polvo y Polen
    if (this.params.motor === 'hueco_bosque') {
      const moteCount = Math.max(140, Math.min(320, Math.floor(count * 1.6)));
      for (let i = 0; i < moteCount; i++) {
        this.dustMotes.push({
          x: this.stream.next() * this.width,
          y: this.stream.next() * this.height,
          vx: (this.stream.next() - 0.5) * 0.6,
          vy: -(0.1 + this.stream.next() * 0.4),
          size: 1.2 + this.stream.next() * 3.8,
          baseAlpha: 0.25 + this.stream.next() * 0.6,
          twinklePhase: this.stream.next() * Math.PI * 2,
          twinkleSpeed: 0.04 + this.stream.next() * 0.08,
        });
      }
    }

    // 4. Constelación Sensorial & Radar
    if (this.params.motor === 'radar_constelacion') {
      const axisLabels = ['FLORAL', 'RESINA', 'BALSÁMICO', 'HUMO', 'ACIDEZ', 'DULZOR', 'MADERA', 'TERROSO'];
      for (let i = 0; i < axisLabels.length; i++) {
        const angle = ((Math.PI * 2) / axisLabels.length) * i - Math.PI / 2;
        const initialVal = 0.45 + this.stream.next() * 0.45;
        this.radarAxes.push({
          label: axisLabels[i],
          angle,
          value: initialVal,
          targetValue: initialVal,
          speed: 0.015 + this.stream.next() * 0.02,
        });
      }
    }

    // 5. Floración & Fenología Austral
    if (this.params.motor === 'floracion_bosque') {
      const flowerCount = Math.max(8, Math.min(18, Math.floor(count * 0.12)));
      for (let i = 0; i < flowerCount; i++) {
        this.blossoms.push({
          x: (0.15 + this.stream.next() * 0.70) * this.width,
          y: (0.15 + this.stream.next() * 0.70) * this.height,
          size: 26 + this.stream.next() * 24,
          petals: 5,
          bloomProgress: 0.6 + this.stream.next() * 0.4,
          rotation: this.stream.next() * Math.PI * 2,
          dewDropSize: 3.5 + this.stream.next() * 3.0,
        });
      }

      const petalCount = Math.max(28, Math.min(65, Math.floor(count * 0.45)));
      for (let i = 0; i < petalCount; i++) {
        this.fallingPetals.push({
          x: this.stream.next() * this.width,
          y: this.stream.next() * this.height,
          vx: (this.stream.next() - 0.5) * 1.2,
          vy: 0.6 + this.stream.next() * 1.4,
          size: 8 + this.stream.next() * 12,
          rotation: this.stream.next() * Math.PI * 2,
          vrot: (this.stream.next() - 0.5) * 0.03,
          wobblePhase: this.stream.next() * Math.PI * 2,
          alpha: 0.65 + this.stream.next() * 0.35,
        });
      }
    }

    // 6. Cristalización & Miel Cremosa
    if (this.params.motor === 'cristalizacion_miel') {
      const flakeCount = Math.max(35, Math.min(90, Math.floor(count * 0.6)));
      for (let i = 0; i < flakeCount; i++) {
        this.crystalFlakes.push({
          x: this.stream.next() * this.width,
          y: this.stream.next() * this.height,
          vx: (this.stream.next() - 0.5) * 0.4,
          vy: 0.3 + this.stream.next() * 0.8,
          size: 4 + this.stream.next() * 11,
          rotation: this.stream.next() * Math.PI * 2,
          vrot: (this.stream.next() - 0.5) * 0.025,
          alpha: 0.5 + this.stream.next() * 0.5,
        });
      }
    }

    // 7. Alambique & Fermentación Silvestre
    if (this.params.motor === 'alambique_hidromiel') {
      const bubbleCount = Math.max(45, Math.min(100, Math.floor(count * 0.7)));
      for (let i = 0; i < bubbleCount; i++) {
        this.bubbles.push({
          x: this.stream.next() * this.width,
          y: this.stream.next() * this.height,
          vy: -(0.8 + this.stream.next() * 2.8),
          radius: 3 + this.stream.next() * 8.5,
          wobblePhase: this.stream.next() * Math.PI * 2,
          alpha: 0.45 + this.stream.next() * 0.55,
        });
      }
    }

    // 8. Reología del Néctar
    if (this.params.motor === 'reologia_miel') {
      const dropCount = Math.max(18, Math.min(36, Math.floor(count * 0.2)));
      for (let i = 0; i < dropCount; i++) {
        this.honeyDrops.push({
          x: (0.1 + this.stream.next() * 0.8) * this.width,
          y: this.stream.next() * this.height,
          vy: 0.8 + this.stream.next() * 2.5,
          radius: 4.5 + this.stream.next() * 7.5,
          stretch: 1.0,
          phase: this.stream.next() * Math.PI * 2,
        });
      }
    }

    // 9. Celdillas Hexagonales para 'geometria_panal'
    if (this.params.motor === 'geometria_panal') {
      const hexRadius = Math.max(34, Math.min(56, this.width * 0.042));
      const dx = hexRadius * 1.5;
      const dy = hexRadius * Math.sqrt(3);
      const cols = Math.ceil(this.width / dx) + 2;
      const rows = Math.ceil(this.height / dy) + 2;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const cx = c * dx;
          const cy = r * dy + (c % 2) * (dy * 0.5);
          this.hexCells.push({
            cx,
            cy,
            radius: hexRadius,
            phase: c * 0.4 + r * 0.3 + this.stream.next() * 0.5,
            fillDepth: 0.3 + this.stream.next() * 0.7,
          });
        }
      }
    }
  }

  private densityFactor(): number {
    if (this.qualityTier >= 2) return 0.55;
    if (this.qualityTier >= 1) return 0.8;
    return 1;
  }

  public step(): void {
    const startedAt = performance.now();
    this.tickCount++;

    if (this.tickCount % IdentitySubstrateSimulation.FIELD_INTERVAL === 0) {
      this.field.update(this.tickCount * 0.016 * this.params.flowSpeed);
    }

    this.updateCamera();
    this.updatePhysics();
    this.render();
    this.trackFrameCost(performance.now() - startedAt);
  }

  private trackFrameCost(costMs: number): void {
    this.frameCostMs = this.frameCostMs === 0 ? costMs : this.frameCostMs * 0.9 + costMs * 0.1;
    const overBudget = this.frameCostMs > IdentitySubstrateSimulation.FRAME_BUDGET_MS;
    const underBudget = this.frameCostMs < IdentitySubstrateSimulation.FRAME_BUDGET_MS * 0.5;

    if (overBudget && this.qualityTier < 2) {
      this.qualityStreak++;
      if (this.qualityStreak >= IdentitySubstrateSimulation.QUALITY_STREAK) {
        this.setQualityTier(this.qualityTier + 1);
      }
    } else if (underBudget && this.qualityTier > 0) {
      this.qualityStreak = 0;
    } else {
      this.qualityStreak = 0;
    }
  }

  private setQualityTier(tier: number): void {
    this.qualityTier = Math.max(0, Math.min(2, tier));
    this.qualityStreak = 0;

    this.field.setOctaves(
      this.qualityTier >= 1 ? Math.max(1, this.params.fieldOctaves - 1) : this.params.fieldOctaves,
    );

    const target = Math.floor(this.params.populationDensity * this.densityFactor());
    if (this.particles.length !== target) {
      this.initParticles();
    }
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

    const focus1X = this.width * 0.50;
    const focus1Y = this.height * 0.48;

    // ── 1. Física de Abejas ────────────────────────────────────────────────
    if (motor === 'obrera_zangano' || motor === 'enjambre_flujo') {
      for (let i = 0; i < this.bees.length; i++) {
        const b = this.bees[i];
        b.vx += (this.streamRespawn.next() - 0.5) * 0.35 * turbulence;
        b.vy += (this.streamRespawn.next() - 0.5) * 0.35 * turbulence;

        const dx = focus1X - b.x;
        const dy = focus1Y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (gravity === 'orbita' && dist > 140) {
          b.vx += (dx / dist) * 0.045 * flowSpeed;
          b.vy += (dy / dist) * 0.045 * flowSpeed;
        } else if (gravity === 'vortice') {
          b.vx += (-dy / dist) * 1.8 * flowSpeed + (dx / dist) * 0.15;
          b.vy += (dx / dist) * 1.8 * flowSpeed + (dy / dist) * 0.15;
        } else if (gravity === 'flujo_laminar') {
          b.vx += 1.4 * flowSpeed;
        }

        if (this.cursor.active) {
          const cdx = this.cursor.x - b.x;
          const cdy = this.cursor.y - b.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
          if (cdist < 320) {
            const force = (320 - cdist) / 320;
            b.vx -= (cdx / cdist) * force * 4.2;
            b.vy -= (cdy / cdist) * force * 4.2;
          }
        }

        if (this.params.fieldInfluence > 0) {
          this.field.sample(b.x, b.y, this.fieldSample);
          b.vx += this.fieldSample.x * this.params.fieldInfluence * 1.2 * flowSpeed;
          b.vy += this.fieldSample.y * this.params.fieldInfluence * 1.2 * flowSpeed;
        }

        b.vx *= 0.982;
        b.vy *= 0.982;

        const maxSpd = (b.isDrone ? 3.0 : 4.4) * flowSpeed;
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (spd > maxSpd) {
          b.vx = (b.vx / spd) * maxSpd;
          b.vy = (b.vy / spd) * maxSpd;
        }

        b.x += b.vx;
        b.y += b.vy;
        b.wingAngle += b.wingSpeed * flowSpeed;
        b.angle = Math.atan2(b.vy, b.vx);

        if (b.x < -80) b.x = this.width + 80;
        if (b.x > this.width + 80) b.x = -80;
        if (b.y < -80) b.y = this.height + 80;
        if (b.y > this.height + 80) b.y = -80;
      }

      for (let i = 0; i < this.botanicals.length; i++) {
        const bot = this.botanicals[i];
        bot.y += bot.vy * flowSpeed;
        bot.x += bot.vx * flowSpeed;
        bot.rotation += bot.vrot * flowSpeed;
        bot.vx *= 0.98;
        if (bot.y < -60) bot.y = this.height + 60;
        if (bot.y > this.height + 60) bot.y = -60;
        if (bot.x < -60) bot.x = this.width + 60;
        if (bot.x > this.width + 60) bot.x = -60;
      }
    }

    // ── 2. Física de Hueco de Bosque ────────────────────────────────────────
    if (motor === 'hueco_bosque') {
      for (let i = 0; i < this.dustMotes.length; i++) {
        const m = this.dustMotes[i];
        m.y += m.vy * flowSpeed;
        m.x += m.vx * flowSpeed;
        m.twinklePhase += m.twinkleSpeed * flowSpeed;
        m.vx *= 0.985;
        if (m.y < -40) m.y = this.height + 40;
        if (m.y > this.height + 40) m.y = -40;
        if (m.x < -40) m.x = this.width + 40;
        if (m.x > this.width + 40) m.x = -40;
      }
    }

    // ── 3. Física de Constelación Sensorial ──────────────────────────────────
    if (motor === 'radar_constelacion') {
      for (let i = 0; i < this.radarAxes.length; i++) {
        const axis = this.radarAxes[i];
        axis.value += (axis.targetValue - axis.value) * axis.speed * flowSpeed;
        if (Math.abs(axis.value - axis.targetValue) < 0.02) {
          axis.targetValue = 0.35 + this.streamRespawn.next() * 0.55;
        }
      }
    }

    // ── 4. Física de Floración & Fenología Austral ──────────────────────────
    if (motor === 'floracion_bosque') {
      for (let i = 0; i < this.blossoms.length; i++) {
        const bl = this.blossoms[i];
        bl.bloomProgress = 0.70 + 0.30 * Math.sin(t * 0.6 + i);
      }
      for (let i = 0; i < this.fallingPetals.length; i++) {
        const p = this.fallingPetals[i];
        p.wobblePhase += 0.04 * flowSpeed;
        p.x += (p.vx + Math.sin(p.wobblePhase) * 1.4) * flowSpeed;
        p.y += p.vy * flowSpeed;
        p.rotation += p.vrot * flowSpeed;
        if (p.y > this.height + 40) {
          p.y = -40;
          p.x = this.streamRespawn.next() * this.width;
        }
      }
    }

    // ── 5. Física de Cristalización & Miel Cremosa ───────────────────────────
    if (motor === 'cristalizacion_miel') {
      for (let i = 0; i < this.crystalFlakes.length; i++) {
        const fl = this.crystalFlakes[i];
        fl.y += fl.vy * flowSpeed;
        fl.x += fl.vx * flowSpeed;
        fl.rotation += fl.vrot * flowSpeed;
        if (fl.y > this.height + 30) {
          fl.y = -30;
          fl.x = this.streamRespawn.next() * this.width;
        }
      }
    }

    // ── 6. Física de Alambique & Fermentación ────────────────────────────────
    if (motor === 'alambique_hidromiel') {
      for (let i = 0; i < this.bubbles.length; i++) {
        const bub = this.bubbles[i];
        bub.wobblePhase += 0.05 * flowSpeed;
        bub.x += Math.sin(bub.wobblePhase) * 0.8 * flowSpeed;
        bub.y += bub.vy * flowSpeed;
        if (bub.y < -30) {
          bub.y = this.height + 30;
          bub.x = this.streamRespawn.next() * this.width;
        }
      }
    }

    // ── 7. Física de Reología de Miel ───────────────────────────────────────
    if (motor === 'reologia_miel') {
      for (let i = 0; i < this.honeyDrops.length; i++) {
        const drop = this.honeyDrops[i];
        drop.vy = Math.min(6.8, drop.vy + 0.12 * flowSpeed);
        drop.y += drop.vy * flowSpeed;
        drop.stretch = 1.0 + (drop.vy / 6.8) * 0.85;

        if (drop.y > this.height * 0.90) {
          drop.y = -40;
          drop.x = (0.12 + this.streamRespawn.next() * 0.76) * this.width;
          drop.vy = 0.8 + this.streamRespawn.next() * 2.0;
          this.triggerPulse(drop.x, this.height * 0.90);
        }
      }
    }

    // ── 8. Física de Geometría de Panal ─────────────────────────────────────
    if (motor === 'geometria_panal') {
      for (let i = 0; i < this.hexCells.length; i++) {
        const cell = this.hexCells[i];
        cell.phase += 0.024 * flowSpeed;
        cell.fillDepth = 0.35 + 0.45 * Math.sin(cell.phase);
      }
    }

    // ── 9. Partículas Generales & Flujo de Campo ────────────────────────────
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life++;
      if (p.life > p.maxLife) {
        p.life = 0;
        p.x = this.streamRespawn.next() * this.width;
        p.y = this.streamRespawn.next() * this.height;
        p.history = [];
      }

      let fx = 0;
      let fy = 0;

      if (motor === 'lidar_fiordos') {
        const topo = Math.sin(p.x * 0.008 + p.y * 0.006 + t);
        fx += Math.cos(topo * Math.PI) * 1.5 * flowSpeed;
        fy += Math.sin(topo * Math.PI) * 1.5 * flowSpeed;
      } else if (motor === 'filigrana_origen') {
        const k = 3.5;
        fx += Math.sin(t * 1.2 + p.phase * k) * 2.0 * flowSpeed;
        fy += Math.cos(t * 0.9 + p.phase * (k + 1)) * 2.0 * flowSpeed;
      } else {
        const wave = Math.sin(p.y * 0.004 + t) * Math.cos(p.x * 0.003 + t * 0.5);
        fx += wave * 1.6 * turbulence;
        fy += (1.0 + Math.sin(p.phase + t) * 0.4) * flowSpeed;
      }

      if (gravity === 'orbita') {
        const dx1 = focus1X - p.x;
        const dy1 = focus1Y - p.y;
        const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) + 1;
        fx += (-dy1 / d1) * 1.4 + (dx1 / (d1 * d1)) * 100;
      } else if (gravity === 'flujo_laminar') {
        fx += 1.6 * flowSpeed;
      } else if (gravity === 'vortice') {
        const dx = focus1X - p.x;
        const dy = focus1Y - p.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 1;
        fx += (-dy / d) * 2.2 + (dx / d) * 0.25;
        fy += (dx / d) * 2.2 + (dy / d) * 0.25;
      }

      const fieldWeight = gravity === 'curl' ? 1 : Math.max(0, Math.min(1, this.params.fieldInfluence));
      if (fieldWeight > 0) {
        this.field.sample(p.x, p.y, this.fieldSample);
        fx += this.fieldSample.x * fieldWeight * 2.4 * flowSpeed;
        fy += this.fieldSample.y * fieldWeight * 2.4 * flowSpeed;
      }

      p.vx = p.vx * 0.92 + fx * 0.12;
      p.vy = p.vy * 0.92 + fy * 0.12;
      p.x += p.vx;
      p.y += p.vy;

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

      if (this.params.layers.particles && this.tickCount % 2 === 0) {
        p.history.push({ x: p.x, y: p.y });
        if (p.history.length > 8) {
          p.history.shift();
        }
      }
    }

    // ── 10. Pulsos Gravitacionales ──────────────────────────────────────────
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
    const palette = this.getActivePalette();

    ctx.save();

    // 1. Fondo & Persistencia
    if (params.transparentBackground) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = Math.min(1.0, Math.max(0.01, params.fadePersistence));
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    } else if (params.motor === 'hueco_bosque') {
      this.renderHuecoCavityBackground(palette);
    } else if (params.motor === 'alambique_hidromiel') {
      this.renderAlambiqueBackground(palette);
    } else {
      ctx.fillStyle = palette.bgHex;
      ctx.globalAlpha = Math.min(1.0, Math.max(0.01, params.fadePersistence));
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Transformación de Cámara
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraOffset.zoom, cameraOffset.zoom);
    ctx.translate(-width / 2 + cameraOffset.x, -height / 2 + cameraOffset.y);

    ctx.globalCompositeOperation = params.blendMode;

    // 3. Capa Hulls / Envolventes y Estructuras de Fondo
    if (params.layers.hulls) {
      this.renderHulls(palette);
    }

    // 4. Capa Sinapsis / Rayos de Luz / Catenarias / Ejes
    if (params.layers.synapses) {
      this.renderSynapses(palette);
    }

    // 5. Capa Pulsos Gravitacionales
    if (params.layers.pulses && this.pulses.length > 0) {
      this.renderPulses(palette);
    }

    // 6. Capa Organismos Vivos, Abejas, Gotas y Flores
    if (params.layers.organisms || params.layers.particles) {
      this.renderOrganisms(palette);
    }

    ctx.restore();

    // 7. Capa de Marca & Sello de Origen Oficial
    if (params.layers.brandSeal) {
      this.renderBrandWatermark(palette);
    }

    ctx.restore();
  }

  // ── FONDOS AMBIENTALES ──────────────────────────────────────────────────────

  private renderHuecoCavityBackground(palette: SubstratePaletteConfig): void {
    const { ctx, width, height } = this;
    const grad = ctx.createRadialGradient(
      width * 0.50,
      height * 0.44,
      width * 0.12,
      width * 0.50,
      height * 0.48,
      Math.max(width, height) * 0.75,
    );
    grad.addColorStop(0, '#060402');
    grad.addColorStop(0.45, '#120A05');
    grad.addColorStop(0.85, '#1F1108');
    grad.addColorStop(1, palette.bgHex);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  private renderAlambiqueBackground(palette: SubstratePaletteConfig): void {
    const { ctx, width, height } = this;
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#080504');
    grad.addColorStop(0.65, '#140A06');
    grad.addColorStop(1, '#2E1107'); // Calor cobrizo en la base

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // ── RENDER: Hulls / Envolventes de Fondo ─────────────────────────────────────

  private renderHulls(palette: SubstratePaletteConfig): void {
    const { ctx, width, height, params } = this;
    const lum = params.luminance;
    const cx = width * 0.50;
    const cy = height * 0.46;

    ctx.save();

    if (params.motor === 'obrera_zangano') {
      if (this.bees.length > 0) {
        ctx.globalAlpha = 0.08 * lum;
        for (let i = 0; i < Math.min(this.bees.length, 5); i++) {
          const b = this.bees[i];
          const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 220);
          grad.addColorStop(0, palette.glowHex);
          grad.addColorStop(0.5, palette.secondaryHex);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 220, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (params.motor === 'hueco_bosque') {
      ctx.lineWidth = 1.2;
      for (let r = 80; r < Math.max(width, height) * 0.8; r += 42) {
        ctx.strokeStyle = palette.primaryHex;
        ctx.globalAlpha = 0.06 * lum;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.2) {
          const waviness = Math.sin(a * 6 + r * 0.02) * 5;
          const px = cx + Math.cos(a) * (r + waviness);
          const py = cy + Math.sin(a) * (r * 1.15 + waviness);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    } else if (params.motor === 'radar_constelacion') {
      // Octógonos concéntricos de calibración sensorial (25%, 50%, 75%, 100%)
      const rMax = Math.min(width, height) * 0.36;
      const levels = [0.25, 0.50, 0.75, 1.0];
      ctx.strokeStyle = palette.primaryHex;
      ctx.lineWidth = 1.0;

      for (const lvl of levels) {
        ctx.globalAlpha = (lvl === 1.0 ? 0.35 : 0.14) * lum;
        ctx.beginPath();
        for (let i = 0; i < this.radarAxes.length; i++) {
          const r = rMax * lvl;
          const ax = cx + Math.cos(this.radarAxes[i].angle) * r;
          const ay = cy + Math.sin(this.radarAxes[i].angle) * r;
          if (i === 0) ctx.moveTo(ax, ay);
          else ctx.lineTo(ax, ay);
        }
        ctx.closePath();
        ctx.stroke();
      }
    } else if (params.motor === 'cristalizacion_miel') {
      // Manto aterciopelado de miel cremosa hilada en frío
      const grad = ctx.createRadialGradient(cx, cy, 50, cx, cy, width * 0.55);
      grad.addColorStop(0, 'rgba(255, 234, 167, 0.12)');
      grad.addColorStop(0.6, 'rgba(214, 170, 92, 0.06)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (params.motor === 'floracion_bosque') {
      // Follaje y siluetas suaves del dosel en el fondo
      ctx.fillStyle = '#223826';
      ctx.globalAlpha = 0.10 * lum;
      for (let i = 0; i < 6; i++) {
        const fx = (i / 5) * width;
        ctx.beginPath();
        ctx.arc(fx, height * 0.95, 140, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (params.motor === 'alambique_hidromiel') {
      // Pátina de alambique de cobre en el fondo
      const potY = height * 0.88;
      ctx.fillStyle = 'rgba(217, 119, 87, 0.18)';
      ctx.beginPath();
      ctx.ellipse(cx, potY, width * 0.42, 60, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (params.motor === 'geometria_panal') {
      ctx.strokeStyle = palette.primaryHex;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.18 * lum;
      for (let i = 0; i < this.hexCells.length; i++) {
        const cell = this.hexCells[i];
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const angle = (Math.PI / 3) * s;
          const hx = cell.cx + Math.cos(angle) * cell.radius;
          const hy = cell.cy + Math.sin(angle) * cell.radius;
          if (s === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    } else if (params.motor === 'reologia_miel') {
      const poolY = height * 0.86;
      const grad = ctx.createLinearGradient(0, poolY, 0, height);
      grad.addColorStop(0, 'rgba(214, 170, 92, 0.15)');
      grad.addColorStop(1, 'rgba(120, 60, 10, 0.45)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, poolY);
      ctx.bezierCurveTo(width * 0.35, poolY + 20, width * 0.65, poolY - 15, width, poolY + 10);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    } else if (params.motor === 'lidar_fiordos') {
      ctx.strokeStyle = palette.secondaryHex;
      ctx.lineWidth = 1.0;
      ctx.globalAlpha = 0.12 * lum;
      for (let y = 0; y < height; y += 70) {
        ctx.beginPath();
        for (let x = 0; x < width; x += 30) {
          const wave = Math.sin(x * 0.005 + y * 0.01) * 25;
          if (x === 0) ctx.moveTo(x, y + wave);
          else ctx.lineTo(x, y + wave);
        }
        ctx.stroke();
      }
    } else {
      ctx.globalAlpha = 0.08 * lum;
      ctx.fillStyle = palette.secondaryHex;
      for (let i = 0; i < this.particles.length; i += 18) {
        const p = this.particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 45, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // ── RENDER: Sinapsis & Rayos Volumétricos ────────────────────────────────────

  private renderSynapses(palette: SubstratePaletteConfig): void {
    const { ctx, width, height, params } = this;
    const lum = params.luminance;
    const cx = width * 0.50;
    const cy = height * 0.46;

    ctx.save();

    if (params.motor === 'hueco_bosque') {
      const rayOriginX = width * 0.54;
      const rayOriginY = -40;
      const rayGrad = ctx.createLinearGradient(rayOriginX, rayOriginY, width * 0.46, height);
      rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      rayGrad.addColorStop(0.35, 'rgba(235, 185, 95, 0.22)');
      rayGrad.addColorStop(0.75, 'rgba(214, 165, 95, 0.08)');
      rayGrad.addColorStop(1, 'rgba(214, 165, 95, 0)');

      ctx.fillStyle = rayGrad;
      ctx.globalAlpha = 0.85 * lum;
      ctx.beginPath();
      ctx.moveTo(rayOriginX - 45, rayOriginY);
      ctx.lineTo(rayOriginX + 65, rayOriginY);
      ctx.lineTo(width * 0.82, height);
      ctx.lineTo(width * 0.16, height);
      ctx.closePath();
      ctx.fill();
    } else if (params.motor === 'radar_constelacion') {
      // Ejes radiales de las 8 notas sensoriales
      const rMax = Math.min(width, height) * 0.36;
      ctx.strokeStyle = palette.primaryHex;
      ctx.lineWidth = 1.0;
      ctx.globalAlpha = 0.25 * lum;

      for (let i = 0; i < this.radarAxes.length; i++) {
        const axis = this.radarAxes[i];
        const ax = cx + Math.cos(axis.angle) * rMax;
        const ay = cy + Math.sin(axis.angle) * rMax;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ax, ay);
        ctx.stroke();

        // Etiquetas sensoriales
        ctx.save();
        ctx.font = '500 11px ui-monospace, monospace';
        ctx.fillStyle = palette.primaryHex;
        ctx.globalAlpha = 0.80 * lum;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelDist = rMax + 24;
        const lx = cx + Math.cos(axis.angle) * labelDist;
        const ly = cy + Math.sin(axis.angle) * labelDist;
        ctx.fillText(axis.label, lx, ly);
        ctx.restore();
      }
    } else if (params.motor === 'cristalizacion_miel') {
      // Agujas fractales de cristalización
      ctx.strokeStyle = palette.glowHex;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < this.particles.length; i += 6) {
        const p = this.particles[i];
        ctx.globalAlpha = 0.32 * lum;
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const ang = (Math.PI / 3) * a;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + Math.cos(ang) * 28, p.y + Math.sin(ang) * 28);
        }
        ctx.stroke();
      }
    } else if (params.motor === 'alambique_hidromiel') {
      // Vapores aromáticos ascendentes
      ctx.strokeStyle = 'rgba(255, 230, 180, 0.18)';
      ctx.lineWidth = 2.0;
      for (let i = 0; i < 5; i++) {
        const vx = (i + 1) * (width / 6);
        ctx.beginPath();
        ctx.moveTo(vx, height * 0.90);
        ctx.bezierCurveTo(
          vx + Math.sin(this.tickCount * 0.03 + i) * 40,
          height * 0.55,
          vx - Math.sin(this.tickCount * 0.03 + i) * 40,
          height * 0.30,
          vx,
          height * 0.05,
        );
        ctx.stroke();
      }
    } else if (params.motor === 'reologia_miel') {
      ctx.strokeStyle = palette.primaryHex;
      ctx.lineWidth = 1.6;
      for (let i = 0; i < this.honeyDrops.length; i += 2) {
        const d = this.honeyDrops[i];
        ctx.globalAlpha = 0.22 * lum;
        ctx.beginPath();
        ctx.moveTo(d.x, 0);
        ctx.quadraticCurveTo(d.x + Math.sin(d.phase) * 15, d.y * 0.5, d.x, d.y);
        ctx.stroke();
      }
    } else {
      const maxDist = 110;
      const maxDistSq = maxDist * maxDist;
      ctx.lineWidth = 1.0;
      for (let i = 0; i < this.particles.length; i++) {
        const p1 = this.particles[i];
        for (let j = i + 1; j < Math.min(this.particles.length, i + 12); j++) {
          const p2 = this.particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            ctx.strokeStyle = palette.primaryHex;
            ctx.globalAlpha = (1 - dist / maxDist) * 0.22 * lum;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
    }

    ctx.restore();
  }

  // ── RENDER: Pulsos Gravitacionales ──────────────────────────────────────────

  private renderPulses(palette: SubstratePaletteConfig): void {
    const { ctx } = this;
    ctx.save();
    for (const pulse of this.pulses) {
      ctx.strokeStyle = palette.glowHex;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = pulse.alpha * 0.65;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (pulse.radius > 20) {
        ctx.lineWidth = 0.75;
        ctx.globalAlpha = pulse.alpha * 0.3;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.radius * 0.72, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ── RENDER: Organismos y Efectos de Cada Motor ──────────────────────────────

  private renderOrganisms(palette: SubstratePaletteConfig): void {
    const { ctx, width, height, params } = this;
    const lum = params.luminance;
    const cx = width * 0.50;
    const cy = height * 0.46;

    ctx.save();

    // ── A. MOTOR: OBRERA Y ZÁNGANO ─────────────────────────────────────────
    if (params.motor === 'obrera_zangano' || params.motor === 'enjambre_flujo') {
      if (params.layers.particles) {
        for (let i = 0; i < this.botanicals.length; i++) {
          const b = this.botanicals[i];
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(b.rotation);
          ctx.globalAlpha = b.opacity * lum;

          if (b.type === 'pollen') {
            if (this.darkShadow) {
              const s = b.size * 2.8;
              ctx.drawImage(this.darkShadow, -s * 0.5, -s * 0.5, s, s);
            }
            ctx.fillStyle = b.color;
            ctx.beginPath();
            if (b.bumps) {
              for (const bump of b.bumps) {
                ctx.moveTo(bump.x + bump.r, bump.y);
                ctx.arc(bump.x, bump.y, bump.r, 0, Math.PI * 2);
              }
            } else {
              ctx.arc(0, 0, b.size, 0, Math.PI * 2);
            }
            ctx.fill();

            ctx.globalAlpha = b.opacity * 0.45 * lum;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-b.size * 0.25, -b.size * 0.25, b.size * 0.35, 0, Math.PI * 2);
            ctx.fill();
          } else if (b.type === 'amber') {
            if (this.goldGlow) {
              const s = b.size * 3.8;
              ctx.drawImage(this.goldGlow, -s * 0.5, -s * 0.5, s, s);
            }
            const amberGrad = ctx.createRadialGradient(-b.size * 0.2, -b.size * 0.2, 0, 0, 0, b.size);
            amberGrad.addColorStop(0, '#FFE082');
            amberGrad.addColorStop(1, '#A05206');
            ctx.fillStyle = amberGrad;
            if (b.points && b.points.length > 0) {
              ctx.beginPath();
              ctx.moveTo(b.points[0].x, b.points[0].y);
              for (let p = 1; p < b.points.length; p++) {
                ctx.lineTo(b.points[p].x, b.points[p].y);
              }
              ctx.closePath();
              ctx.fill();
            }
          } else if (b.type === 'cacao') {
            ctx.fillStyle = '#22140D';
            if (b.points && b.points.length > 0) {
              ctx.beginPath();
              ctx.moveTo(b.points[0].x, b.points[0].y);
              for (let p = 1; p < b.points.length; p++) {
                ctx.lineTo(b.points[p].x, b.points[p].y);
              }
              ctx.closePath();
              ctx.fill();
            }
          } else {
            const nutGrad = ctx.createRadialGradient(0, b.size * 0.2, 0, 0, 0, b.size);
            nutGrad.addColorStop(0, '#3E1704');
            nutGrad.addColorStop(1, '#B05527');
            ctx.fillStyle = nutGrad;
            ctx.beginPath();
            ctx.arc(0, 0, b.size, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      if (params.layers.organisms) {
        for (let i = 0; i < this.bees.length; i++) {
          const bee = this.bees[i];
          ctx.save();
          ctx.translate(bee.x, bee.y);
          ctx.rotate(bee.angle);
          ctx.globalAlpha = bee.opacity * lum;

          if (this.darkShadow) {
            const shw = bee.size * 4.2;
            ctx.drawImage(this.darkShadow, -shw * 0.35, -shw * 0.35, shw, shw);
          }

          if (this.goldGlow) {
            const gw = bee.size * (bee.isDrone ? 8.5 : 7.0);
            const gh = bee.size * (bee.isDrone ? 6.5 : 5.0);
            ctx.drawImage(this.goldGlow, -gw * 0.5, -gh * 0.5, gw, gh);
          }

          ctx.fillStyle = bee.isDrone ? '#1A0F0A' : '#2B1D14';
          ctx.beginPath();
          ctx.ellipse(0, 0, bee.size * 2.5, bee.size * (bee.isDrone ? 1.35 : 1.0), 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = palette.primaryHex;
          ctx.globalAlpha = bee.opacity * 0.9 * lum;
          for (let s = -1; s <= 1; s++) {
            ctx.beginPath();
            ctx.rect(
              s * bee.size * 0.8,
              -bee.size * (bee.isDrone ? 1.0 : 0.8),
              bee.size * 0.45,
              bee.size * (bee.isDrone ? 2.0 : 1.6),
            );
            ctx.fill();
          }

          ctx.globalAlpha = bee.opacity * 0.35 * lum;
          ctx.fillStyle = '#F5F0E8';
          const flap = Math.sin(bee.wingAngle) * (bee.isDrone ? 0.28 : 0.4);

          const rot1 = -0.52 + flap;
          ctx.rotate(rot1);
          ctx.beginPath();
          ctx.ellipse(-bee.size * 0.8, -bee.size * 1.6, bee.size * 2.2, bee.size * 0.85, 0.35, 0, Math.PI * 2);
          ctx.fill();

          const rot2 = 0.52 - flap;
          ctx.rotate(rot2 - rot1);
          ctx.beginPath();
          ctx.ellipse(-bee.size * 0.8, bee.size * 1.6, bee.size * 2.2, bee.size * 0.85, -0.35, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
    }

    // ── B. MOTOR: HUECO DEL BOSQUE & LUZ DE COPA ────────────────────────────
    else if (params.motor === 'hueco_bosque') {
      if (params.layers.particles) {
        for (let i = 0; i < this.dustMotes.length; i++) {
          const m = this.dustMotes[i];
          const coneLeft = this.width * 0.22 + (m.y / this.height) * (this.width * -0.06);
          const coneRight = this.width * 0.65 + (m.y / this.height) * (this.width * 0.17);
          const inBeam = m.x >= coneLeft && m.x <= coneRight;

          const twinkle = 0.5 + 0.5 * Math.sin(m.twinklePhase);
          const alpha = inBeam ? Math.min(1.0, (m.baseAlpha + 0.45) * lum) : m.baseAlpha * 0.35 * lum;

          ctx.save();
          ctx.globalAlpha = alpha;

          if (inBeam && this.goldGlow) {
            const glowSz = m.size * 6.5 * (1 + twinkle * 0.5);
            ctx.drawImage(this.goldGlow, m.x - glowSz * 0.5, m.y - glowSz * 0.5, glowSz, glowSz);
          }

          ctx.fillStyle = inBeam ? '#FFF9DB' : palette.primaryHex;
          ctx.beginPath();
          ctx.arc(m.x, m.y, inBeam ? m.size * (1 + twinkle * 0.4) : m.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // ── C. MOTOR: CONSTELACIÓN SENSORIAL & RADAR ────────────────────────────
    else if (params.motor === 'radar_constelacion') {
      const rMax = Math.min(width, height) * 0.36;

      // 1. Polígono Sensorial Vivo (Relleno Ámbar & Trazo)
      if (params.layers.organisms && this.radarAxes.length > 0) {
        const polyPoints: Array<{ x: number; y: number }> = [];
        for (let i = 0; i < this.radarAxes.length; i++) {
          const axis = this.radarAxes[i];
          const r = rMax * axis.value;
          polyPoints.push({
            x: cx + Math.cos(axis.angle) * r,
            y: cy + Math.sin(axis.angle) * r,
          });
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(polyPoints[0].x, polyPoints[0].y);
        for (let i = 1; i < polyPoints.length; i++) {
          ctx.lineTo(polyPoints[i].x, polyPoints[i].y);
        }
        ctx.closePath();

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rMax);
        grad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        grad.addColorStop(0.7, 'rgba(214, 170, 92, 0.25)');
        grad.addColorStop(1, 'rgba(214, 170, 92, 0.05)');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.85 * lum;
        ctx.fill();

        ctx.strokeStyle = palette.primaryHex;
        ctx.lineWidth = 2.4;
        ctx.globalAlpha = 0.95 * lum;
        ctx.stroke();
        ctx.restore();

        // 2. Estrellas Nodriza en los vértices del polígono
        for (let i = 0; i < polyPoints.length; i++) {
          const pt = polyPoints[i];
          ctx.save();
          if (this.goldGlow) {
            ctx.drawImage(this.goldGlow, pt.x - 24, pt.y - 24, 48, 48);
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // ── D. MOTOR: FLORACIÓN & FENOLOGÍA AUSTRAL ──────────────────────────────
    else if (params.motor === 'floracion_bosque') {
      // 1. Flores de Ulmo y Tiaca floreciendo
      if (params.layers.organisms) {
        for (let i = 0; i < this.blossoms.length; i++) {
          const bl = this.blossoms[i];
          ctx.save();
          ctx.translate(bl.x, bl.y);
          ctx.rotate(bl.rotation);

          const curSize = bl.size * bl.bloomProgress;

          // 5 Pétalos redondeados
          for (let p = 0; p < 5; p++) {
            const pAngle = ((Math.PI * 2) / 5) * p;
            ctx.save();
            ctx.rotate(pAngle);
            ctx.fillStyle = '#FAF7EE';
            ctx.globalAlpha = 0.85 * lum;
            ctx.beginPath();
            ctx.ellipse(0, curSize * 0.7, curSize * 0.45, curSize * 0.65, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Centro ámbar & estambres dorados
          ctx.fillStyle = palette.primaryHex;
          ctx.globalAlpha = 0.95 * lum;
          ctx.beginPath();
          ctx.arc(0, 0, curSize * 0.35, 0, Math.PI * 2);
          ctx.fill();

          // Gota de rocío brillante en el cáliz
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = 0.85 * lum;
          ctx.beginPath();
          ctx.arc(-curSize * 0.08, -curSize * 0.08, bl.dewDropSize, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // 2. Pétalos cayendo al viento
      if (params.layers.particles) {
        for (let i = 0; i < this.fallingPetals.length; i++) {
          const pet = this.fallingPetals[i];
          ctx.save();
          ctx.translate(pet.x, pet.y);
          ctx.rotate(pet.rotation);
          ctx.globalAlpha = pet.alpha * 0.75 * lum;
          ctx.fillStyle = '#F5F0E6';
          ctx.beginPath();
          ctx.ellipse(0, 0, pet.size, pet.size * 0.6, 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // ── E. MOTOR: CRISTALIZACIÓN & MIEL CREMOSA ──────────────────────────────
    else if (params.motor === 'cristalizacion_miel') {
      if (params.layers.particles) {
        for (let i = 0; i < this.crystalFlakes.length; i++) {
          const fl = this.crystalFlakes[i];
          ctx.save();
          ctx.translate(fl.x, fl.y);
          ctx.rotate(fl.rotation);
          ctx.globalAlpha = fl.alpha * lum;

          if (this.goldGlow) {
            ctx.drawImage(this.goldGlow, -fl.size * 1.5, -fl.size * 1.5, fl.size * 3, fl.size * 3);
          }

          // Aguja / Diamante cristalino
          ctx.fillStyle = '#FFFDE8';
          ctx.beginPath();
          ctx.moveTo(0, -fl.size);
          ctx.lineTo(fl.size * 0.4, 0);
          ctx.lineTo(0, fl.size);
          ctx.lineTo(-fl.size * 0.4, 0);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
      }
    }

    // ── F. MOTOR: ALAMBIQUE & FERMENTACIÓN SILVESTRE ─────────────────────────
    else if (params.motor === 'alambique_hidromiel') {
      if (params.layers.organisms) {
        for (let i = 0; i < this.bubbles.length; i++) {
          const bub = this.bubbles[i];
          ctx.save();
          ctx.translate(bub.x, bub.y);
          ctx.globalAlpha = bub.alpha * lum;

          if (this.goldGlow && bub.radius > 5) {
            ctx.drawImage(this.goldGlow, -bub.radius * 2, -bub.radius * 2, bub.radius * 4, bub.radius * 4);
          }

          // Burbuja dorada efervescente
          ctx.strokeStyle = '#FAD390';
          ctx.lineWidth = 1.2;
          ctx.fillStyle = 'rgba(214, 165, 95, 0.25)';
          ctx.beginPath();
          ctx.arc(0, 0, bub.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Reflejo curvo blanco
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(-bub.radius * 0.35, -bub.radius * 0.35, bub.radius * 0.25, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
    }

    // ── G. MOTOR: REOLOGÍA DEL NÉCTAR ───────────────────────────────────────
    else if (params.motor === 'reologia_miel') {
      if (params.layers.organisms) {
        for (let i = 0; i < this.honeyDrops.length; i++) {
          const d = this.honeyDrops[i];
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.globalAlpha = 0.9 * lum;

          const rx = d.radius;
          const ry = d.radius * d.stretch;
          const grad = ctx.createRadialGradient(-rx * 0.2, -ry * 0.3, 0, 0, 0, ry);
          grad.addColorStop(0, '#FFEAA7');
          grad.addColorStop(0.45, palette.primaryHex);
          grad.addColorStop(1, '#8C460A');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(0, -ry * 1.2);
          ctx.bezierCurveTo(rx * 1.1, -ry * 0.3, rx * 1.2, ry * 0.9, 0, ry);
          ctx.bezierCurveTo(-rx * 1.2, ry * 0.9, -rx * 1.1, -ry * 0.3, 0, -ry * 1.2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = 0.65 * lum;
          ctx.beginPath();
          ctx.ellipse(-rx * 0.35, -ry * 0.25, rx * 0.28, ry * 0.4, -0.3, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
    }

    // ── H. MOTOR: GEOMETRÍA DE PANAL ────────────────────────────────────────
    else if (params.motor === 'geometria_panal') {
      if (params.layers.organisms) {
        for (let i = 0; i < this.hexCells.length; i++) {
          const cell = this.hexCells[i];
          ctx.save();
          ctx.translate(cell.cx, cell.cy);
          ctx.globalAlpha = cell.fillDepth * 0.6 * lum;

          const honeyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, cell.radius * 0.9);
          honeyGrad.addColorStop(0, palette.glowHex);
          honeyGrad.addColorStop(0.7, palette.primaryHex);
          honeyGrad.addColorStop(1, 'rgba(140, 70, 10, 0.4)');

          ctx.fillStyle = honeyGrad;
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const angle = (Math.PI / 3) * s;
            const hx = Math.cos(angle) * (cell.radius * 0.88);
            const hy = Math.sin(angle) * (cell.radius * 0.88);
            if (s === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // ── I. MOTORES GENERALES: PARTÍCULAS Y ESTELAS ──────────────────────────
    else {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const pulseSize = Math.sin(p.phase + this.tickCount * 0.05) * 1.5;
        const currentRadius = Math.max(1, p.baseRadius + pulseSize);

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

        if (params.layers.organisms) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius * 2.8);
          grad.addColorStop(0, palette.glowHex);
          grad.addColorStop(0.4, palette.primaryHex);
          grad.addColorStop(1, 'transparent');

          ctx.fillStyle = grad;
          ctx.globalAlpha = 0.55 * lum;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius * 2.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = palette.primaryHex;
          ctx.globalAlpha = 0.9 * lum;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  // ── RENDER: Sello de Origen & Trazabilidad ───────────────────────────────────

  private renderBrandWatermark(palette: SubstratePaletteConfig): void {
    const { ctx, width, height, brandText } = this;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    ctx.strokeStyle = palette.primaryHex;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;

    const cornerMargin = 48;
    const cornerLength = 24;

    ctx.beginPath();
    ctx.moveTo(cornerMargin, cornerMargin + cornerLength);
    ctx.lineTo(cornerMargin, cornerMargin);
    ctx.lineTo(cornerMargin + cornerLength, cornerMargin);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - cornerMargin - cornerLength, cornerMargin);
    ctx.lineTo(width - cornerMargin, cornerMargin);
    ctx.lineTo(width - cornerMargin, cornerMargin + cornerLength);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cornerMargin, height - cornerMargin - cornerLength);
    ctx.lineTo(cornerMargin, height - cornerMargin);
    ctx.lineTo(cornerMargin + cornerLength, height - cornerMargin);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - cornerMargin - cornerLength, height - cornerMargin);
    ctx.lineTo(width - cornerMargin, height - cornerMargin);
    ctx.lineTo(width - cornerMargin, height - cornerMargin - cornerLength);
    ctx.stroke();

    ctx.font = '500 13px ui-monospace, "JetBrains Mono", monospace';
    ctx.fillStyle = palette.primaryHex;
    ctx.globalAlpha = 0.85;
    ctx.textAlign = 'left';
    ctx.fillText(brandText.kicker, cornerMargin + 16, cornerMargin + 18);

    ctx.textAlign = 'right';
    ctx.fillText(brandText.batchCode, width - cornerMargin - 16, cornerMargin + 18);

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
