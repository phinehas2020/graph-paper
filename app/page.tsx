'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedToolbar } from '@/components/AnimatedToolbar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProjectsModal } from '@/components/projects/ProjectsModal';
import useStore from '@/src/model/useStore';
import {
  PenLine,
  Move,
  MousePointer,
  Orbit,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Ruler,
  EraserIcon,
  Square,
  Circle,
  ArrowRight,
  Grid3X3,
  Palette,
  RotateCcw,
  Download,
  Scissors,
  Trash2,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Maximize,
  Minimize,
  Baseline,
  ScanSearch,
  Package,
  Zap,
  Wrench,
  Minus,
  Plus,
  Type,
  Eraser,
  Droplets,
  User,
  LogOut,
  Save,
  FolderOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Add mode type
type AppMode = 'traditional';

type Tool =
  | 'select'
  | 'area-delete'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'text'
  | 'arc'
  | 'pan'
  | 'measure'
  | 'eraser'
  | 'wiring'
  | 'plumbing'
  | 'fullscreen';
type EraserMode = 'partial' | 'whole';
type Point = { x: number; y: number };
type Line = {
  start: Point;
  end: Point;
  color?: string;
  thickness?: number;
};
type Arc = {
  start: Point;
  end: Point;
  control: Point;
  color?: string;
  thickness?: number;
};
type Rectangle = {
  start: Point;
  end: Point;
  color?: string;
  thickness?: number;
  filled?: boolean;
};
type CircleShape = {
  center: Point;
  radius: number;
  color?: string;
  thickness?: number;
  filled?: boolean;
};
type Arrow = { start: Point; end: Point; color?: string; thickness?: number };
type TextElement = {
  position: Point;
  text: string;
  color?: string;
  fontSize?: number;
};
type Measurement = {
  start: Point;
  end: Point;
  color?: string;
  thickness?: number;
};

type ElectricalOutlet = {
  id: string;
  position: Point;
  type: 'standard' | 'gfci' | 'usb';
};

type PlumbingFixture = {
  id: string;
  position: Point;
  type: 'sink' | 'toilet' | 'shower' | 'bathtub' | 'dishwasher' | 'washing_machine';
};

type ElectricalWire = {
  id: string;
  start: Point;
  end: Point;
  outletIds: string[];
};

type PlumbingPipe = {
  id: string;
  start: Point;
  end: Point;
  fixtureIds: string[];
  type: 'water' | 'drain';
};

interface CanvasState {
  lines: Line[];
  arcs: Arc[];
  rectangles: Rectangle[];
  circles: CircleShape[];
  arrows: Arrow[];
  texts: TextElement[];
  measurements: Measurement[];
  electricalOutlets: ElectricalOutlet[];
  plumbingFixtures: PlumbingFixture[];
  electricalWires: ElectricalWire[];
  plumbingPipes: PlumbingPipe[];
}

const EPSILON = 0.001;
const COLORS = [
  '#000000',
  '#dc2626',
  '#2563eb',
  '#16a34a',
  '#ca8a04',
  '#9333ea',
  '#c2410c',
];
const THICKNESSES = [1, 2, 4, 6];
const MOBILE_COLORS = COLORS.slice(0, 2);
const MOBILE_THICKNESSES = THICKNESSES.slice(0, 2);

const STUD_SPACING_UNITS = 1.33; // Represents 16 inches (16/12 feet)

// Vector Math Helpers
const vec = (p1: Point, p2: Point): Point => ({
  x: p2.x - p1.x,
  y: p2.y - p1.y,
});
const add = (p1: Point, p2: Point): Point => ({
  x: p1.x + p2.x,
  y: p1.y + p2.y,
});
const sub = (p1: Point, p2: Point): Point => ({
  x: p1.x - p2.x,
  y: p1.y - p2.y,
});
const scale = (p: Point, s: number): Point => ({ x: p.x * s, y: p.y * s });
const dot = (p1: Point, p2: Point): number => p1.x * p2.x + p1.y * p2.y;
const distSq = (p1: Point, p2: Point): number =>
  (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
const dist = (p1: Point, p2: Point): number => Math.sqrt(distSq(p1, p2));
const len = (p: Point): number => Math.sqrt(dot(p, p));
const normalize = (p: Point): Point => {
  const l = len(p);
  return l < EPSILON ? { x: 0, y: 0 } : scale(p, 1 / l);
};

// Geometry Helpers
function projectPointOntoLine(p: Point, a: Point, b: Point): Point {
  const ab = vec(a, b);
  const ap = vec(a, p);
  const lenAbSq = dot(ab, ab);
  if (lenAbSq < EPSILON) return a;
  const t = dot(ap, ab) / lenAbSq;
  return add(a, scale(ab, t));
}

function clampPointToSegment(p: Point, a: Point, b: Point): Point {
  const ab = vec(a, b);
  const ap = vec(a, p);
  const lenAbSq = dot(ab, ab);
  if (lenAbSq < EPSILON) return a;
  let t = dot(ap, ab) / lenAbSq;
  t = Math.max(0, Math.min(1, t));
  return add(a, scale(ab, t));
}

function distancePointToLineSegment(p: Point, a: Point, b: Point): number {
  const closestPoint = clampPointToSegment(projectPointOntoLine(p, a, b), a, b);
  return dist(p, closestPoint);
}

// Helper to get points on a quadratic bezier curve
function getPointsOnArc(arc: Arc, numPoints = 20): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const x =
      (1 - t) * (1 - t) * arc.start.x +
      2 * (1 - t) * t * arc.control.x +
      t * t * arc.end.x;
    const y =
      (1 - t) * (1 - t) * arc.start.y +
      2 * (1 - t) * t * arc.control.y +
      t * t * arc.end.y;
    points.push({ x, y });
  }
  return points;
}

const tools: {
  name: Tool;
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  color?: string;
}[] = [
  {
    name: 'select',
    icon: MousePointer,
    label: 'Select',
    shortcut: 'V',
    color: '#6366f1',
  },
  {
    name: 'line',
    icon: PenLine,
    label: 'Line',
    shortcut: 'L',
    color: '#ef4444',
  },
  {
    name: 'rectangle',
    icon: Square,
    label: 'Rectangle',
    shortcut: 'R',
    color: '#f97316',
  },
  {
    name: 'circle',
    icon: Circle,
    label: 'Circle',
    shortcut: 'C',
    color: '#eab308',
  },
  { name: 'arc', icon: Orbit, label: 'Arc', shortcut: 'O', color: '#22c55e' },
  {
    name: 'arrow',
    icon: ArrowRight,
    label: 'Arrow',
    shortcut: 'A',
    color: '#06b6d4',
  },
  {
    name: 'text',
    icon: Baseline,
    label: 'Text',
    shortcut: 'T',
    color: '#8b5cf6',
  },
  {
    name: 'measure',
    icon: Ruler,
    label: 'Measure',
    shortcut: 'M',
    color: '#ec4899',
  },
  {
    name: 'eraser',
    icon: EraserIcon,
    label: 'Eraser',
    shortcut: 'E',
    color: '#64748b',
  },
  {
    name: 'pan',
    icon: Move,
    label: 'Navigate',
    shortcut: 'P',
    color: '#84cc16',
  },
  {
    name: 'fullscreen',
    icon: Maximize,
    label: 'Fullscreen',
    shortcut: 'F',
    color: '#0ea5e9',
  },
  {
    name: 'area-delete',
    icon: ScanSearch,
    label: 'Area Delete',
    shortcut: 'D',
    color: '#f43f5e', // Rose color for destructive action
  },
  {
    name: 'wiring',
    icon: Zap,
    label: 'Wiring',
    shortcut: 'W',
    color: '#22c55e', // Green as requested
  },
  {
    name: 'plumbing',
    icon: Wrench,
    label: 'Water Fixtures',
    shortcut: 'U',
    color: '#3b82f6', // Blue as requested
  },
];

export default function EnhancedGraphPaper() {
  const isMobile = useIsMobile();
  const router = useRouter();
  
  // Add store integration and mode state
  const { 
    settings, 
    switchMode
  } = useStore();
  
  const [currentMode, setCurrentMode] = useState<AppMode>('traditional');
  
  const coreToolNames: Tool[] = [
    'select',
    'line',
    'rectangle',
    'text',
    'eraser',
    'pan',
    'fullscreen',
  ];
  const [showAllMobileTools, setShowAllMobileTools] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [tool, setTool] = useState<Tool>('line');
  const [designMode, setDesignMode] = useState<'graph' | 'residential'>(
    'graph',
  );

  const [currentStudSpacing, setCurrentStudSpacing] = useState<number>(1.33); // Default 1.33 feet (16 inches)
  const [eraserMode, setEraserMode] = useState<EraserMode>('partial'); // Default to partial
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentThickness, setCurrentThickness] = useState(2);
  const [gridSize, setGridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [startPanPoint, setStartPanPoint] = useState<Point>({ x: 0, y: 0 });

  const [arcPoints, setArcPoints] = useState<Point[]>([]);
  const [activeShapeStartPoint, setActiveShapeStartPoint] =
    useState<Point | null>(null);
  const [activeShapeEndPoint, setActiveShapeEndPoint] = useState<Point | null>(
    null,
  );

  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null);
  const [eraserStrokePoints, setEraserStrokePoints] = useState<Point[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [editingText, setEditingText] = useState<{
    position: Point;
    currentText: string;
  } | null>(null);
  const [selectedTextElement, setSelectedTextElement] =
    useState<TextElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Measure tool state
  const [measurePoints, setMeasurePoints] = useState<Point[]>([]);
  const [keepMeasurements, setKeepMeasurements] = useState(false);
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [textInputStartTime, setTextInputStartTime] = useState<number>(0);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Authentication and modal states
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);

  const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);
  const [isMultiTouch, setIsMultiTouch] = useState(false);

  // State for area selection
  const [selectionRect, setSelectionRect] = useState<{
    start: Point;
    end: Point;
  } | null>(null);
  const [selectedElementIndices, setSelectedElementIndices] = useState<
    number[]
  >([]); // Using indices for now

  const [history, setHistory] = useState<CanvasState[]>([
    {
      lines: [],
      arcs: [],
      rectangles: [],
      circles: [],
      arrows: [],
      texts: [],
      measurements: [],
      electricalOutlets: [],
      plumbingFixtures: [],
      electricalWires: [],
      plumbingPipes: [],
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eraserWidth = gridSize / 1.5;

  const currentState = useMemo(
    () => history[historyIndex],
    [history, historyIndex],
  );

  const displayedTools = useMemo(() => {
    const all = tools.map((t) =>
      t.name === 'fullscreen'
        ? {
            ...t,
            icon: isFullscreen ? Minimize : Maximize,
            label: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
          }
        : t,
    );
    if (!isMobile) return all;
    if (showAllMobileTools) return all;
    return all.filter((t) => coreToolNames.includes(t.name as Tool));
  }, [isMobile, showAllMobileTools, tools, isFullscreen]);

  const colorOptions = useMemo(
    () => (isMobile ? MOBILE_COLORS : COLORS),
    [isMobile],
  );

  const thicknessOptions = useMemo(
    () => (isMobile ? MOBILE_THICKNESSES : THICKNESSES),
    [isMobile],
  );

  const triggerFeedback = useCallback(() => {
    setIsAnimating(true);
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }
    setTimeout(() => setIsAnimating(false), 200);
  }, [isMobile]);

  const addToHistory = (newState: Partial<CanvasState>) => {
    const nextState: CanvasState = { ...currentState, ...newState };
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, nextState]);
    setHistoryIndex(newHistory.length);
  };

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      triggerFeedback();
    }
  }, [historyIndex, triggerFeedback]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      triggerFeedback();
    }
  }, [historyIndex, history.length, triggerFeedback]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    triggerFeedback();
  }, [triggerFeedback]);

  const getCanvasPoint = (e: { clientX: number; clientY: number }): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getWorldPoint = useCallback(
    (canvasPoint: Point): Point => ({
      x: (canvasPoint.x - panOffset.x) / zoom,
      y: (canvasPoint.y - panOffset.y) / zoom,
    }),
    [panOffset, zoom],
  );

  const getSnappedPoint = (point: Point): Point => {
    const worldPoint = getWorldPoint(point);
    return {
      x: Math.round(worldPoint.x / gridSize) * gridSize,
      y: Math.round(worldPoint.y / gridSize) * gridSize,
    };
  };

  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
      const gradient = ctx.createRadialGradient(
        w / 2,
        h / 2,
        0,
        w / 2,
        h / 2,
        Math.max(w, h),
      );
      gradient.addColorStop(0, '#fafafa');
      gradient.addColorStop(1, '#f0f0f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      if (!showGrid) return;

      const gridOpacity = Math.min(0.3, Math.max(0.05, zoom * 0.15));
      const zoomedGridSize = gridSize * zoom;
      const majorGridSize = zoomedGridSize * 5;

      if (zoomedGridSize > 8) {
        ctx.strokeStyle = `rgba(0, 0, 0, ${gridOpacity * 0.4})`;
        ctx.lineWidth = 0.5;
        const startX = panOffset.x % zoomedGridSize;
        const startY = panOffset.y % zoomedGridSize;
        for (let x = startX; x < w; x += zoomedGridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = startY; y < h; y += zoomedGridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }
      if (majorGridSize > 20) {
        ctx.strokeStyle = `rgba(0, 0, 0, ${gridOpacity})`;
        ctx.lineWidth = 1;
        const majorStartX = panOffset.x % majorGridSize;
        const majorStartY = panOffset.y % majorGridSize;
        for (let x = majorStartX; x < w; x += majorGridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = majorStartY; y < h; y += majorGridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }
    },
    [panOffset, zoom, gridSize, showGrid],
  );

  const drawShapes = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      (currentState.lines || []).forEach((line) => {
        ctx.strokeStyle = line.color || currentColor;
        ctx.lineWidth = (line.thickness || currentThickness) * zoom;
        ctx.beginPath();
        ctx.moveTo(
          line.start.x * zoom + panOffset.x,
          line.start.y * zoom + panOffset.y,
        );
        ctx.lineTo(
          line.end.x * zoom + panOffset.x,
          line.end.y * zoom + panOffset.y,
        );
        ctx.stroke();


      });
      (currentState.arcs || []).forEach((arc) => {
        ctx.strokeStyle = arc.color || currentColor;
        ctx.lineWidth = (arc.thickness || currentThickness) * zoom;
        ctx.beginPath();
        ctx.moveTo(
          arc.start.x * zoom + panOffset.x,
          arc.start.y * zoom + panOffset.y,
        );
        ctx.quadraticCurveTo(
          arc.control.x * zoom + panOffset.x,
          arc.control.y * zoom + panOffset.y,
          arc.end.x * zoom + panOffset.x,
          arc.end.y * zoom + panOffset.y,
        );
        ctx.stroke();
      });
      (currentState.rectangles || []).forEach((rect) => {
        ctx.strokeStyle = rect.color || currentColor;
        ctx.lineWidth = (rect.thickness || currentThickness) * zoom;
        const x = Math.min(rect.start.x, rect.end.x) * zoom + panOffset.x;
        const y = Math.min(rect.start.y, rect.end.y) * zoom + panOffset.y;
        const w = Math.abs(rect.end.x - rect.start.x) * zoom;
        const h = Math.abs(rect.end.y - rect.start.y) * zoom;
        if (rect.filled) {
          ctx.fillStyle = rect.color || currentColor;
          ctx.fillRect(x, y, w, h);
        } else {
          ctx.strokeRect(x, y, w, h);
        }
      });
      (currentState.circles || []).forEach((circle) => {
        ctx.strokeStyle = circle.color || currentColor;
        ctx.lineWidth = (circle.thickness || currentThickness) * zoom;
        ctx.beginPath();
        ctx.arc(
          circle.center.x * zoom + panOffset.x,
          circle.center.y * zoom + panOffset.y,
          circle.radius * zoom,
          0,
          2 * Math.PI,
        );
        if (circle.filled) {
          ctx.fillStyle = circle.color || currentColor;
          ctx.fill();
        } else {
          ctx.stroke();
        }
      });
      (currentState.arrows || []).forEach((arrow) => {
        ctx.strokeStyle = arrow.color || currentColor;
        ctx.lineWidth = (arrow.thickness || currentThickness) * zoom;
        ctx.beginPath();
        ctx.moveTo(
          arrow.start.x * zoom + panOffset.x,
          arrow.start.y * zoom + panOffset.y,
        );
        ctx.lineTo(
          arrow.end.x * zoom + panOffset.x,
          arrow.end.y * zoom + panOffset.y,
        );
        ctx.stroke();
        const angle = Math.atan2(
          arrow.end.y - arrow.start.y,
          arrow.end.x - arrow.start.x,
        );
        const headLength = Math.max(10, 15 * zoom);
        ctx.beginPath();
        ctx.moveTo(
          arrow.end.x * zoom + panOffset.x,
          arrow.end.y * zoom + panOffset.y,
        );
        ctx.lineTo(
          arrow.end.x * zoom +
            panOffset.x -
            headLength * Math.cos(angle - Math.PI / 6),
          arrow.end.y * zoom +
            panOffset.y -
            headLength * Math.sin(angle - Math.PI / 6),
        );
        ctx.moveTo(
          arrow.end.x * zoom + panOffset.x,
          arrow.end.y * zoom + panOffset.y,
        );
        ctx.lineTo(
          arrow.end.x * zoom +
            panOffset.x -
            headLength * Math.cos(angle + Math.PI / 6),
          arrow.end.y * zoom +
            panOffset.y -
            headLength * Math.sin(angle + Math.PI / 6),
        );
        ctx.stroke();
      });

      // Draw measurements
      (currentState.measurements || []).forEach((measurement) => {
        ctx.strokeStyle = measurement.color || '#9333ea'; // Purple for measurements
        ctx.lineWidth = (measurement.thickness || 1) * zoom;
        ctx.setLineDash([5, 5]); // Dashed line for measurements
        ctx.beginPath();
        ctx.moveTo(
          measurement.start.x * zoom + panOffset.x,
          measurement.start.y * zoom + panOffset.y,
        );
        ctx.lineTo(
          measurement.end.x * zoom + panOffset.x,
          measurement.end.y * zoom + panOffset.y,
        );
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash

        // Draw measurement points
        ctx.fillStyle = measurement.color || '#9333ea';
        [measurement.start, measurement.end].forEach((point) => {
          ctx.beginPath();
          ctx.arc(
            point.x * zoom + panOffset.x,
            point.y * zoom + panOffset.y,
            Math.max(2, 3 * zoom),
            0,
            2 * Math.PI,
          );
          ctx.fill();
        });

        // Draw distance label
        const distance = dist(measurement.start, measurement.end) / gridSize;
        if (distance > 0) {
          const midX = ((measurement.start.x + measurement.end.x) / 2) * zoom + panOffset.x;
          const midY = ((measurement.start.y + measurement.end.y) / 2) * zoom + panOffset.y;
          ctx.save();
          ctx.font = `${Math.max(10, 12 * zoom)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
          ctx.fillStyle = '#9333ea';
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const text = `${distance.toFixed(1)} units`;
          ctx.strokeText(text, midX, midY - Math.max(8, 15 * zoom));
          ctx.fillText(text, midX, midY - Math.max(8, 15 * zoom));
          ctx.restore();
        }
      });

      (currentState.texts || []).forEach((textElement) => {
        ctx.fillStyle = textElement.color || currentColor;
        ctx.font = `${textElement.fontSize ? textElement.fontSize * zoom : 16 * zoom}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(
          textElement.text,
          textElement.position.x * zoom + panOffset.x,
          textElement.position.y * zoom + panOffset.y,
        );
        if (selectedTextElement && selectedTextElement === textElement) {
          // Font is already set from fillText
          const textMetrics = ctx.measureText(textElement.text);
          // The width from measureText is in unscaled pixels if the context isn't pre-scaled for font setting.
          // However, since ctx.font was set with zoom-scaled font size, textMetrics.width should be canvas-scaled.
          const textWidthCanvas = textMetrics.width;
          const textHeightCanvas = (textElement.fontSize || 16) * zoom;
          const xPosCanvas = textElement.position.x * zoom + panOffset.x;
          const yPosCanvas = textElement.position.y * zoom + panOffset.y;

          ctx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 2]);
          // Assuming textElement.position.y is the baseline:
          ctx.strokeRect(
            xPosCanvas - 2,
            yPosCanvas - textHeightCanvas - 2,
            textWidthCanvas + 4,
            textHeightCanvas + 4,
          );
          ctx.setLineDash([]);
        }
      });

      // Draw electrical outlets (green squares)
      ((currentState.electricalOutlets || []) as ElectricalOutlet[]).forEach((outlet) => {
        const size = 12 * zoom;
        const x = outlet.position.x * zoom + panOffset.x - size/2;
        const y = outlet.position.y * zoom + panOffset.y - size/2;
        
        ctx.fillStyle = outlet.type === 'gfci' ? '#22c55e' : '#16a34a';
        ctx.fillRect(x, y, size, size);
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);

        // Outlet symbol (two vertical lines)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + size/2 - 3, y + size/2 - 4);
        ctx.lineTo(x + size/2 - 3, y + size/2 + 4);
        ctx.moveTo(x + size/2 + 3, y + size/2 - 4);
        ctx.lineTo(x + size/2 + 3, y + size/2 + 4);
        ctx.stroke();
      });

      // Draw plumbing fixtures (blue shapes)
      ((currentState.plumbingFixtures || []) as PlumbingFixture[]).forEach((fixture) => {
        let size = 20 * zoom;
        if (fixture.type === 'toilet') size = 30 * zoom;
        if (fixture.type === 'shower') size = 40 * zoom;
        
        const x = fixture.position.x * zoom + panOffset.x;
        const y = fixture.position.y * zoom + panOffset.y;
        
        ctx.fillStyle = '#3b82f6';
        if (fixture.type === 'sink' || fixture.type === 'toilet') {
          ctx.fillRect(x - size/2, y - size/2, size, size);
        } else {
          ctx.beginPath();
          ctx.arc(x, y, size/2, 0, 2 * Math.PI);
          ctx.fill();
        }
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        if (fixture.type === 'sink' || fixture.type === 'toilet') {
          ctx.strokeRect(x - size/2, y - size/2, size, size);
        } else {
          ctx.beginPath();
          ctx.arc(x, y, size/2, 0, 2 * Math.PI);
          ctx.stroke();
        }

        // Type label
        if (zoom > 0.3) {
          ctx.fillStyle = '#000000';
          ctx.font = `${Math.max(8, 10 * zoom)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(fixture.type.toUpperCase(), x, y + size + 10);
        }
      });

      // Draw electrical wires (green lines)
      ((currentState.electricalWires || []) as ElectricalWire[]).forEach((wire) => {
        ctx.strokeStyle = '#16a34a'; // Green for electrical
        ctx.lineWidth = Math.max(2, 3 * zoom);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(
          wire.start.x * zoom + panOffset.x,
          wire.start.y * zoom + panOffset.y,
        );
        ctx.lineTo(
          wire.end.x * zoom + panOffset.x,
          wire.end.y * zoom + panOffset.y,
        );
        ctx.stroke();
      });

      // Draw plumbing pipes
      ((currentState.plumbingPipes || []) as PlumbingPipe[]).forEach((pipe) => {
        // Water pipes are blue, drain pipes are gray
        ctx.strokeStyle = pipe.type === 'water' ? '#3b82f6' : '#6b7280';
        ctx.lineWidth = Math.max(3, 4 * zoom);
        
        // Drain pipes are dashed
        if (pipe.type === 'drain') {
          ctx.setLineDash([8 * zoom, 4 * zoom]);
        } else {
          ctx.setLineDash([]);
        }
        
        ctx.beginPath();
        ctx.moveTo(
          pipe.start.x * zoom + panOffset.x,
          pipe.start.y * zoom + panOffset.y,
        );
        ctx.lineTo(
          pipe.end.x * zoom + panOffset.x,
          pipe.end.y * zoom + panOffset.y,
        );
        ctx.stroke();
        
        // Reset dash
        ctx.setLineDash([]);
      });
    },
    [
      currentState,
      currentColor,
      currentThickness,
      panOffset,
      zoom,
      selectedTextElement,
    ],
  );

  const drawPreview = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!currentMousePos) return;
      ctx.strokeStyle = `${currentColor}80`;
      ctx.lineWidth = Math.max(1, currentThickness * zoom);
      ctx.setLineDash([Math.max(3, 5 * zoom), Math.max(3, 5 * zoom)]);

      if (tool === 'arc') {
        const snappedCurrentMouse = getSnappedPoint(currentMousePos);
        if (arcPoints.length === 1) {
          const startPoint = arcPoints[0];
          ctx.beginPath();
          ctx.moveTo(
            startPoint.x * zoom + panOffset.x,
            startPoint.y * zoom + panOffset.y,
          );
          ctx.lineTo(
            snappedCurrentMouse.x * zoom + panOffset.x,
            snappedCurrentMouse.y * zoom + panOffset.y,
          );
          ctx.stroke();
          ctx.fillStyle = currentColor;
          [startPoint, snappedCurrentMouse].forEach((point) => {
            if (!point) return;
            ctx.beginPath();
            ctx.arc(
              point.x * zoom + panOffset.x,
              point.y * zoom + panOffset.y,
              Math.max(2, 4 * zoom),
              0,
              2 * Math.PI,
            );
            ctx.fill();
          });
        } else if (arcPoints.length === 2) {
          const startPoint = arcPoints[0];
          const endPoint = arcPoints[1];
          const controlPointPreview = snappedCurrentMouse;
          if (!startPoint || !endPoint || !controlPointPreview) return;
          ctx.beginPath();
          ctx.moveTo(
            startPoint.x * zoom + panOffset.x,
            startPoint.y * zoom + panOffset.y,
          );
          ctx.quadraticCurveTo(
            controlPointPreview.x * zoom + panOffset.x,
            controlPointPreview.y * zoom + panOffset.y,
            endPoint.x * zoom + panOffset.x,
            endPoint.y * zoom + panOffset.y,
          );
          ctx.stroke();
          ctx.save();
          ctx.strokeStyle = `${currentColor}40`;
          ctx.beginPath();
          ctx.moveTo(
            startPoint.x * zoom + panOffset.x,
            startPoint.y * zoom + panOffset.y,
          );
          ctx.lineTo(
            controlPointPreview.x * zoom + panOffset.x,
            controlPointPreview.y * zoom + panOffset.y,
          );
          ctx.lineTo(
            endPoint.x * zoom + panOffset.x,
            endPoint.y * zoom + panOffset.y,
          );
          ctx.stroke();
          ctx.restore();
          ctx.fillStyle = currentColor;
          [startPoint, endPoint, controlPointPreview].forEach((point) => {
            ctx.beginPath();
            ctx.arc(
              point.x * zoom + panOffset.x,
              point.y * zoom + panOffset.y,
              Math.max(2, 4 * zoom),
              0,
              2 * Math.PI,
            );
            ctx.fill();
          });
        }
      }

      // Draw measure tool preview
      if (tool === 'measure' && measurePoints.length > 0) {
        ctx.strokeStyle = '#9333ea80'; // Purple with transparency
        ctx.lineWidth = Math.max(1, 2 * zoom);
        ctx.setLineDash([5, 5]);
        
        // Draw existing measurement segments
        for (let i = 0; i < measurePoints.length - 1; i++) {
          ctx.beginPath();
          ctx.moveTo(
            measurePoints[i].x * zoom + panOffset.x,
            measurePoints[i].y * zoom + panOffset.y,
          );
          ctx.lineTo(
            measurePoints[i + 1].x * zoom + panOffset.x,
            measurePoints[i + 1].y * zoom + panOffset.y,
          );
          ctx.stroke();
        }
        
        // Draw preview line to current mouse position
        const lastPoint = measurePoints[measurePoints.length - 1];
        const snappedMouse = getSnappedPoint(currentMousePos);
        ctx.beginPath();
        ctx.moveTo(
          lastPoint.x * zoom + panOffset.x,
          lastPoint.y * zoom + panOffset.y,
        );
        ctx.lineTo(
          snappedMouse.x * zoom + panOffset.x,
          snappedMouse.y * zoom + panOffset.y,
        );
        ctx.stroke();
        
        // Draw measurement points
        ctx.fillStyle = '#9333ea';
        measurePoints.forEach((point) => {
          ctx.beginPath();
          ctx.arc(
            point.x * zoom + panOffset.x,
            point.y * zoom + panOffset.y,
            Math.max(2, 3 * zoom),
            0,
            2 * Math.PI,
          );
          ctx.fill();
        });
        
        // Draw distance preview
        const distance = dist(lastPoint, snappedMouse) / gridSize;
        if (distance > 0) {
          const midX = ((lastPoint.x + snappedMouse.x) / 2) * zoom + panOffset.x;
          const midY = ((lastPoint.y + snappedMouse.y) / 2) * zoom + panOffset.y;
          ctx.save();
          ctx.font = `${Math.max(10, 12 * zoom)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
          ctx.fillStyle = '#9333ea';
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const text = `${distance.toFixed(1)} units`;
          ctx.strokeText(text, midX, midY - Math.max(8, 15 * zoom));
          ctx.fillText(text, midX, midY - Math.max(8, 15 * zoom));
          ctx.restore();
        }
        
        ctx.setLineDash([]);
      }

      if (activeShapeStartPoint && tool !== 'arc') {
        const snappedEnd = getSnappedPoint(currentMousePos);
        if (tool === 'line') {
          ctx.beginPath();
          ctx.moveTo(
            activeShapeStartPoint.x * zoom + panOffset.x,
            activeShapeStartPoint.y * zoom + panOffset.y,
          );
          ctx.lineTo(
            snappedEnd.x * zoom + panOffset.x,
            snappedEnd.y * zoom + panOffset.y,
          );
          ctx.stroke();
          const dx =
            Math.abs(snappedEnd.x - activeShapeStartPoint.x) / gridSize;
          const dy =
            Math.abs(snappedEnd.y - activeShapeStartPoint.y) / gridSize;
          const length = Math.sqrt(dx * dx + dy * dy);
          if (length > 0) {
            const midX =
              ((activeShapeStartPoint.x + snappedEnd.x) / 2) * zoom +
              panOffset.x;
            const midY =
              ((activeShapeStartPoint.y + snappedEnd.y) / 2) * zoom +
              panOffset.y;
            ctx.save();
            ctx.font = `${Math.max(10, 12 * zoom)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
            ctx.fillStyle = '#3b82f6';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const text = `${length.toFixed(1)} units`;
            ctx.strokeText(text, midX, midY - Math.max(8, 15 * zoom));
            ctx.fillText(text, midX, midY - Math.max(8, 15 * zoom));
            ctx.restore();
          }
        } else if (tool === 'rectangle') {
          const worldStartX = activeShapeStartPoint.x;
          const worldStartY = activeShapeStartPoint.y;
          const worldEndX = snappedEnd.x;
          const worldEndY = snappedEnd.y;

          const rectX = Math.min(worldStartX, worldEndX) * zoom + panOffset.x;
          const rectY = Math.min(worldStartY, worldEndY) * zoom + panOffset.y;
          const rectW = Math.abs(worldEndX - worldStartX) * zoom;
          const rectH = Math.abs(worldEndY - worldStartY) * zoom;
          ctx.strokeRect(rectX, rectY, rectW, rectH);

          const dimWidth = Math.abs(worldEndX - worldStartX) / gridSize;
          const dimHeight = Math.abs(worldEndY - worldStartY) / gridSize;

          if (dimWidth > 0 || dimHeight > 0) {
            ctx.save();
            ctx.font = `${Math.max(10, 12 * zoom)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
            ctx.fillStyle = '#3b82f6'; // Blue color for dimensions
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3; // For text outline
            ctx.textBaseline = 'middle';

            // Display width dimension
            if (dimWidth > 0) {
              const widthText = `${dimWidth.toFixed(1)} u`;
              const textWidthX =
                ((worldStartX + worldEndX) / 2) * zoom + panOffset.x;
              const textWidthY =
                Math.min(worldStartY, worldEndY) * zoom +
                panOffset.y -
                Math.max(8, 15 * zoom); // Above the top edge
              ctx.textAlign = 'center';
              ctx.strokeText(widthText, textWidthX, textWidthY);
              ctx.fillText(widthText, textWidthX, textWidthY);
            }

            // Display height dimension
            if (dimHeight > 0) {
              const heightText = `${dimHeight.toFixed(1)} u`;
              const textHeightX =
                Math.min(worldStartX, worldEndX) * zoom +
                panOffset.x -
                Math.max(8, 15 * zoom); // Left of the left edge
              const textHeightY =
                ((worldStartY + worldEndY) / 2) * zoom + panOffset.y;
              ctx.textAlign = 'right'; // Align to the right so it's "outside" the left edge
              ctx.strokeText(heightText, textHeightX, textHeightY);
              ctx.fillText(heightText, textHeightX, textHeightY);
            }
            ctx.restore();
          }
        } else if (tool === 'circle') {
          const radius = dist(activeShapeStartPoint, snappedEnd);
          ctx.beginPath();
          ctx.arc(
            activeShapeStartPoint.x * zoom + panOffset.x,
            activeShapeStartPoint.y * zoom + panOffset.y,
            radius * zoom,
            0,
            2 * Math.PI,
          );
          ctx.stroke();
        } else if (tool === 'arrow') {
          ctx.beginPath();
          ctx.moveTo(
            activeShapeStartPoint.x * zoom + panOffset.x,
            activeShapeStartPoint.y * zoom + panOffset.y,
          );
          ctx.lineTo(
            snappedEnd.x * zoom + panOffset.x,
            snappedEnd.y * zoom + panOffset.y,
          );
          ctx.stroke();
        }
      }

      if (tool === 'eraser') {
        const worldCursorPos = getWorldPoint(currentMousePos);
        ctx.beginPath();
        ctx.arc(
          worldCursorPos.x * zoom + panOffset.x,
          worldCursorPos.y * zoom + panOffset.y,
          (eraserWidth / 2) * zoom,
          0,
          2 * Math.PI,
        );
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = Math.max(1, 2 * zoom);
        ctx.stroke();
      }

      if (isMobile) {
        const snapped = getSnappedPoint(currentMousePos);
        const x = snapped.x * zoom + panOffset.x;
        const y = snapped.y * zoom + panOffset.y - 20; // offset above finger
        const size = 6 * zoom;
        ctx.save();
        ctx.setLineDash([]);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);
        ctx.stroke();
        ctx.restore();
      }
      ctx.setLineDash([]);

      // Draw selection rectangle for area-delete tool
      if (
        tool === 'area-delete' &&
        selectionRect &&
        selectionRect.start &&
        currentMousePos
      ) {
        const worldStart = getWorldPoint(selectionRect.start);
        const worldCurrent = getWorldPoint(currentMousePos);

        const rectX =
          Math.min(worldStart.x, worldCurrent.x) * zoom + panOffset.x;
        const rectY =
          Math.min(worldStart.y, worldCurrent.y) * zoom + panOffset.y;
        const rectW = Math.abs(worldCurrent.x - worldStart.x) * zoom;
        const rectH = Math.abs(worldCurrent.y - worldStart.y) * zoom;

        ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)'; // Rose color, semi-transparent
        ctx.fillStyle = 'rgba(244, 63, 94, 0.1)'; // Rose color, very transparent fill
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.fillRect(rectX, rectY, rectW, rectH);
        ctx.strokeRect(rectX, rectY, rectW, rectH);
        ctx.setLineDash([]);
      }
    },
    [
      activeShapeStartPoint,
      currentMousePos,
      currentColor,
      currentThickness,
      eraserWidth,
      gridSize,
      panOffset,
      tool,
      zoom,
      arcPoints,
      isMobile,
      selectionRect, // Added dependency
      getWorldPoint, // Added dependency
    ],
  );

  const handlePointerDown = (
    point: Point,
    isShift: boolean,
    isTouchEvent = false,
  ) => {
    if (isShift || tool === 'pan') {
      setIsPanning(true);
      setStartPanPoint(point);
      return;
    }
    const worldPoint = getWorldPoint(point);
    const snappedPoint = getSnappedPoint(point);

    if (tool === 'area-delete') {
      setSelectionRect({ start: point, end: point }); // Use raw canvas points for drawing rect
      setSelectedElementIndices([]); // Clear previous selection
      setIsDrawing(true); // Use isDrawing to indicate selection in progress
      triggerFeedback();
      return;
    }

    if (tool === 'select') {
      setSelectedTextElement(null); // Reset selection first
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        for (let i = 0; i < currentState.texts.length; i++) {
          const textElement = currentState.texts[i];
          ctx.font = `${textElement.fontSize || 16}px Arial`;
          const textMetrics = ctx.measureText(textElement.text);
          const textWidth = textMetrics.width;
          const textHeight = textElement.fontSize || 16; // Approximation

          const bboxLeft = textElement.position.x;
          const bboxTop = textElement.position.y - textHeight; // Assuming position.y is baseline
          const bboxRight = textElement.position.x + textWidth;
          const bboxBottom = textElement.position.y;

          if (
            worldPoint.x >= bboxLeft &&
            worldPoint.x <= bboxRight &&
            worldPoint.y >= bboxTop &&
            worldPoint.y <= bboxBottom
          ) {
            setSelectedTextElement(textElement);
            triggerFeedback();
            return; // Found a text element, stop here
          }
        }
      }
      // If no text element is selected, proceed with other shape selection logic (if any)
      // For now, we assume no other selection logic, or it's handled elsewhere/below.
    } else if (tool === 'arc') {
      if (arcPoints.length === 0) {
        setArcPoints([snappedPoint]);
        setActiveShapeStartPoint(snappedPoint);
        triggerFeedback();
      } else if (arcPoints.length === 1) {
        if (dist(arcPoints[0], snappedPoint) > EPSILON) {
          setArcPoints([arcPoints[0], snappedPoint]);
          setActiveShapeEndPoint(snappedPoint);
          triggerFeedback();
        }
      } else if (arcPoints.length === 2) {
        const controlPoint = snappedPoint;
        addToHistory({
          arcs: [
            ...currentState.arcs,
            {
              start: arcPoints[0],
              end: arcPoints[1],
              control: controlPoint,
              color: currentColor,
              thickness: currentThickness,
            },
          ],
        });
        setArcPoints([]);
        setActiveShapeStartPoint(null);
        setActiveShapeEndPoint(null);
        triggerFeedback();
      }
      return;
    }

    if (['line', 'rectangle', 'circle', 'arrow'].includes(tool)) {
      if (activeShapeStartPoint) {
        if (dist(activeShapeStartPoint, snappedPoint) > EPSILON) {
          const shapeData = {
            start: activeShapeStartPoint,
            end: snappedPoint,
            color: currentColor,
            thickness: currentThickness,
          };
          switch (tool) {
            case 'line':
              let lineData = { ...shapeData }; // shapeData is { start, end, color, thickness }
              if (designMode === 'residential') {
                const lengthInGridCells =
                  dist(lineData.start, lineData.end) / gridSize; // Calculate length in terms of grid cells

                if (lengthInGridCells > EPSILON) {
                  // Only calculate for non-zero length lines
                  // Note: studCount calculations removed with 3D functionality
                }
              }
              addToHistory({ lines: [...currentState.lines, lineData] });
              break;
            case 'rectangle':
              const newRectangle = shapeData as Rectangle;
              addToHistory({
                rectangles: [...currentState.rectangles, newRectangle],
              });
              break;
            case 'circle':
              const radius = dist(activeShapeStartPoint, snappedPoint);
              addToHistory({
                circles: [
                  ...currentState.circles,
                  {
                    center: activeShapeStartPoint,
                    radius,
                    color: currentColor,
                    thickness: currentThickness,
                  },
                ],
              });
              break;
            case 'arrow':
              addToHistory({
                arrows: [...currentState.arrows, shapeData as Arrow],
              });
              break;
          }
          triggerFeedback();
        }
        setActiveShapeStartPoint(null);
      } else {
        setActiveShapeStartPoint(snappedPoint);
        triggerFeedback();
      }
    } else if (tool === 'eraser') {
      setIsErasing(true);
      setEraserStrokePoints([worldPoint]);
    } else if (tool === 'text') {
      // Simple text tool implementation
      console.log('=== TEXT TOOL CLICKED ===');
      console.log('Current editingText state:', editingText);
      console.log('Click position:', point);
      
      // If already editing, save the current text first
      if (editingText) {
        console.log('Already editing text, saving current text first');
        if (editingText.currentText.trim()) {
          const worldPosition = getWorldPoint(editingText.position);
          addToHistory({
            texts: [
              ...currentState.texts,
              {
                position: worldPosition,
                text: editingText.currentText.trim(),
                color: currentColor,
                fontSize: 16,
              },
            ],
          });
          console.log('Saved text:', editingText.currentText.trim());
        }
      }
      
             // Start new text input
       console.log('Starting new text input');
       setEditingText({
         position: point,
         currentText: '',
       });
       setIsTextEditing(true);
       setTextInputStartTime(Date.now());
       triggerFeedback();
      
    } else if (tool === 'measure') {
      if (measurePoints.length === 0) {
        setMeasurePoints([snappedPoint]);
        triggerFeedback();
      } else {
        const lastPoint = measurePoints[measurePoints.length - 1];
        if (dist(lastPoint, snappedPoint) > EPSILON) {
          setMeasurePoints([...measurePoints, snappedPoint]);
          triggerFeedback();
        }
      }
    } else if (tool === 'wiring') {
      // Add electrical outlet
      const newOutletId = `outlet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newOutlets = [
        ...(currentState.electricalOutlets || []),
        {
          id: newOutletId,
          position: snappedPoint,
          type: 'standard' as const,
        },
      ];
      
      // Auto-route wires between outlets
      const newWires = [...(currentState.electricalWires || [])];
      const existingOutlets = currentState.electricalOutlets || [];
      if (existingOutlets.length > 0) {
        // Connect to nearest existing outlet
        const nearestOutlet = existingOutlets.reduce((nearest, outlet) => 
          dist(outlet.position, snappedPoint) < dist(nearest.position, snappedPoint) ? outlet : nearest
        );
        
        const wireId = `wire_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        newWires.push({
          id: wireId,
          start: nearestOutlet.position,
          end: snappedPoint,
          outletIds: [nearestOutlet.id, newOutletId],
        });
      }
      
      addToHistory({
        electricalOutlets: newOutlets,
        electricalWires: newWires,
      });
      triggerFeedback();
    } else if (tool === 'plumbing') {
      // Add water fixture
      const newFixtureId = `fixture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newFixtures = [
        ...(currentState.plumbingFixtures || []),
        {
          id: newFixtureId,
          position: snappedPoint,
          type: 'sink' as const,
        },
      ];
      
      // Auto-route pipes between fixtures
      const newPipes = [...(currentState.plumbingPipes || [])];
      const existingFixtures = currentState.plumbingFixtures || [];
      if (existingFixtures.length > 0) {
        // Connect to nearest existing fixture with both water and drain lines
        const nearestFixture = existingFixtures.reduce((nearest, fixture) => 
          dist(fixture.position, snappedPoint) < dist(nearest.position, snappedPoint) ? fixture : nearest
        );
        
        // Water supply pipe
        const waterPipeId = `pipe_water_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        newPipes.push({
          id: waterPipeId,
          start: nearestFixture.position,
          end: snappedPoint,
          fixtureIds: [nearestFixture.id, newFixtureId],
          type: 'water',
        });
        
        // Drain pipe
        const drainPipeId = `pipe_drain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        newPipes.push({
          id: drainPipeId,
          start: nearestFixture.position,
          end: snappedPoint,
          fixtureIds: [nearestFixture.id, newFixtureId],
          type: 'drain',
        });
      }
      
      addToHistory({
        plumbingFixtures: newFixtures,
        plumbingPipes: newPipes,
      });
      triggerFeedback();
    }
  };

  const handlePointerMove = (point: Point) => {
    setCurrentMousePos(point);
    if (tool === 'area-delete' && isDrawing && selectionRect) {
      setSelectionRect({ ...selectionRect, end: point });
      // No need to calculate selected elements here, only on pointer up
      return;
    }
    if (isPanning) {
      const dx = point.x - startPanPoint.x;
      const dy = point.y - startPanPoint.y;
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
      setStartPanPoint(point);
    }
    if (isErasing && tool === 'eraser') {
      const worldPoint = getWorldPoint(point);
      setEraserStrokePoints((prev) => [...prev, worldPoint]);
    }
  };

  const handlePointerUp = () => {
    if (
      tool === 'area-delete' &&
      isDrawing &&
      selectionRect &&
      currentMousePos
    ) {
      setIsDrawing(false);
      // Finalize selection rectangle in world coordinates
      const worldRectStart = getWorldPoint(selectionRect.start);
      const worldRectEnd = getWorldPoint(currentMousePos); // Use currentMousePos for the end

      const minX = Math.min(worldRectStart.x, worldRectEnd.x);
      const maxX = Math.max(worldRectStart.x, worldRectEnd.x);
      const minY = Math.min(worldRectStart.y, worldRectEnd.y);
      const maxY = Math.max(worldRectStart.y, worldRectEnd.y);

      const indicesToSelect: number[] = [];
      // For now, only considering 'lines' as floor plan elements
      currentState.lines.forEach((line, index) => {
        // Check if both start and end points of the line are within the selection rectangle
        const lineStartInRect =
          line.start.x >= minX &&
          line.start.x <= maxX &&
          line.start.y >= minY &&
          line.start.y <= maxY;
        const lineEndInRect =
          line.end.x >= minX &&
          line.end.x <= maxX &&
          line.end.y >= minY &&
          line.end.y <= maxY;

        if (lineStartInRect && lineEndInRect) {
          indicesToSelect.push(index);
        }
      });
      setSelectedElementIndices(indicesToSelect);
      // The selectionRect (visual rubber band) will be cleared by drawPreview logic or explicitly if needed
      // For now, drawPreview will stop drawing it if selectionRect.start is not set on next mousedown
      // Or we can explicitly setSelectionRect(null) here if we don't want it to persist visually after selection.
      // Let's clear it for now.
      setSelectionRect(null);
      if (indicesToSelect.length > 0) {
        const confirmed = window.confirm(
          `Are you sure you want to delete ${indicesToSelect.length} selected element(s)? This action cannot be undone directly (but you can use Undo).`,
        );
        if (confirmed) {
          // Note: deleteSelectedElements uses selectedElementIndices from state,
          // which should have been set just before this confirmation.
          deleteSelectedElements();
        } else {
          // User cancelled, clear the selection
          setSelectedElementIndices([]);
          setStatusMessage('Deletion cancelled.');
        }
      } else {
        setStatusMessage('No elements selected in the area.');
      }
      return;
    }

    if (isErasing && tool === 'eraser' && eraserStrokePoints.length > 0) {
      let opPerformed = false;
      let newLines = [...currentState.lines];
      let newCircles = [...currentState.circles];
      let newArcs = [...currentState.arcs];
      let newRectangles = [...currentState.rectangles];
      let newArrows = [...currentState.arrows];

      // --- Line Erasing ---
      if (eraserMode === 'partial') {
        const originalLinesSnapshot = [...newLines]; // Keep a snapshot for comparison
        const processedLines: Line[] = [];
        originalLinesSnapshot.forEach((originalLine) => {
          // Residential mode: if a stud wall is hit in partial erase, treat as whole erase for that line
          if (
            designMode === 'residential' &&
            true
          ) {
            let studWallHit = false;
            for (const ep of eraserStrokePoints) {
              if (
                distancePointToLineSegment(
                  ep,
                  originalLine.start,
                  originalLine.end,
                ) <
                eraserWidth / 2
              ) {
                studWallHit = true;
                break;
              }
            }
            if (studWallHit) {
              opPerformed = true; // Mark operation performed
              return; // Skip this originalLine, effectively deleting it from processedLines
            }
          }

          let segments: Line[] = [originalLine];
          eraserStrokePoints.forEach((ep) => {
            const nextSegments: Line[] = [];
            segments.forEach((seg) => {
              if (
                distancePointToLineSegment(ep, seg.start, seg.end) <
                eraserWidth / 2
              ) {
                const proj = projectPointOntoLine(ep, seg.start, seg.end);
                const lineDir = normalize(vec(seg.start, seg.end));
                const cutP1 = clampPointToSegment(
                  sub(proj, scale(lineDir, eraserWidth / 2)),
                  seg.start,
                  seg.end,
                );
                const cutP2 = clampPointToSegment(
                  add(proj, scale(lineDir, eraserWidth / 2)),
                  seg.start,
                  seg.end,
                );
                if (dist(seg.start, cutP1) > EPSILON)
                  nextSegments.push({ ...seg, end: cutP1 });
                if (dist(cutP2, seg.end) > EPSILON)
                  nextSegments.push({ ...seg, start: cutP2 });
              } else {
                nextSegments.push(seg);
              }
            });
            segments = nextSegments;
          });
          processedLines.push(...segments);
        });

        if (
          processedLines.length !== originalLinesSnapshot.length ||
          processedLines.some((line, idx) => {
            const original = originalLinesSnapshot[idx];
            return (
              !original ||
              dist(line.start, original.start) > EPSILON ||
              dist(line.end, original.end) > EPSILON ||
              line.color !== original.color ||
              line.thickness !== original.thickness
            );
          })
        ) {
          newLines = processedLines;
          opPerformed = true;
        }
      } else {
        // eraserMode === 'whole' for lines
        const originalLineCount = newLines.length;
        newLines = newLines.filter(
          (line) =>
            !eraserStrokePoints.some(
              (ep) =>
                distancePointToLineSegment(ep, line.start, line.end) <
                eraserWidth / 2,
            ),
        );
        if (newLines.length !== originalLineCount) opPerformed = true;
      }

      // --- Other Shapes (always whole element deletion) ---
      // Circles
      const originalCircleCount = newCircles.length;
      newCircles = newCircles.filter(
        (circle) =>
          !eraserStrokePoints.some(
            (ep) =>
              Math.abs(dist(ep, circle.center) - circle.radius) <
              eraserWidth / 2,
          ),
      );
      if (newCircles.length !== originalCircleCount) opPerformed = true;

      // Arcs
      const originalArcCount = newArcs.length;
      newArcs = newArcs.filter((arc) => {
        const arcPolyline = getPointsOnArc(arc);
        return !eraserStrokePoints.some((ep) =>
          arcPolyline.some(
            (p_arc, i_arc, arr_arc) =>
              i_arc < arr_arc.length - 1 &&
              distancePointToLineSegment(ep, p_arc, arr_arc[i_arc + 1]) <
                eraserWidth / 2,
          ),
        );
      });
      if (newArcs.length !== originalArcCount) opPerformed = true;

      // Rectangles (and their trusses if in residential mode)
      const removedRectangles: Rectangle[] = [];
      const keptRectangles: Rectangle[] = [];
      currentState.rectangles.forEach((rect) => {
        const p1 = rect.start;
        const p3 = rect.end;
        const p2 = { x: p3.x, y: p1.y };
        const p4 = { x: p1.x, y: p3.y };
        const sides = [
          { start: p1, end: p2 },
          { start: p2, end: p3 },
          { start: p3, end: p4 },
          { start: p4, end: p1 },
        ];
        const isHit = eraserStrokePoints.some((ep) =>
          sides.some(
            (side) =>
              distancePointToLineSegment(ep, side.start, side.end) <
              eraserWidth / 2,
          ),
        );
        if (isHit) {
          removedRectangles.push(rect);
          opPerformed = true;
        } else {
          keptRectangles.push(rect);
        }
      });
      newRectangles = keptRectangles;

      if (designMode === 'residential' && removedRectangles.length > 0) {
        const linesToAlsoRemoveDueToRectErasure: Line[] = [];
        removedRectangles.forEach((rect) => {
          const minX = Math.min(rect.start.x, rect.end.x);
          const minY = Math.min(rect.start.y, rect.end.y);
          const maxX = Math.max(rect.start.x, rect.end.x);
          const maxY = Math.max(rect.start.y, rect.end.y);

          // Iterate over the current state of lines *after* primary line erasing pass
          // This means newLines might have already been modified by line eraser
          newLines.forEach((line) => {
            if (line.thickness === 1) {
              // Potential truss characteristic
              const isHorizTruss =
                Math.abs(line.start.y - line.end.y) < EPSILON && // is horizontal
                line.thickness === 1 &&
                ((Math.abs(line.start.x - minX) < EPSILON &&
                  Math.abs(line.end.x - maxX) < EPSILON) ||
                  (Math.abs(line.start.x - maxX) < EPSILON &&
                    Math.abs(line.end.x - minX) < EPSILON)) && // matches rect x-bounds (normal or reversed)
                line.start.y >= minY - EPSILON &&
                line.start.y <= maxY + EPSILON; // y is within rect (inclusive of boundaries)
              const isVertTruss =
                Math.abs(line.start.x - line.end.x) < EPSILON && // is vertical
                line.thickness === 1 &&
                ((Math.abs(line.start.y - minY) < EPSILON &&
                  Math.abs(line.end.y - maxY) < EPSILON) ||
                  (Math.abs(line.start.y - maxY) < EPSILON &&
                    Math.abs(line.end.y - minY) < EPSILON)) && // matches rect y-bounds (normal or reversed)
                line.start.x >= minX - EPSILON &&
                line.start.x <= maxX + EPSILON; // x is within rect (inclusive of boundaries)

              if (isHorizTruss || isVertTruss) {
                // Check if this line is already slated for removal to avoid double counting or processing
                // For simplicity, we just add it. Filtering `newLines` later will handle duplicates if any.
                linesToAlsoRemoveDueToRectErasure.push(line);
              }
            }
          });
        });

        if (linesToAlsoRemoveDueToRectErasure.length > 0) {
          newLines = newLines.filter(
            (nl) =>
              !linesToAlsoRemoveDueToRectErasure.some(
                (rfl) =>
                  dist(nl.start, rfl.start) < EPSILON &&
                  dist(nl.end, rfl.end) < EPSILON &&
                  nl.thickness === rfl.thickness,
              ),
          );
          opPerformed = true; // Ensure opPerformed is true if trusses were removed
        }
      }

      // Arrows
      const originalArrowCount = newArrows.length;
      newArrows = newArrows.filter(
        (arrow) =>
          !eraserStrokePoints.some(
            (ep) =>
              distancePointToLineSegment(ep, arrow.start, arrow.end) <
              eraserWidth / 2,
          ),
      );
      if (newArrows.length !== originalArrowCount) opPerformed = true;

      if (opPerformed) {
        addToHistory({
          lines: newLines,
          circles: newCircles,
          arcs: newArcs,
          rectangles: newRectangles,
          arrows: newArrows,
          texts: currentState.texts, // Preserve texts
        });
        triggerFeedback();
      }
    }

    setIsPanning(false);
    setIsDrawing(false); // Make sure to reset isDrawing for area-delete
    setIsErasing(false);
    setEraserStrokePoints([]);
    setIsMultiTouch(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('=== KEYDOWN EVENT ===');
      console.log('Key pressed:', e.key);
      console.log('isTextEditing:', isTextEditing);
      console.log('editingText:', editingText);
      
      // Guard against undefined key
      if (!e.key) {
        console.log('Key is undefined, ignoring event');
        return;
      }
      
      const pressedKey = e.key.toLowerCase();

      // Check if user is typing in ANY input field (not just our text tool)
      const activeElement = document.activeElement;
      const isTypingInInput = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        (activeElement as HTMLElement).contentEditable === 'true' ||
        activeElement.getAttribute('role') === 'textbox'
      );

      // Handle text editing - HIGHEST PRIORITY
      if (isTextEditing && editingText) {
        console.log('In text editing mode, handling key:', e.key);
        
        if (e.key === 'Enter') {
          console.log('Enter pressed - saving text');
          e.preventDefault();
          e.stopPropagation();
          
          if (editingText.currentText.trim()) {
            const worldPosition = getWorldPoint(editingText.position);
            addToHistory({
              texts: [
                ...currentState.texts,
                {
                  position: worldPosition,
                  text: editingText.currentText.trim(),
                  color: currentColor,
                  fontSize: 16,
                },
              ],
            });
            console.log('Text saved successfully:', editingText.currentText.trim());
          }
          
          setEditingText(null);
          setIsTextEditing(false);
          return;
        }
        
        if (e.key === 'Escape') {
          console.log('Escape pressed - canceling text');
          e.preventDefault();
          e.stopPropagation();
          setEditingText(null);
          setIsTextEditing(false);
          return;
        }
        
        // For all other keys during text editing, let them through normally
        console.log('Allowing key through for text input:', e.key);
        return;
      }

      // If user is typing in any input field, don't handle tool shortcuts
      if (isTypingInInput) {
        console.log('User is typing in an input field, ignoring tool shortcuts');
        return;
      }

      // Only handle tool shortcuts if NOT editing text
      console.log('Not editing text, checking for tool shortcuts');
      
      // Handle measure tool shortcuts
      if (tool === 'measure' && pressedKey === 'enter') {
        e.preventDefault();
        if (measurePoints.length > 1) {
          // Finalize measurements
          const newMeasurements: Measurement[] = [];
          for (let i = 0; i < measurePoints.length - 1; i++) {
            newMeasurements.push({
              start: measurePoints[i],
              end: measurePoints[i + 1],
              color: '#9333ea', // Purple for measurements
              thickness: 1,
            });
          }
          addToHistory({
            measurements: [...currentState.measurements, ...newMeasurements],
          });
          setMeasurePoints([]);
          triggerFeedback();
        }
        return;
      }

      // Handle tool shortcuts - but only if we're not editing text
      const toolToSelect = tools.find(
        (t) => t.shortcut && t.shortcut.toLowerCase() === pressedKey,
      );
      if (toolToSelect && !e.metaKey && !e.ctrlKey && !e.altKey) {
        console.log('Tool shortcut matched:', pressedKey, '-> switching to:', toolToSelect.name);
        e.preventDefault();
        if (toolToSelect.name === 'fullscreen') {
          toggleFullscreen();
        } else {
          // Clear measurements when switching tools (unless keep setting is on)
          if (!keepMeasurements && tool === 'measure') {
            setMeasurePoints([]);
          }
          setTool(toolToSelect.name as Tool);
          setActiveShapeStartPoint(null);
          setActiveShapeEndPoint(null);
          setArcPoints([]);
        }
        triggerFeedback();
        return;
      }

      // Handle other shortcuts
      if ((e.metaKey || e.ctrlKey) && pressedKey === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (pressedKey === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShowGrid((s) => !s);
        triggerFeedback();
      } else if (
        selectedTextElement &&
        (e.key === 'Delete' || e.key === 'Backspace')
      ) {
        e.preventDefault();
        const newTexts = currentState.texts.filter(
          (textEl) => textEl !== selectedTextElement,
        );
        addToHistory({ texts: newTexts });
        setSelectedTextElement(null);
        triggerFeedback();
      } else if (pressedKey === 'escape') {
        e.preventDefault();
        setActiveShapeStartPoint(null);
        setActiveShapeEndPoint(null);
        setArcPoints([]);
        if (tool !== 'select') setTool('select');
        triggerFeedback();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    showGrid,
    setShowGrid,
    tool,
    setTool,
    setActiveShapeStartPoint,
    setActiveShapeEndPoint,
    setArcPoints,
    triggerFeedback,
    toggleFullscreen,
    selectedTextElement, // Added
    currentState, // Added (or currentState.texts specifically)
    addToHistory, // Added
    isTextEditing, // Added for text editing state
    editingText, // Added for text editing state
    textInputStartTime, // Added for text input timing
    measurePoints, // Added for measure tool
    keepMeasurements, // Added for measure tool
  ]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      drawGrid(ctx, window.innerWidth, window.innerHeight);
      drawShapes(ctx);
      drawPreview(ctx);
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [drawGrid, drawShapes, drawPreview]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    drawGrid(ctx, canvas.width / dpr, canvas.height / dpr);
    drawShapes(ctx);
    drawPreview(ctx);
  }, [
    currentState,
    panOffset,
    zoom,
    currentMousePos,
    drawGrid,
    drawShapes,
    drawPreview,
    activeShapeStartPoint,
    arcPoints,
    showGrid,
    currentColor,
    currentThickness,
    eraserMode, // Add eraserMode here
  ]);

  useEffect(() => {
    if (isFirstLoad) {
      const timer = setTimeout(() => setIsFirstLoad(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isFirstLoad]);

  useEffect(() => {
    document.title = 'Graph Paper';
  }, []);

  useEffect(() => {
    const messages = {
      line: activeShapeStartPoint
        ? 'Tap to set line end point'
        : 'Tap to set line start point',
      rectangle: activeShapeStartPoint
        ? 'Tap to set rectangle corner'
        : 'Tap to set rectangle start',
      circle: activeShapeStartPoint
        ? 'Tap to set circle radius'
        : 'Tap to set circle center',
      arrow: activeShapeStartPoint
        ? 'Tap to set arrow end'
        : 'Tap to set arrow start',
      arc:
        arcPoints.length === 0
          ? 'Tap to set arc start point'
          : arcPoints.length === 1
            ? 'Tap to set arc end point'
            : 'Tap to set arc curve',
      text: editingText
        ? 'Type your text and press Enter (tool shortcuts disabled while typing)'
        : 'Tap to place text',
      measure: measurePoints.length === 0
        ? 'Tap to start measuring'
        : `Tap to continue measuring (${measurePoints.length} points) - Press Enter to finish`,
      eraser: `Drag to erase (${eraserMode} mode)`,
      pan: 'Drag to move, pinch to zoom',
      select: selectedTextElement
        ? 'Text selected. Press Delete to remove.'
        : 'Tap to select elements',
      'area-delete': selectionRect
        ? 'Release to finalize selection for deletion'
        : 'Click and drag to select area for deletion',
      wiring: 'Tap to place electrical outlets - green wires auto-connect to nearest outlet',
      plumbing: 'Tap to place water fixtures - blue water & gray drain pipes auto-connect',
      fullscreen: 'Fullscreen toggled',
    };
    setStatusMessage(messages[tool] || '');
  }, [
    tool,
    activeShapeStartPoint,
    selectionRect, // Added for area-delete status
    arcPoints,
    eraserMode,
    editingText,
    selectedTextElement,
    measurePoints, // Added for measure tool status
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const preventDefault = (e: TouchEvent) => e.preventDefault();
    canvas.addEventListener('touchmove', preventDefault, { passive: false });
    return () => canvas.removeEventListener('touchmove', preventDefault);
  }, []);

  // Handle wheel events with proper non-passive listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const canvasPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const worldPoint = getWorldPoint(canvasPoint);
      const newZoom = Math.max(0.1, Math.min(5, zoom - e.deltaY * 0.001));
      setPanOffset({
        x: canvasPoint.x - worldPoint.x * newZoom,
        y: canvasPoint.y - worldPoint.y * newZoom,
      });
      setZoom(newZoom);
    };
    
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [zoom, panOffset, getWorldPoint, setPanOffset, setZoom]);

  // Load saved drawing on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('graph-paper-history');
      if (stored) {
        const parsed = JSON.parse(stored) as CanvasState[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          setHistoryIndex(parsed.length - 1);
        }
      }
    } catch (err) {
      console.error('Failed to load drawing', err);
    }
  }, []);

  // Persist drawing whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem('graph-paper-history', JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save drawing', err);
    }
  }, [history]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvas.width; // Use DPR scaled width
    offscreenCanvas.height = canvas.height; // Use DPR scaled height
    const offscreenCtx = offscreenCanvas.getContext('2d');

    if (!offscreenCtx) return;

    offscreenCtx.scale(dpr, dpr); // Scale context for drawing

    // Draw background (similar to drawGrid's background part, but without grid lines)
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const gradient = offscreenCtx.createRadialGradient(
      w / 2,
      h / 2,
      0,
      w / 2,
      h / 2,
      Math.max(w, h),
    );
    gradient.addColorStop(0, '#fafafa');
    gradient.addColorStop(1, '#f0f0f0');
    offscreenCtx.fillStyle = gradient;
    offscreenCtx.fillRect(0, 0, w, h);

    // Draw shapes onto the offscreen canvas
    // drawShapes is a useCallback, so it has access to all necessary states
    drawShapes(offscreenCtx);

    const dataURL = offscreenCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'drawing.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerFeedback();
  }, [drawShapes, triggerFeedback]); // drawShapes has its own dependencies

  const handleClearDrawing = useCallback(() => {
    setHistory([
      {
        lines: [],
        arcs: [],
        rectangles: [],
        circles: [],
        arrows: [],
        texts: [],
        measurements: [],
        electricalOutlets: [],
        plumbingFixtures: [],
        electricalWires: [],
        plumbingPipes: [],
      },
    ]);
    setHistoryIndex(0);
    try {
      localStorage.removeItem('graph-paper-history');
    } catch (err) {
      console.error('Failed to clear drawing', err);
    }
    triggerFeedback();
  }, [triggerFeedback]);

  const handleLoadProject = useCallback((projectData: any) => {
    console.log('handleLoadProject called with data:', projectData);
    
    if (projectData && typeof projectData === 'object') {
      // Ensure all required arrays exist in the loaded data
      const loadedState: CanvasState = {
        lines: projectData.lines || [],
        arcs: projectData.arcs || [],
        rectangles: projectData.rectangles || [],
        circles: projectData.circles || [],
        arrows: projectData.arrows || [],
        texts: projectData.texts || [],
        measurements: projectData.measurements || [],
        electricalOutlets: projectData.electricalOutlets || [],
        plumbingFixtures: projectData.plumbingFixtures || [],
        electricalWires: projectData.electricalWires || [],
        plumbingPipes: projectData.plumbingPipes || [],
      };
      
      console.log('Setting loaded state:', loadedState);
      setHistory([loadedState]);
      setHistoryIndex(0);
      triggerFeedback();
      console.log('Project loaded and history updated');
    } else {
      console.error('Invalid project data:', projectData);
    }
  }, [triggerFeedback]);

  const deleteSelectedElements = useCallback(() => {
    if (selectedElementIndices.length === 0) return;

    // For now, only handling lines as per current selection logic
    const newLines = currentState.lines.filter(
      (_, index) => !selectedElementIndices.includes(index),
    );

    // Potentially extend to other element types (rectangles, circles, etc.) here
    // if the selection logic is expanded in the future.

    addToHistory({
      ...currentState, // Preserve other elements like arcs, rectangles etc.
      lines: newLines,
    });

    setSelectedElementIndices([]); // Clear selection
    triggerFeedback();
    setStatusMessage(`${selectedElementIndices.length} element(s) deleted.`);
  }, [
    selectedElementIndices,
    currentState,
    addToHistory,
    triggerFeedback,
    setSelectedElementIndices, // ensure it's a dependency
    setStatusMessage, // ensure it's a dependency
  ]);



  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Mode switching functions
  const handleModeSwitch = (mode: AppMode) => {
    setCurrentMode(mode);
    switchMode('traditional');
    triggerFeedback();
  };

  // Debug editingText changes and handle focus
  useEffect(() => {
    console.log('=== EDITING TEXT STATE CHANGED ===');
    console.log('New editingText state:', editingText);
    if (editingText) {
      console.log('Text content:', editingText.currentText);
      console.log('Text position:', editingText.position);
      
      // Focus the input when editingText is first created (only when text is empty)
      if (editingText.currentText === '' && textInputRef.current) {
        console.log('Focusing new text input');
        setTimeout(() => {
          if (textInputRef.current && editingText && editingText.currentText === '') {
            textInputRef.current.focus();
            // Don't select all text - just focus
          }
        }, 50);
      }
    }
  }, [editingText]);

  // Render Traditional Graph Paper Mode (default)
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-gradient-to-br from-slate-50 to-slate-100 touch-none">


      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full touch-none ${
          tool === 'pan'
            ? 'cursor-grab'
            : tool === 'eraser'
              ? 'cursor-crosshair'
              : 'cursor-crosshair'
        } ${isPanning ? 'cursor-grabbing' : ''}`}
        onMouseDown={(e) => handlePointerDown(getCanvasPoint(e), e.shiftKey)}
        onMouseMove={(e) => handlePointerMove(getCanvasPoint(e))}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => {
          e.preventDefault();
          const touches = e.touches;
          if (touches.length === 1) {
            setIsMultiTouch(false);
            handlePointerDown(getCanvasPoint(touches[0]), false, true);
          } else if (touches.length === 2) {
            setIsMultiTouch(true);
            setIsPanning(true);
            setLastTouchDistance(getTouchDistance(touches));
            setStartPanPoint(getCanvasPoint(touches[0]));
          }
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const touches = e.touches;
          if (touches.length === 1 && !isMultiTouch) {
            handlePointerMove(getCanvasPoint(touches[0]));
          } else if (touches.length === 2) {
            const currentDistance = getTouchDistance(touches);
            const currentPoint = getCanvasPoint(touches[0]);
            if (lastTouchDistance > 0) {
              const zoomDelta = (currentDistance - lastTouchDistance) * 0.01;
              const newZoom = Math.max(0.1, Math.min(5, zoom + zoomDelta));
              const worldPoint = getWorldPoint(currentPoint);
              setPanOffset({
                x: currentPoint.x - worldPoint.x * newZoom,
                y: currentPoint.y - worldPoint.y * newZoom,
              });
              setZoom(newZoom);
            }
            if (isPanning) {
              const dx = currentPoint.x - startPanPoint.x;
              const dy = currentPoint.y - startPanPoint.y;
              setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
              setStartPanPoint(currentPoint);
            }
            setLastTouchDistance(currentDistance);
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handlePointerUp();
        }}
        onWheel={(e) => {
          e.preventDefault();
          const canvasPoint = getCanvasPoint(e);
          const worldPoint = getWorldPoint(canvasPoint);
          const newZoom = Math.max(0.1, Math.min(5, zoom - e.deltaY * 0.001));
          setPanOffset({
            x: canvasPoint.x - worldPoint.x * newZoom,
            y: canvasPoint.y - worldPoint.y * newZoom,
          });
          setZoom(newZoom);
        }}
      />

      {/* Tool Selection UI Container */}
      <div
        className={`absolute z-10 transition-all duration-700 ${
          isMobile
            ? isToolMenuOpen
              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' // Mobile: Tool menu open (centered card)
              : 'bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] left-1/2 -translate-x-1/2' // Mobile: Tool menu closed (button at bottom)
            : 'top-6 right-6' // Desktop toolbar position
        } ${isFirstLoad ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}
      >
        {isMobile && !isToolMenuOpen ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsToolMenuOpen(true);
              triggerFeedback();
            }}
            className="w-14 h-14 hover:bg-gray-100 active:scale-95"
            aria-label="Select Tool"
          >
            {(() => {
              const Icon = tools.find((t) => t.name === tool)?.icon;
              return Icon ? (
                <Icon className="w-6 h-6" />
              ) : null;
            })()}
          </Button>
        ) : (
          <>
            <AnimatedToolbar
              tools={displayedTools.map(
                ({ name, icon, label, shortcut, color }) => ({
                  name,
                  icon,
                  label,
                  shortcut,
                  color,
                }),
              )}
              activeTool={tool}
              onToolChange={(selectedTool) => {
                if (selectedTool === 'fullscreen') {
                  toggleFullscreen();
                  return;
                }
                setTool(selectedTool as Tool);
                if (isMobile) setIsToolMenuOpen(false);
              }}
              isMobile={isMobile}
              className={isMobile ? 'max-w-[calc(100vw-2rem)]' : ''}
            />

            {/* Additional mobile controls */}
            {isMobile && (
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm mt-2">
                <CardContent className="p-2">
                  {/* User Account Section */}
                  <div className="mb-3 space-y-2">
                    {isAuthenticated ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span className="truncate">{user?.email}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsProjectsModalOpen(true);
                              setIsToolMenuOpen(false);
                            }}
                            size="sm"
                            className="flex-1"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Projects
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              signOut();
                              triggerFeedback();
                            }}
                            size="sm"
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAuthModalOpen(true);
                          setIsToolMenuOpen(false);
                        }}
                        className="w-full"
                        size="sm"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Sign In / Sign Up
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setDesignMode((prevMode) =>
                        prevMode === 'graph' ? 'residential' : 'graph',
                      );
                      triggerFeedback();
                    }}
                    className="w-full mt-2 text-xs"
                    size="sm"
                  >
                    {designMode === 'graph'
                      ? 'Residential Builder'
                      : 'Graph Paper'}
                  </Button>
                  
                  <div className="flex justify-end pt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setIsToolMenuOpen(false);
                        triggerFeedback();
                      }}
                      className="w-8 h-8 hover:bg-gray-100 active:scale-95"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Desktop User Account Controls */}
      {!isMobile && (
        <div className="absolute top-6 left-6 z-10">
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-3">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">{user?.email}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsProjectsModalOpen(true)}
                      size="sm"
                      className="flex-1"
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Projects
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        signOut();
                        triggerFeedback();
                      }}
                      size="sm"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsAuthModalOpen(true)}
                  size="sm"
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In / Sign Up
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`absolute ${isMobile ? 'top-[calc(env(safe-area-inset-top)+1.5rem)]' : 'bottom-6'} left-1/2 -translate-x-1/2 z-10`}
        >
          <Card className="shadow-lg border-0 bg-gray-900 text-white">
            <CardContent className={`${isMobile ? 'px-3 py-2' : 'px-4 py-2'}`}>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                {statusMessage}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Text Editing Input */}
      {editingText && (
        <input
          ref={textInputRef}
          type="text"
          value={editingText.currentText}
          onChange={(e) => {
            console.log('=== TEXT INPUT CHANGE ===');
            console.log('Input value:', e.target.value);
            console.log('Current editingText state:', editingText);
            console.log('Setting new text state...');
            setEditingText({ ...editingText, currentText: e.target.value });
            console.log('Text state updated');
          }}
          onFocus={() => {
            console.log('Text input focused');
          }}
          onBlur={(e) => {
            console.log('Text input blurred, saving text');
            
            // Prevent immediate blur - only allow blur if enough time has passed or if there's actual text
            const timeSinceStart = Date.now() - textInputStartTime;
            const hasText = editingText && editingText.currentText.trim();
            
            if (timeSinceStart < 200 && !hasText) {
              console.log('Preventing immediate blur - refocusing input');
              // Refocus the input if blur happened too quickly
              setTimeout(() => {
                const input = e.target as HTMLInputElement;
                if (input && editingText) {
                  input.focus();
                }
              }, 10);
              return;
            }
            
            // Only save if we actually have some text
            if (hasText) {
              const worldPosition = getWorldPoint(editingText.position);
              addToHistory({
                texts: [
                  ...currentState.texts,
                  {
                    position: worldPosition,
                    text: editingText.currentText.trim(),
                    color: currentColor,
                    fontSize: 16,
                  },
                ],
              });
              console.log('Text saved on blur:', editingText.currentText.trim());
            } else {
              console.log('No text to save on blur');
            }
            setEditingText(null);
            setIsTextEditing(false);
          }}
          onKeyDown={(e) => {
            console.log('Text input onKeyDown:', e.key);
            // Let the global keyboard handler deal with Enter and Escape
          }}
          placeholder="Enter text..."
          autoFocus
          className="absolute bg-white border-2 border-blue-500 rounded px-2 py-1 text-sm font-mono shadow-lg outline-none min-w-[100px]"
          style={{
            left: editingText.position.x,
            top: editingText.position.y - 30,
            zIndex: 1000,
          }}
        />
      )}
      
      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          triggerFeedback();
        }}
      />

      {/* Projects Modal */}
      <ProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        onLoadProject={handleLoadProject}
        currentProjectData={currentState}
        user={user}
      />
    </div>
  );
}
