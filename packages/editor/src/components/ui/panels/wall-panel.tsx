'use client'

import { type AnyNode, useScene, type WallNode } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { useCallback } from 'react'
import { formatLengthImperial } from '../../../lib/units'
import { ColorControl } from '../controls/color-control'
import { PanelSection } from '../controls/panel-section'
import { SliderControl } from '../controls/slider-control'
import { PanelWrapper } from './panel-wrapper'

export function WallPanel() {
  const selectedIds = useViewer((s) => s.selection.selectedIds)
  const setSelection = useViewer((s) => s.setSelection)
  const nodes = useScene((s) => s.nodes)
  const updateNodes = useScene((s) => s.updateNodes)

  const selectedWalls = selectedIds
    .map((id) => nodes[id as AnyNode['id']])
    .filter((node): node is WallNode => !!node && node.type === 'wall')
  const node = selectedWalls[0]
  const isMultiSelection = selectedWalls.length > 1
  const allSelectedAreWalls = selectedWalls.length > 0 && selectedWalls.length === selectedIds.length

  const handleUpdate = useCallback(
    (updates: Partial<WallNode>) => {
      const wallUpdates = selectedIds.flatMap((id) => {
        const selectedNode = nodes[id as AnyNode['id']]
        if (!selectedNode || selectedNode.type !== 'wall') return []
        return [{ id: selectedNode.id, data: updates }]
      })
      if (wallUpdates.length === 0) return
      updateNodes(wallUpdates)
    },
    [nodes, selectedIds, updateNodes],
  )

  const handleClose = useCallback(() => {
    setSelection({ selectedIds: [] })
  }, [setSelection])

  if (!node || !allSelectedAreWalls) return null

  const lengths = selectedWalls.map((wall) => {
    const dx = wall.end[0] - wall.start[0]
    const dz = wall.end[1] - wall.start[1]
    return Math.sqrt(dx * dx + dz * dz)
  })
  const totalLength = lengths.reduce((sum, length) => sum + length, 0)

  const height = node.height ?? 2.5
  const thickness = node.thickness ?? 0.1
  const color = node.color ?? '#e7e5e4'

  return (
    <PanelWrapper
      icon="/icons/wall.png"
      onClose={handleClose}
      title={isMultiSelection ? `${selectedWalls.length} Walls` : node.name || 'Wall'}
      width={280}
    >
      <PanelSection title="Dimensions">
        {isMultiSelection && (
          <p className="px-1 pb-2 text-muted-foreground text-xs">
            Height, thickness, and color changes apply to every selected wall.
          </p>
        )}
        <SliderControl
          label="Height"
          max={6}
          min={0.1}
          onChange={(v) => handleUpdate({ height: Math.max(0.1, v) })}
          precision={2}
          step={0.1}
          unit="m"
          value={Math.round(height * 100) / 100}
        />
        <SliderControl
          label="Thickness"
          max={1}
          min={0.05}
          onChange={(v) => handleUpdate({ thickness: Math.max(0.05, v) })}
          precision={3}
          step={0.01}
          unit="m"
          value={Math.round(thickness * 1000) / 1000}
        />
      </PanelSection>

      <PanelSection title="Appearance">
        <ColorControl color={color} onChange={(value) => handleUpdate({ color: value })} />
      </PanelSection>

      <PanelSection title="Info">
        {isMultiSelection && (
          <div className="flex items-center justify-between px-2 py-1 text-muted-foreground text-sm">
            <span>Selected</span>
            <span className="font-mono text-white">{selectedWalls.length}</span>
          </div>
        )}
        <div className="flex items-center justify-between px-2 py-1 text-muted-foreground text-sm">
          <span>{isMultiSelection ? 'Total length' : 'Length'}</span>
          <span className="font-mono text-white">{formatLengthImperial(totalLength)}</span>
        </div>
      </PanelSection>
    </PanelWrapper>
  )
}
