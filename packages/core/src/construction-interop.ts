import type { AnyNode } from './schema/types'

export { migrateSceneGraph, type SceneGraph } from './schema/scene-graph'
export type { AnyNode } from './schema/types'
export type { DoorNode } from './schema/nodes/door'
export { getScaledDimensions, type ItemNode } from './schema/nodes/item'
export type { LevelNode } from './schema/nodes/level'
export type { RoofSegmentNode } from './schema/nodes/roof-segment'
export type { WallNode } from './schema/nodes/wall'
export type { WindowNode } from './schema/nodes/window'
export type { ZoneNode } from './schema/nodes/zone'
export { DEFAULT_WALL_HEIGHT, DEFAULT_WALL_THICKNESS } from './systems/wall/wall-footprint'

export function resolveLevelId(node: AnyNode, nodes: Record<string, AnyNode>): string {
  if (node.type === 'level') {
    return node.id
  }

  let current: AnyNode | undefined = node

  while (current) {
    if (current.type === 'level') {
      return current.id
    }

    current = current.parentId ? nodes[current.parentId] : undefined
  }

  return 'default'
}
