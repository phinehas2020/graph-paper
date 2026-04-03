'use client'

import { type AnyNode, type AnyNodeId, useScene } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import useEditor from '../../../store/use-editor'
import { ConstructionNodePanel } from './construction-node-panel'
import { isConstructionNodeType } from './construction-node-utils'
import { CeilingPanel } from './ceiling-panel'
import { DoorPanel } from './door-panel'
import { ItemPanel } from './item-panel'
import { ReferencePanel } from './reference-panel'
import { RoofPanel } from './roof-panel'
import { SlabPanel } from './slab-panel'
import { WallPanel } from './wall-panel'
import { WindowPanel } from './window-panel'

export function PanelManager() {
  const selectedIds = useViewer((s) => s.selection.selectedIds)
  const selectedReferenceId = useEditor((s) => s.selectedReferenceId)
  const nodes = useScene((s) => s.nodes)
  const selectedNodes = selectedIds
    .map((id) => nodes[id as AnyNodeId])
    .filter(Boolean) as AnyNode[]
  const allSelectedAreWalls =
    selectedIds.length > 1 && selectedIds.every((id) => nodes[id as AnyNodeId]?.type === 'wall')
  const allSelectedAreConstruction =
    selectedNodes.length > 0 &&
    selectedNodes.length === selectedIds.length &&
    selectedNodes.every((node) => isConstructionNodeType(node.type))

  // Show reference panel if a reference is selected
  if (selectedReferenceId) {
    return <ReferencePanel />
  }

  if (allSelectedAreWalls) {
    return <WallPanel />
  }

  if (allSelectedAreConstruction) {
    return <ConstructionNodePanel />
  }

  // Show appropriate panel based on selected node type
  if (selectedIds.length === 1) {
    const selectedNode = selectedIds[0]
    const node = nodes[selectedNode as AnyNodeId]
    if (node) {
      switch (node.type) {
        case 'item':
          return <ItemPanel />
        case 'roof':
          return <RoofPanel />
        case 'slab':
          return <SlabPanel />
        case 'ceiling':
          return <CeilingPanel />
        case 'wall':
          return <WallPanel />
        case 'door':
          return <DoorPanel />
        case 'window':
          return <WindowPanel />
        default:
          if (node && isConstructionNodeType(node.type)) {
            return <ConstructionNodePanel />
          }
      }
    }
  }

  return null
}
