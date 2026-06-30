import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorldData } from '../types/world';
import { biomeColor } from '../lib/colors';

interface WorldCanvasProps {
  world: WorldData | null;
  onSelectRegion: (x: number, y: number) => void;
  selectedX?: number;
  selectedY?: number;
}

function fitZoom(containerW: number, containerH: number, mapW: number, mapH: number): number {
  if (containerW <= 0 || containerH <= 0) return 1;
  return Math.min(containerW / mapW, containerH / mapH, 4);
}

export function WorldCanvas({ world, onSelectRegion, selectedX, selectedY }: WorldCanvasProps) {
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const lastTouch = useRef<{ x: number; y: number } | null>(null);

  const renderSource = useCallback(() => {
    if (!world || !sourceCanvasRef.current) return;

    const { cells, config } = world;
    const { width, height } = config;
    const canvas = sourceCanvasRef.current;
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
  }, [world]);

  const getContainerSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { width: 0, height: 0 };

    const rect = container.getBoundingClientRect();
    const width = rect.width || container.clientWidth || window.innerWidth;
    const height = rect.height || container.clientHeight || Math.max(window.innerHeight * 0.4, 280);
    return { width, height };
  }, []);

  const draw = useCallback(() => {
    const source = sourceCanvasRef.current;
    const display = displayCanvasRef.current;
    if (!source || !display || !world) return;

    const { width: cw, height: ch } = getContainerSize();
    if (cw <= 0 || ch <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    display.width = Math.floor(cw * dpr);
    display.height = Math.floor(ch * dpr);
    display.style.width = `${cw}px`;
    display.style.height = `${ch}px`;

    const ctx = display.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, cw, ch);

    const drawW = source.width * zoom;
    const drawH = source.height * zoom;
    const offsetX = (cw - drawW) / 2 + pan.x;
    const offsetY = (ch - drawH) / 2 + pan.y;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, offsetX, offsetY, drawW, drawH);

    if (selectedX !== undefined && selectedY !== undefined) {
      const cellSize = zoom;
      const sx = offsetX + selectedX * cellSize;
      const sy = offsetY + selectedY * cellSize;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, cellSize, cellSize);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(sx, sy, cellSize, cellSize);
    }
  }, [world, zoom, pan, selectedX, selectedY, getContainerSize]);

  useEffect(() => {
    renderSource();
  }, [renderSource]);

  useEffect(() => {
    if (!world) return;

    const { width: cw, height: ch } = getContainerSize();
    const initialZoom = fitZoom(cw, ch, world.config.width, world.config.height);
    setZoom(initialZoom);
    setPan({ x: 0, y: 0 });
  }, [world, getContainerSize]);

  useEffect(() => {
    draw();

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => draw());
    observer.observe(container);

    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [draw]);

  const screenToWorld = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const source = sourceCanvasRef.current;
      const container = containerRef.current;
      if (!source || !container || !world) return null;

      const rect = container.getBoundingClientRect();
      const drawW = source.width * zoom;
      const drawH = source.height * zoom;
      const offsetX = (rect.width - drawW) / 2 + pan.x;
      const offsetY = (rect.height - drawH) / 2 + pan.y;

      const wx = Math.floor((clientX - rect.left - offsetX) / zoom);
      const wy = Math.floor((clientY - rect.top - offsetY) / zoom);

      if (wx < 0 || wy < 0 || wx >= world.config.width || wy >= world.config.height) return null;
      return { x: wx, y: wy };
    },
    [world, zoom, pan],
  );

  const handlePointerDown = useCallback(
    (clientX: number, clientY: number, isPanGesture: boolean) => {
      if (isPanGesture) {
        setDragging(true);
        dragStart.current = { x: clientX, y: clientY, panX: pan.x, panY: pan.y };
        lastTouch.current = null;
      } else {
        lastTouch.current = { x: clientX, y: clientY };
      }
    },
    [pan],
  );

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragging) return;
      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;
      setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
    },
    [dragging],
  );

  const handlePointerUp = useCallback(
    (clientX: number, clientY: number) => {
      if (dragging) {
        setDragging(false);
        return;
      }
      if (lastTouch.current) {
        const dx = Math.abs(clientX - lastTouch.current.x);
        const dy = Math.abs(clientY - lastTouch.current.y);
        if (dx < 10 && dy < 10) {
          const pos = screenToWorld(clientX, clientY);
          if (pos) onSelectRegion(pos.x, pos.y);
        }
      }
      lastTouch.current = null;
    },
    [dragging, screenToWorld, onSelectRegion],
  );

  const exportPng = useCallback(() => {
    const canvas = sourceCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `worldgen-${world?.seed ?? 'map'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [world]);

  return (
    <div className="world-canvas-wrapper">
      <canvas ref={sourceCanvasRef} className="source-canvas" aria-hidden="true" />
      <div
        ref={containerRef}
        className="world-canvas-container"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY, e.shiftKey || e.button === 1)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={(e) => handlePointerUp(e.clientX, e.clientY)}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            const t = e.touches[0];
            handlePointerDown(t.clientX, t.clientY, e.touches.length > 1);
          } else if (e.touches.length === 2) {
            setDragging(true);
            dragStart.current = {
              x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
              y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
              panX: pan.x,
              panY: pan.y,
            };
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 1 && dragging) {
            e.preventDefault();
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
          } else if (e.touches.length === 2) {
            e.preventDefault();
            const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            handlePointerMove(cx, cy);
          }
        }}
        onTouchEnd={(e) => {
          if (e.changedTouches.length === 1) {
            const t = e.changedTouches[0];
            handlePointerUp(t.clientX, t.clientY);
          }
          setDragging(false);
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={displayCanvasRef} className="display-canvas" />
        {!world && <div className="canvas-placeholder">Generating map...</div>}
        <div className="canvas-hint">Tap to explore · Pinch or drag to pan</div>
      </div>
      <button className="btn btn-ghost btn-sm export-btn" onClick={exportPng} type="button" disabled={!world}>
        Export PNG
      </button>
    </div>
  );
}
