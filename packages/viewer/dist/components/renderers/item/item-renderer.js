import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useInteractive, useRegistry, useScene, } from '@pascal-app/core';
import { useAnimations } from '@react-three/drei';
import { Clone } from '@react-three/drei/core/Clone';
import { useGLTF } from '@react-three/drei/core/Gltf';
import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { MathUtils } from 'three';
import { positionLocal, smoothstep, time } from 'three/tsl';
import { DoubleSide, MeshStandardNodeMaterial } from 'three/webgpu';
import { useNodeEvents } from '../../../hooks/use-node-events';
import { resolveCdnUrl } from '../../../lib/asset-url';
import { NodeRenderer } from '../node-renderer';
// Shared materials to avoid creating new instances for every mesh
const defaultMaterial = new MeshStandardNodeMaterial({
    color: 0xff_ff_ff,
    roughness: 1,
    metalness: 0,
});
const glassMaterial = new MeshStandardNodeMaterial({
    name: 'glass',
    color: 'lightgray',
    roughness: 0.8,
    metalness: 0,
    transparent: true,
    opacity: 0.35,
    side: DoubleSide,
    depthWrite: false,
});
const getMaterialForOriginal = (original) => {
    if (original.name.toLowerCase() === 'glass') {
        return glassMaterial;
    }
    return defaultMaterial;
};
export const ItemRenderer = ({ node }) => {
    const ref = useRef(null);
    useRegistry(node.id, node.type, ref);
    return (_jsxs("group", { position: node.position, ref: ref, rotation: node.rotation, visible: node.visible, children: [_jsx(Suspense, { fallback: _jsx(PreviewModel, { node: node }), children: _jsx(ModelRenderer, { node: node }) }), node.children?.map((childId) => (_jsx(NodeRenderer, { nodeId: childId }, childId)))] }));
};
const previewMaterial = new MeshStandardNodeMaterial({
    color: '#cccccc',
    roughness: 1,
    metalness: 0,
    depthTest: false,
});
const previewOpacity = smoothstep(0.42, 0.55, positionLocal.y.add(time.mul(-0.2)).mul(10).fract());
previewMaterial.opacityNode = previewOpacity;
previewMaterial.transparent = true;
const PreviewModel = ({ node }) => {
    return (_jsx("mesh", { material: previewMaterial, "position-y": node.asset.dimensions[1] / 2, children: _jsx("boxGeometry", { args: [node.asset.dimensions[0], node.asset.dimensions[1], node.asset.dimensions[2]] }) }));
};
const multiplyScales = (a, b) => [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
const ModelRenderer = ({ node }) => {
    const { scene, nodes, animations } = useGLTF(resolveCdnUrl(node.asset.src) || '');
    const ref = useRef(null);
    const { actions } = useAnimations(animations, ref);
    // Freeze the interactive definition at mount — asset schemas don't change at runtime
    const interactiveRef = useRef(node.asset.interactive);
    if (nodes.cutout) {
        nodes.cutout.visible = false;
    }
    const handlers = useNodeEvents(node, 'item');
    useEffect(() => {
        if (!node.parentId)
            return;
        useScene.getState().dirtyNodes.add(node.parentId);
    }, [node.parentId]);
    useEffect(() => {
        const interactive = interactiveRef.current;
        if (!interactive)
            return;
        useInteractive.getState().initItem(node.id, interactive);
        return () => useInteractive.getState().removeItem(node.id);
    }, [node.id]);
    useMemo(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                const mesh = child;
                if (mesh.name === 'cutout') {
                    child.visible = false;
                    return;
                }
                let hasGlass = false;
                // Handle both single material and material array cases
                if (Array.isArray(mesh.material)) {
                    mesh.material = mesh.material.map((mat) => getMaterialForOriginal(mat));
                    hasGlass = mesh.material.some((mat) => mat.name === 'glass');
                }
                else {
                    mesh.material = getMaterialForOriginal(mesh.material);
                    hasGlass = mesh.material.name === 'glass';
                }
                mesh.castShadow = !hasGlass;
                mesh.receiveShadow = !hasGlass;
            }
        });
    }, [scene]);
    const interactive = interactiveRef.current;
    const animEffect = interactive?.effects.find((e) => e.kind === 'animation') ?? null;
    const lightEffects = interactive?.effects.filter((e) => e.kind === 'light') ?? [];
    return (_jsxs(_Fragment, { children: [_jsx(Clone, { object: scene, position: node.asset.offset, ref: ref, rotation: node.asset.rotation, scale: multiplyScales(node.asset.scale || [1, 1, 1], node.scale || [1, 1, 1]), ...handlers }), animations.length > 0 && (_jsx(ItemAnimation, { actions: actions, animations: animations, animEffect: animEffect, interactive: interactive ?? null, nodeId: node.id })), lightEffects.map((effect, i) => (_jsx(ItemLight, { effect: effect, interactive: interactive, nodeId: node.id }, i)))] }));
};
const ItemAnimation = ({ nodeId, animEffect, interactive, actions, animations, }) => {
    const activeClipRef = useRef(null);
    const fadingOutRef = useRef(null);
    // Reactive: derive target clip name — only re-renders when the clip name itself changes
    const targetClip = useInteractive((s) => {
        const values = s.items[nodeId]?.controlValues;
        if (!animEffect)
            return animations[0]?.name ?? null;
        const toggleIndex = interactive.controls.findIndex((c) => c.kind === 'toggle');
        const isOn = toggleIndex >= 0 ? Boolean(values?.[toggleIndex]) : false;
        return isOn
            ? (animEffect.clips.on ?? null)
            : (animEffect.clips.off ?? animEffect.clips.loop ?? null);
    });
    // When target clip changes: kick off the transition
    useEffect(() => {
        // Cancel any ongoing fade-out immediately
        if (fadingOutRef.current) {
            fadingOutRef.current.timeScale = 0;
            fadingOutRef.current = null;
        }
        // Move current clip to fade-out
        if (activeClipRef.current && activeClipRef.current !== targetClip) {
            const old = actions[activeClipRef.current];
            if (old?.isRunning())
                fadingOutRef.current = old;
        }
        // Start new clip at timeScale 0.01 (as 0 would cause isRunning to be false and thus not play at all), then fade in to 1
        activeClipRef.current = targetClip;
        if (targetClip) {
            const next = actions[targetClip];
            if (next) {
                next.timeScale = 0.01;
                next.play();
            }
        }
    }, [targetClip, actions]);
    // useFrame: only lerping — no logic
    useFrame((_, delta) => {
        if (fadingOutRef.current) {
            const action = fadingOutRef.current;
            action.timeScale = MathUtils.lerp(action.timeScale, 0, Math.min(delta * 5, 1));
            if (action.timeScale < 0.01) {
                action.timeScale = 0;
                fadingOutRef.current = null;
            }
        }
        if (activeClipRef.current) {
            const action = actions[activeClipRef.current];
            if (action?.isRunning() && action.timeScale < 1) {
                action.timeScale = MathUtils.lerp(action.timeScale, 1, Math.min(delta * 5, 1));
                if (1 - action.timeScale < 0.01)
                    action.timeScale = 1;
            }
        }
    });
    return null;
};
const ItemLight = ({ nodeId, effect, interactive, }) => {
    const lightRef = useRef(null);
    // Precompute stable indices — interactive is frozen at mount
    const toggleIndex = interactive.controls.findIndex((c) => c.kind === 'toggle');
    const sliderIndex = interactive.controls.findIndex((c) => c.kind === 'slider');
    const sliderControl = sliderIndex >= 0 ? interactive.controls[sliderIndex] : null;
    useFrame((_, delta) => {
        if (!lightRef.current)
            return;
        const values = useInteractive.getState().items[nodeId]?.controlValues;
        const isOn = toggleIndex >= 0 ? Boolean(values?.[toggleIndex]) : true;
        // Normalize slider to 0-1 (default full intensity if no slider)
        let t = 1;
        if (sliderControl) {
            const raw = values?.[sliderIndex] ?? sliderControl.min;
            t = (raw - sliderControl.min) / (sliderControl.max - sliderControl.min);
        }
        const target = isOn
            ? MathUtils.lerp(effect.intensityRange[0], effect.intensityRange[1], t)
            : effect.intensityRange[0];
        lightRef.current.intensity = MathUtils.lerp(lightRef.current.intensity, target, Math.min(delta * 12, 1));
    });
    return (_jsx("pointLight", { castShadow: false, color: effect.color, distance: effect.distance ?? 0, intensity: effect.intensityRange[0], position: effect.offset, ref: lightRef }));
};
