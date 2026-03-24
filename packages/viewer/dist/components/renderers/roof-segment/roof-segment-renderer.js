import { jsx as _jsx } from "react/jsx-runtime";
import { useRegistry } from '@pascal-app/core';
import { useRef } from 'react';
import { useNodeEvents } from '../../../hooks/use-node-events';
import useViewer from '../../../store/use-viewer';
import { roofDebugMaterials, roofMaterials } from '../roof/roof-materials';
export const RoofSegmentRenderer = ({ node }) => {
    const ref = useRef(null);
    useRegistry(node.id, 'roof-segment', ref);
    const handlers = useNodeEvents(node, 'roof-segment');
    const debugColors = useViewer((s) => s.debugColors);
    return (_jsx("mesh", { material: debugColors ? roofDebugMaterials : roofMaterials, position: node.position, ref: ref, "rotation-y": node.rotation, visible: node.visible, ...handlers, children: _jsx("boxGeometry", { args: [0, 0, 0] }) }));
};
