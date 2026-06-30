import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WorldData } from '../../types/world';
import { buildTerrainGeometry, gridToWorldPosition } from '../../lib/terrainMesh';
import { SETTLEMENT_COLORS } from '../../lib/colors';

interface Terrain3DProps {
  world: WorldData;
  selectedX?: number;
  selectedY?: number;
  onSelect: (x: number, y: number) => void;
}

export function Terrain3D({ world, selectedX, selectedY, onSelect }: Terrain3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const terrain = useMemo(() => buildTerrainGeometry(world), [world]);

  const selectionPos = useMemo(() => {
    if (selectedX === undefined || selectedY === undefined) return null;
    const cell = world.cells[selectedY]?.[selectedX];
    if (!cell) return null;
    return gridToWorldPosition(
      selectedX, selectedY, cell.elevation, terrain.seaLevel,
      terrain.terrainSize, terrain.gridWidth, terrain.gridHeight,
    );
  }, [selectedX, selectedY, world, terrain]);

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={terrain.geometry}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          const point = e.point;
          const nx = point.x / terrain.terrainSize + 0.5;
          const nz = point.z / terrain.terrainSize + 0.5;
          const x = Math.round(nx * (terrain.gridWidth - 1));
          const y = Math.round(nz * (terrain.gridHeight - 1));
          onSelect(
            Math.max(0, Math.min(terrain.gridWidth - 1, x)),
            Math.max(0, Math.min(terrain.gridHeight - 1, y)),
          );
        }}
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.92}
          metalness={0.04}
          flatShading={false}
        />
      </mesh>

      {world.settlements.map((s) => {
        const cell = world.cells[s.y]?.[s.x];
        if (!cell) return null;
        const pos = gridToWorldPosition(
          s.x, s.y, cell.elevation, terrain.seaLevel,
          terrain.terrainSize, terrain.gridWidth, terrain.gridHeight,
        );
        const scale = s.type === 'capital' ? 2.2 : s.type === 'city' ? 1.6 : s.type === 'town' ? 1.2 : 0.8;
        const color = SETTLEMENT_COLORS[s.type] ?? '#fff';

        return (
          <group key={`${s.x}-${s.y}`} position={pos}>
            <mesh castShadow>
              <cylinderGeometry args={[0.35 * scale, 0.5 * scale, 1.8 * scale, 6]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 1.8 * scale + 0.3, 0]}>
              <sphereGeometry args={[0.25 * scale, 8, 8]} />
              <meshStandardMaterial color="#fffef0" emissive="#fffef0" emissiveIntensity={0.8} />
            </mesh>
            <pointLight intensity={0.4} distance={8} color={color} />
          </group>
        );
      })}

      {selectionPos && (
        <SelectionRing position={selectionPos} />
      )}
    </group>
  );
}

function SelectionRing({ position }: { position: THREE.Vector3 }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = clock.elapsedTime * 1.5;
      const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.08;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <mesh ref={ringRef} position={[position.x, position.y + 0.5, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.8, 2.4, 32]} />
      <meshBasicMaterial color="#a5b4fc" transparent opacity={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}
