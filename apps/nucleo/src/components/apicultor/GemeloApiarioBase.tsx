import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Float, Text } from '@react-three/drei';
import { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { BOSQUE_ULMO_DARK, ORO_MIEL_ALT, SCENE_BG } from '@/lib/colors';
import type { ColmenaWithRelations } from '@/lib/apicultor-types';
import { fetchPronostico } from '@/lib/meteo';
import {
  buildApiaryState,
  hiveStateLabel,
  type HiveState,
  type TerritorialAlertInput,
  RISK_COLORS,
  type RiskLevel,
} from '@/lib/hive-state';

interface Colmena3DProps {
  state: HiveState;
  position: [number, number, number];
  selected: boolean;
  onSelect: () => void;
}

function Colmena3D({ state, position, selected, onSelect }: Colmena3DProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const color = useMemo(() => new THREE.Color(state.color), [state.color]);
  const weight = state.weightKg ?? 0;
  const tilt = Math.min(0.15, (weight / 100) * 0.1);
  const label = hiveStateLabel(state);

  useFrame((frame) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(frame.clock.elapsedTime + position[0]) * 0.04;
    }
  });

  return (
    <group position={position} rotation={[tilt, 0, 0]}>
      <Float speed={1.5} rotationIntensity={0.12} floatIntensity={0.35}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
          scale={hovered || selected ? 1.08 : 1}
        >
          <boxGeometry args={[0.8, 1, 0.8]} />
          <meshStandardMaterial
            color={color}
            metalness={0.35}
            roughness={0.45}
            emissive={color}
            emissiveIntensity={selected ? 0.55 : hovered ? 0.4 : 0.12}
          />
        </mesh>
      </Float>
      <Text
        position={[0, 0.85, 0]}
        fontSize={0.14}
        color="white"
        anchorX="center"
        font="/assets/CormorantGaramond-Regular.woff"
      >
        {state.name}
      </Text>
      <Text
        position={[0, -0.72, 0]}
        fontSize={0.11}
        color={state.color}
        anchorX="center"
        font="/assets/CormorantGaramond-Regular.woff"
      >
        {label}
      </Text>
    </group>
  );
}

/** Rejilla expandible: hasta 12 colmenas en 3×4 antes de solaparse. */
function gridPosition(index: number, total: number): [number, number, number] {
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(total))));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const spacing = 2;
  const offsetX = ((cols - 1) * spacing) / 2;
  const rows = Math.ceil(total / cols);
  const offsetZ = ((rows - 1) * spacing) / 2;
  return [col * spacing - offsetX, 0, row * spacing - offsetZ];
}

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

  const title = apiary.name;
  const legend: RiskLevel[] = ['ok', 'watch', 'alert', 'critical', 'unknown'];

  return (
    <div
      className="card animate-in delay-2"
      style={{
        height: '500px',
        background: SCENE_BG,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid hsl(var(--accent) / 0.15)',
      }}
    >
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, pointerEvents: 'none', maxWidth: '70%' }}>
        <div
          style={{
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'hsl(var(--accent))',
            marginBottom: 4,
          }}
        >
          Vista espacial · estado unificado
        </div>
        <div
          style={{
            fontFamily: 'var(--font-existencial)',
            fontSize: '1.15rem',
            color: 'hsl(var(--primary-foreground))',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
          Color = riesgo compuesto (peso, varroa, health, visitas, alertas). No inventa sensores.
        </div>
      </div>

      {apiary.hives.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Sin colmenas registradas en este apiario
        </div>
      ) : (
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[6, 6, 6]} />
          <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2.1} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color={ORO_MIEL_ALT} />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <Stars radius={100} depth={50} count={4000} factor={4} saturation={0} fade speed={1} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
            <planeGeometry args={[24, 24]} />
            <meshStandardMaterial color={BOSQUE_ULMO_DARK} roughness={1} />
          </mesh>
          <group>
            {apiary.hives.map((h, i) => (
              <Colmena3D
                key={h.id}
                state={h}
                position={gridPosition(i, apiary.hives.length)}
                selected={selectedId === h.id}
                onSelect={() => {
                  setSelectedId(h.id);
                  const full = byId.get(h.id);
                  if (full && onSelectColmena) onSelectColmena(full);
                }}
              />
            ))}
          </group>
          <fog attach="fog" args={[SCENE_BG, 12, 28]} />
        </Canvas>
      )}

      {/* Leyenda riesgo */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 10,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          maxWidth: '55%',
          pointerEvents: 'none',
        }}
      >
        {legend
          .filter((r) => apiary.riskSummary[r] > 0)
          .map((r) => {
            const n = apiary.riskSummary[r];
            const label =
              r === 'ok'
                ? 'estable'
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
                style={{
                  fontSize: '0.65rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: RISK_COLORS[r],
                    display: 'inline-block',
                  }}
                />
                {n} {label}
              </span>
            );
          })}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 10,
          textAlign: 'right',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
          {apiary.hiveCount} colmena{apiary.hiveCount === 1 ? '' : 's'} · clic abre ficha
        </div>
        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--success))' }}>
          Ambiente zona: {ambientTempC != null ? `${ambientTempC}°C` : '—'}
        </div>
        {apiary.alertsNearby > 0 && (
          <div style={{ fontSize: '0.7rem', color: RISK_COLORS.alert }}>
            {apiary.alertsNearby} alerta{apiary.alertsNearby === 1 ? '' : 's'} fitosanitaria
            {apiary.alertsNearby === 1 ? '' : 's'} en radio
          </div>
        )}
        {selectedId && (
          <div style={{ fontSize: '0.65rem', color: 'hsl(var(--accent))', marginTop: 2 }}>
            {apiary.hives.find((h) => h.id === selectedId)?.primaryAction ?? 'Ficha abierta'}
          </div>
        )}
      </div>
    </div>
  );
}
