'use client'

import {
  FloorSupportLineSchema,
  type AnyNode,
  type MaterialSchema,
  type SlabNode,
  useScene,
} from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '../../../lib/utils'
import useEditor from '../../../store/use-editor'
import { ActionButton } from '../controls/action-button'
import { MaterialPicker } from '../controls/material-picker'
import { PanelSection } from '../controls/panel-section'
import { SliderControl } from '../controls/slider-control'
import { PanelWrapper } from './panel-wrapper'

const FRAMING_OPTIONS = [
  { label: 'Slab', value: 'slab-on-grade' },
  { label: 'Joists', value: 'joists' },
  { label: 'Engineered', value: 'engineered' },
] as const

const JOIST_SYSTEM_OPTIONS = [
  { label: 'Dimensional', value: 'dimensional-lumber' },
  { label: 'I-Joist', value: 'i-joist' },
  { label: 'Open Web', value: 'open-web' },
] as const

const AXIS_OPTIONS = [
  { label: 'Auto', value: 'auto' },
  { label: 'Along X', value: 'x' },
  { label: 'Along Z', value: 'z' },
] as const

const STOCK_OPTIONS = ['2x8', '2x10'] as const

function calculateArea(polygon: Array<[number, number]>) {
  if (polygon.length < 3) return 0

  let area = 0
  const n = polygon.length
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n
    const pi = polygon[i]
    const pj = polygon[j]
    if (pi && pj) {
      area += pi[0] * pj[1]
      area -= pj[0] * pi[1]
    }
  }

  return Math.abs(area) / 2
}

function getBounds(polygon: Array<[number, number]>) {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY

  for (const [x, z] of polygon) {
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minZ = Math.min(minZ, z)
    maxZ = Math.max(maxZ, z)
  }

  return {
    minX: Number.isFinite(minX) ? minX : 0,
    maxX: Number.isFinite(maxX) ? maxX : 0,
    minZ: Number.isFinite(minZ) ? minZ : 0,
    maxZ: Number.isFinite(maxZ) ? maxZ : 0,
    width: Number.isFinite(maxX - minX) ? Math.max(0, maxX - minX) : 0,
    depth: Number.isFinite(maxZ - minZ) ? Math.max(0, maxZ - minZ) : 0,
  }
}

function resolveAutoJoistAxis(bounds: ReturnType<typeof getBounds>) {
  return bounds.width <= bounds.depth ? 'x' : 'z'
}

function ChoiceChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'rounded-lg border px-3 py-2 text-xs transition',
        active
          ? 'border-primary/60 bg-primary/15 text-primary'
          : 'border-border/50 bg-[#2C2C2E] text-muted-foreground hover:bg-[#3A3A3C] hover:text-foreground',
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

export function SlabPanel() {
  const selectedIds = useViewer((s) => s.selection.selectedIds)
  const setSelection = useViewer((s) => s.setSelection)
  const nodes = useScene((s) => s.nodes)
  const updateNode = useScene((s) => s.updateNode)
  const editingHole = useEditor((s) => s.editingHole)
  const setEditingHole = useEditor((s) => s.setEditingHole)
  const [activeSupportLineId, setActiveSupportLineId] = useState<string | null>(null)

  const selectedId = selectedIds[0]
  const node = selectedId ? (nodes[selectedId as AnyNode['id']] as SlabNode | undefined) : undefined

  const handleUpdate = useCallback(
    (updates: Partial<SlabNode>) => {
      if (!selectedId) return
      updateNode(selectedId as AnyNode['id'], updates)
    },
    [selectedId, updateNode],
  )

  const handleMaterialChange = useCallback(
    (material: MaterialSchema) => {
      handleUpdate({ material })
    },
    [handleUpdate],
  )

  const handleClose = useCallback(() => {
    setSelection({ selectedIds: [] })
    setEditingHole(null)
  }, [setSelection, setEditingHole])

  useEffect(() => {
    if (!node) {
      setEditingHole(null)
      setActiveSupportLineId(null)
    }
  }, [node, setEditingHole])

  useEffect(() => {
    return () => {
      setEditingHole(null)
    }
  }, [setEditingHole])

  const nodeBounds = useMemo(() => getBounds(node?.polygon ?? []), [node?.polygon])
  const joistDirection = node?.joistDirection ?? 'auto'
  const joistAxis = joistDirection === 'auto' ? resolveAutoJoistAxis(nodeBounds) : joistDirection
  const joistSpacing = node?.joistSpacing ?? 0.4064
  const joistStock = node?.joistStock ?? '2x10'
  const beamStock = node?.beamStock ?? '2x10'
  const stockLength = node?.stockLength ?? 4.8768
  const supportLines = node?.supportLines ?? []
  const activeSupportLine =
    supportLines.find((supportLine) => supportLine.id === activeSupportLineId) ?? supportLines[0] ?? null
  const supportOffsetBounds =
    activeSupportLine?.axis === 'x'
      ? {
          label: 'Z Offset',
          min: nodeBounds.minZ,
          max: nodeBounds.maxZ,
        }
      : {
          label: 'X Offset',
          min: nodeBounds.minX,
          max: nodeBounds.maxX,
        }

  useEffect(() => {
    if (supportLines.length === 0) {
      setActiveSupportLineId(null)
      return
    }

    if (!(activeSupportLineId && supportLines.some((supportLine) => supportLine.id === activeSupportLineId))) {
      setActiveSupportLineId(supportLines[0]!.id)
    }
  }, [activeSupportLineId, supportLines])

  const handleAddHole = useCallback(() => {
    if (!(node && selectedId)) return

    const polygon = node.polygon
    let cx = 0
    let cz = 0
    for (const [x, z] of polygon) {
      cx += x
      cz += z
    }
    cx /= polygon.length
    cz /= polygon.length

    const holeSize = 0.5
    const newHole: Array<[number, number]> = [
      [cx - holeSize, cz - holeSize],
      [cx + holeSize, cz - holeSize],
      [cx + holeSize, cz + holeSize],
      [cx - holeSize, cz + holeSize],
    ]
    const currentHoles = node.holes ?? []
    handleUpdate({ holes: [...currentHoles, newHole] })
    setEditingHole({ nodeId: selectedId, holeIndex: currentHoles.length })
  }, [node, selectedId, handleUpdate, setEditingHole])

  const handleEditHole = useCallback(
    (index: number) => {
      if (!selectedId) return
      setEditingHole({ nodeId: selectedId, holeIndex: index })
    },
    [selectedId, setEditingHole],
  )

  const handleDeleteHole = useCallback(
    (index: number) => {
      if (!selectedId) return
      const currentHoles = node?.holes ?? []
      const newHoles = currentHoles.filter((_, i) => i !== index)
      handleUpdate({ holes: newHoles })
      if (editingHole?.nodeId === selectedId && editingHole.holeIndex === index) {
        setEditingHole(null)
      }
    },
    [selectedId, node?.holes, handleUpdate, editingHole, setEditingHole],
  )

  const handleAddSupportLine = useCallback(() => {
    if (!node) return

    const axis = joistAxis === 'x' ? 'z' : 'x'
    const supportLine = FloorSupportLineSchema.parse({
      axis,
      kind: 'beam',
      offset: axis === 'x' ? (nodeBounds.minZ + nodeBounds.maxZ) / 2 : (nodeBounds.minX + nodeBounds.maxX) / 2,
      stock: beamStock,
    })

    handleUpdate({ supportLines: [...supportLines, supportLine] })
    setActiveSupportLineId(supportLine.id)
  }, [beamStock, handleUpdate, joistAxis, node, nodeBounds, supportLines])

  const handleUpdateSupportLine = useCallback(
    (supportLineId: string, updates: Partial<(typeof supportLines)[number]>) => {
      handleUpdate({
        supportLines: supportLines.map((supportLine) =>
          supportLine.id === supportLineId ? { ...supportLine, ...updates } : supportLine,
        ),
      })
    },
    [handleUpdate, supportLines],
  )

  const handleDeleteSupportLine = useCallback(
    (supportLineId: string) => {
      const nextSupportLines = supportLines.filter((supportLine) => supportLine.id !== supportLineId)
      handleUpdate({ supportLines: nextSupportLines })
      setActiveSupportLineId(nextSupportLines[0]?.id ?? null)
    },
    [handleUpdate, supportLines],
  )

  if (!node || node.type !== 'slab' || selectedIds.length !== 1) return null

  const grossArea = calculateArea(node.polygon)
  const netArea = Math.max(0, grossArea - (node.holes ?? []).reduce((sum, hole) => sum + calculateArea(hole), 0))

  return (
    <PanelWrapper
      icon="/icons/floor.png"
      onClose={handleClose}
      title={node.name || 'Floor'}
      width={340}
    >
      <PanelSection title="Floor System">
        <div className="grid grid-cols-3 gap-2">
          {FRAMING_OPTIONS.map((option) => (
            <ChoiceChip
              active={(node.framingStrategy ?? 'slab-on-grade') === option.value}
              key={option.value}
              label={option.label}
              onClick={() => handleUpdate({ framingStrategy: option.value })}
            />
          ))}
        </div>
        <div className="rounded-xl bg-background/40 px-3 py-2 text-xs text-muted-foreground">
          BOM stays downstream. This inspector authors the floor system that regeneration uses.
        </div>
      </PanelSection>

      {node.framingStrategy !== 'slab-on-grade' ? (
        <PanelSection title="Joist Layout">
          <div className="grid grid-cols-3 gap-2">
            {JOIST_SYSTEM_OPTIONS.map((option) => (
              <ChoiceChip
                active={(node.joistSystem ?? 'dimensional-lumber') === option.value}
                key={option.value}
                label={option.label}
                onClick={() => handleUpdate({ joistSystem: option.value })}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {AXIS_OPTIONS.map((option) => (
              <ChoiceChip
                active={joistDirection === option.value}
                key={option.value}
                label={option.label}
                onClick={() => handleUpdate({ joistDirection: option.value })}
              />
            ))}
          </div>

          <div className="rounded-xl bg-background/40 px-3 py-2 text-xs text-muted-foreground">
            Active span axis: <span className="font-medium text-foreground uppercase">{joistAxis}</span>
          </div>

          <SliderControl
            label="Spacing"
            max={0.61}
            min={0.2}
            onChange={(value) => handleUpdate({ joistSpacing: Math.max(0.2, value) })}
            precision={3}
            step={0.0254}
            unit="m"
            value={joistSpacing}
          />

          <SliderControl
            label="Stock Length"
            max={6.1}
            min={2.44}
            onChange={(value) => handleUpdate({ stockLength: Math.max(2.44, value) })}
            precision={2}
            step={0.3048}
            unit="m"
            value={stockLength}
          />

          <div className="grid grid-cols-2 gap-2">
            {STOCK_OPTIONS.map((stock) => (
              <ChoiceChip
                active={joistStock === stock}
                key={stock}
                label={`Joists ${stock}`}
                onClick={() => handleUpdate({ joistStock: stock })}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {STOCK_OPTIONS.map((stock) => (
              <ChoiceChip
                active={beamStock === stock}
                key={stock}
                label={`Beams ${stock}`}
                onClick={() => handleUpdate({ beamStock: stock })}
              />
            ))}
          </div>
        </PanelSection>
      ) : null}

      {node.framingStrategy !== 'slab-on-grade' ? (
        <PanelSection title="Support Beams">
          {supportLines.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {supportLines.map((supportLine, index) => (
                  <ChoiceChip
                    active={activeSupportLine?.id === supportLine.id}
                    key={supportLine.id}
                    label={`Beam ${index + 1}`}
                    onClick={() => setActiveSupportLineId(supportLine.id)}
                  />
                ))}
              </div>

              {activeSupportLine ? (
                <div className="space-y-2 rounded-xl border border-border/50 bg-background/30 p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {(['x', 'z'] as const).map((axis) => (
                      <ChoiceChip
                        active={activeSupportLine.axis === axis}
                        key={axis}
                        label={axis === 'x' ? 'Runs X' : 'Runs Z'}
                        onClick={() =>
                          handleUpdateSupportLine(activeSupportLine.id, {
                            axis,
                            offset:
                              axis === 'x'
                                ? (nodeBounds.minZ + nodeBounds.maxZ) / 2
                                : (nodeBounds.minX + nodeBounds.maxX) / 2,
                          })
                        }
                      />
                    ))}
                  </div>

                  {supportOffsetBounds ? (
                    <SliderControl
                      label={supportOffsetBounds.label}
                      max={supportOffsetBounds.max}
                      min={supportOffsetBounds.min}
                      onChange={(value) =>
                        handleUpdateSupportLine(activeSupportLine.id, {
                          offset: value,
                        })
                      }
                      precision={2}
                      step={0.05}
                      unit="m"
                      value={activeSupportLine.offset}
                    />
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    {STOCK_OPTIONS.map((stock) => (
                      <ChoiceChip
                        active={activeSupportLine.stock === stock}
                        key={stock}
                        label={stock}
                        onClick={() =>
                          handleUpdateSupportLine(activeSupportLine.id, {
                            stock,
                          })
                        }
                      />
                    ))}
                  </div>

                  <ActionButton
                    className="w-full border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                    label="Delete Beam"
                    onClick={() => handleDeleteSupportLine(activeSupportLine.id)}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 px-3 py-3 text-center text-muted-foreground text-xs">
              No authored support beams yet.
            </div>
          )}

          <ActionButton
            className="w-full"
            icon={<Plus className="h-3.5 w-3.5" />}
            label="Add Center Beam"
            onClick={handleAddSupportLine}
          />
        </PanelSection>
      ) : null}

      <PanelSection title="Elevation">
        <SliderControl
          label="Height"
          max={1}
          min={-1}
          onChange={(value) => handleUpdate({ elevation: value })}
          precision={3}
          step={0.01}
          unit="m"
          value={Math.round((node.elevation ?? 0.05) * 1000) / 1000}
        />

        <div className="mt-2 grid grid-cols-2 gap-1.5 px-1 pb-1">
          <ActionButton label="Sunken (-15cm)" onClick={() => handleUpdate({ elevation: -0.15 })} />
          <ActionButton label="Ground (0m)" onClick={() => handleUpdate({ elevation: 0 })} />
          <ActionButton label="Raised (+5cm)" onClick={() => handleUpdate({ elevation: 0.05 })} />
          <ActionButton label="Step (+15cm)" onClick={() => handleUpdate({ elevation: 0.15 })} />
        </div>
      </PanelSection>

      <PanelSection title="Info">
        <div className="flex items-center justify-between px-2 py-1 text-muted-foreground text-sm">
          <span>Net Area</span>
          <span className="font-mono text-white">{netArea.toFixed(2)} m²</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 text-muted-foreground text-sm">
          <span>Gross Area</span>
          <span className="font-mono text-white">{grossArea.toFixed(2)} m²</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 text-muted-foreground text-sm">
          <span>Framed Openings</span>
          <span className="font-mono text-white">{(node.holes ?? []).length}</span>
        </div>
      </PanelSection>

      <PanelSection title="Framed Openings">
        {node.holes && node.holes.length > 0 ? (
          <div className="flex flex-col gap-1 pb-2">
            {node.holes.map((hole, index) => {
              const holeArea = calculateArea(hole)
              const isEditing =
                editingHole?.nodeId === selectedId && editingHole?.holeIndex === index

              return (
                <div
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-2 transition-colors',
                    isEditing
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-transparent hover:bg-accent/30',
                  )}
                  key={index}
                >
                  <div className="min-w-0 flex-1">
                    <p className={cn('font-medium text-xs', isEditing ? 'text-primary' : 'text-white')}>
                      Opening {index + 1} {isEditing ? '(Editing)' : ''}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {holeArea.toFixed(2)} m² · {hole.length} pts
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <ActionButton
                        className="h-7 bg-primary text-primary-foreground hover:bg-primary/90"
                        label="Done"
                        onClick={() => setEditingHole(null)}
                      />
                    ) : (
                      <>
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2C2C2E] text-muted-foreground hover:bg-[#3e3e3e] hover:text-foreground"
                          onClick={() => handleEditHole(index)}
                          type="button"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                          onClick={() => handleDeleteHole(index)}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-2 py-3 text-center text-muted-foreground text-xs">No framed openings</div>
        )}

        <div className="px-1 pt-1 pb-1">
          <ActionButton
            className="w-full"
            disabled={editingHole?.nodeId === selectedId}
            icon={<Plus className="h-3.5 w-3.5" />}
            label="Add Opening"
            onClick={handleAddHole}
          />
        </div>
      </PanelSection>

      <PanelSection title="Material">
        <MaterialPicker
          onChange={handleMaterialChange}
          value={node.material}
        />
      </PanelSection>
    </PanelWrapper>
  )
}
