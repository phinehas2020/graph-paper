'use client'

import {
  type AnyNode,
  type AnyNodeId,
  useScene,
} from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { useCallback, useMemo } from 'react'
import {
  getConstructionNodeLabel,
  isConstructionNodeType,
} from './construction-node-utils'
import { MetricControl } from '../controls/metric-control'
import { PanelSection } from '../controls/panel-section'
import { ToggleControl } from '../controls/toggle-control'
import { PanelWrapper } from './panel-wrapper'

type ConstructionNode = AnyNode & {
  name?: string
  visible?: boolean
  children?: string[]
  position?: [number, number, number]
  center?: [number, number]
  start?: [number, number]
  end?: [number, number]
  polygon?: Array<[number, number]>
  path?: Array<[number, number, number]>
  assemblyId?: string
  wallId?: string | null
  circuitId?: string | null
  roofPlaneId?: string | null
  supportFloorSystemId?: string | null
  derivedFromSlabId?: string | null
  floorKind?: string
  framingKind?: string
  rimMode?: string
  kind?: string
  deviceType?: string
  fixtureType?: string
  circuitType?: string
  systemKind?: string
  foundationKind?: string
  pathMode?: string
  materialCode?: string
  pipeMaterial?: string
  wireType?: string
  label?: string
  breakerAmps?: number
  voltage?: number
  mainBreakerAmps?: number
  amperage?: number
  mountHeight?: number
  height?: number
  width?: number
  depth?: number
  thickness?: number
  spacing?: number
  pitch?: number
  overhang?: number
  heelHeight?: number
  sheathingThickness?: number
  roofingThickness?: number
  joistAngle?: number
  joistSpacing?: number
  memberDepth?: number
  elevation?: number
  plateHeight?: number
  framingMode?: string
  ridgeBoardDepth?: number
  rebarProfile?: string
  slope?: number
  curbHeight?: number
  diameter?: number
  drainDiameter?: number
  roomType?: string
  homerun?: boolean
}

const VECTOR_PRECISION = 3
const LENGTH_STEP = 0.01

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="px-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <input
        className="rounded-lg border border-border/50 bg-[#2C2C2E] px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="px-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <select
        className="rounded-lg border border-border/50 bg-[#2C2C2E] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function FieldGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/30 p-2">
      <div className="px-1 pb-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function renderVec2Fields(
  value: [number, number],
  onChange: (next: [number, number]) => void,
  axisLabels: [string, string] = ['X', 'Z'],
) {
  return (
    <>
      <MetricControl
        label={`${axisLabels[0]} pos`}
        onChange={(next) => onChange([next, value[1]])}
        precision={VECTOR_PRECISION}
        step={LENGTH_STEP}
        unit="m"
        value={value[0]}
      />
      <MetricControl
        label={`${axisLabels[1]} pos`}
        onChange={(next) => onChange([value[0], next])}
        precision={VECTOR_PRECISION}
        step={LENGTH_STEP}
        unit="m"
        value={value[1]}
      />
    </>
  )
}

function renderVec3Fields(
  value: [number, number, number],
  onChange: (next: [number, number, number]) => void,
) {
  return (
    <>
      <MetricControl
        label="X pos"
        onChange={(next) => onChange([next, value[1], value[2]])}
        precision={VECTOR_PRECISION}
        step={LENGTH_STEP}
        unit="m"
        value={value[0]}
      />
      <MetricControl
        label="Y pos"
        onChange={(next) => onChange([value[0], next, value[2]])}
        precision={VECTOR_PRECISION}
        step={LENGTH_STEP}
        unit="m"
        value={value[1]}
      />
      <MetricControl
        label="Z pos"
        onChange={(next) => onChange([value[0], value[1], next])}
        precision={VECTOR_PRECISION}
        step={LENGTH_STEP}
        unit="m"
        value={value[2]}
      />
    </>
  )
}

function renderPolygonInfo(node: ConstructionNode) {
  const pointCount = node.polygon?.length ?? 0
  if (pointCount === 0) return null

  return (
    <PanelSection title="Geometry">
      <div className="rounded-lg border border-border/50 bg-background/30 px-3 py-2 text-sm text-muted-foreground">
        {pointCount} polygon points
      </div>
    </PanelSection>
  )
}

function renderPathInfo(node: ConstructionNode) {
  const pointCount = node.path?.length ?? 0
  if (pointCount === 0) return null

  return (
    <PanelSection title="Geometry">
      <div className="rounded-lg border border-border/50 bg-background/30 px-3 py-2 text-sm text-muted-foreground">
        {pointCount} path points
      </div>
    </PanelSection>
  )
}

export function ConstructionNodePanel() {
  const selectedIds = useViewer((s) => s.selection.selectedIds)
  const setSelection = useViewer((s) => s.setSelection)
  const nodes = useScene((s) => s.nodes)
  const updateNode = useScene((s) => s.updateNode)

  const selectedNodes = useMemo(
    () =>
      selectedIds.reduce<ConstructionNode[]>((accumulator, id) => {
        const node = nodes[id as AnyNodeId]
        if (node && isConstructionNodeType(node.type)) {
          accumulator.push(node as ConstructionNode)
        }
        return accumulator
      }, []),
    [nodes, selectedIds],
  )

  const primaryNode = selectedNodes[0]

  const editableNodes = useMemo(() => {
    if (!primaryNode) return []
    if (selectedNodes.length <= 1) return [primaryNode]
    if (selectedNodes.every((node) => node.type === primaryNode.type)) {
      return selectedNodes
    }
    return [primaryNode]
  }, [primaryNode, selectedNodes])

  const handleClose = useCallback(() => {
    setSelection({ selectedIds: [] })
  }, [setSelection])

  const handleUpdate = useCallback(
    (updates: Record<string, unknown>) => {
      for (const node of editableNodes) {
        updateNode(node.id as AnyNodeId, updates as any)
      }
    },
    [editableNodes, updateNode],
  )

  const handleUpdateName = useCallback(
    (name: string) => {
      handleUpdate({ name })
    },
    [handleUpdate],
  )

  const handleToggleVisible = useCallback(
    (visible: boolean) => {
      handleUpdate({ visible })
    },
    [handleUpdate],
  )

  if (!primaryNode) return null

  const node = primaryNode
  const childrenCount = node.children?.length ?? 0
  const isMultiSelection = editableNodes.length > 1
  const title = isMultiSelection
    ? `${editableNodes.length} ${getConstructionNodeLabel(node)}${editableNodes.length === 1 ? '' : 's'}`
    : getConstructionNodeLabel(node)

  const identitySection = (
    <PanelSection title="Identity">
      <TextField
        label="Name"
        onChange={handleUpdateName}
        placeholder={getConstructionNodeLabel(node)}
        value={node.name ?? ''}
      />
      <ToggleControl
        checked={node.visible !== false}
        label="Visible"
        onChange={handleToggleVisible}
      />
      <div className="rounded-lg border border-border/50 bg-background/30 px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Type</span>
          <span className="font-mono text-foreground">{node.type}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span>Children</span>
          <span className="font-mono text-foreground">{childrenCount}</span>
        </div>
      </div>
    </PanelSection>
  )

  const content = (() => {
    switch (node.type) {
      case 'floor-system':
        return (
          <>
            {identitySection}
            {renderPolygonInfo(node)}
            <PanelSection title="Floor System">
              <SelectField
                label="Framing Kind"
                onChange={(value) => handleUpdate({ framingKind: value })}
                options={['dimensional-lumber', 'i-joist', 'floor-truss']}
                value={(node as any).framingKind ?? 'dimensional-lumber'}
              />
              <SelectField
                label="Rim Mode"
                onChange={(value) => handleUpdate({ rimMode: value })}
                options={['rim-board', 'solid-blocking', 'open-web']}
                value={(node as any).rimMode ?? 'rim-board'}
              />
              <MetricControl
                label="Joist Angle"
                onChange={(value) => handleUpdate({ joistAngle: value })}
                precision={2}
                step={0.01}
                value={node.joistAngle ?? 0}
              />
              <MetricControl
                label="Joist Spacing"
                onChange={(value) => handleUpdate({ joistSpacing: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.joistSpacing ?? 0}
              />
              <MetricControl
                label="Member Depth"
                onChange={(value) => handleUpdate({ memberDepth: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.memberDepth ?? 0}
              />
              <MetricControl
                label="Elevation"
                onChange={(value) => handleUpdate({ elevation: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.elevation ?? 0}
              />
              <MetricControl
                label="Sheathing"
                onChange={(value) => handleUpdate({ sheathingThickness: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.sheathingThickness ?? 0}
              />
            </PanelSection>
          </>
        )

      case 'floor-opening':
        return (
          <>
            {identitySection}
            {renderPolygonInfo(node)}
            <PanelSection title="Opening">
              <MetricControl
                label="Curb Height"
                onChange={(value) => handleUpdate({ curbHeight: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.curbHeight ?? 0}
              />
            </PanelSection>
          </>
        )

      case 'blocking-run':
        return (
          <>
            {identitySection}
            <PanelSection title="Geometry">
              <FieldGroup label="Start">
                {renderVec2Fields(node.start ?? [0, 0], (next) => handleUpdate({ start: next }))}
              </FieldGroup>
              <FieldGroup label="End">
                {renderVec2Fields(node.end ?? [0, 0], (next) => handleUpdate({ end: next }))}
              </FieldGroup>
            </PanelSection>
            <PanelSection title="Blocking">
              <SelectField
                label="Kind"
                onChange={(value) => handleUpdate({ kind: value })}
                options={['solid', 'bridging']}
                value={(node as any).kind ?? 'solid'}
              />
              <MetricControl
                label="Spacing"
                onChange={(value) => handleUpdate({ spacing: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.spacing ?? 0}
              />
              <TextField
                label="Material"
                onChange={(value) => handleUpdate({ materialCode: value })}
                placeholder="lumber.spf.2x10"
                value={node.materialCode ?? ''}
              />
            </PanelSection>
          </>
        )

      case 'beam-line':
        return (
          <>
            {identitySection}
            <PanelSection title="Geometry">
              <FieldGroup label="Start">
                {renderVec2Fields(node.start ?? [0, 0], (next) => handleUpdate({ start: next }))}
              </FieldGroup>
              <FieldGroup label="End">
                {renderVec2Fields(node.end ?? [0, 0], (next) => handleUpdate({ end: next }))}
              </FieldGroup>
            </PanelSection>
            <PanelSection title="Beam">
              <MetricControl
                label="Width"
                onChange={(value) => handleUpdate({ width: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.width ?? 0}
              />
              <MetricControl
                label="Depth"
                onChange={(value) => handleUpdate({ depth: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.depth ?? 0}
              />
              <TextField
                label="Material"
                onChange={(value) => handleUpdate({ materialCode: value })}
                placeholder="lumber.spf.2x10"
                value={node.materialCode ?? ''}
              />
            </PanelSection>
          </>
        )

      case 'support-post':
        return (
          <>
            {identitySection}
            <PanelSection title="Center">
              {renderVec2Fields(node.center ?? [0, 0], (next) => handleUpdate({ center: next }))}
            </PanelSection>
            <PanelSection title="Post">
              <MetricControl
                label="Width"
                onChange={(value) => handleUpdate({ width: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.width ?? 0}
              />
              <MetricControl
                label="Depth"
                onChange={(value) => handleUpdate({ depth: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.depth ?? 0}
              />
              <MetricControl
                label="Height"
                onChange={(value) => handleUpdate({ height: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.height ?? 0}
              />
            </PanelSection>
          </>
        )

      case 'roof-plane':
        return (
          <>
            {identitySection}
            {renderPolygonInfo(node)}
            <PanelSection title="Roof Plane">
              <MetricControl
                label="Pitch"
                onChange={(value) => handleUpdate({ pitch: value })}
                precision={2}
                step={0.25}
                value={node.pitch ?? 0}
              />
              <MetricControl
                label="Overhang"
                onChange={(value) => handleUpdate({ overhang: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.overhang ?? 0}
              />
              <MetricControl
                label="Plate Height"
                onChange={(value) => handleUpdate({ plateHeight: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.plateHeight ?? 0}
              />
              <MetricControl
                label="Heel Height"
                onChange={(value) => handleUpdate({ heelHeight: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.heelHeight ?? 0}
              />
              <MetricControl
                label="Sheathing"
                onChange={(value) => handleUpdate({ sheathingThickness: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.sheathingThickness ?? 0}
              />
              <MetricControl
                label="Roofing"
                onChange={(value) => handleUpdate({ roofingThickness: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.roofingThickness ?? 0}
              />
              <SelectField
                label="Framing Mode"
                onChange={(value) => handleUpdate({ framingMode: value })}
                options={['truss-array', 'rafter-set']}
                value={(node as any).framingMode ?? 'truss-array'}
              />
            </PanelSection>
          </>
        )

      case 'truss-array':
        return (
          <>
            {identitySection}
            <PanelSection title="Geometry">
              <FieldGroup label="Start">
                {renderVec2Fields(node.start ?? [0, 0], (next) => handleUpdate({ start: next }))}
              </FieldGroup>
              <FieldGroup label="End">
                {renderVec2Fields(node.end ?? [0, 0], (next) => handleUpdate({ end: next }))}
              </FieldGroup>
            </PanelSection>
            <PanelSection title="Truss Array">
              <MetricControl
                label="Spacing"
                onChange={(value) => handleUpdate({ spacing: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.spacing ?? 0}
              />
              <MetricControl
                label="Heel Height"
                onChange={(value) => handleUpdate({ heelHeight: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.heelHeight ?? 0}
              />
              <MetricControl
                label="Overhang"
                onChange={(value) => handleUpdate({ overhang: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.overhang ?? 0}
              />
            </PanelSection>
          </>
        )

      case 'rafter-set':
        return (
          <>
            {identitySection}
            <PanelSection title="Geometry">
              <FieldGroup label="Start">
                {renderVec2Fields(node.start ?? [0, 0], (next) => handleUpdate({ start: next }))}
              </FieldGroup>
              <FieldGroup label="End">
                {renderVec2Fields(node.end ?? [0, 0], (next) => handleUpdate({ end: next }))}
              </FieldGroup>
            </PanelSection>
            <PanelSection title="Rafter Set">
              <MetricControl
                label="Spacing"
                onChange={(value) => handleUpdate({ spacing: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.spacing ?? 0}
              />
              <MetricControl
                label="Ridge Board Depth"
                onChange={(value) => handleUpdate({ ridgeBoardDepth: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.ridgeBoardDepth ?? 0}
              />
              <MetricControl
                label="Overhang"
                onChange={(value) => handleUpdate({ overhang: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.overhang ?? 0}
              />
            </PanelSection>
          </>
        )

      case 'electrical-panel':
        return (
          <>
            {identitySection}
            <PanelSection title="Position">
              {renderVec3Fields(node.position ?? [0, 0, 0], (next) => handleUpdate({ position: next }))}
            </PanelSection>
            <PanelSection title="Panel">
              <MetricControl
                label="Amperage"
                onChange={(value) => handleUpdate({ amperage: value })}
                precision={0}
                step={1}
                unit="A"
                value={node.amperage ?? 0}
              />
              <MetricControl
                label="Voltage"
                onChange={(value) => handleUpdate({ voltage: value })}
                precision={0}
                step={1}
                unit="V"
                value={node.voltage ?? 0}
              />
              <MetricControl
                label="Main Breaker"
                onChange={(value) => handleUpdate({ mainBreakerAmps: value })}
                precision={0}
                step={1}
                unit="A"
                value={node.mainBreakerAmps ?? 0}
              />
            </PanelSection>
          </>
        )

      case 'circuit':
        return (
          <>
            {identitySection}
            <PanelSection title="Circuit">
              <TextField
                label="Label"
                onChange={(value) => handleUpdate({ label: value })}
                placeholder="Circuit 1"
                value={node.label ?? ''}
              />
              <SelectField
                label="Type"
                onChange={(value) => handleUpdate({ circuitType: value })}
                options={['lighting', 'general', 'appliance', 'low-voltage']}
                value={(node as any).circuitType ?? 'general'}
              />
              <MetricControl
                label="Breaker"
                onChange={(value) => handleUpdate({ breakerAmps: value })}
                precision={0}
                step={1}
                unit="A"
                value={node.breakerAmps ?? 0}
              />
              <MetricControl
                label="Voltage"
                onChange={(value) => handleUpdate({ voltage: value })}
                precision={0}
                step={1}
                unit="V"
                value={node.voltage ?? 0}
              />
            </PanelSection>
            {renderPathInfo(node)}
          </>
        )

      case 'device-box':
        return (
          <>
            {identitySection}
            <PanelSection title="Position">
              {renderVec3Fields(node.position ?? [0, 0, 0], (next) => handleUpdate({ position: next }))}
            </PanelSection>
            <PanelSection title="Device">
              <SelectField
                label="Device Type"
                onChange={(value) => handleUpdate({ deviceType: value })}
                options={['outlet', 'switch', 'smoke-co', 'data', 'dedicated']}
                value={(node as any).deviceType ?? 'outlet'}
              />
              <MetricControl
                label="Mount Height"
                onChange={(value) => handleUpdate({ mountHeight: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.mountHeight ?? 0}
              />
              <MetricControl
                label="Voltage"
                onChange={(value) => handleUpdate({ voltage: value })}
                precision={0}
                step={1}
                unit="V"
                value={node.voltage ?? 0}
              />
              <TextField
                label="Wire Type"
                onChange={(value) => handleUpdate({ wireType: value })}
                placeholder="NM-B 12/2"
                value={node.wireType ?? ''}
              />
            </PanelSection>
          </>
        )

      case 'light-fixture':
        return (
          <>
            {identitySection}
            <PanelSection title="Position">
              {renderVec3Fields(node.position ?? [0, 0, 0], (next) => handleUpdate({ position: next }))}
            </PanelSection>
            <PanelSection title="Fixture">
              <SelectField
                label="Fixture Type"
                onChange={(value) => handleUpdate({ fixtureType: value })}
                options={['ceiling-light', 'fan', 'recessed', 'exterior-light']}
                value={(node as any).fixtureType ?? 'ceiling-light'}
              />
              <MetricControl
                label="Mount Height"
                onChange={(value) => handleUpdate({ mountHeight: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.mountHeight ?? 0}
              />
            </PanelSection>
          </>
        )

      case 'wire-run':
        return (
          <>
            {identitySection}
            {renderPathInfo(node)}
            <PanelSection title="Electrical Run">
              <TextField
                label="Wire Type"
                onChange={(value) => handleUpdate({ wireType: value })}
                placeholder="NM-B 12/2"
                value={node.wireType ?? ''}
              />
              <ToggleControl
                checked={Boolean((node as any).homerun)}
                label="Homerun"
                onChange={(value) => handleUpdate({ homerun: value })}
              />
              <SelectField
                label="Path Mode"
                onChange={(value) => handleUpdate({ pathMode: value })}
                options={['manual', 'assisted']}
                value={(node as any).pathMode ?? 'manual'}
              />
            </PanelSection>
          </>
        )

      case 'switch-leg':
        return (
          <>
            {identitySection}
            {renderPathInfo(node)}
            <PanelSection title="Electrical Run">
              <TextField
                label="Wire Type"
                onChange={(value) => handleUpdate({ wireType: value })}
                placeholder="NM-B 14/3"
                value={node.wireType ?? ''}
              />
            </PanelSection>
          </>
        )

      case 'plumbing-fixture':
        return (
          <>
            {identitySection}
            <PanelSection title="Position">
              {renderVec3Fields(node.position ?? [0, 0, 0], (next) => handleUpdate({ position: next }))}
            </PanelSection>
            <PanelSection title="Fixture">
              <SelectField
                label="Fixture Type"
                onChange={(value) => handleUpdate({ fixtureType: value })}
                options={['sink', 'toilet', 'shower', 'tub', 'lavatory', 'washer', 'water-heater']}
                value={(node as any).fixtureType ?? 'sink'}
              />
              <TextField
                label="Room Type"
                onChange={(value) => handleUpdate({ roomType: value })}
                placeholder="bathroom"
                value={(node as any).roomType ?? ''}
              />
              <TextField
                label="Pipe Material"
                onChange={(value) => handleUpdate({ pipeMaterial: value })}
                placeholder="PEX"
                value={node.pipeMaterial ?? ''}
              />
              <MetricControl
                label="Drain Diameter"
                onChange={(value) => handleUpdate({ drainDiameter: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.drainDiameter ?? 0}
              />
            </PanelSection>
          </>
        )

      case 'supply-run':
      case 'drain-run':
      case 'vent-run':
        return (
          <>
            {identitySection}
            {renderPathInfo(node)}
            <PanelSection title="Plumbing Run">
              {node.type === 'supply-run' && (
                <SelectField
                  label="System Kind"
                  onChange={(value) => handleUpdate({ systemKind: value })}
                  options={['hot', 'cold']}
                  value={(node as any).systemKind ?? 'cold'}
                />
              )}
              <TextField
                label="Pipe Material"
                onChange={(value) => handleUpdate({ pipeMaterial: value })}
                placeholder="PVC"
                value={node.pipeMaterial ?? ''}
              />
              <MetricControl
                label="Diameter"
                onChange={(value) => handleUpdate({ diameter: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={node.diameter ?? 0}
              />
              {node.type === 'drain-run' && (
                <MetricControl
                  label="Slope"
                  onChange={(value) => handleUpdate({ slope: value })}
                  precision={3}
                  step={0.001}
                  value={(node as any).slope ?? 0}
                />
              )}
            </PanelSection>
          </>
        )

      case 'foundation-system':
        return (
          <>
            {identitySection}
            <PanelSection title="Foundation">
              <SelectField
                label="Kind"
                onChange={(value) => handleUpdate({ foundationKind: value })}
                options={['slab-on-grade', 'crawlspace', 'basement']}
                value={(node as any).foundationKind ?? 'crawlspace'}
              />
              <MetricControl
                label="Footing Width"
                onChange={(value) => handleUpdate({ footingWidth: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={(node as any).footingWidth ?? 0}
              />
              <MetricControl
                label="Footing Depth"
                onChange={(value) => handleUpdate({ footingDepth: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={(node as any).footingDepth ?? 0}
              />
              <MetricControl
                label="Stem Wall"
                onChange={(value) => handleUpdate({ stemWallThickness: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={(node as any).stemWallThickness ?? 0}
              />
              <TextField
                label="Rebar Profile"
                onChange={(value) => handleUpdate({ rebarProfile: value })}
                placeholder={'#4 @ 16" o.c.'}
                value={(node as any).rebarProfile ?? ''}
              />
            </PanelSection>
          </>
        )

      case 'footing-run':
      case 'stem-wall':
        return (
          <>
            {identitySection}
            <PanelSection title="Geometry">
              {renderVec2Fields(node.start ?? [0, 0], (next) => handleUpdate({ start: next }))}
              {renderVec2Fields(node.end ?? [0, 0], (next) => handleUpdate({ end: next }))}
            </PanelSection>
            <PanelSection title="Foundation Segment">
              <MetricControl
                label="Width"
                onChange={(value) => handleUpdate({ width: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={(node as any).width ?? 0}
              />
              {node.type === 'stem-wall' ? (
                <MetricControl
                  label="Height"
                  onChange={(value) => handleUpdate({ height: value })}
                  precision={3}
                  step={LENGTH_STEP}
                  unit="m"
                  value={(node as any).height ?? 0}
                />
              ) : (
                <MetricControl
                  label="Depth"
                  onChange={(value) => handleUpdate({ depth: value })}
                  precision={3}
                  step={LENGTH_STEP}
                  unit="m"
                  value={(node as any).depth ?? 0}
                />
              )}
              <MetricControl
                label="Thickness"
                onChange={(value) => handleUpdate({ thickness: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={(node as any).thickness ?? 0}
              />
            </PanelSection>
          </>
        )

      case 'pier':
      case 'column':
        return (
          <>
            {identitySection}
            <PanelSection title="Center">
              {renderVec2Fields(node.center ?? [0, 0], (next) => handleUpdate({ center: next }))}
            </PanelSection>
            <PanelSection title="Support">
              <MetricControl
                label="Width"
                onChange={(value) => handleUpdate({ width: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={(node as any).width ?? 0}
              />
              <MetricControl
                label="Depth"
                onChange={(value) => handleUpdate({ depth: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={(node as any).depth ?? 0}
              />
              <MetricControl
                label="Height"
                onChange={(value) => handleUpdate({ height: value })}
                precision={3}
                step={LENGTH_STEP}
                unit="m"
                value={(node as any).height ?? 0}
              />
              {node.type === 'column' && (
                <TextField
                  label="Material"
                  onChange={(value) => handleUpdate({ materialCode: value })}
                  placeholder="lumber.spf.2x6"
                  value={(node as any).materialCode ?? ''}
                />
              )}
            </PanelSection>
          </>
        )

      default:
        return (
          <>
            {identitySection}
            <PanelSection title="Details">
              <div className="rounded-lg border border-border/50 bg-background/30 px-3 py-2 text-sm text-muted-foreground">
                This construction node type is recognized but does not yet expose a custom editor.
              </div>
            </PanelSection>
          </>
        )
    }
  })()

  return (
    <PanelWrapper onClose={handleClose} title={title} width={340}>
      {content}
    </PanelWrapper>
  )
}
