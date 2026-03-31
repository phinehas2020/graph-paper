import {
  type AnyNodeId,
  type DoorNode,
  getWallGuideLocalY,
  getWallHeight,
  getScaledDimensions,
  type ItemNode,
  useScene,
  type WallNode,
  type WindowNode,
} from '@pascal-app/core'
import { METERS_PER_INCH } from '../../../lib/units'

const WINDOW_GUIDE_SNAP_THRESHOLD = METERS_PER_INCH * 6

/**
 * Converts wall-local (X along wall, Y = height above wall base) to world XYZ.
 * Wall XZ uses level-local coordinates (levels only offset in Y, not XZ).
 * Pass levelYOffset (the level group's current world Y) and slabElevation (the
 * wall mesh's Y within the level group) so the cursor lands at the correct world
 * height — matching how WallSystem positions the wall mesh at slabElevation.
 */
export function wallLocalToWorld(
  wallNode: WallNode,
  localX: number,
  localY: number,
  levelYOffset = 0,
  slabElevation = 0,
): [number, number, number] {
  const wallAngle = Math.atan2(
    wallNode.end[1] - wallNode.start[1],
    wallNode.end[0] - wallNode.start[0],
  )
  return [
    wallNode.start[0] + localX * Math.cos(wallAngle),
    slabElevation + localY + levelYOffset,
    wallNode.start[1] + localX * Math.sin(wallAngle),
  ]
}

/**
 * Clamps window center position so it stays fully within wall bounds.
 */
export function clampToWall(
  wallNode: WallNode,
  localX: number,
  localY: number,
  width: number,
  height: number,
): { clampedX: number; clampedY: number } {
  const dx = wallNode.end[0] - wallNode.start[0]
  const dz = wallNode.end[1] - wallNode.start[1]
  const wallLength = Math.sqrt(dx * dx + dz * dz)
  const wallHeight = wallNode.height ?? 2.5

  const clampedX = Math.max(width / 2, Math.min(wallLength - width / 2, localX))
  const clampedY = Math.max(height / 2, Math.min(wallHeight - height / 2, localY))
  return { clampedX, clampedY }
}

/**
 * If the cursor is close to a wall guide, snap the window center so either its
 * bottom edge (sill) or top edge (header) lands exactly on that guide.
 */
export function snapWindowCenterYToGuide(
  wallNode: WallNode,
  localY: number,
  height: number,
): number | null {
  const wallHeight = getWallHeight(wallNode)
  const minCenterY = height / 2
  const maxCenterY = wallHeight - height / 2

  let closestCenterY: number | null = null
  let closestDistance = Number.POSITIVE_INFINITY

  for (const guide of wallNode.guides ?? []) {
    const guideY = getWallGuideLocalY(wallNode, guide)
    const candidates = [guideY + height / 2, guideY - height / 2]

    for (const candidateCenterY of candidates) {
      if (candidateCenterY < minCenterY || candidateCenterY > maxCenterY) continue

      const distance = Math.abs(localY - candidateCenterY)
      if (distance > WINDOW_GUIDE_SNAP_THRESHOLD || distance >= closestDistance) continue

      closestCenterY = candidateCenterY
      closestDistance = distance
    }
  }

  return closestCenterY
}

/**
 * Directly checks the wall's children for bounding-box overlap with a proposed window.
 * Works for both `item` type (position[1] = bottom) and `window` type (position[1] = center).
 * The spatial grid only tracks `item` nodes, so windows must be checked this way.
 * Reads the wall's latest children from the store (not the event node) to avoid stale data.
 */
export function hasWallChildOverlap(
  wallId: string,
  clampedX: number,
  clampedY: number,
  width: number,
  height: number,
  ignoreId?: string,
): boolean {
  const nodes = useScene.getState().nodes
  const wallNode = nodes[wallId as AnyNodeId] as WallNode | undefined
  if (!wallNode) return true // Block if wall not found
  const halfW = width / 2
  const halfH = height / 2
  const newBottom = clampedY - halfH
  const newTop = clampedY + halfH
  const newLeft = clampedX - halfW
  const newRight = clampedX + halfW

  for (const childId of wallNode.children) {
    if (childId === ignoreId) continue
    const child = nodes[childId as AnyNodeId]
    if (!child) continue

    let childLeft: number, childRight: number, childBottom: number, childTop: number

    if (child.type === 'item') {
      const item = child as ItemNode
      if (item.asset.attachTo !== 'wall' && item.asset.attachTo !== 'wall-side') continue
      const [w, h] = getScaledDimensions(item)
      childLeft = item.position[0] - w / 2
      childRight = item.position[0] + w / 2
      childBottom = item.position[1] // items store bottom Y
      childTop = item.position[1] + h
    } else if (child.type === 'window') {
      const win = child as WindowNode
      childLeft = win.position[0] - win.width / 2
      childRight = win.position[0] + win.width / 2
      childBottom = win.position[1] - win.height / 2 // windows store center Y
      childTop = win.position[1] + win.height / 2
    } else if (child.type === 'door') {
      const door = child as DoorNode
      childLeft = door.position[0] - door.width / 2
      childRight = door.position[0] + door.width / 2
      childBottom = door.position[1] - door.height / 2 // doors store center Y
      childTop = door.position[1] + door.height / 2
    } else {
      continue
    }

    const xOverlap = newLeft < childRight && newRight > childLeft
    const yOverlap = newBottom < childTop && newTop > childBottom
    if (xOverlap && yOverlap) return true
  }

  return false
}
