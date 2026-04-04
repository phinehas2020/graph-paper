import { type AnyNodeId, resolveLevelId, useScene } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'

export function getActiveFloorSystem(levelId: string | null) {
  if (!levelId) return null

  const { nodes } = useScene.getState()
  const selectedIds = useViewer.getState().selection.selectedIds

  const selectedFloor = selectedIds
    .map((id) => nodes[id as AnyNodeId])
    .find((node) => node?.type === 'floor-system')

  if (selectedFloor?.type === 'floor-system') {
    return selectedFloor
  }

  return Object.values(nodes).find(
    (node) => node?.type === 'floor-system' && resolveLevelId(node, nodes) === levelId,
  )
}
