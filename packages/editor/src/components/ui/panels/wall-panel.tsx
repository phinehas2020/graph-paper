'use client'

import {
  getWallGuideLocalY,
  getWallHeight,
  type AnyNode,
  useScene,
  type WallGuide,
  type WallGuideReference,
  type WallNode,
} from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { Plus, Trash2 } from 'lucide-react'
import { useCallback } from 'react'
import { METERS_PER_INCH, formatLengthImperial } from '../../../lib/units'
import useEditor from '../../../store/use-editor'
import { ActionButton } from '../controls/action-button'
import { ColorControl } from '../controls/color-control'
import { PanelSection } from '../controls/panel-section'
import { SliderControl } from '../controls/slider-control'
import { PanelWrapper } from './panel-wrapper'

export function WallPanel() {
  const selectedIds = useViewer((s) => s.selection.selectedIds)
  const setSelection = useViewer((s) => s.setSelection)
  const nodes = useScene((s) => s.nodes)
  const updateNodes = useScene((s) => s.updateNodes)
  const setMode = useEditor((s) => s.setMode)
  const setStructureLayer = useEditor((s) => s.setStructureLayer)
  const setTool = useEditor((s) => s.setTool)

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
  const wallHeight = getWallHeight(node)
  const sortedGuides = [...(node.guides ?? [])].sort(
    (a, b) => getWallGuideLocalY(node, a) - getWallGuideLocalY(node, b),
  )

  const handleActivateGuideTool = useCallback(() => {
    setStructureLayer('elements')
    setMode('build')
    setTool('wall-guide')
  }, [setMode, setStructureLayer, setTool])

  const handleGuideChange = useCallback(
    (
      guideId: WallGuide['id'],
      updater: (guide: WallGuide) => WallGuide,
    ) => {
      if (!node) return
      handleUpdate({
        guides: (node.guides ?? []).map((guide) => (guide.id === guideId ? updater(guide) : guide)),
      })
    },
    [handleUpdate, node],
  )

  const handleGuideOffsetChange = useCallback(
    (guideId: WallGuide['id'], offset: number) => {
      handleGuideChange(guideId, (guide) => ({
        ...guide,
        offset: Math.min(Math.max(offset, 0), wallHeight),
      }))
    },
    [handleGuideChange, wallHeight],
  )

  const handleGuideReferenceChange = useCallback(
    (guideId: WallGuide['id'], reference: WallGuideReference) => {
      handleGuideChange(guideId, (guide) => ({ ...guide, reference }))
    },
    [handleGuideChange],
  )

  const handleGuideDelete = useCallback(
    (guideId: WallGuide['id']) => {
      if (!node) return
      handleUpdate({
        guides: (node.guides ?? []).filter((guide) => guide.id !== guideId),
      })
    },
    [handleUpdate, node],
  )

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

      {!isMultiSelection && (
        <PanelSection title="Guides">
          <div className="space-y-2">
            <ActionButton
              icon={<Plus className="h-4 w-4" />}
              label={sortedGuides.length > 0 ? 'Draw Another Guide' : 'Draw Guide'}
              onClick={handleActivateGuideTool}
            />

            {sortedGuides.length === 0 ? (
              <p className="px-1 text-muted-foreground text-xs">
                Drop horizontal wall guides for sill heights, headers, or other opening references.
              </p>
            ) : (
              sortedGuides.map((guide, index) => {
                const resolvedHeight = getWallGuideLocalY(node, guide)

                return (
                  <div
                    className="space-y-2 rounded-lg border border-border/50 bg-[#2C2C2E] p-2"
                    key={guide.id}
                  >
                    <div className="flex items-center justify-between gap-3 px-1">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground text-xs">
                          Guide {index + 1}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatLengthImperial(guide.offset)} from {guide.reference}
                          {' · '}
                          sits at {formatLengthImperial(resolvedHeight)}
                        </div>
                      </div>
                      <button
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-[#3e3e3e] hover:text-foreground"
                        onClick={() => handleGuideDelete(guide.id)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <SliderControl
                      label={guide.reference === 'bottom' ? 'Bottom Offset' : 'Top Offset'}
                      max={wallHeight}
                      min={0}
                      onChange={(value) => handleGuideOffsetChange(guide.id, value)}
                      precision={4}
                      step={METERS_PER_INCH}
                      unit="m"
                      value={guide.offset}
                    />

                    <div className="flex gap-1.5">
                      {(['bottom', 'top'] as const).map((reference) => {
                        const isActive = guide.reference === reference

                        return (
                          <button
                            className={`flex-1 rounded-lg border px-3 py-2 font-medium text-xs transition-colors ${
                              isActive
                                ? 'border-cyan-400/60 bg-cyan-500/10 text-foreground'
                                : 'border-border/50 bg-[#252527] text-muted-foreground hover:bg-[#3e3e3e] hover:text-foreground'
                            }`}
                            key={reference}
                            onClick={() => handleGuideReferenceChange(guide.id, reference)}
                            type="button"
                          >
                            From {reference}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </PanelSection>
      )}

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
