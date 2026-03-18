import { emitter, type GridEvent, useScene, WallNode } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DoubleSide, type Group, type Mesh, Shape, ShapeGeometry, Vector3 } from 'three'
import { EDITOR_LAYER } from '../../../lib/constants'
import { sfxEmitter } from '../../../lib/sfx-bus'
import { CursorSphere } from '../shared/cursor-sphere'
import { DrawingLengthBadge } from '../shared/drawing-length-badge'
import { DrawingLengthOverlay } from '../shared/drawing-length-overlay'
import {
  calculateDirectionLength,
  formatLength,
  parseLengthInput,
  projectPointAlongDirection,
  snapPointTo45Degrees,
} from '../shared/drawing-length-utils'

const WALL_HEIGHT = 2.5

/**
 * Update wall preview mesh geometry to create a vertical plane between two points
 */
const updateWallPreview = (mesh: Mesh, start: Vector3, end: Vector3) => {
  // Calculate direction and perpendicular for wall thickness
  const direction = new Vector3(end.x - start.x, 0, end.z - start.z)
  const length = direction.length()

  if (length < 0.01) {
    mesh.visible = false
    return
  }

  mesh.visible = true
  direction.normalize()

  // Create wall shape (vertical rectangle in XY plane)
  const shape = new Shape()
  shape.moveTo(0, 0)
  shape.lineTo(length, 0)
  shape.lineTo(length, WALL_HEIGHT)
  shape.lineTo(0, WALL_HEIGHT)
  shape.closePath()

  // Create geometry
  const geometry = new ShapeGeometry(shape)

  // Calculate rotation angle
  // Negate the angle to fix the opposite direction issue
  const angle = -Math.atan2(direction.z, direction.x)

  // Position at start point and rotate
  mesh.position.set(start.x, start.y, start.z)
  mesh.rotation.y = angle

  // Dispose old geometry and assign new one
  if (mesh.geometry) {
    mesh.geometry.dispose()
  }
  mesh.geometry = geometry
}

const commitWallDrawing = (start: [number, number], end: [number, number]) => {
  const currentLevelId = useViewer.getState().selection.levelId
  const { createNode, nodes } = useScene.getState()

  if (!currentLevelId) return

  const wallCount = Object.values(nodes).filter((n) => n.type === 'wall').length
  const name = `Wall ${wallCount + 1}`

  const wall = WallNode.parse({ name, start, end })

  createNode(wall, currentLevelId)
  sfxEmitter.emit('sfx:structure-build')
}

export const WallTool: React.FC = () => {
  const cursorRef = useRef<Group>(null)
  const wallPreviewRef = useRef<Mesh>(null!)
  const startingPoint = useRef(new Vector3(0, 0, 0))
  const endingPoint = useRef(new Vector3(0, 0, 0))
  const buildingState = useRef(0)
  const shiftPressed = useRef(false)
  const [isLengthInputOpen, setIsLengthInputOpen] = useState(false)
  const [lengthInputValue, setLengthInputValue] = useState('')
  const [lengthInputPosition, setLengthInputPosition] = useState<[number, number, number]>([
    0, 0, 0,
  ])
  const [lengthBadge, setLengthBadge] = useState<{
    position: [number, number, number]
    value: string
  } | null>(null)
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

  const openLengthInput = useCallback(() => {
    if (buildingState.current !== 1) return

    const segment = {
      dx: endingPoint.current.x - startingPoint.current.x,
      dz: endingPoint.current.z - startingPoint.current.z,
    }

    if (segment.dx === 0 && segment.dz === 0) return

    const currentLength = Math.sqrt(segment.dx * segment.dx + segment.dz * segment.dz)
    setLengthInputValueState(formatLength(currentLength))
    setLengthInputPosition([endingPoint.current.x, endingPoint.current.y, endingPoint.current.z])
    isLengthInputOpenRef.current = true
    setIsLengthInputOpen(true)
  }, [setLengthInputValueState])

  const submitLength = useCallback(() => {
    const requestedLength = parseLengthInput(lengthInputValueRef.current)
    if (!requestedLength) return

    const projected = projectPointAlongDirection(
      [startingPoint.current.x, startingPoint.current.z],
      [endingPoint.current.x, endingPoint.current.z],
      requestedLength,
    )

    if (!projected) return

    endingPoint.current.set(projected[0], startingPoint.current.y, projected[1])

    const end: [number, number] = [endingPoint.current.x, endingPoint.current.z]
    const dx = end[0] - startingPoint.current.x
    const dz = end[1] - startingPoint.current.z
    if (dx * dx + dz * dz < 0.01 * 0.01) return

    setLengthBadge(null)
    commitWallDrawing([startingPoint.current.x, startingPoint.current.z], end)
    wallPreviewRef.current.visible = false
    buildingState.current = 0
    closeLengthInput()
  }, [closeLengthInput])

  useEffect(() => {
    let gridPosition: [number, number] = [0, 0]
    let previousWallEnd: [number, number] | null = null

    const onGridMove = (event: GridEvent) => {
      if (!(cursorRef.current && wallPreviewRef.current)) return

      gridPosition = [Math.round(event.position[0] * 2) / 2, Math.round(event.position[2] * 2) / 2]
      const cursorPosition = new Vector3(gridPosition[0], event.position[1], gridPosition[1])

      if (buildingState.current === 1) {
        // Snap to 45° angles only if shift is not pressed
        if (shiftPressed.current) {
          endingPoint.current.copy(cursorPosition)
        } else {
          const snapped = snapPointTo45Degrees(
            [startingPoint.current.x, startingPoint.current.z],
            [cursorPosition.x, cursorPosition.z],
          )
          endingPoint.current.set(snapped[0], event.position[1], snapped[1])
        }

        // Position the cursor at the end of the wall being drawn
        cursorRef.current.position.set(
          endingPoint.current.x,
          endingPoint.current.y,
          endingPoint.current.z,
        )
        setLengthInputPosition([
          endingPoint.current.x,
          endingPoint.current.y,
          endingPoint.current.z,
        ])

        // Play snap sound only when the actual wall end position changes
        const currentWallEnd: [number, number] = [endingPoint.current.x, endingPoint.current.z]
        if (
          previousWallEnd &&
          (currentWallEnd[0] !== previousWallEnd[0] || currentWallEnd[1] !== previousWallEnd[1])
        ) {
          sfxEmitter.emit('sfx:grid-snap')
        }
        previousWallEnd = currentWallEnd

        // Update wall preview geometry
        updateWallPreview(wallPreviewRef.current, startingPoint.current, endingPoint.current)

        const { length } = calculateDirectionLength(
          [startingPoint.current.x, startingPoint.current.z],
          [endingPoint.current.x, endingPoint.current.z],
        )

        if (length >= 0.01) {
          setLengthBadge({
            position: [
              (startingPoint.current.x + endingPoint.current.x) / 2,
              endingPoint.current.y + 0.18,
              (startingPoint.current.z + endingPoint.current.z) / 2,
            ],
            value: formatLength(length),
          })
        } else {
          setLengthBadge(null)
        }
      } else {
        // Not drawing a wall, just follow the grid position
        cursorRef.current.position.set(gridPosition[0], event.position[1], gridPosition[1])
      }
    }

    const onGridClick = (event: GridEvent) => {
      if (buildingState.current === 0) {
        startingPoint.current.set(gridPosition[0], event.position[1], gridPosition[1])
        buildingState.current = 1
        wallPreviewRef.current.visible = true
        setLengthBadge(null)
        setLengthInputPosition([gridPosition[0], event.position[1], gridPosition[1]])
      } else if (buildingState.current === 1) {
        if (isLengthInputOpenRef.current) return
        const dx = endingPoint.current.x - startingPoint.current.x
        const dz = endingPoint.current.z - startingPoint.current.z
        if (dx * dx + dz * dz < 0.01 * 0.01) return
        setLengthBadge(null)
        commitWallDrawing(
          [startingPoint.current.x, startingPoint.current.z],
          [endingPoint.current.x, endingPoint.current.z],
        )
        wallPreviewRef.current.visible = false
        buildingState.current = 0
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftPressed.current = true
        return
      }

      if (e.key === 'Tab' && buildingState.current === 1) {
        e.preventDefault()
        if (!isLengthInputOpenRef.current) {
          openLengthInput()
        }
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftPressed.current = false
      }
    }

    const onCancel = () => {
      if (buildingState.current === 1) {
        buildingState.current = 0
        wallPreviewRef.current.visible = false
        setLengthBadge(null)
        closeLengthInput()
      }
    }

    emitter.on('grid:move', onGridMove)
    emitter.on('grid:click', onGridClick)
    emitter.on('tool:cancel', onCancel)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      emitter.off('grid:move', onGridMove)
      emitter.off('grid:click', onGridClick)
      emitter.off('tool:cancel', onCancel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [closeLengthInput, openLengthInput])

  return (
    <group>
      {/* Cursor indicator */}
      <CursorSphere ref={cursorRef} />

      {/* Wall preview */}
      <mesh layers={EDITOR_LAYER} ref={wallPreviewRef} renderOrder={1} visible={false}>
        <shapeGeometry />
        <meshBasicMaterial
          color="#818cf8"
          depthTest={false}
          depthWrite={false}
          opacity={0.5}
          side={DoubleSide}
          transparent
        />
      </mesh>

      <DrawingLengthOverlay
        isOpen={isLengthInputOpen}
        onCancel={closeLengthInput}
        onSubmit={submitLength}
        onValueChange={setLengthInputValueState}
        position={lengthInputPosition}
        value={lengthInputValue}
      />

      <DrawingLengthBadge
        isVisible={buildingState.current === 1 && lengthBadge !== null}
        position={lengthBadge?.position ?? [0, 0, 0]}
        value={lengthBadge?.value ?? ''}
      />
    </group>
  )
}
