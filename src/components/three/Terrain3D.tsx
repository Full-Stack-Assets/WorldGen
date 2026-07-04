import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Settlement, SettlementType, WorldData } from '../../types/world';
import { gridToWorldPosition, type TerrainBuildResult } from '../../lib/terrainMesh';
import { SETTLEMENT_COLORS } from '../../lib/colors';

const SETTLEMENT_BUILDING_COUNTS: Record<SettlementType, number> = {
  capital: 8, city: 5, town: 3, village: 2, outpost: 1,
};

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

interface Terrain3DProps {
  world: WorldData;
  terrain: TerrainBuildResult;
  selectedX?: number;
  selectedY?: number;
  onSelect: (x: number, y: number) => void;
}

export function Terrain3D({ world, terrain, selectedX, selectedY, onSelect }: Terrain3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

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
            <SettlementModel settlement={s} scale={scale} color={color} />
            <mesh position={[0, 1.5 * scale + 0.35, 0]}>
              <sphereGeometry args={[0.16 * scale, 8, 8]} />
              <meshStandardMaterial color="#fffef0" emissive="#fffef0" emissiveIntensity={0.8} />
            </mesh>
            <pointLight intensity={0.35} distance={9} color={color} />
          </group>
        );
      })}

      {selectionPos && (
        <SelectionRing position={selectionPos} />
      )}
    </group>
  );
}

interface Building {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  rot: number;
}

function SettlementModel({ settlement, scale, color }: { settlement: Settlement; scale: number; color: string }) {
  const count = SETTLEMENT_BUILDING_COUNTS[settlement.type];

  const buildings = useMemo<Building[]>(() => {
    const list: Building[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + hash2(settlement.x, settlement.y + i) * 1.4;
      const radius = count > 1 ? (0.55 + hash2(settlement.x + i, settlement.y) * 0.35) * scale * 1.6 : 0;
      list.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        w: (0.45 + hash2(settlement.x, settlement.y * 3 + i) * 0.25) * scale,
        h: (0.6 + hash2(settlement.x * 5 + i, settlement.y) * 0.5) * scale,
        d: (0.45 + hash2(settlement.x * 2 + i, settlement.y + 1) * 0.25) * scale,
        rot: angle,
      });
    }
    return list;
  }, [settlement.x, settlement.y, count, scale]);

  return (
    <group>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.rot, 0]}>
          <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color="#c9b79c" roughness={0.85} />
          </mesh>
          <mesh position={[0, b.h + b.w * 0.35, 0]} castShadow>
            <coneGeometry args={[b.w * 0.8, b.w * 0.7, 4]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        </group>
      ))}
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
