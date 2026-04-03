import {
  RafterSetNode,
  RoofNode,
  RoofPlaneNode,
  TrussArrayNode,
  type AnyNodeId,
  resolveLevelId,
  useScene,
} from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import useEditor from '../../../store/use-editor'
import { PolygonDrawTool } from '../shared/polygon-draw-tool'
import { SegmentDrawTool } from '../shared/segment-draw-tool'

function ensureRoof(levelId: string) {
  const { nodes, createNode } = useScene.getState()
  const selectedIds = useViewer.getState().selection.selectedIds
  const selectedRoof = selectedIds
    .map((id) => nodes[id as AnyNodeId])
    .find((node) => node?.type === 'roof')

  if (selectedRoof?.type === 'roof') {
    return selectedRoof
  }

  const existingRoof = Object.values(nodes).find(
    (node) => node?.type === 'roof' && resolveLevelId(node, nodes) === levelId,
  )
  if (existingRoof?.type === 'roof') {
    return existingRoof
  }

  const roof = RoofNode.parse({
    name: 'Roof',
  })
  createNode(roof, levelId as AnyNodeId)
  return roof
}

function getActiveRoofPlane(levelId: string) {
  const { nodes } = useScene.getState()
  const selectedIds = useViewer.getState().selection.selectedIds
  const selectedRoofPlane = selectedIds
    .map((id) => nodes[id as AnyNodeId])
    .find((node) => node?.type === 'roof-plane')
  if (selectedRoofPlane?.type === 'roof-plane') {
    return selectedRoofPlane
  }

  return Object.values(nodes).find(
    (node) => node?.type === 'roof-plane' && resolveLevelId(node, nodes) === levelId,
  )
}

export const RoofFramingTool: React.FC = () => {
  const constructionTool = useEditor((state) => state.constructionTool)
  const currentLevelId = useViewer((state) => state.selection.levelId)
  const createNode = useScene((state) => state.createNode)
  const setSelection = useViewer((state) => state.setSelection)

  if (!currentLevelId) return null

  if (constructionTool === 'roof-plane') {
    return (
      <PolygonDrawTool
        color="#c2410c"
        onCommit={(polygon) => {
          const roof = ensureRoof(currentLevelId)
          const roofPlane = RoofPlaneNode.parse({
            name: 'Roof Plane',
            polygon,
          })
          createNode(roofPlane, roof.id as AnyNodeId)
          setSelection({ selectedIds: [roofPlane.id] })
        }}
      />
    )
  }

  if (constructionTool === 'truss-array') {
    return (
      <SegmentDrawTool
        color="#dc2626"
        onCommit={(start, end) => {
          const roofPlane = getActiveRoofPlane(currentLevelId)
          if (!(roofPlane && roofPlane.type === 'roof-plane')) return

          const trussArray = TrussArrayNode.parse({
            name: 'Truss Array',
            roofPlaneId: roofPlane.id,
            start,
            end,
          })
          createNode(trussArray, roofPlane.id as AnyNodeId)
          setSelection({ selectedIds: [trussArray.id] })
        }}
      />
    )
  }

  if (constructionTool === 'rafter-set') {
    return (
      <SegmentDrawTool
        color="#7c3aed"
        onCommit={(start, end) => {
          const roofPlane = getActiveRoofPlane(currentLevelId)
          if (!(roofPlane && roofPlane.type === 'roof-plane')) return

          const rafterSet = RafterSetNode.parse({
            name: 'Rafter Set',
            roofPlaneId: roofPlane.id,
            start,
            end,
          })
          createNode(rafterSet, roofPlane.id as AnyNodeId)
          setSelection({ selectedIds: [rafterSet.id] })
        }}
      />
    )
  }

  return null
}
