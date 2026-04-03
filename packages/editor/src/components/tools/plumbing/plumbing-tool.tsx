import {
  DrainRunNode,
  PlumbingFixtureNode,
  SupplyRunNode,
  VentRunNode,
  type AnyNodeId,
  useScene,
} from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import useEditor from '../../../store/use-editor'
import { PointDrawTool } from '../shared/point-draw-tool'
import { PolylineDrawTool } from '../shared/polyline-draw-tool'

export const PlumbingTool: React.FC = () => {
  const constructionTool = useEditor((state) => state.constructionTool)
  const currentLevelId = useViewer((state) => state.selection.levelId)
  const createNode = useScene((state) => state.createNode)
  const setSelection = useViewer((state) => state.setSelection)

  if (!currentLevelId) return null

  if (constructionTool === 'plumbing-fixture') {
    return (
      <PointDrawTool
        color="#60a5fa"
        onCommit={(position) => {
          const fixture = PlumbingFixtureNode.parse({
            name: 'Plumbing Fixture',
            position,
          })
          createNode(fixture, currentLevelId as AnyNodeId)
          setSelection({ selectedIds: [fixture.id] })
        }}
      />
    )
  }

  if (constructionTool === 'supply-run') {
    return (
      <PolylineDrawTool
        color="#3b82f6"
        onCommit={(path) => {
          const run = SupplyRunNode.parse({
            name: 'Supply Run',
            path,
          })
          createNode(run, currentLevelId as AnyNodeId)
          setSelection({ selectedIds: [run.id] })
        }}
      />
    )
  }

  if (constructionTool === 'drain-run') {
    return (
      <PolylineDrawTool
        color="#f97316"
        onCommit={(path) => {
          const run = DrainRunNode.parse({
            name: 'Drain Run',
            path,
          })
          createNode(run, currentLevelId as AnyNodeId)
          setSelection({ selectedIds: [run.id] })
        }}
      />
    )
  }

  if (constructionTool === 'vent-run') {
    return (
      <PolylineDrawTool
        color="#94a3b8"
        onCommit={(path) => {
          const run = VentRunNode.parse({
            name: 'Vent Run',
            path,
          })
          createNode(run, currentLevelId as AnyNodeId)
          setSelection({ selectedIds: [run.id] })
        }}
      />
    )
  }

  return null
}
