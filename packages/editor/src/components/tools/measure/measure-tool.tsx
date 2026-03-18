import { emitter, type GridEvent } from '@pascal-app/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BufferGeometry, type Group, type Line, Vector3 } from 'three'
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

const MIN_SEGMENT_LENGTH = 0.01

const updateMeasurementPreview = (line: Line, start: Vector3, end: Vector3) => {
  const { length } = calculateDirectionLength([start.x, start.z], [end.x, end.z])

  if (length < MIN_SEGMENT_LENGTH) {
    line.visible = false
    return null
  }

  line.geometry.dispose()
  line.geometry = new BufferGeometry().setFromPoints([start.clone(), end.clone()])
  line.visible = true

  return {
    position: [(start.x + end.x) / 2, end.y + 0.18, (start.z + end.z) / 2] as [
      number,
      number,
      number,
    ],
    value: formatLength(length),
  }
}

export const MeasureTool: React.FC = () => {
  const cursorRef = useRef<Group>(null)
  const measurementLineRef = useRef<Line>(null!)
  const startingPoint = useRef(new Vector3(0, 0, 0))
  const endingPoint = useRef(new Vector3(0, 0, 0))
  const measuringState = useRef(0)
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
    if (measuringState.current !== 1) return

    const { length } = calculateDirectionLength(
      [startingPoint.current.x, startingPoint.current.z],
      [endingPoint.current.x, endingPoint.current.z],
    )

    if (length < MIN_SEGMENT_LENGTH) return

    setLengthInputValueState(formatLength(length))
    setLengthInputPosition([endingPoint.current.x, endingPoint.current.y, endingPoint.current.z])
    isLengthInputOpenRef.current = true
    setIsLengthInputOpen(true)
  }, [setLengthInputValueState])

  const commitMeasurement = useCallback(
    (end: Vector3) => {
      endingPoint.current.copy(end)
      setLengthBadge(
        updateMeasurementPreview(
          measurementLineRef.current,
          startingPoint.current,
          endingPoint.current,
        ),
      )
      measuringState.current = 0
      closeLengthInput()
    },
    [closeLengthInput],
  )

  const submitLength = useCallback(() => {
    const requestedLength = parseLengthInput(lengthInputValueRef.current)
    if (!requestedLength) return

    const projected = projectPointAlongDirection(
      [startingPoint.current.x, startingPoint.current.z],
      [endingPoint.current.x, endingPoint.current.z],
      requestedLength,
    )

    if (!projected) return

    commitMeasurement(new Vector3(projected[0], startingPoint.current.y, projected[1]))
  }, [commitMeasurement])

  useEffect(() => {
    let gridPosition: [number, number] = [0, 0]
    let previousMeasureEnd: [number, number] | null = null

    const onGridMove = (event: GridEvent) => {
      if (!(cursorRef.current && measurementLineRef.current)) return

      gridPosition = [Math.round(event.position[0] * 2) / 2, Math.round(event.position[2] * 2) / 2]
      const cursorPosition = new Vector3(gridPosition[0], event.position[1], gridPosition[1])

      if (measuringState.current === 1) {
        if (shiftPressed.current) {
          endingPoint.current.copy(cursorPosition)
        } else {
          const snapped = snapPointTo45Degrees(
            [startingPoint.current.x, startingPoint.current.z],
            [cursorPosition.x, cursorPosition.z],
          )
          endingPoint.current.set(snapped[0], event.position[1], snapped[1])
        }

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

        const currentMeasureEnd: [number, number] = [endingPoint.current.x, endingPoint.current.z]
        if (
          previousMeasureEnd &&
          (currentMeasureEnd[0] !== previousMeasureEnd[0] ||
            currentMeasureEnd[1] !== previousMeasureEnd[1])
        ) {
          sfxEmitter.emit('sfx:grid-snap')
        }
        previousMeasureEnd = currentMeasureEnd

        setLengthBadge(
          updateMeasurementPreview(
            measurementLineRef.current,
            startingPoint.current,
            endingPoint.current,
          ),
        )
      } else {
        cursorRef.current.position.set(gridPosition[0], event.position[1], gridPosition[1])
      }
    }

    const onGridClick = (event: GridEvent) => {
      if (measuringState.current === 0) {
        startingPoint.current.set(gridPosition[0], event.position[1], gridPosition[1])
        endingPoint.current.copy(startingPoint.current)
        measuringState.current = 1
        previousMeasureEnd = null
        measurementLineRef.current.visible = false
        setLengthBadge(null)
        setLengthInputPosition([gridPosition[0], event.position[1], gridPosition[1]])
      } else if (measuringState.current === 1) {
        if (isLengthInputOpenRef.current) return

        const { length } = calculateDirectionLength(
          [startingPoint.current.x, startingPoint.current.z],
          [endingPoint.current.x, endingPoint.current.z],
        )

        if (length < MIN_SEGMENT_LENGTH) return

        commitMeasurement(endingPoint.current.clone())
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        shiftPressed.current = true
        return
      }

      if (event.key === 'Tab' && measuringState.current === 1) {
        event.preventDefault()
        if (!isLengthInputOpenRef.current) {
          openLengthInput()
        }
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        shiftPressed.current = false
      }
    }

    const onCancel = () => {
      measuringState.current = 0
      measurementLineRef.current.visible = false
      setLengthBadge(null)
      closeLengthInput()
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
  }, [closeLengthInput, commitMeasurement, openLengthInput])

  return (
    <group>
      <CursorSphere color="#22d3ee" ref={cursorRef} />

      <line layers={EDITOR_LAYER} ref={measurementLineRef} renderOrder={1} visible={false}>
        <bufferGeometry />
        <lineBasicMaterial
          color="#22d3ee"
          depthTest={false}
          depthWrite={false}
          opacity={0.95}
          transparent
        />
      </line>

      <DrawingLengthOverlay
        isOpen={isLengthInputOpen}
        onCancel={closeLengthInput}
        onSubmit={submitLength}
        onValueChange={setLengthInputValueState}
        position={lengthInputPosition}
        value={lengthInputValue}
      />

      <DrawingLengthBadge
        isVisible={lengthBadge !== null}
        position={lengthBadge?.position ?? [0, 0, 0]}
        value={lengthBadge?.value ?? ''}
      />
    </group>
  )
}
