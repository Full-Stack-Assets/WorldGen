import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Self-contained clouds. drei's <Cloud> fetches a texture from an external CDN
// and throws (crashing the whole Canvas) when that host is blocked or offline,
// so we generate a soft puff texture on a 2D canvas at runtime — no network,
// no bundled asset, works offline.
function makeCloudTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.45, 'rgba(225,235,248,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

interface Puff {
  base: [number, number, number];
  scale: number;
  speed: number;
}

const PUFFS: Puff[] = [
  { base: [-45, 46, -30], scale: 34, speed: 0.9 },
  { base: [-20, 52, -46], scale: 28, speed: 0.6 },
  { base: [30, 55, 22], scale: 40, speed: 1.2 },
  { base: [52, 48, -12], scale: 30, speed: 0.8 },
  { base: [8, 60, -52], scale: 36, speed: 0.5 },
  { base: [-38, 58, 34], scale: 26, speed: 1.0 },
  { base: [18, 44, 40], scale: 32, speed: 0.7 },
  { base: [-5, 50, 8], scale: 30, speed: 1.1 },
];

const DRIFT_RANGE = 140;

export function ProceduralClouds() {
  const texture = useMemo(makeCloudTexture, []);
  const refs = useRef<(THREE.Sprite | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < PUFFS.length; i++) {
      const sprite = refs.current[i];
      if (!sprite) continue;
      const p = PUFFS[i];
      // Slow linear drift on X, wrapping around so clouds recirculate.
      const drift = ((t * p.speed + p.base[0] + DRIFT_RANGE / 2) % DRIFT_RANGE) - DRIFT_RANGE / 2;
      sprite.position.x = p.base[0] + drift * 0.15;
    }
  });

  return (
    <group>
      {PUFFS.map((p, i) => (
        <sprite
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          position={p.base}
          scale={[p.scale, p.scale * 0.6, 1]}
        >
          <spriteMaterial
            map={texture}
            transparent
            opacity={0.32}
            depthWrite={false}
            color="#c8d6e6"
          />
        </sprite>
      ))}
    </group>
  );
}
