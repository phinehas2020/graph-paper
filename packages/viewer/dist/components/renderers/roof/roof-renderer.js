import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRegistry } from '@pascal-app/core';
import { useRef } from 'react';
import { useNodeEvents } from '../../../hooks/use-node-events';
export const RoofRenderer = ({ node }) => {
    const ref = useRef(null);
    useRegistry(node.id, 'roof', ref);
    const handlers = useNodeEvents(node, 'roof');
    return (_jsxs("mesh", { castShadow: true, position: node.position, receiveShadow: true, ref: ref, "rotation-y": node.rotation, visible: node.visible, ...handlers, children: [_jsx("boxGeometry", { args: [0, 0, 0] }), _jsx("meshStandardMaterial", { color: "white" })] }));
};
