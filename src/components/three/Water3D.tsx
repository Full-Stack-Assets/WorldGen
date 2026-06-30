import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TERRAIN_SIZE } from '../../lib/terrainMesh';

export function Water3D() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.15 + Math.sin(clock.elapsedTime * 0.8) * 0.05;
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]} receiveShadow>
      <planeGeometry args={[TERRAIN_SIZE * 1.4, TERRAIN_SIZE * 1.4, 1, 1]} />
      <meshStandardMaterial
        color="#1a4a7a"
        emissive="#0e3a5e"
        emissiveIntensity={0.2}
        transparent
        opacity={0.82}
        roughness={0.15}
        metalness={0.65}
      />
    </mesh>
  );
}
