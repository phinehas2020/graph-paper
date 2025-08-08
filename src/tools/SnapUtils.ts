import { Point, FlatPiece } from '@/src/model/types';

export function snapToGrid(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

export function findNearestWall(point: Point, walls: FlatPiece[]): { wallId: string | null; distance: number } {
  let nearestWallId: string | null = null;
  let minDistance = Number.POSITIVE_INFINITY;
  for (const wall of walls) {
    const distance = distanceToRect(point, wall);
    if (distance < minDistance) {
      minDistance = distance;
      nearestWallId = wall.id;
    }
  }
  return { wallId: nearestWallId, distance: minDistance };
}

export function projectPointToWall(point: Point, wall: FlatPiece): Point {
  const left = wall.position.x;
  const right = wall.position.x + wall.dimensions.width;
  const top = wall.position.y;
  const bottom = wall.position.y + wall.dimensions.height;

  // Clamp to wall rectangle edges (closest point on rectangle perimeter)
  const clampedX = Math.max(left, Math.min(point.x, right));
  const clampedY = Math.max(top, Math.min(point.y, bottom));

  // Determine whether to snap to horizontal or vertical edge based on proximity
  const distances = [
    { d: Math.abs(clampedY - top), p: { x: clampedX, y: top } },
    { d: Math.abs(bottom - clampedY), p: { x: clampedX, y: bottom } },
    { d: Math.abs(clampedX - left), p: { x: left, y: clampedY } },
    { d: Math.abs(right - clampedX), p: { x: right, y: clampedY } },
  ];
  distances.sort((a, b) => a.d - b.d);
  return distances[0].p;
}

function distanceToRect(point: Point, wall: FlatPiece): number {
  const left = wall.position.x;
  const right = wall.position.x + wall.dimensions.width;
  const top = wall.position.y;
  const bottom = wall.position.y + wall.dimensions.height;

  const dx = Math.max(left - point.x, 0, point.x - right);
  const dy = Math.max(top - point.y, 0, point.y - bottom);
  return Math.hypot(dx, dy);
}


