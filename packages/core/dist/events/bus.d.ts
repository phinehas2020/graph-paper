import type { ThreeEvent } from '@react-three/fiber';
import type { BeamLineNode, BuildingNode, BlockingRunNode, CircuitNode, CeilingNode, ColumnNode, DeviceBoxNode, DrainRunNode, DoorNode, ElectricalPanelNode, FloorOpeningNode, FloorSystemNode, FootingRunNode, FoundationSystemNode, ItemNode, LevelNode, LightFixtureNode, PierNode, PlumbingFixtureNode, RafterSetNode, RoofPlaneNode, RoofNode, RoofSegmentNode, SiteNode, SlabNode, StemWallNode, SupportPostNode, SupplyRunNode, SwitchLegNode, TrussArrayNode, VentRunNode, WallNode, WireRunNode, WindowNode, ZoneNode } from '../schema';
import type { AnyNode } from '../schema/types';
export interface GridEvent {
    position: [number, number, number];
    nativeEvent: ThreeEvent<PointerEvent>;
}
export interface NodeEvent<T extends AnyNode = AnyNode> {
    node: T;
    position: [number, number, number];
    localPosition: [number, number, number];
    normal?: [number, number, number];
    stopPropagation: () => void;
    nativeEvent: ThreeEvent<PointerEvent>;
}
export type WallEvent = NodeEvent<WallNode>;
export type ItemEvent = NodeEvent<ItemNode>;
export type SiteEvent = NodeEvent<SiteNode>;
export type BuildingEvent = NodeEvent<BuildingNode>;
export type LevelEvent = NodeEvent<LevelNode>;
export type ZoneEvent = NodeEvent<ZoneNode>;
export type SlabEvent = NodeEvent<SlabNode>;
export type CeilingEvent = NodeEvent<CeilingNode>;
export type RoofEvent = NodeEvent<RoofNode>;
export type RoofPlaneEvent = NodeEvent<RoofPlaneNode>;
export type RoofSegmentEvent = NodeEvent<RoofSegmentNode>;
export type TrussArrayEvent = NodeEvent<TrussArrayNode>;
export type RafterSetEvent = NodeEvent<RafterSetNode>;
export type WindowEvent = NodeEvent<WindowNode>;
export type DoorEvent = NodeEvent<DoorNode>;
export type FloorSystemEvent = NodeEvent<FloorSystemNode>;
export type FloorOpeningEvent = NodeEvent<FloorOpeningNode>;
export type BlockingRunEvent = NodeEvent<BlockingRunNode>;
export type BeamLineEvent = NodeEvent<BeamLineNode>;
export type SupportPostEvent = NodeEvent<SupportPostNode>;
export type ElectricalPanelEvent = NodeEvent<ElectricalPanelNode>;
export type CircuitEvent = NodeEvent<CircuitNode>;
export type DeviceBoxEvent = NodeEvent<DeviceBoxNode>;
export type LightFixtureEvent = NodeEvent<LightFixtureNode>;
export type WireRunEvent = NodeEvent<WireRunNode>;
export type SwitchLegEvent = NodeEvent<SwitchLegNode>;
export type PlumbingFixtureEvent = NodeEvent<PlumbingFixtureNode>;
export type SupplyRunEvent = NodeEvent<SupplyRunNode>;
export type DrainRunEvent = NodeEvent<DrainRunNode>;
export type VentRunEvent = NodeEvent<VentRunNode>;
export type FoundationSystemEvent = NodeEvent<FoundationSystemNode>;
export type FootingRunEvent = NodeEvent<FootingRunNode>;
export type StemWallEvent = NodeEvent<StemWallNode>;
export type PierEvent = NodeEvent<PierNode>;
export type ColumnEvent = NodeEvent<ColumnNode>;
export declare const eventSuffixes: readonly ["click", "move", "enter", "leave", "pointerdown", "pointerup", "context-menu", "double-click"];
export type EventSuffix = (typeof eventSuffixes)[number];
type NodeEvents<T extends string, E> = {
    [K in `${T}:${EventSuffix}`]: E;
};
type GridEvents = {
    [K in `grid:${EventSuffix}`]: GridEvent;
};
export interface CameraControlEvent {
    nodeId: AnyNode['id'];
}
export interface ThumbnailGenerateEvent {
    projectId: string;
}
type CameraControlEvents = {
    'camera-controls:view': CameraControlEvent;
    'camera-controls:capture': CameraControlEvent;
    'camera-controls:top-view': undefined;
    'camera-controls:orbit-cw': undefined;
    'camera-controls:orbit-ccw': undefined;
    'camera-controls:generate-thumbnail': ThumbnailGenerateEvent;
};
type ToolEvents = {
    'tool:cancel': undefined;
};
type PresetEvents = {
    'preset:generate-thumbnail': {
        presetId: string;
        nodeId: string;
    };
    'preset:thumbnail-updated': {
        presetId: string;
        thumbnailUrl: string;
    };
};
type EditorEvents = GridEvents & NodeEvents<'wall', WallEvent> & NodeEvents<'item', ItemEvent> & NodeEvents<'site', SiteEvent> & NodeEvents<'building', BuildingEvent> & NodeEvents<'level', LevelEvent> & NodeEvents<'zone', ZoneEvent> & NodeEvents<'slab', SlabEvent> & NodeEvents<'ceiling', CeilingEvent> & NodeEvents<'roof', RoofEvent> & NodeEvents<'roof-plane', RoofPlaneEvent> & NodeEvents<'roof-segment', RoofSegmentEvent> & NodeEvents<'truss-array', TrussArrayEvent> & NodeEvents<'rafter-set', RafterSetEvent> & NodeEvents<'window', WindowEvent> & NodeEvents<'door', DoorEvent> & NodeEvents<'floor-system', FloorSystemEvent> & NodeEvents<'floor-opening', FloorOpeningEvent> & NodeEvents<'blocking-run', BlockingRunEvent> & NodeEvents<'beam-line', BeamLineEvent> & NodeEvents<'support-post', SupportPostEvent> & NodeEvents<'electrical-panel', ElectricalPanelEvent> & NodeEvents<'circuit', CircuitEvent> & NodeEvents<'device-box', DeviceBoxEvent> & NodeEvents<'light-fixture', LightFixtureEvent> & NodeEvents<'wire-run', WireRunEvent> & NodeEvents<'switch-leg', SwitchLegEvent> & NodeEvents<'plumbing-fixture', PlumbingFixtureEvent> & NodeEvents<'supply-run', SupplyRunEvent> & NodeEvents<'drain-run', DrainRunEvent> & NodeEvents<'vent-run', VentRunEvent> & NodeEvents<'foundation-system', FoundationSystemEvent> & NodeEvents<'footing-run', FootingRunEvent> & NodeEvents<'stem-wall', StemWallEvent> & NodeEvents<'pier', PierEvent> & NodeEvents<'column', ColumnEvent> & CameraControlEvents & ToolEvents & PresetEvents;
export declare const emitter: import("mitt").Emitter<EditorEvents>;
export {};
//# sourceMappingURL=bus.d.ts.map