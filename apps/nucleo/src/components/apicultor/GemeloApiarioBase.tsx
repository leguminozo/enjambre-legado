'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import { useRef, useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import * as THREE from 'three';
import { Eye, EyeOff, Layers, RotateCcw, AlertTriangle } from 'lucide-react';
import type { ColmenaWithRelations } from '@/lib/apicultor-types';
import { fetchPronostico } from '@/lib/meteo';
import {
  buildApiaryState,
  type HiveState,
  type TerritorialAlertInput,
  RISK_COLORS,
  type RiskLevel,
} from '@/lib/hive-state';
import { cn } from '@/lib/cn';

// ─── Paleta de materiales hiperrealistas Langstroth ──────────────────────────
const MADERA_CRIA = '#784e2d'; // Madera nativa de Chiloé (tostada / alerce)
const MADERA_ALZA = '#8a5c37'; // Madera alza melaria
const MADERA_PISO = '#593a22'; // Madera base y bancal
const ZINC_TECHO = '#8e9699'; // Chapa de zinc galvanizado reflectante
const RENDIJA_NEGRA = '#141414'; // Piquera interior oscura
const SUELO_BOSQUE = '#111a13'; // Humus y musgo húmedo de Chiloé
const TARIMA_MADERA = '#3a2b1f'; // Tarima de tablones rústicos

type HudMode = 'detailed' | 'compact' | 'focus';

// ─── Enjambre de abejas activas (Partículas de pecoreo) ────────────────────
function AbejasPecoreando({ active, count = 10 }: { active: boolean; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const [positions, offsets] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const offs = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.45;
      pos[i * 3 + 1] = 0.2 + Math.random() * 0.35;
      pos[i * 3 + 2] = 0.45 + Math.random() * 0.35;
      offs[i] = Math.random() * Math.PI * 2;
    }
    return [pos, offs];
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current || !active) return;
    const t = clock.elapsedTime * 2.8;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const o = offsets[i] ?? 0;
      arr[idx] = (Math.sin(t + o) * 0.18) + (Math.cos(t * 0.5 + o) * 0.08);
      arr[idx + 1] = 0.22 + Math.sin(t * 1.5 + o) * 0.12;
      arr[idx + 2] = 0.52 + Math.cos(t + o) * 0.18;
    }
    posAttr.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#f6be48"
        transparent
        opacity={0.88}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── HUD Flotante de Telemetría sobre la Colmena ────────────────────────────
interface ColmenaHudProps {
  state: HiveState;
  selected: boolean;
  hovered: boolean;
  mode: HudMode;
  hudY: number;
  onSelect: () => void;
}

function ColmenaHud({ state, selected, hovered, mode, hudY, onSelect }: ColmenaHudProps) {
  const isVisible =
    mode === 'detailed' ||
    (mode === 'compact' && !selected) ||
    hovered ||
    selected;

  if (!isVisible && mode === 'focus') return null;

  const trendSymbol =
    state.weightTrend === 'up' ? '↑' : state.weightTrend === 'down' ? '↓' : '→';
  const showFullMetrics = mode === 'detailed' || hovered || selected;

  const alzaLabel =
    state.alzas === 0
      ? 'Cámara de cría'
      : `${state.alzas} ${state.alzas === 1 ? 'alza' : 'alzas'}`;

  return (
    <Html
      position={[0, hudY, 0]}
      center
      distanceFactor={7.5}
      className="pointer-events-auto select-none"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={cn(
          'transition-all duration-300 rounded-xl p-2.5 backdrop-blur-md cursor-pointer border shadow-2xl min-w-[170px] max-w-[230px]',
          selected
            ? 'bg-card/95 border-accent ring-2 ring-accent/40 shadow-accent/20 scale-105'
            : hovered
              ? 'bg-card/90 border-accent/70 scale-102'
              : 'bg-card/85 border-border/70 hover:border-accent/50',
        )}
      >
        {/* Cabecera: Nombre y Estado Sanitario */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-bold text-xs text-foreground tracking-tight flex items-center gap-1.5 font-display">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ background: state.color }}
            />
            {state.name}
          </span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider whitespace-nowrap"
            style={{
              background: `${state.color}18`,
              color: state.color,
              border: `1px solid ${state.color}40`,
            }}
          >
            {state.riskLabel}
          </span>
        </div>

        {/* Subcabecera contextual: Alzas y Lote activo */}
        <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground font-datos mb-1.5">
          <span className="text-accent/90 font-medium">{alzaLabel}</span>
          {state.loteActivo && (
            <span className="truncate max-w-[100px] text-muted-foreground/80">
              Lote: {state.loteActivo}
            </span>
          )}
        </div>

        {/* Métricas clave en cuadrícula compacta de 4 columnas */}
        {showFullMetrics ? (
          <div className="grid grid-cols-4 gap-1 text-center font-datos text-[10px] pt-1.5 border-t border-border/40">
            <div className="bg-surface-sunken/80 rounded px-1 py-1">
              <span className="text-[8px] text-muted-foreground block leading-none">PESO</span>
              <span className="font-bold text-foreground">
                {state.weightKg != null ? `${state.weightKg.toFixed(1)}k` : '—'}
                <span className="text-accent text-[9px] ml-0.5">{trendSymbol}</span>
              </span>
            </div>

            <div className="bg-surface-sunken/80 rounded px-1 py-1">
              <span className="text-[8px] text-muted-foreground block leading-none">ALZAS</span>
              <span className="font-bold text-foreground">
                {state.alzas}
              </span>
            </div>

            <div className="bg-surface-sunken/80 rounded px-1 py-1">
              <span className="text-[8px] text-muted-foreground block leading-none">VARROA</span>
              <span
                className="font-bold"
                style={{
                  color:
                    state.varroaLevel != null && state.varroaLevel > 3
                      ? 'hsl(var(--destructive))'
                      : 'hsl(var(--foreground))',
                }}
              >
                {state.varroaLevel != null ? `${state.varroaLevel}%` : '—'}
              </span>
            </div>

            <div className="bg-surface-sunken/80 rounded px-1 py-1">
              <span className="text-[8px] text-muted-foreground block leading-none">VISITA</span>
              <span className="font-bold text-foreground">
                {state.daysSinceInspection != null ? `${state.daysSinceInspection}d` : '—'}
              </span>
            </div>
          </div>
        ) : null}

        {/* Detalle expandido cuando está seleccionada o hovered */}
        {(selected || hovered) && (
          <div className="mt-1.5 pt-1.5 border-t border-border/40 space-y-1">
            <div className="grid grid-cols-2 gap-1 text-[9px] text-muted-foreground">
              <div className="flex items-center gap-1 truncate">
                <span>Reina:</span>
                <span className="font-medium text-foreground truncate">
                  {state.queenStatus === 'activa'
                    ? 'Activa'
                    : state.queenStatus === 'implicita'
                      ? 'Implícita'
                      : state.queenStatus === 'huerfana'
                        ? 'No vista'
                        : '—'}
                </span>
              </div>
              <div className="flex items-center gap-1 justify-end truncate">
                <span>Mielada:</span>
                <span className="font-medium text-foreground truncate font-datos">
                  {state.productionTotalKg != null ? `${state.productionTotalKg} kg` : '0 kg'}
                </span>
              </div>
            </div>

            {state.primaryAction && (
              <div className="text-[9px] text-accent/90 leading-tight italic truncate pt-0.5">
                → {state.primaryAction}
              </div>
            )}
            <div className="text-[8px] text-center font-bold uppercase tracking-wider text-muted-foreground/80 pt-0.5">
              Clic para abrir ficha técnica
            </div>
          </div>
        )}
      </div>
    </Html>
  );
}

// ─── Modelo Procedural Hiperrealista Colmena Langstroth ──────────────────────
interface Colmena3DProps {
  state: HiveState;
  position: [number, number, number];
  selected: boolean;
  hovered: boolean;
  hudMode: HudMode;
  onSelect: () => void;
  onHover: (hover: boolean) => void;
}

function ColmenaLangstroth3D({
  state,
  position,
  selected,
  hovered,
  hudMode,
  onSelect,
  onHover,
}: Colmena3DProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const statusColor = useMemo(() => new THREE.Color(state.color), [state.color]);

  // Sutil balanceo orgánico según peso de mielada acumulada
  const weight = state.weightKg ?? 30;
  const tilt = Math.min(0.04, (weight / 120) * 0.04);

  // Cantidad real de alzas melarias apiladas (0 = solo cámara de cría)
  const alzasCount = Math.max(0, Math.min(4, state.alzas ?? 0));
  const techoY = alzasCount === 0 ? 0.80 : 0.80 + alzasCount * 0.44;
  const hudY = techoY + 0.48;

  const beeCount = useMemo(() => {
    if (state.risk === 'critical') return 0;
    if (state.poblacion === 'alta' || state.poblacion === 'fuerte') return 18;
    if (state.poblacion === 'media') return 12;
    if (state.poblacion === 'baja' || state.poblacion === 'debil') return 6;
    return 10;
  }, [state.risk, state.poblacion]);

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[tilt, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        onHover(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 1. Bancal Apícola / Soporte de madera rústica (Eleva del suelo húmedo) */}
      <group position={[0, 0.05, 0]}>
        <mesh position={[-0.32, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.08, 0.1, 0.9]} />
          <meshStandardMaterial color={MADERA_PISO} roughness={0.92} />
        </mesh>
        <mesh position={[0.32, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.08, 0.1, 0.9]} />
          <meshStandardMaterial color={MADERA_PISO} roughness={0.92} />
        </mesh>
      </group>

      {/* 2. Piso de la colmena con rampa de vuelo extendida (Piquera) */}
      <group position={[0, 0.13, 0]}>
        {/* Tablero base */}
        <mesh position={[0, 0, 0.05]} castShadow receiveShadow>
          <boxGeometry args={[0.76, 0.05, 0.98]} />
          <meshStandardMaterial color={MADERA_PISO} roughness={0.88} />
        </mesh>
        {/* Rendija oscura de la piquera (acceso de abejas) */}
        <mesh position={[0, 0.035, 0.44]}>
          <boxGeometry args={[0.55, 0.025, 0.03]} />
          <meshBasicMaterial color={RENDIJA_NEGRA} />
        </mesh>
        {/* Placa metálica de número/registro */}
        <mesh position={[0, 0.02, 0.542]}>
          <boxGeometry args={[0.18, 0.02, 0.01]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={selected ? 0.6 : 0.25}
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
      </group>

      {/* 3. Cámara de Cría (Cuerpo profundo inferior) */}
      <group position={[0, 0.44, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.72, 0.54, 0.88]} />
          <meshStandardMaterial
            color={MADERA_CRIA}
            roughness={0.76}
            metalness={0.04}
          />
        </mesh>
        {/* Molduras/Asas rebajadas para manipulación del apicultor */}
        <mesh position={[0, 0.05, 0.441]}>
          <boxGeometry args={[0.26, 0.04, 0.015]} />
          <meshStandardMaterial color="#4a2e19" roughness={0.95} />
        </mesh>
        <mesh position={[-0.361, 0.05, 0]}>
          <boxGeometry args={[0.015, 0.04, 0.26]} />
          <meshStandardMaterial color="#4a2e19" roughness={0.95} />
        </mesh>
        <mesh position={[0.361, 0.05, 0]}>
          <boxGeometry args={[0.015, 0.04, 0.26]} />
          <meshStandardMaterial color="#4a2e19" roughness={0.95} />
        </mesh>
      </group>

      {/* 4. Alzas Melarias Procedurales (Cuerpos de recolección de miel según estado real) */}
      {Array.from({ length: alzasCount }).map((_, i) => {
        const alzaY = 0.94 + i * 0.44;
        const isTop = i === alzasCount - 1;
        return (
          <group key={`alza-${i}`} position={[0, alzaY, 0]}>
            {/* Listón de encastre / junta de separación inferior */}
            <mesh position={[0, -0.21, 0]} castShadow>
              <boxGeometry args={[0.73, 0.03, 0.89]} />
              <meshStandardMaterial color="#503520" roughness={0.9} />
            </mesh>
            {/* Cuerpo del alza */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.72, 0.42, 0.88]} />
              <meshStandardMaterial
                color={MADERA_ALZA}
                roughness={0.72}
                metalness={0.05}
              />
            </mesh>
            {/* Asas rebajadas para manipulación (frontal y laterales) */}
            <mesh position={[0, 0.02, 0.441]}>
              <boxGeometry args={[0.26, 0.035, 0.015]} />
              <meshStandardMaterial color="#4a2e19" roughness={0.95} />
            </mesh>
            <mesh position={[-0.361, 0.02, 0]}>
              <boxGeometry args={[0.015, 0.035, 0.22]} />
              <meshStandardMaterial color="#4a2e19" roughness={0.95} />
            </mesh>
            <mesh position={[0.361, 0.02, 0]}>
              <boxGeometry args={[0.015, 0.035, 0.22]} />
              <meshStandardMaterial color="#4a2e19" roughness={0.95} />
            </mesh>
            {/* Aro lumínico sutil del estado sanitario en el alza superior */}
            {isTop && (
              <mesh position={[0, 0.02, 0.442]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.008, 16]} />
                <meshStandardMaterial
                  color={statusColor}
                  emissive={statusColor}
                  emissiveIntensity={selected ? 0.9 : hovered ? 0.6 : 0.3}
                  roughness={0.3}
                  metalness={0.7}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Si no tiene alzas (cámara de cría sola), aro de estado en la cámara */}
      {alzasCount === 0 && (
        <mesh position={[0, 0.49, 0.442]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.008, 16]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={selected ? 0.9 : hovered ? 0.6 : 0.3}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      )}

      {/* 5. Entretapa y Techo Telescópico de Zinc Galvanizado */}
      <group position={[0, techoY, 0]}>
        {/* Marco de madera del alero que sobresale */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.82, 0.12, 0.98]} />
          <meshStandardMaterial color="#543720" roughness={0.82} />
        </mesh>
        {/* Cubierta metálica de zinc reflectante */}
        <mesh position={[0, 0.065, 0]} castShadow>
          <boxGeometry args={[0.83, 0.015, 0.99]} />
          <meshStandardMaterial
            color={ZINC_TECHO}
            metalness={0.85}
            roughness={0.28}
          />
        </mesh>
      </group>

      {/* 6. Abejas en vuelo en la piquera adaptadas a la vitalidad de la colmena */}
      <AbejasPecoreando active={beeCount > 0} count={beeCount} />

      {/* 7. Halo de selección en el suelo */}
      {(selected || hovered) && (
        <mesh position={[0, 0.005, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.68, 32]} />
          <meshBasicMaterial
            color={statusColor}
            transparent
            opacity={selected ? 0.65 : 0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 8. HUD de Telemetría Flotante Espacial */}
      <ColmenaHud
        state={state}
        selected={selected}
        hovered={hovered}
        mode={hudMode}
        hudY={hudY}
        onSelect={onSelect}
      />
    </group>
  );
}

// ─── Plataforma y Tarimas de Madera de Apiario ──────────────────────────────
function PlataformaApiario({ count }: { count: number }) {
  const width = Math.max(8, Math.ceil(Math.sqrt(count)) * 2.8 + 2);
  return (
    <group position={[0, -0.01, 0]}>
      {/* Suelo vegetal húmedo de Chiloé (musgo y tierra) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[36, 36]} />
        <meshStandardMaterial color={SUELO_BOSQUE} roughness={0.98} />
      </mesh>

      {/* Tarima central de tablones rústicos de madera donde descansan los bancales */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[width, width * 0.75]} />
        <meshStandardMaterial color={TARIMA_MADERA} roughness={0.88} />
      </mesh>
    </group>
  );
}

// ─── Posición en Rejilla Orgánica de Apiario ────────────────────────────────
function calcularPosicion(index: number, total: number): [number, number, number] {
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(total))));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const espaciadoX = 2.4;
  const espaciadoZ = 2.2;
  const offsetX = ((cols - 1) * espaciadoX) / 2;
  const rows = Math.ceil(total / cols);
  const offsetZ = ((rows - 1) * espaciadoZ) / 2;
  return [col * espaciadoX - offsetX, 0, row * espaciadoZ - offsetZ];
}

// ─── Componente Principal ──────────────────────────────────────────────────
interface GemeloApiarioProps {
  colmenas?: ColmenaWithRelations[];
  apiarioName?: string;
  apiarioLat?: number | null;
  apiarioLng?: number | null;
  territorialAlerts?: TerritorialAlertInput[];
  onSelectColmena?: (colmena: ColmenaWithRelations) => void;
}

export function GemeloApiario({
  colmenas = [],
  apiarioName,
  apiarioLat,
  apiarioLng,
  territorialAlerts = [],
  onSelectColmena,
}: GemeloApiarioProps) {
  const [ambientTempC, setAmbientTempC] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hudMode, setHudMode] = useState<HudMode>('detailed');
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPronostico().then((data) => {
      if (cancelled || !data) return;
      const hour = new Date().getHours();
      const t = data.temperature_2m?.[hour] ?? data.temperature_2m?.[0];
      if (typeof t === 'number') setAmbientTempC(Math.round(t));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const apiary = useMemo(
    () =>
      buildApiaryState(colmenas, {
        apiarioName,
        apiarioId: colmenas[0]?.apiario_id ?? null,
        ctx: {
          ambientTempC,
          apiarioLat: apiarioLat ?? colmenas[0]?.lat,
          apiarioLng: apiarioLng ?? colmenas[0]?.lng,
          territorialAlerts,
        },
      }),
    [colmenas, apiarioName, ambientTempC, apiarioLat, apiarioLng, territorialAlerts],
  );

  const byId = useMemo(() => new Map(colmenas.map((c) => [c.id, c])), [colmenas]);

  const legend: RiskLevel[] = ['ok', 'watch', 'alert', 'critical', 'unknown'];

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div
      className="card animate-in delay-2 relative w-full h-[580px] overflow-hidden rounded-2xl border border-accent/20 bg-background/95"
    >
      {/* Cabecera flotante: Título y Contexto */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none max-w-[70%]">
        <div className="text-[10px] uppercase tracking-widest font-mono text-accent mb-0.5">
          Gemelo Digital · Apiario Chiloé
        </div>
        <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
          {apiary.name}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Arquitectura Langstroth de madera y zinc · telemetría en tiempo real
        </p>
      </div>

      {/* Barra de controles superiores (HUD toggle y reencuadre) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur-md p-1.5 rounded-xl border border-border/70 shadow-lg">
        <button
          onClick={() =>
            setHudMode((m) => (m === 'detailed' ? 'compact' : m === 'compact' ? 'focus' : 'detailed'))
          }
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-surface-raised"
          title="Cambiar densidad de telemetría flotante"
        >
          {hudMode === 'detailed' ? (
            <>
              <Eye size={13} className="text-accent" /> Telemetría Completa
            </>
          ) : hudMode === 'compact' ? (
            <>
              <Layers size={13} className="text-accent" /> Compacta
            </>
          ) : (
            <>
              <EyeOff size={13} /> Enfoque
            </>
          )}
        </button>

        <div className="w-[1px] h-4 bg-border/60" />

        <button
          onClick={resetCamera}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-surface-raised"
          title="Reencuadrar cámara"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Canvas 3D */}
      {apiary.hives.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Sin colmenas registradas en este apiario
        </div>
      ) : (
        <Canvas shadows gl={{ antialias: true }}>
          <PerspectiveCamera makeDefault position={[5.5, 4.5, 6.5]} fov={45} />
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.06}
            maxPolarAngle={Math.PI / 2.15}
            minDistance={2.5}
            maxDistance={22}
          />

          {/* Iluminación de claro de bosque en Chiloé */}
          <ambientLight intensity={0.45} />
          <hemisphereLight
            color="#dbe8db"
            groundColor="#1c281e"
            intensity={0.65}
          />
          {/* Sol matinal cálido filtrado con sombras suaves */}
          <directionalLight
            position={[12, 18, 10]}
            intensity={2.1}
            color="#fff6de"
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0004}
          />
          {/* Rebote cálido de miel */}
          <pointLight
            position={[0, 4.5, 3]}
            color="#e8a838"
            intensity={0.8}
            distance={18}
          />

          {/* Plataforma de suelo de bosque de Chiloé */}
          <PlataformaApiario count={apiary.hives.length} />

          {/* Rejilla de colmenas Langstroth */}
          <group>
            {apiary.hives.map((h, i) => (
              <ColmenaLangstroth3D
                key={h.id}
                state={h}
                position={calcularPosicion(i, apiary.hives.length)}
                selected={selectedId === h.id}
                hovered={hoveredId === h.id}
                hudMode={hudMode}
                onSelect={() => {
                  setSelectedId(h.id);
                  const full = byId.get(h.id);
                  if (full && onSelectColmena) onSelectColmena(full);
                }}
                onHover={(hState) => {
                  setHoveredId(hState ? h.id : null);
                }}
              />
            ))}
          </group>

          {/* Niebla de bosque lluvioso templado */}
          <fog attach="fog" args={[SUELO_BOSQUE, 12, 28]} />
        </Canvas>
      )}

      {/* Leyenda y sumario de salud en la esquina inferior izquierda */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2 max-w-[55%] pointer-events-none">
        {legend
          .filter((r) => apiary.riskSummary[r] > 0)
          .map((r) => {
            const n = apiary.riskSummary[r];
            const label =
              r === 'ok'
                ? 'óptima'
                : r === 'watch'
                  ? 'vigilancia'
                  : r === 'alert'
                    ? 'atención'
                    : r === 'critical'
                      ? 'crítico'
                      : 'sin datos';
            return (
              <span
                key={r}
                className="text-[10px] inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground font-datos"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: RISK_COLORS[r] }}
                />
                {n} {label}
              </span>
            );
          })}
      </div>

      {/* Metadatos ambientales en la esquina inferior derecha */}
      <div className="absolute bottom-4 right-4 z-10 text-right pointer-events-none space-y-0.5">
        <div className="text-[11px] text-muted-foreground font-datos">
          {apiary.hiveCount} colmena{apiary.hiveCount === 1 ? '' : 's'} en apiario
        </div>
        <div className="text-[11px] text-success font-medium font-datos">
          Zona: {ambientTempC != null ? `${ambientTempC}°C` : '—'}
        </div>
        {apiary.alertsNearby > 0 && (
          <div className="text-[11px] text-destructive font-medium font-datos flex items-center gap-1">
            <AlertTriangle size={12} className="shrink-0" />
            <span>{apiary.alertsNearby} alerta(s) fitosanitaria(s) en radio</span>
          </div>
        )}
      </div>
    </div>
  );
}
