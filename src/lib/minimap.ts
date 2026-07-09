// Pure projection helpers shared by the Minimap component. Kept separate from
// React/DOM so the coordinate math is unit-testable.

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Maps a click at (px, py) within a canvas of size canvasW×canvasH to a grid
// cell, clamped to valid bounds.
export function pixelToCell(
  px: number,
  py: number,
  canvasW: number,
  canvasH: number,
  gridW: number,
  gridH: number,
): { x: number; y: number } {
  const x = clamp(Math.floor((px / canvasW) * gridW), 0, gridW - 1);
  const y = clamp(Math.floor((py / canvasH) * gridH), 0, gridH - 1);
  return { x, y };
}

// Center pixel of a grid cell within a canvas of size canvasW×canvasH.
export function cellToPixel(
  x: number,
  y: number,
  canvasW: number,
  canvasH: number,
  gridW: number,
  gridH: number,
): { px: number; py: number } {
  return {
    px: ((x + 0.5) / gridW) * canvasW,
    py: ((y + 0.5) / gridH) * canvasH,
  };
}
