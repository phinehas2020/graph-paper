'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useScene } from '@pascal-app/core';
import { BeamLineRenderer, BlockingRunRenderer, ColumnRenderer, DeviceBoxRenderer, DrainRunRenderer, ElectricalPanelRenderer, FloorOpeningRenderer, FloorSystemRenderer, FootingRunRenderer, FoundationSystemRenderer, LightFixtureRenderer, PierRenderer, PlumbingFixtureRenderer, RafterSetRenderer, RoofPlaneRenderer, StemWallRenderer, SupplyRunRenderer, SupportPostRenderer, SwitchLegRenderer, TrussArrayRenderer, VentRunRenderer, WireRunRenderer, } from './construction/construction-renderers';
import { BuildingRenderer } from './building/building-renderer';
import { CeilingRenderer } from './ceiling/ceiling-renderer';
import { DoorRenderer } from './door/door-renderer';
import { GuideRenderer } from './guide/guide-renderer';
import { ItemRenderer } from './item/item-renderer';
import { LevelRenderer } from './level/level-renderer';
import { RoofRenderer } from './roof/roof-renderer';
import { RoofSegmentRenderer } from './roof-segment/roof-segment-renderer';
import { ScanRenderer } from './scan/scan-renderer';
import { SiteRenderer } from './site/site-renderer';
import { SlabRenderer } from './slab/slab-renderer';
import { WallRenderer } from './wall/wall-renderer';
import { WindowRenderer } from './window/window-renderer';
import { ZoneRenderer } from './zone/zone-renderer';
export const NodeRenderer = ({ nodeId }) => {
    const node = useScene((state) => state.nodes[nodeId]);
    if (!node)
        return null;
    return (_jsxs(_Fragment, { children: [node.type === 'site' && _jsx(SiteRenderer, { node: node }), node.type === 'building' && _jsx(BuildingRenderer, { node: node }), node.type === 'ceiling' && _jsx(CeilingRenderer, { node: node }), node.type === 'level' && _jsx(LevelRenderer, { node: node }), node.type === 'item' && _jsx(ItemRenderer, { node: node }), node.type === 'slab' && _jsx(SlabRenderer, { node: node }), node.type === 'wall' && _jsx(WallRenderer, { node: node }), node.type === 'door' && _jsx(DoorRenderer, { node: node }), node.type === 'window' && _jsx(WindowRenderer, { node: node }), node.type === 'zone' && _jsx(ZoneRenderer, { node: node }), node.type === 'roof' && _jsx(RoofRenderer, { node: node }), node.type === 'roof-plane' && _jsx(RoofPlaneRenderer, { node: node }), node.type === 'roof-segment' && _jsx(RoofSegmentRenderer, { node: node }), node.type === 'truss-array' && _jsx(TrussArrayRenderer, { node: node }), node.type === 'rafter-set' && _jsx(RafterSetRenderer, { node: node }), node.type === 'scan' && _jsx(ScanRenderer, { node: node }), node.type === 'guide' && _jsx(GuideRenderer, { node: node }), node.type === 'floor-system' && _jsx(FloorSystemRenderer, { node: node }), node.type === 'floor-opening' && _jsx(FloorOpeningRenderer, { node: node }), node.type === 'blocking-run' && _jsx(BlockingRunRenderer, { node: node }), node.type === 'beam-line' && _jsx(BeamLineRenderer, { node: node }), node.type === 'support-post' && _jsx(SupportPostRenderer, { node: node }), node.type === 'electrical-panel' && _jsx(ElectricalPanelRenderer, { node: node }), node.type === 'device-box' && _jsx(DeviceBoxRenderer, { node: node }), node.type === 'light-fixture' && _jsx(LightFixtureRenderer, { node: node }), node.type === 'wire-run' && _jsx(WireRunRenderer, { node: node }), node.type === 'switch-leg' && _jsx(SwitchLegRenderer, { node: node }), node.type === 'plumbing-fixture' && _jsx(PlumbingFixtureRenderer, { node: node }), node.type === 'supply-run' && _jsx(SupplyRunRenderer, { node: node }), node.type === 'drain-run' && _jsx(DrainRunRenderer, { node: node }), node.type === 'vent-run' && _jsx(VentRunRenderer, { node: node }), node.type === 'foundation-system' && _jsx(FoundationSystemRenderer, { node: node }), node.type === 'footing-run' && _jsx(FootingRunRenderer, { node: node }), node.type === 'stem-wall' && _jsx(StemWallRenderer, { node: node }), node.type === 'pier' && _jsx(PierRenderer, { node: node }), node.type === 'column' && _jsx(ColumnRenderer, { node: node })] }));
};
