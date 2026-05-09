import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Float, Text } from '@react-three/drei';
import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';

interface Colmena3DProps {
  position: [number, number, number];
  temp: number;
  name: string;
  weight: number;
}

function Colmena3D({ position, temp, name, weight }: Colmena3DProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  // Color basado en temperatura: de bosque oscuro a ámbar cálido
  // 10°C -> oscuro, 35°C -> dorado
  const color = useMemo(() => {
    const t = Math.max(0, Math.min(1, (temp - 10) / 25));
    return new THREE.Color().lerpColors(
      new THREE.Color('#0A3D2F'), // Bosque profundo
      new THREE.Color('#E4A32B'), // Oro miel
      t
    );
  }, [temp]);

  // Inclinación simulada por peso (exagerada para feedback visual)
  const tilt = (weight / 100) * 0.1;

  useFrame((state) => {
    if (meshRef.current) {
      // Pequeña flotación orgánica
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

      <Text
        position={[0, 0.8, 0]}
        fontSize={0.15}
        color="white"
        font="https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmY9k-m-9K6Uks0L-9nO-P_ZzT7Oq.woff"
      >
        {name}
      </Text>
      
      <Text
        position={[0, -0.7, 0]}
        fontSize={0.12}
        color={color}
        opacity={0.8}
      >
        {temp}°C | {weight}kg
      </Text>
    </group>
  );
}

export default function GemeloApiario() {
  // Datos mock para las colmenas del apiario central
  const colmenas = [
    { id: '1', name: 'Ulmo-Alpha', pos: [-2, 0, 0] as [number, number, number], temp: 34, weight: 42 },
    { id: '2', name: 'Tepú-Beta', pos: [0, 0, 0] as [number, number, number], temp: 28, weight: 35 },
    { id: '3', name: 'Bosque-Gamma', pos: [2, 0, 0] as [number, number, number], temp: 15, weight: 12 },
    { id: '4', name: 'Norte-Delta', pos: [0, 0, -2] as [number, number, number], temp: 32, weight: 38 },
  ];

  return (
    <div className="card animate-in delay-2" style={{ height: '500px', background: '#051510', position: 'relative', overflow: 'hidden', border: '1px solid rgba(228,163,43,0.1)' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--oro-miel)', marginBottom: 4 }}>
          Gemelo Digital V1
        </div>
        <div style={{ fontFamily: 'var(--font-existencial)', fontSize: '1.2rem', color: 'var(--crema-natural)' }}>
          Apiario Central Pureo
        </div>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} />
        <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2.1} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#E4A32B" />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* Suelo del apiario (Bosque) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#062A1F" roughness={1} />
        </mesh>

        <group>
          {colmenas.map((c) => (
            <Colmena3D key={c.id} position={c.pos} temp={c.temp} name={c.name} weight={c.weight} />
          ))}
        </group>

        {/* Efecto de partículas de floración simulado */}
        <fog attach="fog" args={['#051510', 10, 25]} />
      </Canvas>

      <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10, textAlign: 'right', pointerEvents: 'none' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Sensores IoT activos: 4/4
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--salud-optima)' }}>
          Latencia Sincrónica: 120ms
        </div>
      </div>
    </div>
  );
}
