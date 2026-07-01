import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Float, Text } from '@react-three/drei';
import { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { BOSQUE_ULMO, ORO_MIEL_ALT, BOSQUE_ULMO_DARK, SCENE_BG } from '@/lib/colors';
import type { Colmena } from '@/types/ecosystem';
import { fetchPronostico } from '@/lib/meteo';

interface Colmena3DProps {
  position: [number, number, number];
  temp: number;
  name: string;
  weight: number;
}

function Colmena3D({ position, temp, name, weight }: Colmena3DProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const color = useMemo(() => {
    const t = Math.max(0, Math.min(1, (temp - 10) / 25));
    return new THREE.Color().lerpColors(
      new THREE.Color(BOSQUE_ULMO),
      new THREE.Color(ORO_MIEL_ALT),
      t,
    );
  }, [temp]);

  const tilt = (weight / 100) * 0.1;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.05;
    }
  });

  return (
    <group position={position} rotation={[tilt, 0, 0]}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh
          ref={meshRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          scale={hovered ? 1.05 : 1}
        >
          <boxGeometry args={[0.8, 1, 0.8]} />
          <meshStandardMaterial
            color={color}
            metalness={0.6}
            roughness={0.2}
            emissive={color}
            emissiveIntensity={hovered ? 0.5 : 0.1}
          />
        </mesh>
      </Float>
      <Text position={[0, 0.8, 0]} fontSize={0.15} color="white" font="/assets/CormorantGaramond-Regular.woff">
        {name}
      </Text>
      <Text position={[0, -0.7, 0]} fontSize={0.12} color={color} font="/assets/CormorantGaramond-Regular.woff">
        {temp}°C | {weight}kg
      </Text>
    </group>
  );
}

const GRID_POSITIONS: [number, number, number][] = [
  [-2, 0, 0], [0, 0, 0], [2, 0, 0], [0, 0, -2], [-2, 0, -2], [2, 0, -2],
];

interface GemeloApiarioProps {
  colmenas?: Colmena[];
  apiarioName?: string;
}

export function GemeloApiario({ colmenas = [], apiarioName }: GemeloApiarioProps) {
  const [baseTemp, setBaseTemp] = useState(16);

  useEffect(() => {
    fetchPronostico().then((data) => {
      const hour = new Date().getHours();
      const t = data?.temperature_2m?.[hour] ?? data?.temperature_2m?.[0];
      if (typeof t === 'number') setBaseTemp(Math.round(t));
    });
  }, []);

  const colmenas3d = useMemo(() => {
    if (colmenas.length === 0) return [];
    return colmenas.slice(0, 6).map((c, i) => {
      const lastPeso = c.pesoHistory?.[c.pesoHistory.length - 1]?.kg;
      const tempOffset = c.health === 'optimal' ? 4 : c.health === 'attention' ? 0 : -3;
      return {
        id: c.id,
        name: c.name,
        pos: GRID_POSITIONS[i % GRID_POSITIONS.length],
        temp: baseTemp + tempOffset,
        weight: Math.round(lastPeso ?? c.production ?? 0),
      };
    });
  }, [colmenas, baseTemp]);

  const title = apiarioName ?? (colmenas[0]?.location || 'Apiario Pureo');
  const sensorCount = colmenas.length;

  return (
    <div className="card animate-in delay-2" style={{ height: '500px', background: SCENE_BG, position: 'relative', overflow: 'hidden', border: '1px solid hsl(var(--accent) / 0.15)' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'hsl(var(--accent))', marginBottom: 4 }}>
          Gemelo Digital
        </div>
        <div style={{ fontFamily: 'var(--font-existencial)', fontSize: '1.2rem', color: 'hsl(var(--primary-foreground))' }}>
          {title}
        </div>
      </div>

      {colmenas3d.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Sin colmenas registradas en Supabase
        </div>
      ) : (
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} />
          <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2.1} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color={ORO_MIEL_ALT} />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color={BOSQUE_ULMO_DARK} roughness={1} />
          </mesh>
          <group>
            {colmenas3d.map((c) => (
              <Colmena3D key={c.id} position={c.pos} temp={c.temp} name={c.name} weight={c.weight} />
            ))}
          </group>
          <fog attach="fog" args={[SCENE_BG, 10, 25]} />
        </Canvas>
      )}

      <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10, textAlign: 'right', pointerEvents: 'none' }}>
        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
          Colmenas sincronizadas: {sensorCount}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--success))' }}>
          Temp. base Pureo: {baseTemp}°C
        </div>
      </div>
    </div>
  );
}