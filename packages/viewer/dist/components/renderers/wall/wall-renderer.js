import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getWallGuideLocalY, getWallLength, useRegistry } from '@pascal-app/core';
import { useRef } from 'react';
import { useNodeEvents } from '../../../hooks/use-node-events';
import { NodeRenderer } from '../node-renderer';
const GUIDE_COLOR = '#22d3ee';
const GUIDE_HEIGHT = 0.016;
const GUIDE_DEPTH = 0.008;
const GUIDE_OFFSET = 0.01;
const disableRaycast = () => null;
export const WallRenderer = ({ node }) => {
    const ref = useRef(null);
    const color = node.color ?? '#e7e5e4';
    const wallLength = getWallLength(node);
    const halfThickness = (node.thickness ?? 0.1) / 2;
    useRegistry(node.id, 'wall', ref);
    const handlers = useNodeEvents(node, 'wall');
    return (_jsxs("mesh", { castShadow: true, receiveShadow: true, ref: ref, visible: node.visible, children: [_jsx("boxGeometry", { args: [0, 0, 0] }), _jsx("meshStandardMaterial", { color: color }), _jsx("mesh", { name: "collision-mesh", visible: false, ...handlers, children: _jsx("boxGeometry", { args: [0, 0, 0] }) }), (node.guides ?? []).map((guide) => {
                const guideY = getWallGuideLocalY(node, guide);
                const guideColor = guide.color ?? GUIDE_COLOR;
                return (_jsxs("group", { children: [_jsxs("mesh", { position: [wallLength / 2, guideY, halfThickness + GUIDE_OFFSET], raycast: disableRaycast, renderOrder: 2, children: [_jsx("boxGeometry", { args: [wallLength, GUIDE_HEIGHT, GUIDE_DEPTH] }), _jsx("meshBasicMaterial", { color: guideColor, depthTest: false, depthWrite: false, opacity: 0.92, transparent: true })] }), _jsxs("mesh", { position: [wallLength / 2, guideY, -(halfThickness + GUIDE_OFFSET)], raycast: disableRaycast, renderOrder: 2, children: [_jsx("boxGeometry", { args: [wallLength, GUIDE_HEIGHT, GUIDE_DEPTH] }), _jsx("meshBasicMaterial", { color: guideColor, depthTest: false, depthWrite: false, opacity: 0.92, transparent: true })] })] }, guide.id));
            }), node.children.map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, childId)))] }));
};
