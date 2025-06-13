"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-is-mobile"
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
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

type Tool = "select" | "line" | "rectangle" | "circle" | "arrow" | "text" | "arc" | "pan" | "measure" | "eraser"
type EraserMode = "partial" | "whole"
type Point = { x: number; y: number }
type Line = { start: Point; end: Point; color?: string; thickness?: number }
type Arc = { start: Point; end: Point; control: Point; color?: string; thickness?: number }
type Rectangle = { start: Point; end: Point; color?: string; thickness?: number; filled?: boolean }
type CircleShape = { center: Point; radius: number; color?: string; thickness?: number; filled?: boolean }
type Arrow = { start: Point; end: Point; color?: string; thickness?: number }
type TextElement = { position: Point; text: string; color?: string; fontSize?: number }

interface CanvasState {
  lines: Line[]
  arcs: Arc[]
  rectangles: Rectangle[]
  circles: CircleShape[]
  arrows: Arrow[]
  texts: TextElement[]
}

const EPSILON = 0.001
const COLORS = ["#000000", "#dc2626", "#2563eb", "#16a34a", "#ca8a04", "#9333ea", "#c2410c"]
const THICKNESSES = [1, 2, 4, 6]

// Vector Math Helpers
const vec = (p1: Point, p2: Point): Point => ({ x: p2.x - p1.x, y: p2.y - p1.y })
const add = (p1: Point, p2: Point): Point => ({ x: p1.x + p2.x, y: p1.y + p2.y })
const sub = (p1: Point, p2: Point): Point => ({ x: p1.x - p2.x, y: p1.y - p2.y })
const scale = (p: Point, s: number): Point => ({ x: p.x * s, y: p.y * s })
const dot = (p1: Point, p2: Point): number => p1.x * p2.x + p1.y * p2.y
const distSq = (p1: Point, p2: Point): number => (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2
const dist = (p1: Point, p2: Point): number => Math.sqrt(distSq(p1, p2))
const len = (p: Point): number => Math.sqrt(dot(p, p))
const normalize = (p: Point): Point => {
  const l = len(p)
  return l < EPSILON ? { x: 0, y: 0 } : scale(p, 1 / l)
}

// Geometry Helpers
function projectPointOntoLine(p: Point, a: Point, b: Point): Point {
  const ab = vec(a, b)
  const ap = vec(a, p)
  const lenAbSq = dot(ab, ab)
  if (lenAbSq < EPSILON) return a
  const t = dot(ap, ab) / lenAbSq
  return add(a, scale(ab, t))
}

function clampPointToSegment(p: Point, a: Point, b: Point): Point {
  const ab = vec(a, b)
  const ap = vec(a, p)
  const lenAbSq = dot(ab, ab)
  if (lenAbSq < EPSILON) return a
  let t = dot(ap, ab) / lenAbSq
  t = Math.max(0, Math.min(1, t))
  return add(a, scale(ab, t))
}

function distancePointToLineSegment(p: Point, a: Point, b: Point): number {
  const closestPoint = clampPointToSegment(projectPointOntoLine(p, a, b), a, b)
  return dist(p, closestPoint)
}

// Helper to get points on a quadratic bezier curve
function getPointsOnArc(arc: Arc, numPoints = 20): Point[] {
  const points: Point[] = []
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const x = (1 - t) * (1 - t) * arc.start.x + 2 * (1 - t) * t * arc.control.x + t * t * arc.end.x
    const y = (1 - t) * (1 - t) * arc.start.y + 2 * (1 - t) * t * arc.control.y + t * t * arc.end.y
    points.push({ x, y })
  }
  return points
}

const tools: { name: Tool; icon: LucideIcon; label: string; shortcut?: string }[] = [
  { name: "select", icon: MousePointer, label: "Select", shortcut: "V" },
  { name: "line", icon: PenLine, label: "Line", shortcut: "L" },
  { name: "rectangle", icon: Square, label: "Rectangle", shortcut: "R" },
  { name: "circle", icon: Circle, label: "Circle", shortcut: "C" },
  { name: "arc", icon: Orbit, label: "Arc", shortcut: "O" },
  { name: "arrow", icon: ArrowRight, label: "Arrow", shortcut: "A" },
  { name: "measure", icon: Ruler, label: "Measure", shortcut: "M" },
  { name: "eraser", icon: EraserIcon, label: "Eraser", shortcut: "E" },
  { name: "pan", icon: Move, label: "Navigate", shortcut: "P" },
]

export default function EnhancedGraphPaper() {
  const isMobile = useIsMobile()
  const coreToolNames: Tool[] = ["select", "line", "rectangle", "eraser", "pan"];
  const [showAllMobileTools, setShowAllMobileTools] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [tool, setTool] = useState<Tool>("line")
  const [eraserMode, setEraserMode] = useState<EraserMode>("partial") // Default to partial
  const [currentColor, setCurrentColor] = useState("#000000")
  const [currentThickness, setCurrentThickness] = useState(2)
  const [gridSize, setGridSize] = useState(20)
  const [showGrid, setShowGrid] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isErasing, setIsErasing] = useState(false)
  const [startPanPoint, setStartPanPoint] = useState<Point>({ x: 0, y: 0 })

  const [arcPoints, setArcPoints] = useState<Point[]>([])
  const [activeShapeStartPoint, setActiveShapeStartPoint] = useState<Point | null>(null)
  const [activeShapeEndPoint, setActiveShapeEndPoint] = useState<Point | null>(null)

  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null)
  const [eraserStrokePoints, setEraserStrokePoints] = useState<Point[]>([])
  const [statusMessage, setStatusMessage] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  const [lastTouchDistance, setLastTouchDistance] = useState<number>(0)
  const [isMultiTouch, setIsMultiTouch] = useState(false)

  const [history, setHistory] = useState<CanvasState[]>([
    {
      lines: [],
      arcs: [],
      rectangles: [],
      circles: [],
      arrows: [],
      texts: [],
    },
  ])
  const [historyIndex, setHistoryIndex] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const eraserWidth = gridSize / 1.5

  const currentState = useMemo(() => history[historyIndex], [history, historyIndex])

  const displayedTools = useMemo(() => {
    if (!isMobile) return tools;
    if (showAllMobileTools) return tools;
    return tools.filter(t => coreToolNames.includes(t.name));
  }, [isMobile, showAllMobileTools, tools]); // tools was missing in dependencies

  const triggerFeedback = useCallback(() => {
    setIsAnimating(true)
    if (isMobile && "vibrate" in navigator) {
      navigator.vibrate(20)
    }
    setTimeout(() => setIsAnimating(false), 200)
  }, [isMobile])

  const addToHistory = (newState: Partial<CanvasState>) => {
    const nextState: CanvasState = { ...currentState, ...newState }
    const newHistory = history.slice(0, historyIndex + 1)
    setHistory([...newHistory, nextState])
    setHistoryIndex(newHistory.length)
  }

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1)
      triggerFeedback()
    }
  }, [historyIndex, triggerFeedback])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      triggerFeedback()
    }
  }, [historyIndex, history.length, triggerFeedback])

  const getCanvasPoint = (e: { clientX: number; clientY: number }): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const getWorldPoint = (canvasPoint: Point): Point => ({
    x: (canvasPoint.x - panOffset.x) / zoom,
    y: (canvasPoint.y - panOffset.y) / zoom,
  })

  const getSnappedPoint = (point: Point): Point => {
    const worldPoint = getWorldPoint(point)
    return {
      x: Math.round(worldPoint.x / gridSize) * gridSize,
      y: Math.round(worldPoint.y / gridSize) * gridSize,
    }
  }

  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.clearRect(0, 0, w, h)
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h))
      gradient.addColorStop(0, "#fafafa")
      gradient.addColorStop(1, "#f0f0f0")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)

      if (!showGrid) return

      const gridOpacity = Math.min(0.3, Math.max(0.05, zoom * 0.15))
      const zoomedGridSize = gridSize * zoom
      const majorGridSize = zoomedGridSize * 5

      if (zoomedGridSize > 8) {
        ctx.strokeStyle = `rgba(0, 0, 0, ${gridOpacity * 0.4})`
        ctx.lineWidth = 0.5
        const startX = panOffset.x % zoomedGridSize
        const startY = panOffset.y % zoomedGridSize
        for (let x = startX; x < w; x += zoomedGridSize) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, h)
          ctx.stroke()
        }
        for (let y = startY; y < h; y += zoomedGridSize) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(w, y)
          ctx.stroke()
        }
      }
      if (majorGridSize > 20) {
        ctx.strokeStyle = `rgba(0, 0, 0, ${gridOpacity})`
        ctx.lineWidth = 1
        const majorStartX = panOffset.x % majorGridSize
        const majorStartY = panOffset.y % majorGridSize
        for (let x = majorStartX; x < w; x += majorGridSize) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, h)
          ctx.stroke()
        }
        for (let y = majorStartY; y < h; y += majorGridSize) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(w, y)
          ctx.stroke()
        }
      }
    },
    [panOffset, zoom, gridSize, showGrid],
  )

  const drawShapes = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      currentState.lines.forEach((line) => {
        ctx.strokeStyle = line.color || currentColor
        ctx.lineWidth = (line.thickness || currentThickness) * zoom
        ctx.beginPath()
        ctx.moveTo(line.start.x * zoom + panOffset.x, line.start.y * zoom + panOffset.y)
        ctx.lineTo(line.end.x * zoom + panOffset.x, line.end.y * zoom + panOffset.y)
        ctx.stroke()
      })
      currentState.arcs.forEach((arc) => {
        ctx.strokeStyle = arc.color || currentColor
        ctx.lineWidth = (arc.thickness || currentThickness) * zoom
        ctx.beginPath()
        ctx.moveTo(arc.start.x * zoom + panOffset.x, arc.start.y * zoom + panOffset.y)
        ctx.quadraticCurveTo(
          arc.control.x * zoom + panOffset.x,
          arc.control.y * zoom + panOffset.y,
          arc.end.x * zoom + panOffset.x,
          arc.end.y * zoom + panOffset.y,
        )
        ctx.stroke()
      })
      currentState.rectangles.forEach((rect) => {
        ctx.strokeStyle = rect.color || currentColor
        ctx.lineWidth = (rect.thickness || currentThickness) * zoom
        const x = Math.min(rect.start.x, rect.end.x) * zoom + panOffset.x
        const y = Math.min(rect.start.y, rect.end.y) * zoom + panOffset.y
        const w = Math.abs(rect.end.x - rect.start.x) * zoom
        const h = Math.abs(rect.end.y - rect.start.y) * zoom
        if (rect.filled) {
          ctx.fillStyle = rect.color || currentColor
          ctx.fillRect(x, y, w, h)
        } else {
          ctx.strokeRect(x, y, w, h)
        }
      })
      currentState.circles.forEach((circle) => {
        ctx.strokeStyle = circle.color || currentColor
        ctx.lineWidth = (circle.thickness || currentThickness) * zoom
        ctx.beginPath()
        ctx.arc(
          circle.center.x * zoom + panOffset.x,
          circle.center.y * zoom + panOffset.y,
          circle.radius * zoom,
          0,
          2 * Math.PI,
        )
        if (circle.filled) {
          ctx.fillStyle = circle.color || currentColor
          ctx.fill()
        } else {
          ctx.stroke()
        }
      })
      currentState.arrows.forEach((arrow) => {
        ctx.strokeStyle = arrow.color || currentColor
        ctx.lineWidth = (arrow.thickness || currentThickness) * zoom
        ctx.beginPath()
        ctx.moveTo(arrow.start.x * zoom + panOffset.x, arrow.start.y * zoom + panOffset.y)
        ctx.lineTo(arrow.end.x * zoom + panOffset.x, arrow.end.y * zoom + panOffset.y)
        ctx.stroke()
        const angle = Math.atan2(arrow.end.y - arrow.start.y, arrow.end.x - arrow.start.x)
        const headLength = Math.max(10, 15 * zoom)
        ctx.beginPath()
        ctx.moveTo(arrow.end.x * zoom + panOffset.x, arrow.end.y * zoom + panOffset.y)
        ctx.lineTo(
          arrow.end.x * zoom + panOffset.x - headLength * Math.cos(angle - Math.PI / 6),
          arrow.end.y * zoom + panOffset.y - headLength * Math.sin(angle - Math.PI / 6),
        )
        ctx.moveTo(arrow.end.x * zoom + panOffset.x, arrow.end.y * zoom + panOffset.y)
        ctx.lineTo(
          arrow.end.x * zoom + panOffset.x - headLength * Math.cos(angle + Math.PI / 6),
          arrow.end.y * zoom + panOffset.y - headLength * Math.sin(angle + Math.PI / 6),
        )
        ctx.stroke()
      })
    },
    [currentState, currentColor, currentThickness, panOffset, zoom],
  )

  const drawPreview = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!currentMousePos) return
      ctx.strokeStyle = `${currentColor}80`
      ctx.lineWidth = Math.max(1, currentThickness * zoom)
      ctx.setLineDash([Math.max(3, 5 * zoom), Math.max(3, 5 * zoom)])

      if (tool === "arc") {
        const snappedCurrentMouse = getSnappedPoint(currentMousePos)
        if (arcPoints.length === 1) {
          const startPoint = arcPoints[0]
          ctx.beginPath()
          ctx.moveTo(startPoint.x * zoom + panOffset.x, startPoint.y * zoom + panOffset.y)
          ctx.lineTo(snappedCurrentMouse.x * zoom + panOffset.x, snappedCurrentMouse.y * zoom + panOffset.y)
          ctx.stroke()
          ctx.fillStyle = currentColor
          ;[startPoint, snappedCurrentMouse].forEach((point) => {
            if (!point) return
            ctx.beginPath()
            ctx.arc(point.x * zoom + panOffset.x, point.y * zoom + panOffset.y, Math.max(2, 4 * zoom), 0, 2 * Math.PI)
            ctx.fill()
          })
        } else if (arcPoints.length === 2) {
          const startPoint = arcPoints[0]
          const endPoint = arcPoints[1]
          const controlPointPreview = snappedCurrentMouse
          if (!startPoint || !endPoint || !controlPointPreview) return
          ctx.beginPath()
          ctx.moveTo(startPoint.x * zoom + panOffset.x, startPoint.y * zoom + panOffset.y)
          ctx.quadraticCurveTo(
            controlPointPreview.x * zoom + panOffset.x,
            controlPointPreview.y * zoom + panOffset.y,
            endPoint.x * zoom + panOffset.x,
            endPoint.y * zoom + panOffset.y,
          )
          ctx.stroke()
          ctx.save()
          ctx.strokeStyle = `${currentColor}40`
          ctx.beginPath()
          ctx.moveTo(startPoint.x * zoom + panOffset.x, startPoint.y * zoom + panOffset.y)
          ctx.lineTo(controlPointPreview.x * zoom + panOffset.x, controlPointPreview.y * zoom + panOffset.y)
          ctx.lineTo(endPoint.x * zoom + panOffset.x, endPoint.y * zoom + panOffset.y)
          ctx.stroke()
          ctx.restore()
          ctx.fillStyle = currentColor
          ;[startPoint, endPoint, controlPointPreview].forEach((point) => {
            ctx.beginPath()
            ctx.arc(point.x * zoom + panOffset.x, point.y * zoom + panOffset.y, Math.max(2, 4 * zoom), 0, 2 * Math.PI)
            ctx.fill()
          })
        }
      }

      if (activeShapeStartPoint && tool !== "arc") {
        const snappedEnd = getSnappedPoint(currentMousePos)
        if (tool === "line") {
          ctx.beginPath()
          ctx.moveTo(activeShapeStartPoint.x * zoom + panOffset.x, activeShapeStartPoint.y * zoom + panOffset.y)
          ctx.lineTo(snappedEnd.x * zoom + panOffset.x, snappedEnd.y * zoom + panOffset.y)
          ctx.stroke()
          const dx = Math.abs(snappedEnd.x - activeShapeStartPoint.x) / gridSize
          const dy = Math.abs(snappedEnd.y - activeShapeStartPoint.y) / gridSize
          const length = Math.sqrt(dx * dx + dy * dy)
          if (length > 0) {
            const midX = ((activeShapeStartPoint.x + snappedEnd.x) / 2) * zoom + panOffset.x
            const midY = ((activeShapeStartPoint.y + snappedEnd.y) / 2) * zoom + panOffset.y
            ctx.save()
            ctx.font = `${Math.max(10, 12 * zoom)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
            ctx.fillStyle = "#3b82f6"
            ctx.strokeStyle = "white"
            ctx.lineWidth = 3
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            const text = `${length.toFixed(1)} units`
            ctx.strokeText(text, midX, midY - Math.max(8, 15 * zoom))
            ctx.fillText(text, midX, midY - Math.max(8, 15 * zoom))
            ctx.restore()
          }
        } else if (tool === "rectangle") {
          const worldStartX = activeShapeStartPoint.x
          const worldStartY = activeShapeStartPoint.y
          const worldEndX = snappedEnd.x
          const worldEndY = snappedEnd.y

          const rectX = Math.min(worldStartX, worldEndX) * zoom + panOffset.x
          const rectY = Math.min(worldStartY, worldEndY) * zoom + panOffset.y
          const rectW = Math.abs(worldEndX - worldStartX) * zoom
          const rectH = Math.abs(worldEndY - worldStartY) * zoom
          ctx.strokeRect(rectX, rectY, rectW, rectH)

          const dimWidth = Math.abs(worldEndX - worldStartX) / gridSize
          const dimHeight = Math.abs(worldEndY - worldStartY) / gridSize

          if (dimWidth > 0 || dimHeight > 0) {
            ctx.save()
            ctx.font = `${Math.max(10, 12 * zoom)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
            ctx.fillStyle = "#3b82f6" // Blue color for dimensions
            ctx.strokeStyle = "white"
            ctx.lineWidth = 3 // For text outline
            ctx.textBaseline = "middle"

            // Display width dimension
            if (dimWidth > 0) {
              const widthText = `${dimWidth.toFixed(1)} u`
              const textWidthX = ((worldStartX + worldEndX) / 2) * zoom + panOffset.x
              const textWidthY = Math.min(worldStartY, worldEndY) * zoom + panOffset.y - Math.max(8, 15 * zoom) // Above the top edge
              ctx.textAlign = "center"
              ctx.strokeText(widthText, textWidthX, textWidthY)
              ctx.fillText(widthText, textWidthX, textWidthY)
            }

            // Display height dimension
            if (dimHeight > 0) {
              const heightText = `${dimHeight.toFixed(1)} u`
              const textHeightX = Math.min(worldStartX, worldEndX) * zoom + panOffset.x - Math.max(8, 15 * zoom) // Left of the left edge
              const textHeightY = ((worldStartY + worldEndY) / 2) * zoom + panOffset.y
              ctx.textAlign = "right" // Align to the right so it's "outside" the left edge
              ctx.strokeText(heightText, textHeightX, textHeightY)
              ctx.fillText(heightText, textHeightX, textHeightY)
            }
            ctx.restore()
          }
        } else if (tool === "circle") {
          const radius = dist(activeShapeStartPoint, snappedEnd)
          ctx.beginPath()
          ctx.arc(
            activeShapeStartPoint.x * zoom + panOffset.x,
            activeShapeStartPoint.y * zoom + panOffset.y,
            radius * zoom,
            0,
            2 * Math.PI,
          )
          ctx.stroke()
        } else if (tool === "arrow") {
          ctx.beginPath()
          ctx.moveTo(activeShapeStartPoint.x * zoom + panOffset.x, activeShapeStartPoint.y * zoom + panOffset.y)
          ctx.lineTo(snappedEnd.x * zoom + panOffset.x, snappedEnd.y * zoom + panOffset.y)
          ctx.stroke()
        }
      }

      if (tool === "eraser") {
        const worldCursorPos = getWorldPoint(currentMousePos)
        ctx.beginPath()
        ctx.arc(
          worldCursorPos.x * zoom + panOffset.x,
          worldCursorPos.y * zoom + panOffset.y,
          (eraserWidth / 2) * zoom,
          0,
          2 * Math.PI,
        )
        ctx.strokeStyle = "rgba(239, 68, 68, 0.6)"
        ctx.lineWidth = Math.max(1, 2 * zoom)
        ctx.stroke()
      }
      ctx.setLineDash([])
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
    ],
  )

  const handlePointerDown = (point: Point, isShift: boolean, isTouchEvent = false) => {
    if (isShift || tool === "pan") {
      setIsPanning(true)
      setStartPanPoint(point)
      return
    }
    const worldPoint = getWorldPoint(point)
    const snappedPoint = getSnappedPoint(point)

    if (tool === "arc") {
      if (arcPoints.length === 0) {
        setArcPoints([snappedPoint])
        setActiveShapeStartPoint(snappedPoint)
        triggerFeedback()
      } else if (arcPoints.length === 1) {
        if (dist(arcPoints[0], snappedPoint) > EPSILON) {
          setArcPoints([arcPoints[0], snappedPoint])
          setActiveShapeEndPoint(snappedPoint)
          triggerFeedback()
        }
      } else if (arcPoints.length === 2) {
        const controlPoint = snappedPoint
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
        })
        setArcPoints([])
        setActiveShapeStartPoint(null)
        setActiveShapeEndPoint(null)
        triggerFeedback()
      }
      return
    }

    if (["line", "rectangle", "circle", "arrow"].includes(tool)) {
      if (activeShapeStartPoint) {
        if (dist(activeShapeStartPoint, snappedPoint) > EPSILON) {
          const shapeData = {
            start: activeShapeStartPoint,
            end: snappedPoint,
            color: currentColor,
            thickness: currentThickness,
          }
          switch (tool) {
            case "line":
              addToHistory({ lines: [...currentState.lines, shapeData] })
              break
            case "rectangle":
              addToHistory({ rectangles: [...currentState.rectangles, shapeData as Rectangle] })
              break
            case "circle":
              const radius = dist(activeShapeStartPoint, snappedPoint)
              addToHistory({
                circles: [
                  ...currentState.circles,
                  { center: activeShapeStartPoint, radius, color: currentColor, thickness: currentThickness },
                ],
              })
              break
            case "arrow":
              addToHistory({ arrows: [...currentState.arrows, shapeData as Arrow] })
              break
          }
          triggerFeedback()
        }
        setActiveShapeStartPoint(null)
      } else {
        setActiveShapeStartPoint(snappedPoint)
        triggerFeedback()
      }
    } else if (tool === "eraser") {
      setIsErasing(true)
      setEraserStrokePoints([worldPoint])
    }
  }

  const handlePointerMove = (point: Point) => {
    setCurrentMousePos(point)
    if (isPanning) {
      const dx = point.x - startPanPoint.x
      const dy = point.y - startPanPoint.y
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy })
      setStartPanPoint(point)
    }
    if (isErasing && tool === "eraser") {
      const worldPoint = getWorldPoint(point)
      setEraserStrokePoints((prev) => [...prev, worldPoint])
    }
  }

  const handlePointerUp = () => {
    if (isErasing && tool === "eraser" && eraserStrokePoints.length > 0) {
      let opPerformed = false
      let newLines = [...currentState.lines]
      let newCircles = [...currentState.circles]
      let newArcs = [...currentState.arcs]
      let newRectangles = [...currentState.rectangles]
      let newArrows = [...currentState.arrows]

      // --- Line Erasing ---
      if (eraserMode === "partial") {
        const originalLinesSnapshot = [...newLines]
        const processedLines: Line[] = []
        newLines.forEach((originalLine) => {
          let segments: Line[] = [originalLine]
          eraserStrokePoints.forEach((ep) => {
            const nextSegments: Line[] = []
            segments.forEach((seg) => {
              if (distancePointToLineSegment(ep, seg.start, seg.end) < eraserWidth / 2) {
                const proj = projectPointOntoLine(ep, seg.start, seg.end)
                const lineDir = normalize(vec(seg.start, seg.end))
                const cutP1 = clampPointToSegment(sub(proj, scale(lineDir, eraserWidth / 2)), seg.start, seg.end)
                const cutP2 = clampPointToSegment(add(proj, scale(lineDir, eraserWidth / 2)), seg.start, seg.end)
                if (dist(seg.start, cutP1) > EPSILON) nextSegments.push({ ...seg, end: cutP1 })
                if (dist(cutP2, seg.end) > EPSILON) nextSegments.push({ ...seg, start: cutP2 })
              } else {
                nextSegments.push(seg)
              }
            })
            segments = nextSegments
          })
          processedLines.push(...segments)
        })

        if (
          processedLines.length !== originalLinesSnapshot.length ||
          processedLines.some((line, idx) => {
            const original = originalLinesSnapshot[idx]
            return (
              !original ||
              dist(line.start, original.start) > EPSILON ||
              dist(line.end, original.end) > EPSILON ||
              line.color !== original.color ||
              line.thickness !== original.thickness
            )
          })
        ) {
          newLines = processedLines
          opPerformed = true
        }
      } else {
        // eraserMode === 'whole' for lines
        const originalLineCount = newLines.length
        newLines = newLines.filter(
          (line) =>
            !eraserStrokePoints.some((ep) => distancePointToLineSegment(ep, line.start, line.end) < eraserWidth / 2),
        )
        if (newLines.length !== originalLineCount) opPerformed = true
      }

      // --- Other Shapes (always whole element deletion) ---
      const originalCircleCount = newCircles.length
      newCircles = newCircles.filter(
        (circle) =>
          !eraserStrokePoints.some((ep) => Math.abs(dist(ep, circle.center) - circle.radius) < eraserWidth / 2),
      )
      if (newCircles.length !== originalCircleCount) opPerformed = true

      const originalArcCount = newArcs.length
      newArcs = newArcs.filter((arc) => {
        const arcPolyline = getPointsOnArc(arc)
        return !eraserStrokePoints.some((ep) =>
          arcPolyline.some(
            (p_arc, i_arc, arr_arc) =>
              i_arc < arr_arc.length - 1 && distancePointToLineSegment(ep, p_arc, arr_arc[i_arc + 1]) < eraserWidth / 2,
          ),
        )
      })
      if (newArcs.length !== originalArcCount) opPerformed = true

      const originalRectangleCount = newRectangles.length
      newRectangles = newRectangles.filter((rect) => {
        const p1 = rect.start
        const p3 = rect.end
        const p2 = { x: p3.x, y: p1.y }
        const p4 = { x: p1.x, y: p3.y }
        const sides = [
          { start: p1, end: p2 },
          { start: p2, end: p3 },
          { start: p3, end: p4 },
          { start: p4, end: p1 },
        ]
        return !eraserStrokePoints.some((ep) =>
          sides.some((side) => distancePointToLineSegment(ep, side.start, side.end) < eraserWidth / 2),
        )
      })
      if (newRectangles.length !== originalRectangleCount) opPerformed = true

      const originalArrowCount = newArrows.length
      newArrows = newArrows.filter(
        (arrow) =>
          !eraserStrokePoints.some((ep) => distancePointToLineSegment(ep, arrow.start, arrow.end) < eraserWidth / 2),
      )
      if (newArrows.length !== originalArrowCount) opPerformed = true

      if (opPerformed) {
        addToHistory({
          lines: newLines,
          circles: newCircles,
          arcs: newArcs,
          rectangles: newRectangles,
          arrows: newArrows,
          texts: currentState.texts, // Preserve texts
        })
        triggerFeedback()
      }
    }

    setIsPanning(false)
    setIsErasing(false)
    setEraserStrokePoints([])
    setIsMultiTouch(false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const pressedKey = e.key.toLowerCase()

      // Handle tool shortcuts
      const toolToSelect = tools.find((t) => t.shortcut && t.shortcut.toLowerCase() === pressedKey)
      if (toolToSelect && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Ensure no modifiers for tool shortcuts
        e.preventDefault()
        setTool(toolToSelect.name)
        setActiveShapeStartPoint(null)
        setActiveShapeEndPoint(null)
        setArcPoints([])
        triggerFeedback()
        return
      }

      // Handle other shortcuts
      if ((e.metaKey || e.ctrlKey) && pressedKey === "z") {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      } else if (pressedKey === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setShowGrid((s) => !s)
        triggerFeedback()
      } else if (pressedKey === "escape") {
        e.preventDefault()
        setActiveShapeStartPoint(null)
        setActiveShapeEndPoint(null)
        setArcPoints([])
        if (tool !== "select") setTool("select")
        triggerFeedback()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
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
  ])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + "px"
      canvas.style.height = window.innerHeight + "px"
      ctx.scale(dpr, dpr)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      drawGrid(ctx, window.innerWidth, window.innerHeight)
      drawShapes(ctx)
      drawPreview(ctx)
    }
    window.addEventListener("resize", resize)
    resize()
    return () => window.removeEventListener("resize", resize)
  }, [drawGrid, drawShapes, drawPreview])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const dpr = window.devicePixelRatio || 1
    drawGrid(ctx, canvas.width / dpr, canvas.height / dpr)
    drawShapes(ctx)
    drawPreview(ctx)
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
  ])

  useEffect(() => {
    if (isFirstLoad) {
      const timer = setTimeout(() => setIsFirstLoad(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [isFirstLoad])

  useEffect(() => {
    document.title = "Graph Paper"
  }, [])

  useEffect(() => {
    const messages = {
      line: activeShapeStartPoint ? "Tap to set line end point" : "Tap to set line start point",
      rectangle: activeShapeStartPoint ? "Tap to set rectangle corner" : "Tap to set rectangle start",
      circle: activeShapeStartPoint ? "Tap to set circle radius" : "Tap to set circle center",
      arrow: activeShapeStartPoint ? "Tap to set arrow end" : "Tap to set arrow start",
      arc:
        arcPoints.length === 0
          ? "Tap to set arc start point"
          : arcPoints.length === 1
            ? "Tap to set arc end point"
            : "Tap to set arc curve",
      eraser: `Drag to erase (${eraserMode} mode)`,
      pan: "Drag to move, pinch to zoom",
      select: "Tap to select elements",
    }
    setStatusMessage(messages[tool] || "")
  }, [tool, activeShapeStartPoint, arcPoints, eraserMode])

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => e.preventDefault()
    document.addEventListener("touchmove", preventDefault, { passive: false })
    return () => document.removeEventListener("touchmove", preventDefault)
  }, [])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const offscreenCanvas = document.createElement("canvas")
    offscreenCanvas.width = canvas.width // Use DPR scaled width
    offscreenCanvas.height = canvas.height // Use DPR scaled height
    const offscreenCtx = offscreenCanvas.getContext("2d")

    if (!offscreenCtx) return

    offscreenCtx.scale(dpr, dpr) // Scale context for drawing

    // Draw background (similar to drawGrid's background part, but without grid lines)
    const w = canvas.width / dpr
    const h = canvas.height / dpr
    const gradient = offscreenCtx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h))
    gradient.addColorStop(0, "#fafafa")
    gradient.addColorStop(1, "#f0f0f0")
    offscreenCtx.fillStyle = gradient
    offscreenCtx.fillRect(0, 0, w, h)

    // Draw shapes onto the offscreen canvas
    // drawShapes is a useCallback, so it has access to all necessary states
    drawShapes(offscreenCtx)

    const dataURL = offscreenCanvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.href = dataURL
    link.download = "drawing.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    triggerFeedback()
  }, [drawShapes, triggerFeedback]) // drawShapes has its own dependencies

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-gradient-to-br from-slate-50 to-slate-100 touch-none">
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full transition-all duration-200 touch-none ${
          tool === "pan" ? "cursor-grab" : tool === "eraser" ? "cursor-crosshair" : "cursor-crosshair"
        } ${isPanning ? "cursor-grabbing" : ""}`}
        onMouseDown={(e) => handlePointerDown(getCanvasPoint(e), e.shiftKey)}
        onMouseMove={(e) => handlePointerMove(getCanvasPoint(e))}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => {
          e.preventDefault()
          const touches = e.touches
          if (touches.length === 1) {
            setIsMultiTouch(false)
            handlePointerDown(getCanvasPoint(touches[0]), false, true)
          } else if (touches.length === 2) {
            setIsMultiTouch(true)
            setIsPanning(true)
            setLastTouchDistance(getTouchDistance(touches))
            setStartPanPoint(getCanvasPoint(touches[0]))
          }
        }}
        onTouchMove={(e) => {
          e.preventDefault()
          const touches = e.touches
          if (touches.length === 1 && !isMultiTouch) {
            handlePointerMove(getCanvasPoint(touches[0]))
          } else if (touches.length === 2) {
            const currentDistance = getTouchDistance(touches)
            const currentPoint = getCanvasPoint(touches[0])
            if (lastTouchDistance > 0) {
              const zoomDelta = (currentDistance - lastTouchDistance) * 0.01
              const newZoom = Math.max(0.1, Math.min(5, zoom + zoomDelta))
              const worldPoint = getWorldPoint(currentPoint)
              setPanOffset({ x: currentPoint.x - worldPoint.x * newZoom, y: currentPoint.y - worldPoint.y * newZoom })
              setZoom(newZoom)
            }
            if (isPanning) {
              const dx = currentPoint.x - startPanPoint.x
              const dy = currentPoint.y - startPanPoint.y
              setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy })
              setStartPanPoint(currentPoint)
            }
            setLastTouchDistance(currentDistance)
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          handlePointerUp()
        }}
        onWheel={(e) => {
          e.preventDefault()
          const canvasPoint = getCanvasPoint(e)
          const worldPoint = getWorldPoint(canvasPoint)
          const newZoom = Math.max(0.1, Math.min(5, zoom - e.deltaY * 0.001))
          setPanOffset({ x: canvasPoint.x - worldPoint.x * newZoom, y: canvasPoint.y - worldPoint.y * newZoom })
          setZoom(newZoom)
        }}
      />

      <div
        className={`absolute z-10 transition-all duration-700 ${isFirstLoad ? "opacity-0 scale-95 translate-y-4" : "opacity-100 scale-100 translate-y-0"} ${
          isMobile ? "bottom-6 left-1/2 -translate-x-1/2" : "top-6 right-6"
        }`}
      >
        <Card
          className={`shadow-xl border-0 bg-white/95 backdrop-blur-sm transition-all duration-300 ${isAnimating ? "scale-105" : ""} ${isMobile ? "max-w-[calc(100vw-2rem)]" : ""}`}
        >
          <CardContent className={isMobile ? "p-1" : "p-2"}>
            <ToggleGroup
              type="single"
              value={tool}
              onValueChange={(value) => value && setTool(value as Tool)}
              orientation="horizontal"
              className={`gap-1 ${isMobile ? "flex flex-wrap justify-center items-center" : ""}`}
            >
              {displayedTools.map(({ name, icon: Icon, label, shortcut }) => (
                <TooltipProvider key={name} delayDuration={isMobile ? 0 : 100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value={name}
                        aria-label={label}
                        className={`${isMobile ? "w-14 h-14" : "w-12 h-12"} data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 hover:bg-gray-100 transition-all duration-200 active:scale-95`}
                      >
                        <Icon className={`${isMobile ? "w-6 h-6" : "w-5 h-5"}`} />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent side={isMobile ? "top" : "bottom"} className="bg-gray-900 text-white">
                      <p>
                        {label} {shortcut && `(${shortcut})`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {isMobile && tools.length > coreToolNames.length && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAllMobileTools(prev => !prev);
                    triggerFeedback();
                  }}
                  className={`${isMobile ? "w-14 h-14" : "w-12 h-12"} hover:bg-gray-100 transition-all duration-200 active:scale-95 flex items-center justify-center`}
                  aria-label={showAllMobileTools ? "Show fewer tools" : "Show more tools"}
                >
                  {showAllMobileTools ? (
                    <ChevronUp className={`${isMobile ? "w-6 h-6" : "w-5 h-5"}`} />
                  ) : (
                    <ChevronDown className={`${isMobile ? "w-6 h-6" : "w-5 h-5"}`} />
                  )}
                </Button>
              )}
            </ToggleGroup>
          </CardContent>
        </Card>
      </div>

      <div
        className={`absolute ${isMobile ? "top-6 left-6" : "top-6 left-6"} z-10 transition-all duration-700 delay-100 ${isFirstLoad ? "opacity-0 scale-95 -translate-x-4" : "opacity-100 scale-100 translate-x-0"}`}
      >
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className={isMobile ? "p-1.5" : "p-2"}>
            <div className={`flex items-center gap-2 ${isMobile ? "flex-col" : ""}`}>
              <Palette className="w-4 h-4 text-gray-600" />
              <div className={`flex gap-1 ${isMobile ? "flex-wrap justify-center" : ""}`}>
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setCurrentColor(color)
                      triggerFeedback()
                    }}
                    className={`${isMobile ? "w-10 h-10" : "w-6 h-6"} rounded-full border-2 transition-all duration-200 hover:scale-110 active:scale-95 ${currentColor === color ? "border-gray-800 ring-2 ring-blue-200" : "border-gray-300"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className={`absolute ${isMobile ? "top-24 left-6" : "top-20 left-6"} z-10 transition-all duration-700 delay-150 ${isFirstLoad ? "opacity-0 scale-95 -translate-x-4" : "opacity-100 scale-100 translate-x-0"}`}
      >
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className={isMobile ? "p-1.5" : "p-2"}>
            <div className={`flex items-center gap-2 ${isMobile ? "flex-col" : ""}`}>
              <div className="w-4 h-4 text-gray-600 text-xs font-medium">T</div>
              <div className={`flex gap-1 ${isMobile ? "justify-center" : ""}`}>
                {THICKNESSES.map((thickness) => (
                  <button
                    key={thickness}
                    onClick={() => {
                      setCurrentThickness(thickness)
                      triggerFeedback()
                    }}
                    className={`${isMobile ? "w-10 h-10" : "w-6 h-6"} rounded border-2 transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center ${currentThickness === thickness ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                  >
                    <div className="rounded-full bg-gray-800" style={{ width: thickness + 2, height: thickness + 2 }} />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className={`absolute ${isMobile ? "top-6 right-6" : "bottom-6 left-6"} ${isMobile ? "" : "flex gap-2"} z-10 transition-all duration-700 delay-200 ${isFirstLoad ? "opacity-0 scale-95 translate-y-4" : "opacity-100 scale-100 translate-y-0"}`}
      >
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className={`p-1 ${isMobile ? "flex flex-col items-end gap-1" : "flex gap-1"}`}>
            {isMobile ? (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setIsActionMenuOpen(prev => !prev);
                          triggerFeedback();
                        }}
                        className="w-10 h-10 hover:bg-gray-100 active:scale-95"
                      >
                        {isActionMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{isActionMenuOpen ? "Close Menu" : "Open Menu"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {isActionMenuOpen && (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex === 0} className={`${isMobile ? "w-10 h-10" : "w-9 h-9"} hover:bg-gray-100 disabled:opacity-50 active:scale-95`}>
                            <Undo className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Undo (Ctrl+Z)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex === history.length - 1} className={`${isMobile ? "w-10 h-10" : "w-9 h-9"} hover:bg-gray-100 disabled:opacity-50 active:scale-95`}>
                            <Redo className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Redo (Ctrl+Shift+Z)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => { setShowGrid(!showGrid); triggerFeedback(); }} className={`${isMobile ? "w-10 h-10" : "w-9 h-9"} hover:bg-gray-100 active:scale-95 ${showGrid ? "bg-blue-50 text-blue-700" : ""}`}>
                            <Grid3X3 className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Toggle Grid (G)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleDownload} className={`${isMobile ? "w-10 h-10" : "w-9 h-9"} hover:bg-gray-100 active:scale-95`}>
                            <Download className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Download PNG</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => { setEraserMode(eraserMode === "partial" ? "whole" : "partial"); triggerFeedback(); }} className={`${isMobile ? "w-10 h-10" : "w-9 h-9"} hover:bg-gray-100 active:scale-95 ${tool === "eraser" ? (eraserMode === "partial" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700") : "text-gray-500"}`} disabled={tool !== "eraser"}>
                            {eraserMode === "partial" ? <Scissors className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} /> : <Trash2 className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Eraser: {eraserMode === "partial" ? "Partial (Lines Only)" : "Whole Element"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
              </>
            ) : (
              <>
                <TooltipProvider> <Tooltip> <TooltipTrigger asChild> <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex === 0} className="w-9 h-9 hover:bg-gray-100 disabled:opacity-50 active:scale-95"> <Undo className="w-5 h-5" /> </Button></TooltipTrigger><TooltipContent><p>Undo (Ctrl+Z)</p></TooltipContent></Tooltip></TooltipProvider>
                <TooltipProvider> <Tooltip> <TooltipTrigger asChild> <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex === history.length - 1} className="w-9 h-9 hover:bg-gray-100 disabled:opacity-50 active:scale-95"> <Redo className="w-5 h-5" /> </Button></TooltipTrigger><TooltipContent><p>Redo (Ctrl+Shift+Z)</p></TooltipContent></Tooltip></TooltipProvider>
                <TooltipProvider> <Tooltip> <TooltipTrigger asChild> <Button variant="ghost" size="icon" onClick={() => { setShowGrid(!showGrid); triggerFeedback(); }} className={`w-9 h-9 hover:bg-gray-100 active:scale-95 ${showGrid ? "bg-blue-50 text-blue-700" : ""}`}> <Grid3X3 className="w-5 h-5" /> </Button></TooltipTrigger><TooltipContent><p>Toggle Grid (G)</p></TooltipContent></Tooltip></TooltipProvider>
                <TooltipProvider> <Tooltip> <TooltipTrigger asChild> <Button variant="ghost" size="icon" onClick={handleDownload} className="w-9 h-9 hover:bg-gray-100 active:scale-95"> <Download className="w-5 h-5" /> </Button></TooltipTrigger><TooltipContent><p>Download PNG</p></TooltipContent></Tooltip></TooltipProvider>
                <TooltipProvider> <Tooltip> <TooltipTrigger asChild> <Button variant="ghost" size="icon" onClick={() => { setEraserMode(eraserMode === "partial" ? "whole" : "partial"); triggerFeedback(); }} className={`w-9 h-9 hover:bg-gray-100 active:scale-95 ${tool === "eraser" ? (eraserMode === "partial" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700") : "text-gray-500"}`} disabled={tool !== "eraser"}> {eraserMode === "partial" ? <Scissors className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />} </Button></TooltipTrigger><TooltipContent><p>Eraser: {eraserMode === "partial" ? "Partial (Lines Only)" : "Whole Element"}</p></TooltipContent></Tooltip></TooltipProvider>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div
        className={`absolute ${isMobile ? "bottom-6 left-6" : "bottom-6 right-6"} z-10 transition-all duration-700 delay-300 ${isFirstLoad ? "opacity-0 scale-95 translate-y-4" : "opacity-100 scale-100 translate-y-0"}`}
      >
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-1 flex flex-col gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setZoom((z) => Math.min(5, z + 0.3))
                      triggerFeedback()
                    }}
                    className={`${isMobile ? "w-10 h-10" : "w-9 h-9"} hover:bg-gray-100 active:scale-95`}
                  >
                    <ZoomIn className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isMobile ? "right" : "left"}>
                  <p>Zoom In</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div
              className={`${isMobile ? "px-1 py-1 text-xs" : "px-2 py-1 text-xs"} text-gray-600 text-center min-w-[3rem]`}
            >
              {Math.round(zoom * 100)}%
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setZoom((z) => Math.max(0.1, z - 0.3))
                      triggerFeedback()
                    }}
                    className={`${isMobile ? "w-10 h-10" : "w-9 h-9"} hover:bg-gray-100 active:scale-95`}
                  >
                    <ZoomOut className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isMobile ? "right" : "left"}>
                  <p>Zoom Out</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setZoom(1)
                      setPanOffset({ x: 0, y: 0 })
                      triggerFeedback()
                    }}
                    className={`${isMobile ? "w-10 h-10" : "w-9 h-9"} hover:bg-gray-100 active:scale-95`}
                  >
                    <RotateCcw className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isMobile ? "right" : "left"}>
                  <p>Reset View</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>

      {statusMessage && (
        <div className={`absolute ${isMobile ? "bottom-24" : "bottom-6"} left-1/2 -translate-x-1/2 z-10`}>
          <Card className="shadow-lg border-0 bg-gray-900 text-white">
            <CardContent className={`${isMobile ? "px-3 py-2" : "px-4 py-2"}`}>
              <p className={`${isMobile ? "text-xs" : "text-sm"} font-medium`}>{statusMessage}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
