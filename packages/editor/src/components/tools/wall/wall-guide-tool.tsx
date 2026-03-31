import {
  emitter,
  getWallGuideLocalY,
  getWallHeight,
  sceneRegistry,
  spatialGridManager,
  useScene,
  WallGuide,
  type AnyNodeId,
  type WallGuideReference,
  type WallNode,
  type WallEvent,
} from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BoxGeometry, type Mesh, type MeshBasicMaterial, Vector3 } from 'three'
import { EDITOR_LAYER } from '../../../lib/constants'
import { METERS_PER_INCH, parseLengthToMeters } from '../../../lib/units'
import { sfxEmitter } from '../../../lib/sfx-bus'
import { DrawingLengthBadge } from '../shared/drawing-length-badge'
import { DrawingLengthOverlay } from '../shared/drawing-length-overlay'
import { formatLength } from '../shared/drawing-length-utils'
import { getSideFromNormal, isValidWallSideFace } from '../item/placement-math'

const GUIDE_COLOR_VALID = '#22d3ee'
const GUIDE_COLOR_INVALID = '#ef4444'
const GUIDE_FACE_OFFSET = 0.03
const GUIDE_DUPLICATE_EPSILON = METERS_PER_INCH / 2

type PreviewContext = {
  wallId: WallNode['id']
  localY: number
  side: 'front' | 'back'
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const snapGuideOffset = (value: number) => Math.round(value / METERS_PER_INCH) * METERS_PER_INCH

const buildGuideBadge = (reference: WallGuideReference, offset: number) =>
  `${reference === 'bottom' ? 'Bottom' : 'Top'} ${formatLength(offset)}`

const buildGuidePreviewPoints = (
  wall: WallNode,
  guideY: number,
  side: 'front' | 'back',
  worldY: number,
): { start: Vector3; end: Vector3; badgePosition: [number, number, number] } => {
  const angle = Math.atan2(wall.end[1] - wall.start[1], wall.end[0] - wall.start[0])
  const sideSign = side === 'front' ? 1 : -1
  const normalX = -Math.sin(angle) * sideSign
  const normalZ = Math.cos(angle) * sideSign
  const faceOffset = (wall.thickness ?? 0.1) / 2 + GUIDE_FACE_OFFSET

  const start = new Vector3(
    wall.start[0] + normalX * faceOffset,
    worldY,
    wall.start[1] + normalZ * faceOffset,
  )
  const end = new Vector3(
    wall.end[0] + normalX * faceOffset,
    worldY,
    wall.end[1] + normalZ * faceOffset,
  )

  return {
    start,
    end,
    badgePosition: [(start.x + end.x) / 2, worldY + 0.14, (start.z + end.z) / 2],
  }
}

const hasGuideAtSameHeight = (
  wall: WallNode,
  candidate: Pick<WallGuide, 'offset' | 'reference'>,
): boolean =>
  (wall.guides ?? []).some(
    (guide) =>
      Math.abs(getWallGuideLocalY(wall, guide) - getWallGuideLocalY(wall, candidate)) <
      GUIDE_DUPLICATE_EPSILON,
  )

export const WallGuideTool: React.FC = () => {
  const previewMeshRef = useRef<Mesh>(null!)
  const previewContextRef = useRef<PreviewContext | null>(null)
  const referenceRef = useRef<WallGuideReference>('bottom')
  const isLengthInputOpenRef = useRef(false)
  const lengthInputValueRef = useRef('')

  const [isLengthInputOpen, setIsLengthInputOpen] = useState(false)
  const [lengthInputValue, setLengthInputValue] = useState('')
  const [lengthInputPosition, setLengthInputPosition] = useState<[number, number, number]>([
    0, 0, 0,
  ])
  const [lengthBadge, setLengthBadge] = useState<{
    position: [number, number, number]
    value: string
  } | null>(null)

  const setLengthInputValueState = useCallback((value: string) => {
    lengthInputValueRef.current = value
    setLengthInputValue(value)
  }, [])

  const getLevelId = useCallback(() => useViewer.getState().selection.levelId, [])

  const getLevelYOffset = useCallback(() => {
    const id = getLevelId()
    return id ? (sceneRegistry.nodes.get(id as AnyNodeId)?.position.y ?? 0) : 0
  }, [getLevelId])

  const getSlabElevation = useCallback((wall: WallNode) => {
    if (!wall.parentId) return 0
    return spatialGridManager.getSlabElevationForWall(wall.parentId, wall.start, wall.end)
  }, [])

  const hidePreview = useCallback(() => {
    previewContextRef.current = null
    setLengthBadge(null)
    if (previewMeshRef.current) previewMeshRef.current.visible = false
  }, [])

  const closeLengthInput = useCallback(() => {
    isLengthInputOpenRef.current = false
    setIsLengthInputOpen(false)
    setLengthInputValueState('')
  }, [setLengthInputValueState])

  const refreshPreview = useCallback(() => {
    const context = previewContextRef.current
    const previewMesh = previewMeshRef.current
    if (!(context && previewMesh)) {
      hidePreview()
      return null
    }

    const wall = useScene.getState().nodes[context.wallId as AnyNodeId]
    if (!wall || wall.type !== 'wall') {
      hidePreview()
      return null
    }

    const levelId = getLevelId()
    if (!(levelId && wall.parentId === levelId)) {
      hidePreview()
      return null
    }

    const wallHeight = getWallHeight(wall)
    const rawOffset =
      referenceRef.current === 'bottom' ? context.localY : wallHeight - context.localY
    const offset = clamp(snapGuideOffset(rawOffset), 0, wallHeight)
    const candidateGuide = { offset, reference: referenceRef.current }
    const valid = !hasGuideAtSameHeight(wall, candidateGuide)

    const guideY = getWallGuideLocalY(wall, candidateGuide)
    const slabElevation = getSlabElevation(wall)
    const worldY = getLevelYOffset() + slabElevation + guideY
    const preview = buildGuidePreviewPoints(wall, guideY, context.side, worldY)
    const dx = preview.end.x - preview.start.x
    const dz = preview.end.z - preview.start.z
    const length = Math.sqrt(dx * dx + dz * dz)
    const angle = -Math.atan2(dz, dx)

    previewMesh.geometry.dispose()
    previewMesh.geometry = new BoxGeometry(length, 0.02, 0.008)
    previewMesh.position.set(
      (preview.start.x + preview.end.x) / 2,
      worldY,
      (preview.start.z + preview.end.z) / 2,
    )
    previewMesh.rotation.set(0, angle, 0)
    previewMesh.visible = true

    const material = previewMesh.material as MeshBasicMaterial
    material.color.set(valid ? GUIDE_COLOR_VALID : GUIDE_COLOR_INVALID)

    setLengthInputPosition(preview.badgePosition)
    setLengthBadge({
      position: preview.badgePosition,
      value: buildGuideBadge(referenceRef.current, offset),
    })

    return { wall, candidateGuide, valid }
  }, [getLevelId, getLevelYOffset, getSlabElevation, hidePreview])

  const commitGuide = useCallback(
    (wall: WallNode, guide: Pick<WallGuide, 'offset' | 'reference'>) => {
      const latestWall = useScene.getState().nodes[wall.id as AnyNodeId]
      if (!latestWall || latestWall.type !== 'wall') return false
      if (hasGuideAtSameHeight(latestWall, guide)) return false

      const nextGuide = WallGuide.parse({
        offset: guide.offset,
        reference: guide.reference,
      })

      useScene.getState().updateNode(latestWall.id, {
        guides: [...(latestWall.guides ?? []), nextGuide],
      })
      sfxEmitter.emit('sfx:grid-snap')
      return true
    },
    [],
  )

  const openLengthInput = useCallback(() => {
    const preview = refreshPreview()
    if (!preview) return

    setLengthInputValueState(formatLength(preview.candidateGuide.offset))
    isLengthInputOpenRef.current = true
    setIsLengthInputOpen(true)
  }, [refreshPreview, setLengthInputValueState])

  const submitLength = useCallback(() => {
    const parsedLength = parseLengthToMeters(lengthInputValueRef.current)
    if (parsedLength === null || !Number.isFinite(parsedLength) || parsedLength < 0) return

    const context = previewContextRef.current
    if (!context) return

    const wall = useScene.getState().nodes[context.wallId as AnyNodeId]
    if (!wall || wall.type !== 'wall') return

    const wallHeight = getWallHeight(wall)
    const offset = clamp(snapGuideOffset(parsedLength), 0, wallHeight)
    const nextGuide = { offset, reference: referenceRef.current }
    if (!commitGuide(wall, nextGuide)) return

    previewContextRef.current = {
      ...context,
      localY: getWallGuideLocalY(wall, nextGuide),
    }

    closeLengthInput()
    refreshPreview()
  }, [closeLengthInput, commitGuide, refreshPreview])

  useEffect(() => {
    const onWallEnter = (event: WallEvent) => {
      if (!isValidWallSideFace(event.normal)) return
      if (event.node.parentId !== getLevelId()) return

      previewContextRef.current = {
        wallId: event.node.id,
        localY: event.localPosition[1],
        side: getSideFromNormal(event.normal),
      }

      refreshPreview()
      event.stopPropagation()
    }

    const onWallMove = (event: WallEvent) => {
      if (!isValidWallSideFace(event.normal)) return
      if (event.node.parentId !== getLevelId()) return

      previewContextRef.current = {
        wallId: event.node.id,
        localY: event.localPosition[1],
        side: getSideFromNormal(event.normal),
      }

      refreshPreview()
      event.stopPropagation()
    }

    const onWallClick = (event: WallEvent) => {
      if (!isValidWallSideFace(event.normal)) return
      if (event.node.parentId !== getLevelId()) return
      if (isLengthInputOpenRef.current) return

      previewContextRef.current = {
        wallId: event.node.id,
        localY: event.localPosition[1],
        side: getSideFromNormal(event.normal),
      }

      const preview = refreshPreview()
      if (!(preview && preview.valid)) return

      commitGuide(preview.wall, preview.candidateGuide)
      event.stopPropagation()
    }

    const onWallLeave = () => {
      if (isLengthInputOpenRef.current) return
      hidePreview()
    }

    const onCancel = () => {
      closeLengthInput()
      hidePreview()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && previewContextRef.current) {
        event.preventDefault()
        if (!isLengthInputOpenRef.current) {
          openLengthInput()
        }
      }

      if (
        event.key.toLowerCase() === 'f' &&
        previewContextRef.current &&
        !isLengthInputOpenRef.current
      ) {
        referenceRef.current = referenceRef.current === 'bottom' ? 'top' : 'bottom'
        refreshPreview()
      }
    }

    emitter.on('wall:enter', onWallEnter)
    emitter.on('wall:move', onWallMove)
    emitter.on('wall:click', onWallClick)
    emitter.on('wall:leave', onWallLeave)
    emitter.on('tool:cancel', onCancel)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      emitter.off('wall:enter', onWallEnter)
      emitter.off('wall:move', onWallMove)
      emitter.off('wall:click', onWallClick)
      emitter.off('wall:leave', onWallLeave)
      emitter.off('tool:cancel', onCancel)
      window.removeEventListener('keydown', onKeyDown)
      closeLengthInput()
      hidePreview()
    }
  }, [closeLengthInput, commitGuide, getLevelId, hidePreview, openLengthInput, refreshPreview])

  return (
    <>
      <mesh layers={EDITOR_LAYER} ref={previewMeshRef} renderOrder={2} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial depthTest={false} depthWrite={false} transparent />
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
        isVisible={lengthBadge !== null}
        position={lengthBadge?.position ?? [0, 0, 0]}
        value={lengthBadge?.value ?? ''}
      />
    </>
  )
}
