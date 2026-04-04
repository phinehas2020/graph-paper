import {
  BlockingRunNode,
  FloorOpeningNode,
  FloorSystemNode,
  type AnyNodeId,
  useScene,
} from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import useEditor from '../../../store/use-editor'
import { PolygonDrawTool } from '../shared/polygon-draw-tool'
import { SegmentDrawTool } from '../shared/segment-draw-tool'
import { getActiveFloorSystem } from './floor-tool-utils'

export const FloorTool: React.FC = () => {
  const constructionTool = useEditor((state) => state.constructionTool)
  const currentLevelId = useViewer((state) => state.selection.levelId)
  const createNode = useScene((state) => state.createNode)
  const setSelection = useViewer((state) => state.setSelection)

  if (!currentLevelId) return null

  if (constructionTool === 'floor-system') {
    return (
      <PolygonDrawTool
        color="#d4b483"
        onCommit={(polygon) => {
          const floorCount = Object.values(useScene.getState().nodes).filter(
            (node) => node.type === 'floor-system',
          ).length

          const floorSystem = FloorSystemNode.parse({
            name: `Floor System ${floorCount + 1}`,
            polygon,
          })
          createNode(floorSystem, currentLevelId as AnyNodeId)
          setSelection({ selectedIds: [floorSystem.id] })
        }}
      />
    )
  }

  if (constructionTool === 'floor-opening') {
    return (
      <PolygonDrawTool
        color="#ef4444"
        onCommit={(polygon) => {
          const parentFloor = getActiveFloorSystem(currentLevelId)
          if (!(parentFloor && parentFloor.type === 'floor-system')) return

          const opening = FloorOpeningNode.parse({
            name: 'Floor Opening',
            polygon,
          })
          createNode(opening, parentFloor.id as AnyNodeId)
          setSelection({ selectedIds: [opening.id] })
        }}
      />
    )
  }

  if (constructionTool === 'blocking-run') {
    return (
      <SegmentDrawTool
        color="#f59e0b"
        onCommit={(start, end) => {
          const parentFloor = getActiveFloorSystem(currentLevelId)
          if (!(parentFloor && parentFloor.type === 'floor-system')) return

          const blocking = BlockingRunNode.parse({
            name: 'Blocking Run',
            start,
            end,
          })
          createNode(blocking, parentFloor.id as AnyNodeId)
          setSelection({ selectedIds: [blocking.id] })
        }}
      />
    )
  }

  return null
}
