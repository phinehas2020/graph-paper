import { BeamLineNode, SupportPostNode, type AnyNodeId, useScene } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import useEditor from '../../../store/use-editor'
import { getActiveFloorSystem } from '../floor/floor-tool-utils'
import { PointDrawTool } from '../shared/point-draw-tool'
import { SegmentDrawTool } from '../shared/segment-draw-tool'

export const BeamTool: React.FC = () => {
  const constructionTool = useEditor((state) => state.constructionTool)
  const currentLevelId = useViewer((state) => state.selection.levelId)
  const createNode = useScene((state) => state.createNode)
  const setSelection = useViewer((state) => state.setSelection)

  if (!currentLevelId) return null

  if (constructionTool === 'beam-line') {
    return (
      <SegmentDrawTool
        color="#8b5e34"
        onCommit={(start, end) => {
          const parentFloor = getActiveFloorSystem(currentLevelId)

          const beam = BeamLineNode.parse({
            name: 'Beam',
            start,
            end,
            supportFloorSystemId: parentFloor?.type === 'floor-system' ? parentFloor.id : null,
          })
          createNode(beam, currentLevelId as AnyNodeId)
          setSelection({ selectedIds: [beam.id] })
        }}
      />
    )
  }

  if (constructionTool === 'support-post') {
    return (
      <PointDrawTool
        color="#475569"
        onCommit={(position) => {
          const post = SupportPostNode.parse({
            name: 'Support Post',
            center: [position[0], position[2]],
          })
          createNode(post, currentLevelId as AnyNodeId)
          setSelection({ selectedIds: [post.id] })
        }}
      />
    )
  }

  return null
}
