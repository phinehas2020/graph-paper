import { type BeamLineEvent, type BeamLineNode, type BuildingEvent, type BuildingNode, type BlockingRunEvent, type BlockingRunNode, type CircuitEvent, type CircuitNode, type CeilingEvent, type CeilingNode, type ColumnEvent, type ColumnNode, type DeviceBoxEvent, type DeviceBoxNode, type DrainRunEvent, type DrainRunNode, type DoorEvent, type DoorNode, type ElectricalPanelEvent, type ElectricalPanelNode, type FloorOpeningEvent, type FloorOpeningNode, type FloorSystemEvent, type FloorSystemNode, type FootingRunEvent, type FootingRunNode, type FoundationSystemEvent, type FoundationSystemNode, type ItemEvent, type ItemNode, type LevelEvent, type LevelNode, type LightFixtureEvent, type LightFixtureNode, type PierEvent, type PierNode, type PlumbingFixtureEvent, type PlumbingFixtureNode, type RafterSetEvent, type RafterSetNode, type RoofPlaneEvent, type RoofPlaneNode, type RoofEvent, type RoofNode, type RoofSegmentEvent, type RoofSegmentNode, type SiteEvent, type SiteNode, type SlabEvent, type SlabNode, type StemWallEvent, type StemWallNode, type SupportPostEvent, type SupportPostNode, type SupplyRunEvent, type SupplyRunNode, type SwitchLegEvent, type SwitchLegNode, type TrussArrayEvent, type TrussArrayNode, type VentRunEvent, type VentRunNode, type WallEvent, type WallNode, type WireRunEvent, type WireRunNode, type WindowEvent, type WindowNode, type ZoneEvent, type ZoneNode } from '@pascal-app/core';
import type { ThreeEvent } from '@react-three/fiber';
type NodeConfig = {
    site: {
        node: SiteNode;
        event: SiteEvent;
    };
    item: {
        node: ItemNode;
        event: ItemEvent;
    };
    wall: {
        node: WallNode;
        event: WallEvent;
    };
    building: {
        node: BuildingNode;
        event: BuildingEvent;
    };
    level: {
        node: LevelNode;
        event: LevelEvent;
    };
    zone: {
        node: ZoneNode;
        event: ZoneEvent;
    };
    slab: {
        node: SlabNode;
        event: SlabEvent;
    };
    ceiling: {
        node: CeilingNode;
        event: CeilingEvent;
    };
    roof: {
        node: RoofNode;
        event: RoofEvent;
    };
    'roof-plane': {
        node: RoofPlaneNode;
        event: RoofPlaneEvent;
    };
    'roof-segment': {
        node: RoofSegmentNode;
        event: RoofSegmentEvent;
    };
    'truss-array': {
        node: TrussArrayNode;
        event: TrussArrayEvent;
    };
    'rafter-set': {
        node: RafterSetNode;
        event: RafterSetEvent;
    };
    window: {
        node: WindowNode;
        event: WindowEvent;
    };
    door: {
        node: DoorNode;
        event: DoorEvent;
    };
    'floor-system': {
        node: FloorSystemNode;
        event: FloorSystemEvent;
    };
    'floor-opening': {
        node: FloorOpeningNode;
        event: FloorOpeningEvent;
    };
    'blocking-run': {
        node: BlockingRunNode;
        event: BlockingRunEvent;
    };
    'beam-line': {
        node: BeamLineNode;
        event: BeamLineEvent;
    };
    'support-post': {
        node: SupportPostNode;
        event: SupportPostEvent;
    };
    'electrical-panel': {
        node: ElectricalPanelNode;
        event: ElectricalPanelEvent;
    };
    circuit: {
        node: CircuitNode;
        event: CircuitEvent;
    };
    'device-box': {
        node: DeviceBoxNode;
        event: DeviceBoxEvent;
    };
    'light-fixture': {
        node: LightFixtureNode;
        event: LightFixtureEvent;
    };
    'wire-run': {
        node: WireRunNode;
        event: WireRunEvent;
    };
    'switch-leg': {
        node: SwitchLegNode;
        event: SwitchLegEvent;
    };
    'plumbing-fixture': {
        node: PlumbingFixtureNode;
        event: PlumbingFixtureEvent;
    };
    'supply-run': {
        node: SupplyRunNode;
        event: SupplyRunEvent;
    };
    'drain-run': {
        node: DrainRunNode;
        event: DrainRunEvent;
    };
    'vent-run': {
        node: VentRunNode;
        event: VentRunEvent;
    };
    'foundation-system': {
        node: FoundationSystemNode;
        event: FoundationSystemEvent;
    };
    'footing-run': {
        node: FootingRunNode;
        event: FootingRunEvent;
    };
    'stem-wall': {
        node: StemWallNode;
        event: StemWallEvent;
    };
    pier: {
        node: PierNode;
        event: PierEvent;
    };
    column: {
        node: ColumnNode;
        event: ColumnEvent;
    };
};
type NodeType = keyof NodeConfig;
export declare function useNodeEvents<T extends NodeType>(node: NodeConfig[T]['node'], type: T): {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
    onPointerUp: (e: ThreeEvent<PointerEvent>) => void;
    onClick: (e: ThreeEvent<PointerEvent>) => void;
    onPointerEnter: (e: ThreeEvent<PointerEvent>) => void;
    onPointerLeave: (e: ThreeEvent<PointerEvent>) => void;
    onPointerMove: (e: ThreeEvent<PointerEvent>) => void;
    onDoubleClick: (e: ThreeEvent<PointerEvent>) => void;
    onContextMenu: (e: ThreeEvent<PointerEvent>) => void;
};
export {};
//# sourceMappingURL=use-node-events.d.ts.map