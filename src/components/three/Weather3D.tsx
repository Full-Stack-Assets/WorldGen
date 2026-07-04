import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WeatherKind } from '../../lib/weather';

interface Weather3DProps {
  kind: WeatherKind;
  areaSize: number;
  topY: number;
  bottomY: number;
}

const PARTICLE_CONFIG = {
  rain: { count: 2200, size: 0.12, speed: 42, color: '#bcd6f0', opacity: 0.55, drift: 0.4 },
  snow: { count: 1200, size: 0.22, speed: 4.5, color: '#ffffff', opacity: 0.85, drift: 1.6 },
} as const;

export function Weather3D({ kind, areaSize, topY, bottomY }: Weather3DProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const config = kind === 'clear' ? null : PARTICLE_CONFIG[kind];
  const count = config?.count ?? 0;

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * areaSize;
      positions[i * 3 + 1] = topY - Math.random() * (topY - bottomY);
      positions[i * 3 + 2] = (Math.random() - 0.5) * areaSize;
      seeds[i] = Math.random() * Math.PI * 2;
    }
    return { positions, seeds };
  }, [count, areaSize, topY, bottomY]);

  useFrame((state, delta) => {
    if (!config || !pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      arr[idx + 1] -= config.speed * delta;
      arr[idx] += Math.sin(t * 0.6 + seeds[i]) * config.drift * delta;
      if (arr[idx + 1] < bottomY) {
        arr[idx + 1] = topY;
        arr[idx] = (Math.random() - 0.5) * areaSize;
        arr[idx + 2] = (Math.random() - 0.5) * areaSize;
      }
    }
    posAttr.needsUpdate = true;
  });

  if (!config || count === 0) return null;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={config.size}
        color={config.color}
        transparent
        opacity={config.opacity}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
