import z from 'zod';
import { BuildingNode } from './nodes/building';
import { CeilingNode } from './nodes/ceiling';
import { DoorNode } from './nodes/door';
import { CircuitNode, DeviceBoxNode, ElectricalPanelNode, LightFixtureNode, SwitchLegNode, WireRunNode, } from './nodes/electrical';
import { BeamLineNode, BlockingRunNode, FloorOpeningNode, FloorSystemNode, SupportPostNode, } from './nodes/floor-system';
import { ColumnNode, FootingRunNode, FoundationSystemNode, PierNode, StemWallNode, } from './nodes/foundation';
import { GuideNode } from './nodes/guide';
import { ItemNode } from './nodes/item';
import { LevelNode } from './nodes/level';
import { DrainRunNode, PlumbingFixtureNode, SupplyRunNode, VentRunNode } from './nodes/plumbing';
import { RoofNode } from './nodes/roof';
import { RafterSetNode, RoofPlaneNode, TrussArrayNode } from './nodes/roof-plane';
import { RoofSegmentNode } from './nodes/roof-segment';
import { ScanNode } from './nodes/scan';
import { SiteNode } from './nodes/site';
import { SlabNode } from './nodes/slab';
import { WallNode } from './nodes/wall';
import { WindowNode } from './nodes/window';
import { ZoneNode } from './nodes/zone';
export const AnyNode = z.discriminatedUnion('type', [
    SiteNode,
    BuildingNode,
    LevelNode,
    WallNode,
    ItemNode,
    ZoneNode,
    SlabNode,
    CeilingNode,
    RoofNode,
    RoofSegmentNode,
    ScanNode,
    GuideNode,
    WindowNode,
    DoorNode,
    FloorSystemNode,
    BeamLineNode,
    SupportPostNode,
    FloorOpeningNode,
    BlockingRunNode,
    RoofPlaneNode,
    TrussArrayNode,
    RafterSetNode,
    ElectricalPanelNode,
    CircuitNode,
    DeviceBoxNode,
    LightFixtureNode,
    WireRunNode,
    SwitchLegNode,
    PlumbingFixtureNode,
    SupplyRunNode,
    DrainRunNode,
    VentRunNode,
    FoundationSystemNode,
    FootingRunNode,
    StemWallNode,
    PierNode,
    ColumnNode,
]);
