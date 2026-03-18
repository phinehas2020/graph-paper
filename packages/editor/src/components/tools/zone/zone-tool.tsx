import { emitter, type GridEvent, type LevelNode, useScene, ZoneNode } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BufferGeometry, DoubleSide, type Group, type Line, Shape, Vector3 } from 'three'
import { PALETTE_COLORS } from './../../../components/ui/primitives/color-dot'
import { EDITOR_LAYER } from './../../../lib/constants'
import { CursorSphere } from '../shared/cursor-sphere'
import { DrawingLengthOverlay } from '../shared/drawing-length-overlay'
import {
  formatLength,
  parseLengthInput,
  projectPointAlongDirection,
} from '../shared/drawing-length-utils'

const Y_OFFSET = 0.02

/**
 * Snaps a point to the nearest axis-aligned or 45-degree diagonal from the last point
 */
const calculateSnapPoint = (
  lastPoint: [number, number],
  currentPoint: [number, number],
): [number, number] => {
  const [x1, y1] = lastPoint
  const [x, y] = currentPoint

  const dx = x - x1
  const dy = y - y1
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  // Calculate distances to horizontal, vertical, and diagonal lines
  const horizontalDist = absDy
  const verticalDist = absDx
  const diagonalDist = Math.abs(absDx - absDy)

  // Find the minimum distance to determine which axis to snap to
  const minDist = Math.min(horizontalDist, verticalDist, diagonalDist)

  if (minDist === diagonalDist) {
    // Snap to 45° diagonal
    const diagonalLength = Math.min(absDx, absDy)
    return [x1 + Math.sign(dx) * diagonalLength, y1 + Math.sign(dy) * diagonalLength]
  }
  if (minDist === horizontalDist) {
    // Snap to horizontal
    return [x, y1]
  }
  // Snap to vertical
  return [x1, y]
}

/**
 * Creates a zone with the given polygon points
 */
const commitZoneDrawing = (levelId: LevelNode['id'], points: Array<[number, number]>) => {
  const { createNode, nodes } = useScene.getState()

  // Count existing zones for naming and color cycling
  const zoneCount = Object.values(nodes).filter((n) => n.type === 'zone').length
  const name = `Zone ${zoneCount + 1}`

  // Cycle through colors
  const color = PALETTE_COLORS[zoneCount % PALETTE_COLORS.length]

  const zone = ZoneNode.parse({
    name,
    polygon: points,
    color,
  })

  createNode(zone, levelId)

  // Select the newly created zone
  useViewer.getState().setSelection({ zoneId: zone.id })
}

type PreviewState = {
  points: Array<[number, number]>
  cursorPoint: [number, number] | null
  levelY: number
}

// Helper to validate point values (no NaN or Infinity)
const isValidPoint = (pt: [number, number] | null | undefined): pt is [number, number] => {
  if (!pt) return false
  return Number.isFinite(pt[0]) && Number.isFinite(pt[1])
}

export const ZoneTool: React.FC = () => {
  const cursorRef = useRef<Group>(null)
  const mainLineRef = useRef<Line>(null!)
  const closingLineRef = useRef<Line>(null!)
  const pointsRef = useRef<Array<[number, number]>>([])
  const levelYRef = useRef(0)
  const snappedCursorRef = useRef<[number, number]>([0, 0])
  const currentLevelId = useViewer((state) => state.selection.levelId)
  const [preview, setPreview] = useState<PreviewState>({
    points: [],
    cursorPoint: null,
    levelY: 0,
  })
  const [isLengthInputOpen, setIsLengthInputOpen] = useState(false)
  const [lengthInputValue, setLengthInputValue] = useState('')
  const [lengthInputPosition, setLengthInputPosition] = useState<[number, number, number]>([
    0, 0, 0,
  ])
  const isLengthInputOpenRef = useRef(false)
  const lengthInputValueRef = useRef('')

  const setLengthInputValueState = useCallback((value: string) => {
    lengthInputValueRef.current = value
    setLengthInputValue(value)
  }, [])

  const closeLengthInput = useCallback(() => {
    isLengthInputOpenRef.current = false
    setIsLengthInputOpen(false)
    setLengthInputValueState('')
  }, [setLengthInputValueState])

  const getCursorPoint = useCallback(
    (points: Array<[number, number]>, cursor: [number, number]) => {
      const lastPoint = points[points.length - 1]
      if (!lastPoint) return cursor
      return calculateSnapPoint(lastPoint, cursor)
    },
    [],
  )

  const updateDrawingPreview = useCallback(() => {
    const points = pointsRef.current
    const cursorPoint = isValidPoint(snappedCursorRef.current)
      ? getCursorPoint(points, snappedCursorRef.current)
      : null

    setPreview({ points: [...points], cursorPoint, levelY: levelYRef.current })

    const linePoints: Vector3[] = points.map(
      ([x, z]) => new Vector3(x, levelYRef.current + Y_OFFSET, z),
    )

    if (isValidPoint(cursorPoint)) {
      linePoints.push(new Vector3(cursorPoint[0], levelYRef.current + Y_OFFSET, cursorPoint[1]))
    }

    if (linePoints.length >= 2) {
      mainLineRef.current.geometry.dispose()
      mainLineRef.current.geometry = new BufferGeometry().setFromPoints(linePoints)
      mainLineRef.current.visible = true
    } else {
      mainLineRef.current.visible = false
    }

    if (points.length >= 2 && isValidPoint(cursorPoint) && isValidPoint(points[0])) {
      const closingPoints = [
        new Vector3(cursorPoint[0], levelYRef.current + Y_OFFSET, cursorPoint[1]),
        new Vector3(points[0][0], levelYRef.current + Y_OFFSET, points[0][1]),
      ]
      closingLineRef.current.geometry.dispose()
      closingLineRef.current.geometry = new BufferGeometry().setFromPoints(closingPoints)
      closingLineRef.current.visible = true
    } else {
      closingLineRef.current.visible = false
    }
  }, [getCursorPoint])

  const setPointsAndUpdateRef = useCallback(
    (nextPoints: Array<[number, number]>) => {
      pointsRef.current = nextPoints
      updateDrawingPreview()
    },
    [updateDrawingPreview],
  )

  const resetDrawingState = useCallback(() => {
    pointsRef.current = []
    setPreview({ points: [], cursorPoint: null, levelY: levelYRef.current })
    mainLineRef.current.visible = false
    closingLineRef.current.visible = false
    closeLengthInput()
  }, [closeLengthInput])

  const openLengthInput = useCallback(() => {
    const currentPoints = pointsRef.current
    const lastPoint = currentPoints[currentPoints.length - 1]
    if (!lastPoint) return

    const cursorPoint = snappedCursorRef.current
    const dx = cursorPoint[0] - lastPoint[0]
    const dz = cursorPoint[1] - lastPoint[1]
    const currentLength = Math.sqrt(dx * dx + dz * dz)
    if (!Number.isFinite(currentLength) || currentLength === 0) return

    setLengthInputValueState(formatLength(currentLength))
    setLengthInputPosition([cursorPoint[0], levelYRef.current + Y_OFFSET, cursorPoint[1]])
    isLengthInputOpenRef.current = true
    setIsLengthInputOpen(true)
  }, [setLengthInputValueState])

  const submitLength = useCallback(() => {
    const requestedLength = parseLengthInput(lengthInputValueRef.current)
    if (!requestedLength) return

    const currentPoints = pointsRef.current
    const lastPoint = currentPoints[currentPoints.length - 1]
    if (!lastPoint) return

    const projected = projectPointAlongDirection(
      lastPoint,
      snappedCursorRef.current,
      requestedLength,
    )
    if (!projected) return

    setPointsAndUpdateRef([...currentPoints, projected])
    closeLengthInput()
  }, [closeLengthInput, setPointsAndUpdateRef])

  useEffect(() => {
    if (!currentLevelId) return

    const onGridMove = (event: GridEvent) => {
      if (!cursorRef.current) return

      const gridX = Math.round(event.position[0] * 2) / 2
      const gridZ = Math.round(event.position[2] * 2) / 2
      const rawCursor: [number, number] = [gridX, gridZ]

      const currentPoints = pointsRef.current
      const lastPoint = currentPoints[currentPoints.length - 1]
      const snappedCursor = lastPoint ? calculateSnapPoint(lastPoint, rawCursor) : rawCursor
      snappedCursorRef.current = snappedCursor
      levelYRef.current = event.position[1]

      cursorRef.current.position.set(snappedCursor[0], event.position[1], snappedCursor[1])

      if (isLengthInputOpenRef.current) {
        setLengthInputPosition([snappedCursor[0], event.position[1] + Y_OFFSET, snappedCursor[1]])
      }

      updateDrawingPreview()
    }

    const onGridClick = (event: GridEvent) => {
      if (!currentLevelId) return

      const gridX = Math.round(event.position[0] * 2) / 2
      const gridZ = Math.round(event.position[2] * 2) / 2
      const rawCursor: [number, number] = [gridX, gridZ]

      const currentPoints = pointsRef.current
      const lastPoint = currentPoints[currentPoints.length - 1]
      const clickPoint = lastPoint ? calculateSnapPoint(lastPoint, rawCursor) : rawCursor
      snappedCursorRef.current = clickPoint
      updateDrawingPreview()

      if (isLengthInputOpenRef.current) return

      const firstPoint = currentPoints[0]
      if (
        currentPoints.length >= 3 &&
        firstPoint &&
        Math.abs(clickPoint[0] - firstPoint[0]) < 0.25 &&
        Math.abs(clickPoint[1] - firstPoint[1]) < 0.25
      ) {
        commitZoneDrawing(currentLevelId, currentPoints)
        resetDrawingState()
      } else {
        setPointsAndUpdateRef([...currentPoints, clickPoint])
      }
    }

    const onGridDoubleClick = () => {
      if (!currentLevelId) return

      const currentPoints = pointsRef.current
      if (currentPoints.length >= 3) {
        commitZoneDrawing(currentLevelId, currentPoints)
        resetDrawingState()
      }
    }

    const onCancel = () => {
      closeLengthInput()
      resetDrawingState()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && pointsRef.current.length > 0) {
        event.preventDefault()
        if (!isLengthInputOpenRef.current) {
          openLengthInput()
        }
      }
    }

    // Initialize line geometries
    mainLineRef.current.geometry = new BufferGeometry()
    closingLineRef.current.geometry = new BufferGeometry()

    emitter.on('grid:move', onGridMove)
    emitter.on('grid:click', onGridClick)
    emitter.on('grid:double-click', onGridDoubleClick)
    document.addEventListener('keydown', onKeyDown)
    emitter.on('tool:cancel', onCancel)

    return () => {
      emitter.off('grid:move', onGridMove)
      emitter.off('grid:click', onGridClick)
      emitter.off('grid:double-click', onGridDoubleClick)
      emitter.off('tool:cancel', onCancel)
      document.removeEventListener('keydown', onKeyDown)
      resetDrawingState()
    }
  }, [
    closeLengthInput,
    currentLevelId,
    openLengthInput,
    resetDrawingState,
    setPointsAndUpdateRef,
    updateDrawingPreview,
  ])

  const { points, cursorPoint, levelY } = preview

  // Create preview shape when we have 3+ points
  const previewShape = useMemo(() => {
    if (points.length < 3) return null

    const allPoints = [...points]
    if (isValidPoint(cursorPoint)) {
      allPoints.push(cursorPoint)
    }

    // THREE.Shape is in X-Y plane. After rotation of -PI/2 around X:
    // - Shape X -> World X
    // - Shape Y -> World -Z (so we negate Z to get correct orientation)
    const firstPt = allPoints[0]
    if (!isValidPoint(firstPt)) return null

    const shape = new Shape()
    shape.moveTo(firstPt[0], -firstPt[1])

    for (let i = 1; i < allPoints.length; i++) {
      const pt = allPoints[i]
      if (isValidPoint(pt)) {
        shape.lineTo(pt[0], -pt[1])
      }
    }
    shape.closePath()

    return shape
  }, [points, cursorPoint])

  return (
    <group>
      {/* Cursor */}
      <CursorSphere ref={cursorRef} />

      {/* Preview fill */}
      {previewShape && (
        <mesh
          frustumCulled={false}
          layers={EDITOR_LAYER}
          position={[0, levelY + Y_OFFSET, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <shapeGeometry args={[previewShape]} />
          <meshBasicMaterial
            color="#818cf8"
            depthTest={false}
            opacity={0.15}
            side={DoubleSide}
            transparent
          />
        </mesh>
      )}

      {/* Main line - uses native line element with TSL-compatible material */}
      {/* @ts-ignore */}
      <line
        frustumCulled={false}
        layers={EDITOR_LAYER}
        ref={mainLineRef}
        renderOrder={1}
        visible={false}
      >
        <bufferGeometry />
        <lineBasicNodeMaterial color="#818cf8" depthTest={false} depthWrite={false} linewidth={3} />
      </line>

      {/* Closing line - uses native line element with TSL-compatible material */}
      {/* @ts-ignore */}
      <line
        frustumCulled={false}
        layers={EDITOR_LAYER}
        ref={closingLineRef}
        renderOrder={1}
        visible={false}
      >
        <bufferGeometry />
        <lineBasicNodeMaterial
          color="#818cf8"
          depthTest={false}
          depthWrite={false}
          linewidth={2}
          opacity={0.5}
          transparent
        />
      </line>

      {/* Point markers */}
      {points.map(([x, z], index) =>
        isValidPoint([x, z]) ? (
          <CursorSphere
            color="#818cf8"
            height={0}
            key={index}
            position={[x, levelY + Y_OFFSET + 0.01, z]}
            showTooltip={false}
          />
        ) : null,
      )}

      <DrawingLengthOverlay
        isOpen={isLengthInputOpen}
        onCancel={closeLengthInput}
        onSubmit={submitLength}
        onValueChange={setLengthInputValueState}
        position={lengthInputPosition}
        value={lengthInputValue}
      />
    </group>
  )
}
