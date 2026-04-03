'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRegistry } from '@pascal-app/core';
import { useMemo, useRef } from 'react';
import { BoxGeometry, BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Shape } from 'three';
import { useNodeEvents } from '../../../hooks/use-node-events';
import { NodeRenderer } from '../node-renderer';
function createPlanExtrusionGeometry(polygon, depth) {
    if (polygon.length < 3) {
        return new BoxGeometry(0, 0, 0);
    }
    const shape = new Shape();
    const [firstX, firstZ] = polygon[0];
    shape.moveTo(firstX, -firstZ);
    for (const [x, z] of polygon.slice(1)) {
        shape.lineTo(x, -z);
    }
    shape.closePath();
    const geometry = new ExtrudeGeometry(shape, {
        depth: Math.max(depth, 0.01),
        bevelEnabled: false,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();
    return geometry;
}
function SegmentMesh({ color, depth, end, height, start, }) {
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const length = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx);
    return (_jsxs("mesh", { castShadow: true, position: [(start[0] + end[0]) / 2, 0, (start[1] + end[1]) / 2], receiveShadow: true, "rotation-y": angle, children: [_jsx("boxGeometry", { args: [Math.max(length, 0.01), Math.max(height, 0.01), Math.max(depth, 0.01)] }), _jsx("meshStandardMaterial", { color: color })] }));
}
function PathSegments({ color, depth, path, yOffset = 0, }) {
    if (path.length < 2) {
        return null;
    }
    return (_jsx("group", { children: path.slice(0, -1).map((point, index) => {
            const next = path[index + 1];
            if (!next)
                return null;
            const dx = next[0] - point[0];
            const dy = next[1] - point[1];
            const dz = next[2] - point[2];
            const length = Math.hypot(dx, dy, dz);
            const angle = Math.atan2(dz, dx);
            return (_jsxs("mesh", { castShadow: true, position: [(point[0] + next[0]) / 2, (point[1] + next[1]) / 2 + yOffset, (point[2] + next[2]) / 2], receiveShadow: true, "rotation-y": angle, children: [_jsx("boxGeometry", { args: [Math.max(length, 0.01), Math.max(depth, 0.01), Math.max(depth, 0.01)] }), _jsx("meshStandardMaterial", { color: color })] }, `${point.join(':')}:${next.join(':')}`));
        }) }));
}
function OutlinePath({ color, path, }) {
    const geometry = useMemo(() => {
        const nextGeometry = new BufferGeometry();
        const positions = path.flatMap(([x, y, z]) => [x, y, z]);
        nextGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
        return nextGeometry;
    }, [path]);
    return (_jsxs("line", { children: [_jsx("primitive", { attach: "geometry", object: geometry }), _jsx("lineBasicMaterial", { color: color, linewidth: 2 })] }));
}
export const FloorSystemRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'floor-system');
    const geometry = useMemo(() => createPlanExtrusionGeometry(node.polygon, node.memberDepth), [node.memberDepth, node.polygon]);
    useRegistry(node.id, 'floor-system', ref);
    return (_jsxs("mesh", { castShadow: true, geometry: geometry, position: [0, -node.elevation, 0], receiveShadow: true, ref: ref, visible: node.visible, ...handlers, children: [_jsx("meshStandardMaterial", { color: node.color ?? '#d4b483', opacity: 0.72, transparent: true }), node.children.map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, childId)))] }));
};
export const FloorOpeningRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'floor-opening');
    const geometry = useMemo(() => createPlanExtrusionGeometry(node.polygon, 0.02), [node.polygon]);
    useRegistry(node.id, 'floor-opening', ref);
    return (_jsx("mesh", { geometry: geometry, position: [0, 0.005, 0], ref: ref, visible: node.visible, ...handlers, children: _jsx("meshStandardMaterial", { color: node.color ?? '#ef4444', opacity: 0.45, transparent: true }) }));
};
export const BlockingRunRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'blocking-run');
    useRegistry(node.id, 'blocking-run', ref);
    return (_jsx("group", { ref: ref, visible: node.visible, ...handlers, children: _jsx(SegmentMesh, { color: node.color ?? '#f59e0b', depth: 0.05, end: node.end, height: 0.05, start: node.start }) }));
};
export const BeamLineRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'beam-line');
    useRegistry(node.id, 'beam-line', ref);
    return (_jsx("group", { position: [0, -node.depth / 2, 0], ref: ref, visible: node.visible, ...handlers, children: _jsx(SegmentMesh, { color: node.color ?? '#8b5e34', depth: node.width, end: node.end, height: node.depth, start: node.start }) }));
};
export const SupportPostRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'support-post');
    useRegistry(node.id, 'support-post', ref);
    return (_jsxs("mesh", { castShadow: true, position: [node.center[0], -node.height / 2, node.center[1]], receiveShadow: true, ref: ref, visible: node.visible, ...handlers, children: [_jsx("boxGeometry", { args: [node.width, node.height, node.depth] }), _jsx("meshStandardMaterial", { color: node.color ?? '#6b7280' })] }));
};
export const RoofPlaneRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'roof-plane');
    const geometry = useMemo(() => createPlanExtrusionGeometry(node.polygon, node.sheathingThickness + node.roofingThickness), [node.polygon, node.roofingThickness, node.sheathingThickness]);
    useRegistry(node.id, 'roof-plane', ref);
    return (_jsxs("mesh", { castShadow: true, geometry: geometry, position: [0, node.plateHeight, 0], receiveShadow: true, ref: ref, visible: node.visible, ...handlers, children: [_jsx("meshStandardMaterial", { color: node.color ?? '#c2410c', opacity: 0.58, transparent: true }), node.children.map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, childId)))] }));
};
export const TrussArrayRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'truss-array');
    useRegistry(node.id, 'truss-array', ref);
    return (_jsx("group", { position: [0, node.heelHeight, 0], ref: ref, visible: node.visible, ...handlers, children: _jsx(SegmentMesh, { color: node.color ?? '#dc2626', depth: 0.06, end: node.end, height: 0.12, start: node.start }) }));
};
export const RafterSetRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'rafter-set');
    useRegistry(node.id, 'rafter-set', ref);
    return (_jsx("group", { position: [0, 0.05, 0], ref: ref, visible: node.visible, ...handlers, children: _jsx(SegmentMesh, { color: node.color ?? '#7c3aed', depth: 0.05, end: node.end, height: 0.1, start: node.start }) }));
};
export const ElectricalPanelRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'electrical-panel');
    useRegistry(node.id, 'electrical-panel', ref);
    return (_jsxs("group", { position: node.position, ref: ref, visible: node.visible, ...handlers, children: [_jsxs("mesh", { castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [0.4, 0.8, 0.12] }), _jsx("meshStandardMaterial", { color: node.color ?? '#334155' })] }), node.children.map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, childId)))] }));
};
export const DeviceBoxRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'device-box');
    useRegistry(node.id, 'device-box', ref);
    return (_jsxs("mesh", { castShadow: true, position: node.position, receiveShadow: true, ref: ref, visible: node.visible, ...handlers, children: [_jsx("boxGeometry", { args: [0.14, 0.14, 0.06] }), _jsx("meshStandardMaterial", { color: node.color ?? '#0f766e' })] }));
};
export const LightFixtureRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'light-fixture');
    useRegistry(node.id, 'light-fixture', ref);
    return (_jsxs("mesh", { castShadow: true, position: node.position, receiveShadow: true, ref: ref, visible: node.visible, ...handlers, children: [_jsx("cylinderGeometry", { args: [0.14, 0.18, 0.08, 24] }), _jsx("meshStandardMaterial", { color: node.color ?? '#facc15' })] }));
};
export const WireRunRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'wire-run');
    useRegistry(node.id, 'wire-run', ref);
    return (_jsxs("group", { ref: ref, visible: node.visible, ...handlers, children: [_jsx(PathSegments, { color: node.color ?? '#38bdf8', depth: 0.03, path: node.path }), _jsx(OutlinePath, { color: node.color ?? '#38bdf8', path: node.path })] }));
};
export const SwitchLegRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'switch-leg');
    useRegistry(node.id, 'switch-leg', ref);
    return (_jsxs("group", { ref: ref, visible: node.visible, ...handlers, children: [_jsx(PathSegments, { color: node.color ?? '#f97316', depth: 0.03, path: node.path }), _jsx(OutlinePath, { color: node.color ?? '#f97316', path: node.path })] }));
};
export const PlumbingFixtureRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'plumbing-fixture');
    useRegistry(node.id, 'plumbing-fixture', ref);
    return (_jsxs("mesh", { castShadow: true, position: node.position, receiveShadow: true, ref: ref, visible: node.visible, ...handlers, children: [_jsx("boxGeometry", { args: [0.4, 0.25, 0.4] }), _jsx("meshStandardMaterial", { color: node.color ?? '#60a5fa' })] }));
};
export const SupplyRunRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'supply-run');
    useRegistry(node.id, 'supply-run', ref);
    return (_jsxs("group", { ref: ref, visible: node.visible, ...handlers, children: [_jsx(PathSegments, { color: node.systemKind === 'hot' ? '#ef4444' : '#3b82f6', depth: 0.035, path: node.path }), _jsx(OutlinePath, { color: node.systemKind === 'hot' ? '#ef4444' : '#3b82f6', path: node.path })] }));
};
export const DrainRunRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'drain-run');
    useRegistry(node.id, 'drain-run', ref);
    return (_jsxs("group", { ref: ref, visible: node.visible, ...handlers, children: [_jsx(PathSegments, { color: node.color ?? '#f97316', depth: 0.05, path: node.path }), _jsx(OutlinePath, { color: node.color ?? '#f97316', path: node.path })] }));
};
export const VentRunRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'vent-run');
    useRegistry(node.id, 'vent-run', ref);
    return (_jsxs("group", { ref: ref, visible: node.visible, ...handlers, children: [_jsx(PathSegments, { color: node.color ?? '#94a3b8', depth: 0.04, path: node.path }), _jsx(OutlinePath, { color: node.color ?? '#94a3b8', path: node.path })] }));
};
export const FoundationSystemRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'foundation-system');
    useRegistry(node.id, 'foundation-system', ref);
    return (_jsx("group", { ref: ref, visible: node.visible, ...handlers, children: node.children.map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, childId))) }));
};
export const FootingRunRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'footing-run');
    useRegistry(node.id, 'footing-run', ref);
    return (_jsx("group", { position: [0, -node.depth / 2, 0], ref: ref, visible: node.visible, ...handlers, children: _jsx(SegmentMesh, { color: node.color ?? '#7c2d12', depth: node.width, end: node.end, height: node.thickness, start: node.start }) }));
};
export const StemWallRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'stem-wall');
    useRegistry(node.id, 'stem-wall', ref);
    return (_jsx("group", { position: [0, node.height / 2, 0], ref: ref, visible: node.visible, ...handlers, children: _jsx(SegmentMesh, { color: node.color ?? '#78716c', depth: node.thickness, end: node.end, height: node.height, start: node.start }) }));
};
export const PierRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'pier');
    useRegistry(node.id, 'pier', ref);
    return (_jsxs("mesh", { castShadow: true, position: [node.center[0], node.height / 2, node.center[1]], receiveShadow: true, ref: ref, visible: node.visible, ...handlers, children: [_jsx("boxGeometry", { args: [node.width, node.height, node.depth] }), _jsx("meshStandardMaterial", { color: node.color ?? '#92400e' })] }));
};
export const ColumnRenderer = ({ node }) => {
    const ref = useRef(null);
    const handlers = useNodeEvents(node, 'column');
    useRegistry(node.id, 'column', ref);
    return (_jsxs("mesh", { castShadow: true, position: [node.center[0], node.height / 2, node.center[1]], receiveShadow: true, ref: ref, visible: node.visible, ...handlers, children: [_jsx("boxGeometry", { args: [node.width, node.height, node.depth] }), _jsx("meshStandardMaterial", { color: node.color ?? '#475569' })] }));
};
