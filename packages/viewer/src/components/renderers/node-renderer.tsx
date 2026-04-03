'use client'

import { type AnyNode, useScene } from '@pascal-app/core'
import {
  BeamLineRenderer,
  BlockingRunRenderer,
  ColumnRenderer,
  DeviceBoxRenderer,
  DrainRunRenderer,
  ElectricalPanelRenderer,
  FloorOpeningRenderer,
  FloorSystemRenderer,
  FootingRunRenderer,
  FoundationSystemRenderer,
  LightFixtureRenderer,
  PierRenderer,
  PlumbingFixtureRenderer,
  RafterSetRenderer,
  RoofPlaneRenderer,
  StemWallRenderer,
  SupplyRunRenderer,
  SupportPostRenderer,
  SwitchLegRenderer,
  TrussArrayRenderer,
  VentRunRenderer,
  WireRunRenderer,
} from './construction/construction-renderers'
import { BuildingRenderer } from './building/building-renderer'
import { CeilingRenderer } from './ceiling/ceiling-renderer'
import { DoorRenderer } from './door/door-renderer'
import { GuideRenderer } from './guide/guide-renderer'
import { ItemRenderer } from './item/item-renderer'
import { LevelRenderer } from './level/level-renderer'
import { RoofRenderer } from './roof/roof-renderer'
import { RoofSegmentRenderer } from './roof-segment/roof-segment-renderer'
import { ScanRenderer } from './scan/scan-renderer'
import { SiteRenderer } from './site/site-renderer'
import { SlabRenderer } from './slab/slab-renderer'
import { WallRenderer } from './wall/wall-renderer'
import { WindowRenderer } from './window/window-renderer'
import { ZoneRenderer } from './zone/zone-renderer'

export const NodeRenderer = ({ nodeId }: { nodeId: AnyNode['id'] }) => {
  const node = useScene((state) => state.nodes[nodeId])

  if (!node) return null

  return (
    <>
      {node.type === 'site' && <SiteRenderer node={node} />}
      {node.type === 'building' && <BuildingRenderer node={node} />}
      {node.type === 'ceiling' && <CeilingRenderer node={node} />}
      {node.type === 'level' && <LevelRenderer node={node} />}
      {node.type === 'item' && <ItemRenderer node={node} />}
      {node.type === 'slab' && <SlabRenderer node={node} />}
      {node.type === 'wall' && <WallRenderer node={node} />}
      {node.type === 'door' && <DoorRenderer node={node} />}
      {node.type === 'window' && <WindowRenderer node={node} />}
      {node.type === 'zone' && <ZoneRenderer node={node} />}
      {node.type === 'roof' && <RoofRenderer node={node} />}
      {node.type === 'roof-plane' && <RoofPlaneRenderer node={node} />}
      {node.type === 'roof-segment' && <RoofSegmentRenderer node={node} />}
      {node.type === 'truss-array' && <TrussArrayRenderer node={node} />}
      {node.type === 'rafter-set' && <RafterSetRenderer node={node} />}
      {node.type === 'scan' && <ScanRenderer node={node} />}
      {node.type === 'guide' && <GuideRenderer node={node} />}
      {node.type === 'floor-system' && <FloorSystemRenderer node={node} />}
      {node.type === 'floor-opening' && <FloorOpeningRenderer node={node} />}
      {node.type === 'blocking-run' && <BlockingRunRenderer node={node} />}
      {node.type === 'beam-line' && <BeamLineRenderer node={node} />}
      {node.type === 'support-post' && <SupportPostRenderer node={node} />}
      {node.type === 'electrical-panel' && <ElectricalPanelRenderer node={node} />}
      {node.type === 'device-box' && <DeviceBoxRenderer node={node} />}
      {node.type === 'light-fixture' && <LightFixtureRenderer node={node} />}
      {node.type === 'wire-run' && <WireRunRenderer node={node} />}
      {node.type === 'switch-leg' && <SwitchLegRenderer node={node} />}
      {node.type === 'plumbing-fixture' && <PlumbingFixtureRenderer node={node} />}
      {node.type === 'supply-run' && <SupplyRunRenderer node={node} />}
      {node.type === 'drain-run' && <DrainRunRenderer node={node} />}
      {node.type === 'vent-run' && <VentRunRenderer node={node} />}
      {node.type === 'foundation-system' && <FoundationSystemRenderer node={node} />}
      {node.type === 'footing-run' && <FootingRunRenderer node={node} />}
      {node.type === 'stem-wall' && <StemWallRenderer node={node} />}
      {node.type === 'pier' && <PierRenderer node={node} />}
      {node.type === 'column' && <ColumnRenderer node={node} />}
    </>
  )
}
