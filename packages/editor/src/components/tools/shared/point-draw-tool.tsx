import { emitter, type GridEvent } from '@pascal-app/core'
import { useEffect, useRef } from 'react'
import { Group } from 'three'
import { CursorSphere } from './cursor-sphere'

type PointDrawToolProps = {
  color?: string
  onCommit: (position: [number, number, number]) => void
}

export const PointDrawTool = ({ color = '#22c55e', onCommit }: PointDrawToolProps) => {
  const cursorRef = useRef<Group>(null)
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
      onCommit(cursorPositionRef.current)
    }

    emitter.on('grid:move', onGridMove)
    emitter.on('grid:click', onGridClick)

    return () => {
      emitter.off('grid:move', onGridMove)
      emitter.off('grid:click', onGridClick)
    }
  }, [onCommit])

  return <CursorSphere color={color} ref={cursorRef} showTooltip />
}
