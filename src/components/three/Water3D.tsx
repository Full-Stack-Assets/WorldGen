import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TERRAIN_SIZE } from '../../lib/terrainMesh';

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  varying float vWave;
  varying vec3 vWorldPos;

  float wave(vec2 p, float t) {
    float w = sin(p.x * 0.18 + t * 1.3) * 0.18;
    w += sin(p.y * 0.24 - t * 1.7) * 0.14;
    w += sin((p.x + p.y) * 0.11 + t * 0.9) * 0.1;
    return w;
  }

  void main() {
    vec3 pos = position;
    float h = wave(pos.xy, uTime);
    pos.z += h;
    vWave = h;
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uFoamColor;
  uniform float uOpacity;
  varying float vWave;
  varying vec3 vWorldPos;

  void main() {
    vec3 fdx = dFdx(vWorldPos);
    vec3 fdy = dFdy(vWorldPos);
    vec3 normal = normalize(cross(fdx, fdy));

    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 3.0);

    float foam = smoothstep(0.14, 0.24, vWave);
    vec3 base = mix(uDeepColor, uShallowColor, clamp(vWave * 1.6 + 0.5, 0.0, 1.0));
    vec3 color = mix(base, uFoamColor, foam * 0.6);
    color += fresnel * 0.22;

    float shimmer = pow(max(dot(normal, normalize(vec3(0.25, 1.0, 0.15))), 0.0), 50.0);
    color += shimmer * 0.5;

    gl_FragColor = vec4(color, uOpacity);
  }
`;

export function Water3D() {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDeepColor: { value: new THREE.Color('#0c2c52') },
    uShallowColor: { value: new THREE.Color('#1f6f9c') },
    uFoamColor: { value: new THREE.Color('#bfe3ec') },
    uOpacity: { value: 0.85 },
  }), []);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]} receiveShadow>
      <planeGeometry args={[TERRAIN_SIZE * 1.4, TERRAIN_SIZE * 1.4, 96, 96]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        transparent
      />
    </mesh>
  );
}
