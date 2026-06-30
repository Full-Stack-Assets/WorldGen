import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorldData } from '../types/world';
import { biomeColor } from '../lib/colors';

interface WorldCanvasProps {
  world: WorldData | null;
  onSelectRegion: (x: number, y: number) => void;
  selectedX?: number;
  selectedY?: number;
}

export function WorldCanvas({ world, onSelectRegion, selectedX, selectedY }: WorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const renderWorld = useCallback(() => {
    if (!world || !canvasRef.current) return;

    const { cells, config } = world;
    const { width, height } = config;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = cells[y][x];
        const [r, g, b] = biomeColor(cell.biome, cell.elevation);
        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    imageDataRef.current = imageData;
  }, [world]);

  useEffect(() => {
    renderWorld();
  }, [renderWorld]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !world) return;

    const displayCanvas = container.querySelector('.display-canvas') as HTMLCanvasElement;
    if (!displayCanvas) return;

    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    displayCanvas.width = rect.width;
    displayCanvas.height = rect.height;

    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const scale = zoom;
    const drawW = canvas.width * scale;
    const drawH = canvas.height * scale;
    const offsetX = (rect.width - drawW) / 2 + pan.x;
    const offsetY = (rect.height - drawH) / 2 + pan.y;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, offsetX, offsetY, drawW, drawH);

    if (selectedX !== undefined && selectedY !== undefined) {
      const cellSize = scale;
      const sx = offsetX + selectedX * cellSize;
      const sy = offsetY + selectedY * cellSize;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, cellSize, cellSize);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(sx, sy, cellSize, cellSize);
    }
  }, [world, zoom, pan, selectedX, selectedY]);

  useEffect(() => {
    draw();
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  const screenToWorld = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || !world) return null;

      const rect = container.getBoundingClientRect();
      const scale = zoom;
      const drawW = canvas.width * scale;
      const drawH = canvas.height * scale;
      const offsetX = (rect.width - drawW) / 2 + pan.x;
      const offsetY = (rect.height - drawH) / 2 + pan.y;

      const wx = Math.floor((clientX - rect.left - offsetX) / scale);
      const wy = Math.floor((clientY - rect.top - offsetY) / scale);

      if (wx < 0 || wy < 0 || wx >= world.config.width || wy >= world.config.height) return null;
      return { x: wx, y: wy };
    },
    [world, zoom, pan],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.max(0.5, Math.min(16, z * delta)));
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || e.button === 2 || e.altKey || e.shiftKey) {
        setDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      }
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
    },
    [dragging],
  );

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragging) return;
      const pos = screenToWorld(e.clientX, e.clientY);
      if (pos) onSelectRegion(pos.x, pos.y);
    },
    [dragging, screenToWorld, onSelectRegion],
  );

  const exportPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `worldgen-${world?.seed ?? 'map'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [world]);

  return (
    <div className="world-canvas-wrapper">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div
        ref={containerRef}
        className="world-canvas-container"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas className="display-canvas" />
        <div className="canvas-hint">
          Click to explore · Scroll to zoom · Shift+drag to pan
        </div>
      </div>
      <button className="btn btn-ghost btn-sm export-btn" onClick={exportPng} type="button">
        Export PNG
      </button>
    </div>
  );
}
