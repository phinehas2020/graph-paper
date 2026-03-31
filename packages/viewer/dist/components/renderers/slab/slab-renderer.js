import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRegistry } from '@pascal-app/core';
import { useRef } from 'react';
import { useNodeEvents } from '../../../hooks/use-node-events';
export const SlabRenderer = ({ node }) => {
    const ref = useRef(null);
    const color = node.color ?? '#e5e5e5';
    useRegistry(node.id, 'slab', ref);
    const handlers = useNodeEvents(node, 'slab');
    return (_jsxs("mesh", { castShadow: true, receiveShadow: true, ref: ref, ...handlers, visible: node.visible, children: [_jsx("boxGeometry", { args: [0, 0, 0] }), _jsx("meshStandardMaterial", { color: color })] }));
};
