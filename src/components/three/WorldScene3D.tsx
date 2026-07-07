import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type { WorldData } from '../../types/world';
import type { WeatherKind } from '../../lib/weather';
import { computeDayNight } from '../../lib/daynight';
import { buildTerrainGeometry, HEIGHT_SCALE } from '../../lib/terrainMesh';
import { Terrain3D } from './Terrain3D';
import { Vegetation3D } from './Vegetation3D';
import { Water3D } from './Water3D';
import { Weather3D } from './Weather3D';
import { ProceduralClouds } from './ProceduralClouds';

interface WorldScene3DProps {
  world: WorldData | null;
  selectedX?: number;
  selectedY?: number;
  timeOfDay: number;
  weather: WeatherKind;
  onSelectRegion: (x: number, y: number) => void;
}

function SceneContent({
  world,
  selectedX,
  selectedY,
  timeOfDay,
  weather,
  onSelectRegion,
}: {
  world: WorldData;
  selectedX?: number;
  selectedY?: number;
  timeOfDay: number;
  weather: WeatherKind;
  onSelectRegion: (x: number, y: number) => void;
}) {
  const terrain = useMemo(() => buildTerrainGeometry(world), [world]);
  const dayNight = useMemo(() => computeDayNight(timeOfDay), [timeOfDay]);

  return (
    <>
      <color attach="background" args={[dayNight.backgroundColor]} />
      <fog attach="fog" args={[dayNight.fogColor, 80, 320]} />

      <Sky
        distance={450000}
        sunPosition={dayNight.sunPosition}
        mieCoefficient={0.005}
        mieDirectionalG={0.9}
        rayleigh={0.4}
        turbidity={8}
      />

      <group visible={dayNight.starsVisible}>
        <Stars radius={300} depth={80} count={4000} factor={3} saturation={0.2} fade speed={0.3} />
      </group>

      <ambientLight intensity={dayNight.ambientIntensity} color="#8eb4d4" />
      <hemisphereLight args={['#87ceeb', '#2d4a2d', dayNight.hemiIntensity]} />
      <directionalLight
        position={dayNight.sunPosition}
        intensity={dayNight.sunIntensity}
        color={dayNight.sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={300}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-40, 20, -30]} intensity={dayNight.moonIntensity} color="#6b8cce" />

      <ProceduralClouds />

      <Water3D />
      <Terrain3D
        world={world}
        terrain={terrain}
        selectedX={selectedX}
        selectedY={selectedY}
        onSelect={onSelectRegion}
      />
      <Vegetation3D
        world={world}
        terrainSize={terrain.terrainSize}
        seaLevel={terrain.seaLevel}
        gridWidth={terrain.gridWidth}
        gridHeight={terrain.gridHeight}
      />
      <Weather3D
        kind={weather}
        areaSize={terrain.terrainSize * 1.2}
        topY={HEIGHT_SCALE * 1.6}
        bottomY={-2}
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

export function WorldScene3D({ world, selectedX, selectedY, timeOfDay, weather, onSelectRegion }: WorldScene3DProps) {
  return (
    <div className="world-scene-3d">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 70, 90], fov: 45, near: 0.5, far: 500 }}
        gl={{ antialias: true, toneMappingExposure: 1.15, preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          {world && (
            <SceneContent
              world={world}
              selectedX={selectedX}
              selectedY={selectedY}
              timeOfDay={timeOfDay}
              weather={weather}
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
