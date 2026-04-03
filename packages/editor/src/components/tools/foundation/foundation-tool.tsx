import {
  ColumnNode,
  FootingRunNode,
  FoundationSystemNode,
  PierNode,
  StemWallNode,
  type AnyNodeId,
  resolveLevelId,
  useScene,
} from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import useEditor from '../../../store/use-editor'
import { PointDrawTool } from '../shared/point-draw-tool'
import { SegmentDrawTool } from '../shared/segment-draw-tool'

function ensureFoundationSystem(levelId: string) {
  const { nodes, createNode } = useScene.getState()
  const selectedIds = useViewer.getState().selection.selectedIds
  const selectedFoundation = selectedIds
    .map((id) => nodes[id as AnyNodeId])
    .find((node) => node?.type === 'foundation-system')

  if (selectedFoundation?.type === 'foundation-system') {
    return selectedFoundation
  }

  const existingFoundation = Object.values(nodes).find(
    (node) => node?.type === 'foundation-system' && resolveLevelId(node, nodes) === levelId,
  )
  if (existingFoundation?.type === 'foundation-system') {
    return existingFoundation
  }

  const foundation = FoundationSystemNode.parse({
    name: 'Foundation System',
  })
  createNode(foundation, levelId as AnyNodeId)
  return foundation
}

export const FoundationTool: React.FC = () => {
  const constructionTool = useEditor((state) => state.constructionTool)
  const currentLevelId = useViewer((state) => state.selection.levelId)
  const createNode = useScene((state) => state.createNode)
  const setSelection = useViewer((state) => state.setSelection)

  if (!currentLevelId || constructionTool === 'foundation-system') return null

  if (constructionTool === 'footing-run') {
    return (
      <SegmentDrawTool
        color="#7c2d12"
        onCommit={(start, end) => {
          const foundation = ensureFoundationSystem(currentLevelId)
          const footing = FootingRunNode.parse({
            name: 'Footing Run',
            start,
            end,
          })
          createNode(footing, foundation.id as AnyNodeId)
          setSelection({ selectedIds: [footing.id] })
        }}
      />
    )
  }

  if (constructionTool === 'stem-wall') {
    return (
      <SegmentDrawTool
        color="#78716c"
        onCommit={(start, end) => {
          const foundation = ensureFoundationSystem(currentLevelId)
          const stemWall = StemWallNode.parse({
            name: 'Stem Wall',
            start,
            end,
          })
          createNode(stemWall, foundation.id as AnyNodeId)
          setSelection({ selectedIds: [stemWall.id] })
        }}
      />
    )
  }

  if (constructionTool === 'pier') {
    return (
      <PointDrawTool
        color="#92400e"
        onCommit={(position) => {
          const foundation = ensureFoundationSystem(currentLevelId)
          const pier = PierNode.parse({
            name: 'Pier',
            center: [position[0], position[2]],
          })
          createNode(pier, foundation.id as AnyNodeId)
          setSelection({ selectedIds: [pier.id] })
        }}
      />
    )
  }

  if (constructionTool === 'column') {
    return (
      <PointDrawTool
        color="#475569"
        onCommit={(position) => {
          const foundation = ensureFoundationSystem(currentLevelId)
          const column = ColumnNode.parse({
            name: 'Column',
            center: [position[0], position[2]],
          })
          createNode(column, foundation.id as AnyNodeId)
          setSelection({ selectedIds: [column.id] })
        }}
      />
    )
  }

  return null
}
