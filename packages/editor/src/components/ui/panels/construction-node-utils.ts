'use client'

import type { AnyNode } from '@pascal-app/core'

export const AUTHORED_CONSTRUCTION_NODE_TYPES = [
  'floor-system',
  'floor-opening',
  'blocking-run',
  'beam-line',
  'support-post',
  'roof-plane',
  'truss-array',
  'rafter-set',
  'electrical-panel',
  'circuit',
  'device-box',
  'light-fixture',
  'wire-run',
  'switch-leg',
  'plumbing-fixture',
  'supply-run',
  'drain-run',
  'vent-run',
  'foundation-system',
  'footing-run',
  'stem-wall',
  'pier',
  'column',
] as const

export type ConstructionNodeType = (typeof AUTHORED_CONSTRUCTION_NODE_TYPES)[number]

export const STRUCTURE_NODE_TYPES = [
  'wall',
  'slab',
  'ceiling',
  'roof',
  'window',
  'door',
  ...AUTHORED_CONSTRUCTION_NODE_TYPES,
] as const

export const EDITOR_SELECTION_EVENT_TYPES = [
  'wall',
  'item',
  'building',
  'zone',
  'slab',
  'ceiling',
  'roof',
  'window',
  'door',
  'site',
  ...AUTHORED_CONSTRUCTION_NODE_TYPES,
] as const

const CONSTRUCTION_NODE_LABELS: Record<ConstructionNodeType, string> = {
  'floor-system': 'Floor System',
  'floor-opening': 'Floor Opening',
  'blocking-run': 'Blocking Run',
  'beam-line': 'Beam Line',
  'support-post': 'Support Post',
  'roof-plane': 'Roof Plane',
  'truss-array': 'Truss Array',
  'rafter-set': 'Rafter Set',
  'electrical-panel': 'Electrical Panel',
  circuit: 'Circuit',
  'device-box': 'Device Box',
  'light-fixture': 'Light Fixture',
  'wire-run': 'Wire Run',
  'switch-leg': 'Switch Leg',
  'plumbing-fixture': 'Plumbing Fixture',
  'supply-run': 'Supply Run',
  'drain-run': 'Drain Run',
  'vent-run': 'Vent Run',
  'foundation-system': 'Foundation System',
  'footing-run': 'Footing Run',
  'stem-wall': 'Stem Wall',
  pier: 'Pier',
  column: 'Column',
}

export function isConstructionNodeType(type: string): type is ConstructionNodeType {
  return AUTHORED_CONSTRUCTION_NODE_TYPES.includes(type as ConstructionNodeType)
}

export function isStructureNodeType(type: string): boolean {
  return STRUCTURE_NODE_TYPES.includes(type as (typeof STRUCTURE_NODE_TYPES)[number])
}

export function getConstructionNodeLabel(node: Pick<AnyNode, 'type' | 'name'>): string {
  if (node.name) return node.name
  if (isConstructionNodeType(node.type)) {
    return CONSTRUCTION_NODE_LABELS[node.type]
  }
  return node.type
}
