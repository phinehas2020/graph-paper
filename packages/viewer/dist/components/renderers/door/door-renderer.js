import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRegistry } from '@pascal-app/core';
import { useRef } from 'react';
import { useNodeEvents } from '../../../hooks/use-node-events';
export const DoorRenderer = ({ node }) => {
    const ref = useRef(null);
    useRegistry(node.id, 'door', ref);
    const handlers = useNodeEvents(node, 'door');
    const isTransient = !!node.metadata?.isTransient;
    return (_jsxs("mesh", { castShadow: true, position: node.position, receiveShadow: true, ref: ref, rotation: node.rotation, visible: node.visible, ...(isTransient ? {} : handlers), children: [_jsx("boxGeometry", { args: [0, 0, 0] }), _jsx("meshStandardMaterial", { color: "#d1d5db" })] }));
};
