import { useEffect, useRef } from 'react';
import type { WorldData } from '../types/world';
import { BIOME_COLORS } from '../lib/colors';
import { pixelToCell } from '../lib/minimap';

interface MinimapProps {
  world: WorldData;
  selectedX?: number;
  selectedY?: number;
  onSelect: (x: number, y: number) => void;
}

// Top-down 2D overview. The canvas intrinsic size equals the grid so each cell
// is one pixel; CSS scales it up (pixelated) and clicks map back via pixelToCell.
export function Minimap({ world, selectedX, selectedY, onSelect }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { config, cells, settlements } = world;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = config.width;
    canvas.height = config.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = ctx.createImageData(config.width, config.height);
    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const [r, g, b] = BIOME_COLORS[cells[y][x].biome];
        const i = (y * config.width + x) * 4;
        image.data[i] = r;
        image.data[i + 1] = g;
        image.data[i + 2] = b;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);

    // Settlement dots.
    ctx.fillStyle = '#fde68a';
    for (const s of settlements) {
      ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
    }

    // Selected region marker.
    if (selectedX !== undefined && selectedY !== undefined) {
      ctx.strokeStyle = '#a5b4fc';
      ctx.lineWidth = Math.max(1, Math.round(config.width / 96));
      ctx.strokeRect(selectedX - 2, selectedY - 2, 5, 5);
    }
  }, [config, cells, settlements, selectedX, selectedY]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { x, y } = pixelToCell(
      e.clientX - rect.left,
      e.clientY - rect.top,
      rect.width,
      rect.height,
      config.width,
      config.height,
    );
    onSelect(x, y);
  };

  return (
    <div className="panel-section minimap-panel">
      <h3>Overview</h3>
      <canvas
        ref={canvasRef}
        className="minimap-canvas"
        onClick={handleClick}
        role="img"
        aria-label="World overview map — click to explore a region"
      />
      <p className="hint">Click the map to jump to a region.</p>
    </div>
  );
}
