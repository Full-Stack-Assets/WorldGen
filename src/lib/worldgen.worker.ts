import { generateWorld } from './worldgen';
import type { WorldConfig } from '../types/world';

// Dedicated worker: runs the pure, deterministic generation pipeline off the
// main thread so large (Ultra 320²) grids never block UI or input.
addEventListener('message', (event: MessageEvent<{ id: number; config: WorldConfig }>) => {
  const { id, config } = event.data;
  const world = generateWorld(config);
  postMessage({ id, world });
});
