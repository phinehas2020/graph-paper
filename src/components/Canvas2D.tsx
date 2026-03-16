import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { formatMeasurement } from '@/src/tools/MeasurementUtils';
import { Point, Wall, WallOpening } from '@/src/model/types';
import usePlannerEditorStore from '@/src/planner/stores/usePlannerEditorStore';
import usePlannerSceneStore from '@/src/planner/stores/usePlannerSceneStore';
import usePlannerViewerStore from '@/src/planner/stores/usePlannerViewerStore';

interface Canvas2DProps {
  width: number;
  height: number;
  onToolAction?: (action: string, data: any) => void;
}

const GRID_SIZE = 20; // pixels per grid unit
const CONNECTION_THRESHOLD = 0.5; // grid units
const FLOOR_CLOSE_THRESHOLD = 0.75; // grid units
const FLOOR_EDGE_SNAP_THRESHOLD = 0.75; // grid units
const OPENING_PLACEMENT_THRESHOLD = 0.8; // grid units
const WALL_SELECTION_THRESHOLD = 0.75; // grid units
const OPENING_SELECTION_THRESHOLD = 0.95; // grid units
const DEFAULT_WALL_COLOR = '#f5f3ef';
const SELECTION_COLOR = '#f59e0b';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 10,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawPillLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options?: {
    background?: string;
    border?: string;
    color?: string;
  },
) {
  const background = options?.background ?? 'rgba(255, 255, 255, 0.92)';
  const border = options?.border ?? '#cbd5e1';
  const color = options?.color ?? '#0f172a';

  ctx.save();
  ctx.font = '12px "IBM Plex Mono", monospace';
  const textWidth = ctx.measureText(text).width;
  const pillWidth = textWidth + 18;
  const pillHeight = 22;

  drawRoundedRect(ctx, x - pillWidth / 2, y - pillHeight / 2, pillWidth, pillHeight, 11);
  ctx.fillStyle = background;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fill: string,
  outer = 'rgba(255, 255, 255, 0.96)',
  radius = 6,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
  ctx.fillStyle = outer;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function distanceBetweenPoints(pointA: Point, pointB: Point): number {
  return Math.sqrt((pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2);
}

function getPolylineLength(points: Point[]): number {
  if (points.length < 2) {
    return 0;
  }

  let totalLength = 0;
  for (let index = 1; index < points.length; index += 1) {
    totalLength += distanceBetweenPoints(points[index - 1], points[index]);
  }
  return totalLength;
}

function projectPointToSegment(point: Point, start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return start;
  }

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  const clampedT = Math.max(0, Math.min(1, t));

  return {
    x: start.x + dx * clampedT,
    y: start.y + dy * clampedT,
  };
}

function getPointToSegmentDistance(point: Point, start: Point, end: Point) {
  const projectedPoint = projectPointToSegment(point, start, end);
  return {
    projectedPoint,
    distance: distanceBetweenPoints(point, projectedPoint),
  };
}

function hexToRgba(color: string, alpha: number) {
  const normalized = color.replace('#', '');
  if (normalized.length !== 6) {
    return `rgba(148, 163, 184, ${alpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

interface WallPlacement {
  wall: Wall;
  point: Point;
  distance: number;
  t: number;
  length: number;
  direction: Point;
  normal: Point;
}

function getWallLength(wall: Wall): number {
  return distanceBetweenPoints(wall.start, wall.end);
}

function getWallOpeningCenter(wall: Wall, opening: WallOpening): Point {
  return {
    x: wall.start.x + (wall.end.x - wall.start.x) * opening.offset,
    y: wall.start.y + (wall.end.y - wall.start.y) * opening.offset,
  };
}

function getWallOpeningEndpoints(wall: Wall, opening: WallOpening): { start: Point; end: Point } {
  const wallLength = getWallLength(wall);
  if (wallLength === 0) {
    const center = getWallOpeningCenter(wall, opening);
    return { start: center, end: center };
  }

  const direction = {
    x: (wall.end.x - wall.start.x) / wallLength,
    y: (wall.end.y - wall.start.y) / wallLength,
  };
  const center = getWallOpeningCenter(wall, opening);
  const halfWidth = opening.width / 2;

  return {
    start: {
      x: center.x - direction.x * halfWidth,
      y: center.y - direction.y * halfWidth,
    },
    end: {
      x: center.x + direction.x * halfWidth,
      y: center.y + direction.y * halfWidth,
    },
  };
}

export const Canvas2D: React.FC<Canvas2DProps> = ({
  width,
  height,
  onToolAction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [previewPoint, setPreviewPoint] = useState<Point | null>(null);
  const [editingText, setEditingText] = useState<{id: string, text: string} | null>(null);
  const [textInput, setTextInput] = useState('');

  const activeTool = usePlannerEditorStore((state) => state.activeTool);
  const snapToFloorEdges = usePlannerEditorStore(
    (state) => state.snapToFloorEdges,
  );
  const selectedElement = usePlannerViewerStore((state) => state.selectedElement);
  const setSelectedElement = usePlannerViewerStore(
    (state) => state.setSelectedElement,
  );

  const { 
    wallNodes,
    floorNodes,
    measurements,
    textElements,
    settings,
    addFloor, 
    addWall, 
    addWallOpening,
    addMeasurement,
    addTextElement,
    updateTextElement,
    updateSettings,
    autoConnectNearbyWalls 
  } = usePlannerSceneStore();
  const walls = useMemo(
    () => wallNodes.map((node) => node.entity),
    [wallNodes],
  );
  const floors = useMemo(
    () => floorNodes.map((node) => node.entity),
    [floorNodes],
  );

  // Convert screen coordinates to grid coordinates
  const screenToGrid = useCallback((screenX: number, screenY: number): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    const x = (screenX - rect.left - width / 2) / GRID_SIZE;
    const y = -(screenY - rect.top - height / 2) / GRID_SIZE; // Flip Y axis
    
    return settings.gridVisible ? {
      x: Math.round(x * 2) / 2, // Snap to half-grid
      y: Math.round(y * 2) / 2
    } : { x, y };
  }, [width, height, settings.gridVisible]);

  // Convert grid coordinates to screen coordinates
  const gridToScreen = useCallback((gridX: number, gridY: number): Point => {
    return {
      x: gridX * GRID_SIZE + width / 2,
      y: -gridY * GRID_SIZE + height / 2 // Flip Y axis
    };
  }, [width, height]);

  // Find nearby wall endpoints for snapping
  const findNearbyEndpoint = useCallback((point: Point): {wallId: string, endpoint: 'start' | 'end', point: Point, distance: number} | null => {
    for (const wall of walls) {
      const startDist = distanceBetweenPoints(wall.start, point);
      const endDist = distanceBetweenPoints(wall.end, point);
      
      if (startDist <= CONNECTION_THRESHOLD) {
        return { wallId: wall.id, endpoint: 'start', point: wall.start, distance: startDist };
      }
      if (endDist <= CONNECTION_THRESHOLD) {
        return { wallId: wall.id, endpoint: 'end', point: wall.end, distance: endDist };
      }
    }
    return null;
  }, [walls]);

  const findClosestFloorEdgePoint = useCallback((point: Point): { point: Point; distance: number } | null => {
    let closest: { point: Point; distance: number } | null = null;

    floors.forEach((floor) => {
      if (floor.points.length < 2) {
        return;
      }

      for (let index = 0; index < floor.points.length; index += 1) {
        const start = floor.points[index];
        const end = floor.points[(index + 1) % floor.points.length];
        const projectedPoint = projectPointToSegment(point, start, end);
        const distance = distanceBetweenPoints(point, projectedPoint);

        if (distance <= FLOOR_EDGE_SNAP_THRESHOLD) {
          if (!closest || distance < closest.distance) {
            closest = {
              point: projectedPoint,
              distance,
            };
          }
        }
      }
    });

    return closest;
  }, [floors]);

  const resolveWallPoint = useCallback((point: Point): Point => {
    let resolvedPoint = point;
    let bestDistance = Number.POSITIVE_INFINITY;

    const nearbyEndpoint = findNearbyEndpoint(point);
    if (nearbyEndpoint) {
      resolvedPoint = nearbyEndpoint.point;
      bestDistance = nearbyEndpoint.distance;
    }

    if (snapToFloorEdges) {
      const floorEdgePoint = findClosestFloorEdgePoint(point);
      if (floorEdgePoint && floorEdgePoint.distance < bestDistance) {
        resolvedPoint = floorEdgePoint.point;
      }
    }

    return resolvedPoint;
  }, [findClosestFloorEdgePoint, findNearbyEndpoint, snapToFloorEdges]);

  const resolveFloorPoint = useCallback((point: Point): Point => {
    if (!isDrawing || currentPoints.length === 0) {
      return point;
    }

    if (currentPoints.length > 2) {
      const firstPoint = currentPoints[0];
      if (distanceBetweenPoints(point, firstPoint) <= FLOOR_CLOSE_THRESHOLD) {
        return firstPoint;
      }
    }

    const lastPoint = currentPoints[currentPoints.length - 1];
    if (distanceBetweenPoints(point, lastPoint) <= CONNECTION_THRESHOLD) {
      return lastPoint;
    }

    return point;
  }, [currentPoints, isDrawing]);

  const findClosestWallPlacement = useCallback((point: Point): WallPlacement | null => {
    let closestPlacement: WallPlacement | null = null;

    walls.forEach((wall) => {
      const length = getWallLength(wall);
      if (length === 0) {
        return;
      }

      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const projectedPoint = projectPointToSegment(point, wall.start, wall.end);
      const distance = distanceBetweenPoints(point, projectedPoint);

      if (distance > OPENING_PLACEMENT_THRESHOLD) {
        return;
      }

      const projectedDistance = distanceBetweenPoints(wall.start, projectedPoint);
      const t = projectedDistance / length;
      const direction = { x: dx / length, y: dy / length };
      const normal = { x: -direction.y, y: direction.x };

      if (!closestPlacement || distance < closestPlacement.distance) {
        closestPlacement = {
          wall,
          point: projectedPoint,
          distance,
          t,
          length,
          direction,
          normal,
        };
      }
    });

    return closestPlacement;
  }, [walls]);

  const createOpeningPayload = useCallback((
    type: 'door' | 'window',
    placement: WallPlacement,
  ): Omit<WallOpening, 'id'> | null => {
    const defaults =
      type === 'door'
        ? { width: 3, height: 2.35, bottom: 0, hingeSide: 'start' as const }
        : { width: 4, height: 1.4, bottom: 1.05, hingeSide: 'start' as const };

    const maxWidth = Math.max(1.5, placement.length - 0.6);
    if (maxWidth <= 1.25) {
      return null;
    }

    const openingWidth = Math.min(defaults.width, maxWidth);
    const halfRatio = openingWidth / (2 * placement.length);
    const offset = Math.max(halfRatio, Math.min(1 - halfRatio, placement.t));
    const availableHeight = Math.max(0.9, placement.wall.height - defaults.bottom - 0.2);
    const openingHeight = Math.min(defaults.height, availableHeight);

    if (openingHeight <= 0.75) {
      return null;
    }

    const overlapsExistingOpening = (placement.wall.openings ?? []).some((existingOpening) => {
      const centerDistance = Math.abs(existingOpening.offset - offset) * placement.length;
      const requiredClearance = (existingOpening.width + openingWidth) / 2 + 0.25;
      return centerDistance < requiredClearance;
    });

    if (overlapsExistingOpening) {
      return null;
    }

    return {
      type,
      offset,
      width: openingWidth,
      height: openingHeight,
      bottom: defaults.bottom,
      hingeSide: defaults.hingeSide,
    };
  }, []);

  const findClosestWallHit = useCallback((point: Point): Wall | null => {
    let closestWall: Wall | null = null;
    let smallestDistance = Number.POSITIVE_INFINITY;

    walls.forEach((wall) => {
      const threshold = Math.max(WALL_SELECTION_THRESHOLD, wall.thickness * 2.8);
      const { distance } = getPointToSegmentDistance(point, wall.start, wall.end);

      if (distance <= threshold && distance < smallestDistance) {
        closestWall = wall;
        smallestDistance = distance;
      }
    });

    return closestWall;
  }, [walls]);

  const findClosestOpeningHit = useCallback((point: Point): { wallId: string; openingId: string } | null => {
    let closestOpening: { wallId: string; openingId: string } | null = null;
    let smallestDistance = Number.POSITIVE_INFINITY;

    walls.forEach((wall) => {
      (wall.openings ?? []).forEach((opening) => {
        const endpoints = getWallOpeningEndpoints(wall, opening);
        const { distance } = getPointToSegmentDistance(point, endpoints.start, endpoints.end);

        if (distance <= OPENING_SELECTION_THRESHOLD && distance < smallestDistance) {
          closestOpening = {
            wallId: wall.id,
            openingId: opening.id,
          };
          smallestDistance = distance;
        }
      });
    });

    return closestOpening;
  }, [walls]);

  const drawOpeningSymbol = useCallback((
    ctx: CanvasRenderingContext2D,
    wall: Wall,
    opening: WallOpening,
    options?: { preview?: boolean; selected?: boolean },
  ) => {
    const preview = options?.preview ?? false;
    const selected = options?.selected ?? false;
    const openingEndpoints = getWallOpeningEndpoints(wall, opening);
    const start = gridToScreen(openingEndpoints.start.x, openingEndpoints.start.y);
    const end = gridToScreen(openingEndpoints.end.x, openingEndpoints.end.y);
    const centerPoint = getWallOpeningCenter(wall, opening);
    const center = gridToScreen(centerPoint.x, centerPoint.y);
    const screenDx = end.x - start.x;
    const screenDy = end.y - start.y;
    const screenLength = Math.sqrt(screenDx * screenDx + screenDy * screenDy);
    const wallWidth = Math.max(8, wall.thickness * GRID_SIZE * 5);

    if (screenLength === 0) {
      return;
    }

    const doorStroke = selected
      ? SELECTION_COLOR
      : preview
        ? 'rgba(249, 115, 22, 0.95)'
        : '#1d4ed8';
    const windowStroke = selected
      ? SELECTION_COLOR
      : preview
        ? 'rgba(34, 197, 94, 0.95)'
        : '#0ea5e9';
    const unitX = screenDx / screenLength;
    const unitY = screenDy / screenLength;
    const normalX = -unitY;
    const normalY = unitX;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = selected
      ? 'rgba(255, 245, 230, 0.98)'
      : preview
        ? 'rgba(255, 247, 237, 0.98)'
        : 'rgba(255, 255, 255, 0.98)';
    ctx.lineWidth = wallWidth + (selected ? 10 : preview ? 8 : 6);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    if (opening.type === 'door') {
      const hingeAtEnd = opening.hingeSide === 'end';
      const hinge = hingeAtEnd ? end : start;
      const farPoint = hingeAtEnd ? start : end;
      const closedAngle = Math.atan2(farPoint.y - hinge.y, farPoint.x - hinge.x);
      const openAngle = closedAngle + Math.PI / 3;
      const arcRadius = screenLength;

      ctx.strokeStyle = doorStroke;
      ctx.lineWidth = selected ? 2.8 : 2;

      ctx.beginPath();
      ctx.moveTo(start.x - normalX * (wallWidth * 0.42), start.y - normalY * (wallWidth * 0.42));
      ctx.lineTo(start.x + normalX * (wallWidth * 0.42), start.y + normalY * (wallWidth * 0.42));
      ctx.moveTo(end.x - normalX * (wallWidth * 0.42), end.y - normalY * (wallWidth * 0.42));
      ctx.lineTo(end.x + normalX * (wallWidth * 0.42), end.y + normalY * (wallWidth * 0.42));
      ctx.stroke();

      const leafEnd = {
        x: hinge.x + Math.cos(openAngle) * arcRadius,
        y: hinge.y + Math.sin(openAngle) * arcRadius,
      };

      ctx.beginPath();
      ctx.moveTo(hinge.x, hinge.y);
      ctx.lineTo(leafEnd.x, leafEnd.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hinge.x, hinge.y, arcRadius, closedAngle, openAngle);
      ctx.stroke();
    } else {
      ctx.strokeStyle = windowStroke;
      ctx.lineWidth = Math.max(selected ? 4 : 3, wallWidth * 0.45);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(center.x - normalX * (wallWidth * 0.75), center.y - normalY * (wallWidth * 0.75));
      ctx.lineTo(center.x + normalX * (wallWidth * 0.75), center.y + normalY * (wallWidth * 0.75));
      ctx.stroke();
    }

    ctx.restore();
  }, [gridToScreen]);

  // Drawing functions
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!settings.gridVisible) return;

    const gridSpacing = GRID_SIZE;
    const centerX = width / 2;
    const centerY = height / 2;
    const majorStep = gridSpacing * 5;

    ctx.save();

    // Vertical lines
    for (let x = centerX % gridSpacing; x < width; x += gridSpacing) {
      const isMajor = Math.abs((x - centerX) % majorStep) < 0.5;
      ctx.beginPath();
      ctx.strokeStyle = isMajor ? '#c7d3df' : '#e3eaf2';
      ctx.lineWidth = isMajor ? 1.2 : 1;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = centerY % gridSpacing; y < height; y += gridSpacing) {
      const isMajor = Math.abs((y - centerY) % majorStep) < 0.5;
      ctx.beginPath();
      ctx.strokeStyle = isMajor ? '#c7d3df' : '#e3eaf2';
      ctx.lineWidth = isMajor ? 1.2 : 1;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#9fb2c6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    ctx.restore();
  }, [width, height, settings.gridVisible]);

  const drawFloors = useCallback((ctx: CanvasRenderingContext2D) => {
    floors.forEach(floor => {
      if (floor.points.length < 3) return;

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.86)');
      gradient.addColorStop(1, 'rgba(218, 232, 245, 0.58)');

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#8fa2b6';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      const firstPoint = gridToScreen(floor.points[0].x, floor.points[0].y);
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (let index = 1; index < floor.points.length; index += 1) {
        const point = gridToScreen(floor.points[index].x, floor.points[index].y);
        ctx.lineTo(point.x, point.y);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.setLineDash([]);

      const centroid = floor.points.reduce(
        (acc, point) => ({
          x: acc.x + point.x / floor.points.length,
          y: acc.y + point.y / floor.points.length,
        }),
        { x: 0, y: 0 },
      );
      const centroidScreen = gridToScreen(centroid.x, centroid.y);
      drawPillLabel(ctx, `Floor ${floors.indexOf(floor) + 1}`, centroidScreen.x, centroidScreen.y, {
        background: 'rgba(255, 255, 255, 0.88)',
        border: '#d4dee8',
        color: '#475569',
      });

      ctx.restore();
    });
  }, [floors, gridToScreen, height, width]);

  const drawWalls = useCallback((ctx: CanvasRenderingContext2D) => {
    walls.forEach(wall => {
      const start = gridToScreen(wall.start.x, wall.start.y);
      const end = gridToScreen(wall.end.x, wall.end.y);
      const isSelectedWall =
        selectedElement?.type === 'wall'
          ? selectedElement.wallId === wall.id
          : selectedElement?.type === 'opening' && selectedElement.wallId === wall.id;
      const selectedOpeningId =
        selectedElement?.type === 'opening' && selectedElement.wallId === wall.id
          ? selectedElement.openingId
          : null;

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const wallWidth = Math.max(8, wall.thickness * GRID_SIZE * 5);
      const normalX = length === 0 ? 0 : -dy / length;
      const normalY = length === 0 ? 0 : dx / length;
      const labelX = (start.x + end.x) / 2 + normalX * 20;
      const labelY = (start.y + end.y) / 2 + normalY * 20;
      const wallColor = wall.color ?? DEFAULT_WALL_COLOR;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.strokeStyle = isSelectedWall
        ? 'rgba(245, 158, 11, 0.28)'
        : hexToRgba(wallColor, 0.18);
      ctx.lineWidth = wallWidth + (isSelectedWall ? 14 : 10);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.strokeStyle = isSelectedWall ? SELECTION_COLOR : '#2f6fb0';
      ctx.lineWidth = wallWidth + (isSelectedWall ? 3 : 2);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.strokeStyle = wallColor;
      ctx.lineWidth = wallWidth - 1;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      drawNode(ctx, start.x, start.y, isSelectedWall ? SELECTION_COLOR : '#3092ec');
      drawNode(ctx, end.x, end.y, isSelectedWall ? SELECTION_COLOR : '#3092ec');

      (wall.openings ?? []).forEach((opening) => {
        drawOpeningSymbol(ctx, wall, opening, {
          selected: selectedOpeningId === opening.id,
        });
      });

      drawPillLabel(ctx, formatMeasurement(length / GRID_SIZE), labelX, labelY, {
        background: 'rgba(255, 255, 255, 0.92)',
        border: isSelectedWall ? '#fcd34d' : '#bfdbfe',
        color: isSelectedWall ? '#b45309' : '#2563eb',
      });

      ctx.restore();
    });
  }, [walls, drawOpeningSymbol, gridToScreen, selectedElement]);

  const drawMeasurements = useCallback((ctx: CanvasRenderingContext2D) => {
    measurements.forEach(measurement => {
      const start = gridToScreen(measurement.start.x, measurement.start.y);
      const end = gridToScreen(measurement.end.x, measurement.end.y);
      
      // Measurement line
      ctx.strokeStyle = '#9C27B0';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Measurement endpoints
      ctx.fillStyle = '#9C27B0';
      ctx.beginPath();
      ctx.arc(start.x, start.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(end.x, end.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Calculate distance
      const distance = Math.sqrt(
        (measurement.end.x - measurement.start.x) ** 2 + 
        (measurement.end.y - measurement.start.y) ** 2
      );
      
      // Display measurement text
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const text = measurement.label || formatMeasurement(distance);
      drawPillLabel(ctx, text, midX, midY, {
        background: 'rgba(255, 255, 255, 0.96)',
        border: '#d8b4fe',
        color: '#7c3aed',
      });
    });
  }, [measurements, gridToScreen]);

  const drawTextElements = useCallback((ctx: CanvasRenderingContext2D) => {
    textElements.forEach(textElement => {
      const position = gridToScreen(textElement.position.x, textElement.position.y);
      
      ctx.save();
      ctx.translate(position.x, position.y);
      ctx.rotate((textElement.rotation * Math.PI) / 180);
      
      ctx.font = `${textElement.fontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Use current input text if this element is being edited
      const displayText = editingText?.id === textElement.id ? textInput : textElement.text;
      const textMetrics = ctx.measureText(displayText);
      const textWidth = textMetrics.width;
      const textHeight = textElement.fontSize;
      
      // Background
      ctx.fillStyle = editingText?.id === textElement.id ? 'rgba(255, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(-textWidth/2 - 4, -textHeight/2 - 2, textWidth + 8, textHeight + 4);
      
      // Border for editing
      if (editingText?.id === textElement.id) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(-textWidth/2 - 4, -textHeight/2 - 2, textWidth + 8, textHeight + 4);
      }
      
      // Text
      ctx.fillStyle = textElement.color;
      ctx.fillText(displayText, 0, 0);
      
      // Cursor for editing
      if (editingText?.id === textElement.id) {
        const cursorX = textWidth/2 + 2;
        ctx.strokeStyle = textElement.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cursorX, -textHeight/2);
        ctx.lineTo(cursorX, textHeight/2);
        ctx.stroke();
      }
      
      ctx.restore();
    });
  }, [textElements, gridToScreen, editingText, textInput]);

  const drawCurrentDrawing = useCallback((ctx: CanvasRenderingContext2D) => {
    if (activeTool === 'floor' && currentPoints.length > 0) {
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      const firstPoint = gridToScreen(currentPoints[0].x, currentPoints[0].y);
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      for (let index = 1; index < currentPoints.length; index += 1) {
        const point = gridToScreen(currentPoints[index].x, currentPoints[index].y);
        ctx.lineTo(point.x, point.y);
      }
      
      if (previewPoint) {
        const preview = gridToScreen(previewPoint.x, previewPoint.y);
        ctx.lineTo(preview.x, preview.y);

        const lastPoint = currentPoints[currentPoints.length - 1];
        const segmentLength = distanceBetweenPoints(lastPoint, previewPoint);
        const segmentMidpoint = gridToScreen(
          (lastPoint.x + previewPoint.x) / 2,
          (lastPoint.y + previewPoint.y) / 2,
        );

        drawPillLabel(
          ctx,
          `Segment ${formatMeasurement(segmentLength)}`,
          segmentMidpoint.x,
          segmentMidpoint.y - 18,
          {
            background: 'rgba(255, 247, 237, 0.96)',
            border: '#fdba74',
            color: '#c2410c',
          },
        );

        const livePathLength = getPolylineLength([...currentPoints, previewPoint]);
        drawPillLabel(
          ctx,
          `Run ${formatMeasurement(livePathLength)}`,
          preview.x + 56,
          preview.y - 20,
          {
            background: 'rgba(255, 255, 255, 0.96)',
            border: '#fed7aa',
            color: '#9a3412',
          },
        );
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Show points
      currentPoints.forEach(point => {
        const screenPoint = gridToScreen(point.x, point.y);
        drawNode(ctx, screenPoint.x, screenPoint.y, '#f97316', '#fff7ed', 4);
      });
    }
    
    if (activeTool === 'wall' && currentPoints.length === 1 && previewPoint) {
      const start = gridToScreen(currentPoints[0].x, currentPoints[0].y);
      const end = gridToScreen(previewPoint.x, previewPoint.y);
      
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const previewDistance = Math.sqrt(
        (previewPoint.x - currentPoints[0].x) ** 2 +
        (previewPoint.y - currentPoints[0].y) ** 2,
      );
      drawPillLabel(
        ctx,
        `Wall ${formatMeasurement(previewDistance)}`,
        (start.x + end.x) / 2,
        (start.y + end.y) / 2 - 18,
        {
          background: 'rgba(255, 247, 237, 0.95)',
          border: '#fdba74',
          color: '#c2410c',
        },
      );

      drawPillLabel(
        ctx,
        formatMeasurement(previewDistance),
        end.x + 52,
        end.y - 18,
        {
          background: 'rgba(255, 255, 255, 0.96)',
          border: '#fdba74',
          color: '#9a3412',
        },
      );
    }

    if ((activeTool === 'door' || activeTool === 'window') && previewPoint) {
      const placement = findClosestWallPlacement(previewPoint);
      if (placement) {
        const opening = createOpeningPayload(activeTool, placement);
        if (opening) {
          drawOpeningSymbol(ctx, placement.wall, { ...opening, id: 'preview' }, { preview: true });

          const labelPoint = gridToScreen(placement.point.x, placement.point.y);
          drawPillLabel(
            ctx,
            `${activeTool === 'door' ? 'Door' : 'Window'} ${formatMeasurement(opening.width)}`,
            labelPoint.x + placement.normal.x * 36,
            labelPoint.y + placement.normal.y * 36,
            {
              background: 'rgba(255, 255, 255, 0.96)',
              border: activeTool === 'door' ? '#fdba74' : '#67e8f9',
              color: activeTool === 'door' ? '#c2410c' : '#0f766e',
            },
          );
        }
      }
    }
    
    if (activeTool === 'measure' && currentPoints.length === 1 && previewPoint) {
      const start = gridToScreen(currentPoints[0].x, currentPoints[0].y);
      const end = gridToScreen(previewPoint.x, previewPoint.y);
      
      ctx.strokeStyle = '#9C27B0';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Show preview measurement
      const distance = Math.sqrt(
        (previewPoint.x - currentPoints[0].x) ** 2 + 
        (previewPoint.y - currentPoints[0].y) ** 2
      );
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      const text = formatMeasurement(distance);
      drawPillLabel(ctx, text, midX, midY, {
        background: 'rgba(255, 255, 255, 0.95)',
        border: '#d8b4fe',
        color: '#7c3aed',
      });
    }
    
    // Show measurement points being drawn
    if (activeTool === 'measure' && currentPoints.length > 0) {
      currentPoints.forEach(point => {
        const screenPoint = gridToScreen(point.x, point.y);
        drawNode(ctx, screenPoint.x, screenPoint.y, '#9333ea', '#f5f3ff', 4);
      });
    }
  }, [activeTool, createOpeningPayload, currentPoints, drawOpeningSymbol, findClosestWallPlacement, gridToScreen, previewPoint, settings.units]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width, height);

    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#fcfdff');
    background.addColorStop(1, '#f1f6fb');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    // Draw layers
    drawGrid(ctx);
    drawFloors(ctx);
    drawWalls(ctx);
    drawMeasurements(ctx);
    drawTextElements(ctx);
    drawCurrentDrawing(ctx);
  }, [width, height, drawGrid, drawFloors, drawWalls, drawMeasurements, drawTextElements, drawCurrentDrawing]);

  // Event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rawPoint = screenToGrid(e.clientX, e.clientY);
    const floorPoint = activeTool === 'floor' ? resolveFloorPoint(rawPoint) : rawPoint;
    const wallPoint = activeTool === 'wall' ? resolveWallPoint(rawPoint) : rawPoint;
    
    if (activeTool === 'floor') {
      if (!isDrawing) {
        setCurrentPoints([floorPoint]);
        setIsDrawing(true);
      } else {
        const lastPoint = currentPoints[currentPoints.length - 1];

        if (distanceBetweenPoints(lastPoint, floorPoint) <= CONNECTION_THRESHOLD) {
          return;
        }

        // Check if clicking near first point to close
        if (currentPoints.length > 2) {
          const firstPoint = currentPoints[0];
          const distance = distanceBetweenPoints(firstPoint, floorPoint);
          if (distance <= FLOOR_CLOSE_THRESHOLD) {
            // Close floor
            addFloor({
              points: currentPoints,
              elevation: 0,
              thickness: 0.2
            });
            setSelectedElement(null);
            setCurrentPoints([]);
            setIsDrawing(false);
            setPreviewPoint(null);
            onToolAction?.('floor-completed', { points: currentPoints });
            return;
          }
        }
        setCurrentPoints(prev => [...prev, floorPoint]);
      }
    }
    
    if (activeTool === 'wall') {
      if (!isDrawing) {
        setCurrentPoints([wallPoint]);
        setIsDrawing(true);
      } else {
        // Complete wall
        const wallId = addWall({
          start: currentPoints[0],
          end: wallPoint,
          height: 3,
          thickness: 0.15,
          color: DEFAULT_WALL_COLOR,
          openings: [],
        });
        
        // Auto-connect to nearby walls
        autoConnectNearbyWalls(CONNECTION_THRESHOLD);
        
        // Start new wall from current point
        setSelectedElement(null);
        setCurrentPoints([wallPoint]);
        onToolAction?.('wall-completed', { wallId, start: currentPoints[0], end: wallPoint });
      }
    }

    if (activeTool === 'door' || activeTool === 'window') {
      const placement = findClosestWallPlacement(rawPoint);
      if (placement) {
        const opening = createOpeningPayload(activeTool, placement);
        if (opening) {
          const openingId = addWallOpening(placement.wall.id, opening);
          setSelectedElement({
            type: 'opening',
            wallId: placement.wall.id,
            openingId,
          });
          onToolAction?.('opening-added', {
            openingId,
            wallId: placement.wall.id,
            type: activeTool,
          });
        }
      }
    }
    
    if (activeTool === 'measure') {
      if (!isDrawing) {
        setCurrentPoints([rawPoint]);
        setIsDrawing(true);
      } else {
        // Complete measurement
        const measurementId = addMeasurement({
          start: currentPoints[0],
          end: rawPoint,
          showDimensions: true,
          units: settings.units,
          temporary: settings.measurementMode === 'temporary'
        });
        
        // Start new measurement from current point (like wall tool)
        setCurrentPoints([rawPoint]);
        onToolAction?.('measurement-completed', { measurementId, start: currentPoints[0], end: rawPoint });
      }
    }
    
    if (activeTool === 'text') {
      // Add text element
      const textId = addTextElement({
        position: rawPoint,
        text: 'Text',
        fontSize: 16,
        color: '#000000',
        rotation: 0
      });
      setEditingText({ id: textId, text: 'Text' });
      setTextInput('Text');
      updateSettings({ isTextEditing: true });
      onToolAction?.('text-added', { id: textId, position: rawPoint });
    }
    
    if (activeTool === 'select') {
      const openingHit = findClosestOpeningHit(rawPoint);
      if (openingHit) {
        setSelectedElement({
          type: 'opening',
          wallId: openingHit.wallId,
          openingId: openingHit.openingId,
        });
        return;
      }

      const wallHit = findClosestWallHit(rawPoint);
      if (wallHit) {
        setSelectedElement({
          type: 'wall',
          wallId: wallHit.id,
        });
        return;
      }

      setSelectedElement(null);
    }
  }, [activeTool, addFloor, addMeasurement, addTextElement, addWall, addWallOpening, autoConnectNearbyWalls, createOpeningPayload, currentPoints, findClosestOpeningHit, findClosestWallHit, findClosestWallPlacement, isDrawing, onToolAction, resolveFloorPoint, resolveWallPoint, screenToGrid, setSelectedElement, settings.measurementMode, settings.units, updateSettings]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rawPoint = screenToGrid(e.clientX, e.clientY);
    const point = activeTool === 'wall'
      ? resolveWallPoint(rawPoint)
      : activeTool === 'floor'
        ? resolveFloorPoint(rawPoint)
        : rawPoint;
    
    if (isDrawing || activeTool === 'door' || activeTool === 'window') {
      setPreviewPoint(point);
    }
  }, [activeTool, isDrawing, resolveFloorPoint, resolveWallPoint, screenToGrid]);

  const handleMouseUp = useCallback(() => {
    return undefined;
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (editingText) {
        // Finish editing text
        updateTextElement(editingText.id, { text: textInput });
        setEditingText(null);
        setTextInput('');
        updateSettings({ isTextEditing: false });
      } else {
        setCurrentPoints([]);
        setIsDrawing(false);
        setPreviewPoint(null);
      }
    }
    if (e.key === 'Enter' && activeTool === 'wall' && isDrawing) {
      setCurrentPoints([]);
      setIsDrawing(false);
      setPreviewPoint(null);
    }
    if (e.key === 'Enter' && activeTool === 'measure' && isDrawing) {
      setCurrentPoints([]);
      setIsDrawing(false);
      setPreviewPoint(null);
    }
    if (e.key === 'Enter' && editingText) {
      // Finish editing text
      updateTextElement(editingText.id, { text: textInput });
      setEditingText(null);
      setTextInput('');
      updateSettings({ isTextEditing: false });
    }
  }, [activeTool, isDrawing, editingText, textInput, updateTextElement, updateSettings]);

  const handleTextInput = useCallback((e: KeyboardEvent) => {
    if (editingText && settings.isTextEditing) {
      // Prevent all other keyboard shortcuts when editing text
      if (e.key !== 'Escape' && e.key !== 'Enter') {
        e.preventDefault();
        e.stopPropagation();
      }
      
      if (e.key === 'Backspace') {
        setTextInput(prev => prev.slice(0, -1));
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setTextInput(prev => prev + e.key);
      }
    }
  }, [editingText, settings.isTextEditing]);

  // Effects
  useEffect(() => {
    render();
  }, [render]);

  const previousToolRef = useRef(activeTool);

  useEffect(() => {
    if (previousToolRef.current === activeTool) {
      return;
    }

    if (editingText) {
      updateTextElement(editingText.id, { text: textInput });
      setEditingText(null);
      setTextInput('');
      updateSettings({ isTextEditing: false });
    }

    setCurrentPoints([]);
    setIsDrawing(false);
    setPreviewPoint(null);
    previousToolRef.current = activeTool;
  }, [activeTool, editingText, textInput, updateSettings, updateTextElement]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleTextInput);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleTextInput);
    };
  }, [handleKeyDown, handleTextInput]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: '100%',
        height: '100%',
        cursor:
          activeTool === 'select' || activeTool === null
            ? 'default'
            : 'crosshair',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};

export default Canvas2D;
