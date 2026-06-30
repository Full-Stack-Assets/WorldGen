import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Cloud, Stars, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type { WorldData } from '../../types/world';
import { Terrain3D } from './Terrain3D';
import { Water3D } from './Water3D';

interface WorldScene3DProps {
  world: WorldData | null;
  selectedX?: number;
  selectedY?: number;
  onSelectRegion: (x: number, y: number) => void;
}

function SceneContent({
  world,
  selectedX,
  selectedY,
  onSelectRegion,
}: {
  world: WorldData;
  selectedX?: number;
  selectedY?: number;
  onSelectRegion: (x: number, y: number) => void;
}) {
  return (
    <>
      <color attach="background" args={['#060a14']} />
      <fog attach="fog" args={['#0a1628', 80, 320]} />

      <Sky
        distance={450000}
        sunPosition={[80, 30, 60]}
        inclination={0.52}
        azimuth={0.22}
        mieCoefficient={0.005}
        mieDirectionalG={0.9}
        rayleigh={0.4}
        turbidity={8}
      />

      <Stars radius={300} depth={80} count={4000} factor={3} saturation={0.2} fade speed={0.3} />

      <ambientLight intensity={0.25} color="#8eb4d4" />
      <hemisphereLight args={['#87ceeb', '#2d4a2d', 0.45]} />
      <directionalLight
        position={[80, 60, 40]}
        intensity={1.8}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={300}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-40, 20, -30]} intensity={0.3} color="#6b8cce" />

      <Cloud position={[-40, 45, -30]} opacity={0.35} speed={0.15} bounds={[20, 4, 20]} segments={20} color="#c8d8e8" />
      <Cloud position={[50, 55, 20]} opacity={0.28} speed={0.1} bounds={[25, 5, 25]} segments={20} color="#d0dce8" />
      <Cloud position={[0, 60, -50]} opacity={0.22} speed={0.08} bounds={[30, 4, 30]} segments={15} color="#b8c8d8" />

      <Water3D />
      <Terrain3D
        world={world}
        selectedX={selectedX}
        selectedY={selectedY}
        onSelect={onSelectRegion}
      />

      <ContactShadows
        position={[0, 0.05, 0]}
        opacity={0.45}
        scale={260}
        blur={2.5}
        far={80}
        color="#000814"
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={25}
        maxDistance={180}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 8, 0]}
      />

      <EffectComposer>
        <Bloom
          intensity={0.35}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette offset={0.3} darkness={0.55} blendFunction={BlendFunction.NORMAL} />
        <ChromaticAberration
          offset={[0.0004, 0.0004]}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    </>
  );
}

export function WorldScene3D({ world, selectedX, selectedY, onSelectRegion }: WorldScene3DProps) {
  return (
    <div className="world-scene-3d">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 70, 90], fov: 45, near: 0.5, far: 500 }}
        gl={{ antialias: true, toneMappingExposure: 1.15 }}
      >
        <Suspense fallback={null}>
          {world && (
            <SceneContent
              world={world}
              selectedX={selectedX}
              selectedY={selectedY}
              onSelectRegion={onSelectRegion}
            />
          )}
        </Suspense>
      </Canvas>

      {!world && (
        <div className="scene-loading">
          <div className="scene-loading-ring" />
          <p>Generating world...</p>
        </div>
      )}

      <div className="scene-hud-hint">
        Drag to orbit · Scroll to zoom · Click terrain to explore
      </div>
    </div>
  );
}
