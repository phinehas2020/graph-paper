import { emitter, type GridEvent } from '@pascal-app/core'
import { useEffect, useRef, useState } from 'react'
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  type Line,
  Mesh,
  Shape,
  ShapeGeometry,
} from 'three'
import { EDITOR_LAYER } from '../../../lib/constants'
import { CursorSphere } from './cursor-sphere'

type PolygonDrawToolProps = {
  color?: string
  minPoints?: number
  onCommit: (points: Array<[number, number]>, levelY: number) => void
}

function buildPreviewGeometry(points: Array<[number, number]>) {
  if (points.length < 3) {
    return new BufferGeometry()
  }

  const shape = new Shape()
  const [firstX, firstZ] = points[0]!
  shape.moveTo(firstX, firstZ)
  for (const [x, z] of points.slice(1)) {
    shape.lineTo(x, z)
  }
  shape.closePath()
  return new ShapeGeometry(shape)
}

export const PolygonDrawTool = ({
  color = '#f59e0b',
  minPoints = 3,
  onCommit,
}: PolygonDrawToolProps) => {
  const cursorRef = useRef<Group>(null)
  const lineRef = useRef<Line>(null!)
  const fillRef = useRef<Mesh>(null!)
  const [points, setPoints] = useState<Array<[number, number]>>([])
  const [cursorPosition, setCursorPosition] = useState<[number, number]>([0, 0])
  const levelYRef = useRef(0)

  useEffect(() => {
    const onGridMove = (event: GridEvent) => {
      const nextPoint: [number, number] = [
        Math.round(event.position[0] * 2) / 2,
        Math.round(event.position[2] * 2) / 2,
      ]
      levelYRef.current = event.position[1]
      setCursorPosition(nextPoint)
      cursorRef.current?.position.set(nextPoint[0], event.position[1], nextPoint[1])
    }

    const onGridClick = () => {
      setPoints((current) => {
        if (current.length >= minPoints) {
          const [firstX, firstZ] = current[0]!
          const dx = cursorPosition[0] - firstX
          const dz = cursorPosition[1] - firstZ
          if (Math.hypot(dx, dz) < 0.35) {
            onCommit(current, levelYRef.current)
            return []
          }
        }

        return [...current, cursorPosition]
      })
    }

    const onGridDoubleClick = () => {
      setPoints((current) => {
        if (current.length < minPoints) {
          return current
        }

        onCommit(current, levelYRef.current)
        return []
      })
    }

    const onCancel = () => {
      setPoints([])
    }

    emitter.on('grid:move', onGridMove)
    emitter.on('grid:click', onGridClick)
    emitter.on('grid:double-click', onGridDoubleClick)
    emitter.on('tool:cancel', onCancel)

    return () => {
      emitter.off('grid:move', onGridMove)
      emitter.off('grid:click', onGridClick)
      emitter.off('grid:double-click', onGridDoubleClick)
      emitter.off('tool:cancel', onCancel)
    }
  }, [cursorPosition, minPoints, onCommit])

  useEffect(() => {
    if (!lineRef.current) return

    const positions = [...points, cursorPosition].flatMap(([x, z]) => [x, levelYRef.current + 0.02, z])
    if (points.length >= 2) {
      const [firstX, firstZ] = points[0]!
      positions.push(firstX, levelYRef.current + 0.02, firstZ)
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    lineRef.current.geometry.dispose()
    lineRef.current.geometry = geometry
  }, [cursorPosition, points])

  useEffect(() => {
    if (!fillRef.current) return
    fillRef.current.geometry.dispose()
    fillRef.current.geometry = buildPreviewGeometry(points)
  }, [points])

  return (
    <group>
      <CursorSphere color={color} ref={cursorRef} showTooltip />
      {/* @ts-expect-error R3F line element conflicts with the DOM SVG line type in TS here. */}
      <line frustumCulled={false} layers={EDITOR_LAYER} ref={lineRef} renderOrder={10}>
        <bufferGeometry />
        <lineBasicMaterial color={color} depthTest={false} depthWrite={false} linewidth={2} />
      </line>
      <mesh ref={fillRef} renderOrder={3} rotation={[-Math.PI / 2, 0, 0]}>
        <bufferGeometry />
        <meshBasicMaterial
          color={color}
          depthTest={false}
          depthWrite={false}
          opacity={0.16}
          side={DoubleSide}
          transparent
        />
      </mesh>
    </group>
  )
}
