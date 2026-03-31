import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRegistry } from '@pascal-app/core';
import { useRef } from 'react';
import { useNodeEvents } from '../../../hooks/use-node-events';
import { NodeRenderer } from '../node-renderer';
export const WallRenderer = ({ node }) => {
    const ref = useRef(null);
    const color = node.color ?? '#e7e5e4';
    useRegistry(node.id, 'wall', ref);
    const handlers = useNodeEvents(node, 'wall');
    return (_jsxs("mesh", { castShadow: true, receiveShadow: true, ref: ref, visible: node.visible, children: [_jsx("boxGeometry", { args: [0, 0, 0] }), _jsx("meshStandardMaterial", { color: color }), _jsx("mesh", { name: "collision-mesh", visible: false, ...handlers, children: _jsx("boxGeometry", { args: [0, 0, 0] }) }), node.children.map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, childId)))] }));
};
