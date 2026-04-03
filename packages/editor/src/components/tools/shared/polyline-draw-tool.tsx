import { emitter, type GridEvent } from '@pascal-app/core'
import { useEffect, useRef, useState } from 'react'
import { BufferGeometry, Float32BufferAttribute, Group, type Line } from 'three'
import { EDITOR_LAYER } from '../../../lib/constants'
import { CursorSphere } from './cursor-sphere'

type PolylineDrawToolProps = {
  color?: string
  minPoints?: number
  onCommit: (path: Array<[number, number, number]>) => void
}

export const PolylineDrawTool = ({
  color = '#60a5fa',
  minPoints = 2,
  onCommit,
}: PolylineDrawToolProps) => {
  const cursorRef = useRef<Group>(null)
  const lineRef = useRef<Line>(null!)
  const [points, setPoints] = useState<Array<[number, number, number]>>([])
  const cursorPositionRef = useRef<[number, number, number]>([0, 0, 0])

  useEffect(() => {
    const onGridMove = (event: GridEvent) => {
      const nextPosition: [number, number, number] = [
        Math.round(event.position[0] * 2) / 2,
        event.position[1],
        Math.round(event.position[2] * 2) / 2,
      ]
      cursorPositionRef.current = nextPosition
      cursorRef.current?.position.set(nextPosition[0], nextPosition[1], nextPosition[2])
    }

    const onGridClick = () => {
      setPoints((current) => [...current, cursorPositionRef.current])
    }

    const onGridDoubleClick = () => {
      setPoints((current) => {
        if (current.length < minPoints) {
          return current
        }
        onCommit(current)
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
  }, [minPoints, onCommit])

  useEffect(() => {
    if (!lineRef.current) return

    const positions = [...points, cursorPositionRef.current].flatMap(([x, y, z]) => [x, y + 0.02, z])
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    lineRef.current.geometry.dispose()
    lineRef.current.geometry = geometry
  }, [points])

  return (
    <group>
      <CursorSphere color={color} ref={cursorRef} showTooltip />
      {/* @ts-expect-error R3F line element conflicts with the DOM SVG line type in TS here. */}
      <line frustumCulled={false} layers={EDITOR_LAYER} ref={lineRef} renderOrder={10}>
        <bufferGeometry />
        <lineBasicMaterial color={color} depthTest={false} depthWrite={false} linewidth={2} />
      </line>
    </group>
  )
}
