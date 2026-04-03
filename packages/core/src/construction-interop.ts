import type { AnyNode } from './schema/types'

export { migrateSceneGraph, type SceneGraph } from './schema/scene-graph'
export type { AnyNode } from './schema/types'
export type { DoorNode } from './schema/nodes/door'
export type {
  CircuitNode,
  DeviceBoxNode,
  ElectricalPanelNode,
  LightFixtureNode,
  SwitchLegNode,
  WireRunNode,
} from './schema/nodes/electrical'
export type {
  BeamLineNode,
  BlockingRunNode,
  FloorOpeningNode,
  FloorSystemNode,
  SupportPostNode,
} from './schema/nodes/floor-system'
export type {
  ColumnNode,
  FootingRunNode,
  FoundationSystemNode,
  PierNode,
  StemWallNode,
} from './schema/nodes/foundation'
export { getScaledDimensions, type ItemNode } from './schema/nodes/item'
export type { LevelNode } from './schema/nodes/level'
export type {
  DrainRunNode,
  PlumbingFixtureNode,
  SupplyRunNode,
  VentRunNode,
} from './schema/nodes/plumbing'
export type { RafterSetNode, RoofPlaneNode, TrussArrayNode } from './schema/nodes/roof-plane'
export type { RoofSegmentNode } from './schema/nodes/roof-segment'
export type { WallNode } from './schema/nodes/wall'
export type { WindowNode } from './schema/nodes/window'
export type { ZoneNode } from './schema/nodes/zone'
export { DEFAULT_WALL_HEIGHT, DEFAULT_WALL_THICKNESS } from './schema/nodes/wall'

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
