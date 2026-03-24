'use client'

import { type AnyNode, type RoofNode, type RoofSegmentNode, useScene } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { useCallback } from 'react'
import { ActionButton } from '../controls/action-button'
import { PanelSection } from '../controls/panel-section'
import { SliderControl } from '../controls/slider-control'
import { PanelWrapper } from './panel-wrapper'

export function RoofPanel() {
  const selectedIds = useViewer((s) => s.selection.selectedIds)
  const setSelection = useViewer((s) => s.setSelection)
  const nodes = useScene((s) => s.nodes)
  const updateNode = useScene((s) => s.updateNode)

  const selectedId = selectedIds[0]
  const node = selectedId ? (nodes[selectedId as AnyNode['id']] as RoofNode | undefined) : undefined
  const segmentId = node?.children?.[0]
  const segment = segmentId
    ? (nodes[segmentId as AnyNode['id']] as RoofSegmentNode | undefined)
    : undefined

  const handleUpdateRoof = useCallback(
    (updates: Partial<RoofNode>) => {
      if (!selectedId) return
      updateNode(selectedId as AnyNode['id'], updates)
    },
    [selectedId, updateNode],
  )

  const handleUpdateSegment = useCallback(
    (updates: Partial<RoofSegmentNode>) => {
      if (!segmentId) return
      updateNode(segmentId as AnyNode['id'], updates)
    },
    [segmentId, updateNode],
  )

  const handleClose = useCallback(() => {
    setSelection({ selectedIds: [] })
  }, [setSelection])

  if (!node || node.type !== 'roof' || selectedIds.length !== 1) return null

  return (
    <PanelWrapper
      icon="/icons/roof.png"
      onClose={handleClose}
      title={node.name || 'Roof'}
      width={300}
    >
      {segment ? (
        <PanelSection title="Dimensions">
          <SliderControl
            label="Length"
            max={20}
            min={0.5}
            onChange={(v) => handleUpdateSegment({ width: v })}
            precision={2}
            step={0.5}
            unit="m"
            value={Math.round(segment.width * 100) / 100}
          />
          <SliderControl
            label="Depth"
            max={20}
            min={0.5}
            onChange={(v) => handleUpdateSegment({ depth: v })}
            precision={2}
            step={0.5}
            unit="m"
            value={Math.round(segment.depth * 100) / 100}
          />
          <SliderControl
            label="Height"
            max={10}
            min={0.1}
            onChange={(v) => handleUpdateSegment({ roofHeight: v })}
            precision={2}
            step={0.1}
            unit="m"
            value={Math.round(segment.roofHeight * 100) / 100}
          />
        </PanelSection>
      ) : null}

      <PanelSection title="Rotation">
        <SliderControl
          label={
            <>
              R<sub className="ml-[1px] text-[11px] opacity-70">rot</sub>
            </>
          }
          max={180}
          min={-180}
          onChange={(degrees) => {
            const radians = (degrees * Math.PI) / 180
            handleUpdateRoof({ rotation: radians })
          }}
          precision={0}
          step={1}
          unit="°"
          value={Math.round((node.rotation * 180) / Math.PI)}
        />
        <div className="flex gap-1.5 px-1 pt-2 pb-1">
          <ActionButton
            label="-90°"
            onClick={() => handleUpdateRoof({ rotation: node.rotation - Math.PI / 2 })}
          />
          <ActionButton
            label="+90°"
            onClick={() => handleUpdateRoof({ rotation: node.rotation + Math.PI / 2 })}
          />
        </div>
      </PanelSection>

      <PanelSection title="Position">
        <SliderControl
          label={
            <>
              X<sub className="ml-[1px] text-[11px] opacity-70">pos</sub>
            </>
          }
          max={50}
          min={-50}
          onChange={(v) => {
            const pos = [...node.position] as [number, number, number]
            pos[0] = v
            handleUpdateRoof({ position: pos })
          }}
          precision={2}
          step={0.1}
          unit="m"
          value={Math.round(node.position[0] * 100) / 100}
        />
        <SliderControl
          label={
            <>
              Y<sub className="ml-[1px] text-[11px] opacity-70">pos</sub>
            </>
          }
          max={50}
          min={-50}
          onChange={(v) => {
            const pos = [...node.position] as [number, number, number]
            pos[1] = v
            handleUpdateRoof({ position: pos })
          }}
          precision={2}
          step={0.1}
          unit="m"
          value={Math.round(node.position[1] * 100) / 100}
        />
        <SliderControl
          label={
            <>
              Z<sub className="ml-[1px] text-[11px] opacity-70">pos</sub>
            </>
          }
          max={50}
          min={-50}
          onChange={(v) => {
            const pos = [...node.position] as [number, number, number]
            pos[2] = v
            handleUpdateRoof({ position: pos })
          }}
          precision={2}
          step={0.1}
          unit="m"
          value={Math.round(node.position[2] * 100) / 100}
        />
      </PanelSection>
    </PanelWrapper>
  )
}
