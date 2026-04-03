import { type AnyNode, type AnyNodeId, useScene } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { Cable, Hammer, HousePlug, Layers3, WavesLadder } from 'lucide-react'
import { useEffect, useState } from 'react'
import useEditor from './../../../../../store/use-editor'
import {
  getConstructionNodeLabel,
  isConstructionNodeType,
} from '../../../../ui/panels/construction-node-utils'
import { InlineRenameInput } from './inline-rename-input'
import { handleTreeSelection, TreeNode, TreeNodeWrapper } from './tree-node'
import { TreeNodeActions } from './tree-node-actions'

interface ConstructionTreeNodeProps {
  node: AnyNode
  depth: number
  isLast?: boolean
}

function getNodeChildren(node: AnyNode): AnyNodeId[] {
  return 'children' in node ? (node.children as AnyNodeId[]) : []
}

function getConstructionIcon(type: string) {
  if (type === 'electrical-panel' || type === 'circuit' || type === 'device-box' || type === 'light-fixture' || type === 'wire-run' || type === 'switch-leg') {
    return <HousePlug className="h-3.5 w-3.5" />
  }
  if (type === 'plumbing-fixture' || type === 'supply-run' || type === 'drain-run' || type === 'vent-run') {
    return <WavesLadder className="h-3.5 w-3.5" />
  }
  if (type === 'roof-plane' || type === 'truss-array' || type === 'rafter-set') {
    return <Layers3 className="h-3.5 w-3.5" />
  }
  if (
    type === 'foundation-system' ||
    type === 'footing-run' ||
    type === 'stem-wall' ||
    type === 'pier' ||
    type === 'column'
  ) {
    return <Cable className="h-3.5 w-3.5" />
  }

  return <Hammer className="h-3.5 w-3.5" />
}

export function ConstructionTreeNode({ node, depth, isLast }: ConstructionTreeNodeProps) {
  const childIds = getNodeChildren(node)
  const [expanded, setExpanded] = useState(childIds.length > 0)
  const [isEditing, setIsEditing] = useState(false)
  const selectedIds = useViewer((state) => state.selection.selectedIds)
  const isSelected = selectedIds.includes(node.id)
  const isHovered = useViewer((state) => state.hoveredId === node.id)
  const setSelection = useViewer((state) => state.setSelection)
  const setHoveredId = useViewer((state) => state.setHoveredId)

  useEffect(() => {
    if (selectedIds.length === 0) return
    const nodes = useScene.getState().nodes
    let isDescendant = false
    for (const id of selectedIds) {
      let current = nodes[id as AnyNodeId]
      while (current && current.parentId) {
        if (current.parentId === node.id) {
          isDescendant = true
          break
        }
        current = nodes[current.parentId as AnyNodeId]
      }
      if (isDescendant) break
    }
    if (isDescendant) {
      setExpanded(true)
    }
  }, [selectedIds, node.id])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const handled = handleTreeSelection(e, node.id, selectedIds, setSelection)
    if (!handled && useEditor.getState().phase === 'furnish') {
      useEditor.getState().setPhase('structure')
    }
  }

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleMouseEnter = () => {
    setHoveredId(node.id)
  }

  const handleMouseLeave = () => {
    setHoveredId(null)
  }

  if (!isConstructionNodeType(node.type)) {
    return null
  }

  const defaultName = getConstructionNodeLabel(node)
  const hasChildren = childIds.length > 0

  return (
    <TreeNodeWrapper
      actions={<TreeNodeActions node={node as any} />}
      depth={depth}
      expanded={expanded}
      hasChildren={hasChildren}
      icon={getConstructionIcon(node.type)}
      isHovered={isHovered}
      isLast={isLast}
      isSelected={isSelected}
      isVisible={node.visible !== false}
      label={
        <InlineRenameInput
          defaultName={defaultName}
          isEditing={isEditing}
          node={node as any}
          onStartEditing={() => setIsEditing(true)}
          onStopEditing={() => setIsEditing(false)}
        />
      }
      nodeId={node.id as AnyNodeId}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onToggle={() => setExpanded(!expanded)}
    >
      {hasChildren &&
        childIds.map((childId, index) => (
          <TreeNode
            depth={depth + 1}
            isLast={index === childIds.length - 1}
            key={childId}
            nodeId={childId as AnyNodeId}
          />
        ))}
    </TreeNodeWrapper>
  )
}
