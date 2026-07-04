import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { WorldData } from '../../types/world';
import { gridToGroundPosition } from '../../lib/terrainMesh';
import { placeProps, type PlacedProp, type PropType } from '../../lib/vegetation';

interface Vegetation3DProps {
  world: WorldData;
  terrainSize: number;
  seaLevel: number;
  gridWidth: number;
  gridHeight: number;
}

const dummy = new THREE.Object3D();
const dummyColor = new THREE.Color();

function applyInstances(
  mesh: THREE.InstancedMesh | null,
  props: PlacedProp[],
  world: WorldData,
  terrainSize: number,
  seaLevel: number,
  gridWidth: number,
  gridHeight: number,
  baseColor: THREE.Color,
  colorVariance: number,
  heightOffset: number,
) {
  if (!mesh) return;
  for (let i = 0; i < props.length; i++) {
    const p = props[i];
    const cell = world.cells[p.y][p.x];
    const pos = gridToGroundPosition(p.x, p.y, cell.elevation, seaLevel, terrainSize, gridWidth, gridHeight);
    dummy.position.set(pos.x, pos.y + heightOffset * p.scale, pos.z);
    dummy.rotation.set(0, p.rotation, 0);
    dummy.scale.setScalar(p.scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    const tint = 1 + (Math.sin(p.x * 12.9898 + p.y * 78.233) * 0.5) * colorVariance;
    dummyColor.copy(baseColor).multiplyScalar(tint);
    mesh.setColorAt(i, dummyColor);
  }
  mesh.count = props.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

const TRUNK_TYPES: PropType[] = ['conifer', 'deciduous', 'palm', 'deadTree'];

export function Vegetation3D({ world, terrainSize, seaLevel, gridWidth, gridHeight }: Vegetation3DProps) {
  const props = useMemo(() => placeProps(world), [world]);

  const groups = useMemo(() => {
    const byType: Record<PropType, PlacedProp[]> = {
      conifer: [], deciduous: [], palm: [], cactus: [], rock: [], deadTree: [],
    };
    for (const p of props) byType[p.type].push(p);
    return byType;
  }, [props]);

  const trunkProps = useMemo(() => props.filter((p) => TRUNK_TYPES.includes(p.type)), [props]);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const coniferRef = useRef<THREE.InstancedMesh>(null);
  const deciduousRef = useRef<THREE.InstancedMesh>(null);
  const palmRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);
  const cactusRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    applyInstances(trunkRef.current, trunkProps, world, terrainSize, seaLevel, gridWidth, gridHeight, new THREE.Color('#5a4632'), 0.15, 0.5);
    applyInstances(coniferRef.current, groups.conifer, world, terrainSize, seaLevel, gridWidth, gridHeight, new THREE.Color('#1f5c33'), 0.2, 1.6);
    applyInstances(deciduousRef.current, groups.deciduous, world, terrainSize, seaLevel, gridWidth, gridHeight, new THREE.Color('#3f8f45'), 0.25, 1.5);
    applyInstances(palmRef.current, groups.palm, world, terrainSize, seaLevel, gridWidth, gridHeight, new THREE.Color('#5aa54a'), 0.2, 1.1);
    applyInstances(rockRef.current, groups.rock, world, terrainSize, seaLevel, gridWidth, gridHeight, new THREE.Color('#8a8a86'), 0.2, 0.15);
    applyInstances(cactusRef.current, groups.cactus, world, terrainSize, seaLevel, gridWidth, gridHeight, new THREE.Color('#4a7a3f'), 0.15, 0.55);
  }, [groups, trunkProps, world, terrainSize, seaLevel, gridWidth, gridHeight]);

  const maxCount = props.length || 1;

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, maxCount]} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.09, 1, 5]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>

      <instancedMesh ref={coniferRef} args={[undefined, undefined, maxCount]} castShadow>
        <coneGeometry args={[0.55, 1.7, 7]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>

      <instancedMesh ref={deciduousRef} args={[undefined, undefined, maxCount]} castShadow>
        <sphereGeometry args={[0.55, 7, 6]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>

      <instancedMesh ref={palmRef} args={[undefined, undefined, maxCount]} castShadow>
        <coneGeometry args={[0.6, 0.55, 6, 1, true]} />
        <meshStandardMaterial roughness={0.75} side={THREE.DoubleSide} />
      </instancedMesh>

      <instancedMesh ref={rockRef} args={[undefined, undefined, maxCount]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial roughness={0.95} flatShading />
      </instancedMesh>

      <instancedMesh ref={cactusRef} args={[undefined, undefined, maxCount]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 1.1, 6]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
    </group>
  );
}
