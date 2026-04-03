import { emitter, type GridEvent } from '@pascal-app/core'
import { useEffect, useRef, useState } from 'react'
import { BufferGeometry, Float32BufferAttribute, Group, type Line } from 'three'
import { EDITOR_LAYER } from '../../../lib/constants'
import { CursorSphere } from './cursor-sphere'

type SegmentDrawToolProps = {
  color?: string
  onCommit: (start: [number, number], end: [number, number], levelY: number) => void
}

export const SegmentDrawTool = ({
  color = '#38bdf8',
  onCommit,
}: SegmentDrawToolProps) => {
  const cursorRef = useRef<Group>(null)
  const lineRef = useRef<Line>(null!)
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null)
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
      if (!startPoint) {
        setStartPoint(cursorPosition)
        return
      }

      onCommit(startPoint, cursorPosition, levelYRef.current)
      setStartPoint(null)
    }

    const onCancel = () => {
      setStartPoint(null)
    }

    emitter.on('grid:move', onGridMove)
    emitter.on('grid:click', onGridClick)
    emitter.on('tool:cancel', onCancel)

    return () => {
      emitter.off('grid:move', onGridMove)
      emitter.off('grid:click', onGridClick)
      emitter.off('tool:cancel', onCancel)
    }
  }, [cursorPosition, onCommit, startPoint])

  useEffect(() => {
    if (!(lineRef.current && startPoint)) return

    const geometry = new BufferGeometry()
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute(
        [
          startPoint[0],
          levelYRef.current + 0.02,
          startPoint[1],
          cursorPosition[0],
          levelYRef.current + 0.02,
          cursorPosition[1],
        ],
        3,
      ),
    )
    lineRef.current.geometry.dispose()
    lineRef.current.geometry = geometry
  }, [cursorPosition, startPoint])

  return (
    <group>
      <CursorSphere color={color} ref={cursorRef} showTooltip />
      {startPoint ? (
        /* @ts-expect-error R3F line element conflicts with the DOM SVG line type in TS here. */
        <line frustumCulled={false} layers={EDITOR_LAYER} ref={lineRef} renderOrder={10}>
          <bufferGeometry />
          <lineBasicMaterial color={color} depthTest={false} depthWrite={false} linewidth={2} />
        </line>
      ) : null}
    </group>
  )
}
