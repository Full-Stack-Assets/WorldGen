import * as THREE from 'three';
import type { WorldData } from '../types/world';
import { biomeColor } from './colors';

export const TERRAIN_SIZE = 220;
export const HEIGHT_SCALE = 42;

export interface TerrainBuildResult {
  geometry: THREE.BufferGeometry;
  terrainSize: number;
  heightScale: number;
  seaLevel: number;
  gridWidth: number;
  gridHeight: number;
}

export function buildTerrainGeometry(world: WorldData): TerrainBuildResult {
  const { cells, config } = world;
  const segW = config.width - 1;
  const segH = config.height - 1;

  const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, segW, segH);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(positions.count * 3);

  for (let i = 0; i < positions.count; i++) {
    const col = i % (segW + 1);
    const row = Math.floor(i / (segW + 1));
    const cell = cells[Math.min(row, config.height - 1)][Math.min(col, config.width - 1)];

    const aboveSea = cell.elevation >= config.seaLevel;
    const height = aboveSea
      ? (cell.elevation - config.seaLevel) * HEIGHT_SCALE
      : (cell.elevation - config.seaLevel) * HEIGHT_SCALE * 0.35;

    positions.setY(i, height);

    let [r, g, b] = biomeColor(cell.biome, cell.elevation);
    if (!aboveSea) {
      r = Math.round(r * 0.45);
      g = Math.round(g * 0.45);
      b = Math.round(b * 0.55);
    }

    colors[i * 3] = r / 255;
    colors[i * 3 + 1] = g / 255;
    colors[i * 3 + 2] = b / 255;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  return {
    geometry,
    terrainSize: TERRAIN_SIZE,
    heightScale: HEIGHT_SCALE,
    seaLevel: config.seaLevel,
    gridWidth: config.width,
    gridHeight: config.height,
  };
}

export function worldPointToGrid(
  point: THREE.Vector3,
  terrainSize: number,
  gridWidth: number,
  gridHeight: number,
): { x: number; y: number } {
  const nx = point.x / terrainSize + 0.5;
  const nz = point.z / terrainSize + 0.5;
  const x = Math.round(nx * (gridWidth - 1));
  const y = Math.round(nz * (gridHeight - 1));
  return {
    x: Math.max(0, Math.min(gridWidth - 1, x)),
    y: Math.max(0, Math.min(gridHeight - 1, y)),
  };
}

function surfaceHeight(elevation: number, seaLevel: number): number {
  return Math.max(0.5, (elevation - seaLevel) * HEIGHT_SCALE);
}

function gridToPlane(
  x: number,
  y: number,
  terrainSize: number,
  gridWidth: number,
  gridHeight: number,
): { wx: number; wz: number } {
  return {
    wx: (x / (gridWidth - 1) - 0.5) * terrainSize,
    wz: (y / (gridHeight - 1) - 0.5) * terrainSize,
  };
}

// Floats 1.5 units above the terrain surface — for markers/rings meant to hover clear of the mesh.
export function gridToWorldPosition(
  x: number,
  y: number,
  elevation: number,
  seaLevel: number,
  terrainSize: number,
  gridWidth: number,
  gridHeight: number,
): THREE.Vector3 {
  const { wx, wz } = gridToPlane(x, y, terrainSize, gridWidth, gridHeight);
  return new THREE.Vector3(wx, surfaceHeight(elevation, seaLevel) + 1.5, wz);
}

// Sits directly on the terrain surface — for props (vegetation, rocks) that should rest on the ground.
export function gridToGroundPosition(
  x: number,
  y: number,
  elevation: number,
  seaLevel: number,
  terrainSize: number,
  gridWidth: number,
  gridHeight: number,
): THREE.Vector3 {
  const { wx, wz } = gridToPlane(x, y, terrainSize, gridWidth, gridHeight);
  return new THREE.Vector3(wx, surfaceHeight(elevation, seaLevel), wz);
}
