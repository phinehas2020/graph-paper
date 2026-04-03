import dedent from 'dedent'
import { z } from 'zod'
import { BaseNode, nodeType, objectId } from '../base'
import { CeilingNode } from './ceiling'
import {
  CircuitNode,
  DeviceBoxNode,
  ElectricalPanelNode,
  LightFixtureNode,
  SwitchLegNode,
  WireRunNode,
} from './electrical'
import {
  BeamLineNode,
  BlockingRunNode,
  FloorOpeningNode,
  FloorSystemNode,
  SupportPostNode,
} from './floor-system'
import {
  ColumnNode,
  FootingRunNode,
  FoundationSystemNode,
  PierNode,
  StemWallNode,
} from './foundation'
import { GuideNode } from './guide'
import { ItemNode } from './item'
import { DrainRunNode, PlumbingFixtureNode, SupplyRunNode, VentRunNode } from './plumbing'
import { RoofNode } from './roof'
import { RafterSetNode, RoofPlaneNode, TrussArrayNode } from './roof-plane'
import { ScanNode } from './scan'
import { SlabNode } from './slab'
import { WallNode } from './wall'
import { ZoneNode } from './zone'

export const LevelNode = BaseNode.extend({
  id: objectId('level'),
  type: nodeType('level'),
  children: z
    .array(
      z.union([
        WallNode.shape.id,
        ZoneNode.shape.id,
        SlabNode.shape.id,
        CeilingNode.shape.id,
        RoofNode.shape.id,
        ScanNode.shape.id,
        GuideNode.shape.id,
        ItemNode.shape.id,
        FloorSystemNode.shape.id,
        BeamLineNode.shape.id,
        SupportPostNode.shape.id,
        FloorOpeningNode.shape.id,
        BlockingRunNode.shape.id,
        RoofPlaneNode.shape.id,
        TrussArrayNode.shape.id,
        RafterSetNode.shape.id,
        ElectricalPanelNode.shape.id,
        CircuitNode.shape.id,
        DeviceBoxNode.shape.id,
        LightFixtureNode.shape.id,
        WireRunNode.shape.id,
        SwitchLegNode.shape.id,
        PlumbingFixtureNode.shape.id,
        SupplyRunNode.shape.id,
        DrainRunNode.shape.id,
        VentRunNode.shape.id,
        FoundationSystemNode.shape.id,
        FootingRunNode.shape.id,
        StemWallNode.shape.id,
        PierNode.shape.id,
        ColumnNode.shape.id,
      ]),
    )
    .default([]),
  // Specific props
  level: z.number().default(0),
  defaultWallAssemblyId: z.string().optional(),
}).describe(
  dedent`
  Level node - used to represent a level in the building
  - children: array of floor, wall, ceiling, roof, item nodes
  - level: level number
  - defaultWallAssemblyId: optional wall assembly default for authored walls on this level
  `,
)

export type LevelNode = z.infer<typeof LevelNode>
