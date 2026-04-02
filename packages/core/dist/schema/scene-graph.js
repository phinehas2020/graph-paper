import { BuildingNode } from './nodes/building';
import { LevelNode } from './nodes/level';
import { SiteNode } from './nodes/site';
import { AnyNode } from './types';
export const SCENE_SCHEMA_VERSION = 2;
function isNodeLike(value) {
    return Boolean(value &&
        typeof value === 'object' &&
        typeof value.id === 'string' &&
        typeof value.type === 'string');
}
function normalizeSceneNode(value, normalizedNodes, forcedParentId = null) {
    if (!isNodeLike(value)) {
        return null;
    }
    const parentId = forcedParentId ??
        (typeof value.parentId === 'string' || value.parentId === null ? value.parentId : null);
    const rawNode = {
        ...value,
        object: 'node',
        parentId,
    };
    if (Array.isArray(value.children)) {
        const childIds = [];
        for (const child of value.children) {
            if (typeof child === 'string') {
                childIds.push(child);
                continue;
            }
            const normalizedChild = normalizeSceneNode(child, normalizedNodes, value.id);
            if (normalizedChild) {
                childIds.push(normalizedChild.id);
            }
        }
        rawNode.children = childIds;
    }
    try {
        const parsed = AnyNode.parse(rawNode);
        normalizedNodes[parsed.id] = parsed;
        return parsed;
    }
    catch {
        return null;
    }
}
function migrateLegacyNodes(nodes) {
    const patchedNodes = { ...nodes };
    for (const [id, node] of Object.entries(patchedNodes)) {
        if (node.type === 'item' && !('scale' in node)) {
            patchedNodes[id] = AnyNode.parse({
                ...node,
                scale: [1, 1, 1],
            });
        }
        if (node.type === 'roof' && !('children' in node)) {
            const oldRoof = node;
            const suffix = id.includes('_') ? id.split('_')[1] : Math.random().toString(36).slice(2);
            const segmentId = `rseg_${suffix}`;
            const segment = AnyNode.parse({
                object: 'node',
                id: segmentId,
                type: 'roof-segment',
                parentId: id,
                visible: oldRoof.visible ?? true,
                metadata: {},
                position: [0, 0, 0],
                rotation: 0,
                roofType: 'gable',
                width: typeof oldRoof.length === 'number' ? oldRoof.length : 8,
                depth: (typeof oldRoof.leftWidth === 'number' ? oldRoof.leftWidth : 2.2) +
                    (typeof oldRoof.rightWidth === 'number' ? oldRoof.rightWidth : 2.2),
                wallHeight: 0,
                roofHeight: typeof oldRoof.height === 'number' ? oldRoof.height : 2.5,
                wallThickness: 0.1,
                deckThickness: 0.1,
                overhang: 0.3,
                shingleThickness: 0.05,
            });
            patchedNodes[segmentId] = segment;
            patchedNodes[id] = AnyNode.parse({
                ...oldRoof,
                children: [segmentId],
            });
        }
    }
    return patchedNodes;
}
function normalizeRootNodeIds(inputRootNodeIds, inputNodes, normalizedNodes) {
    const normalizedRootIds = new Set();
    if (Array.isArray(inputRootNodeIds)) {
        for (const root of inputRootNodeIds) {
            if (typeof root === 'string') {
                normalizedRootIds.add(root);
                continue;
            }
            const normalizedRoot = normalizeSceneNode(root, normalizedNodes, null);
            if (normalizedRoot) {
                normalizedRootIds.add(normalizedRoot.id);
            }
        }
    }
    for (const node of Object.values(inputNodes)) {
        const normalizedNode = normalizeSceneNode(node, normalizedNodes);
        if (normalizedNode && normalizedNode.parentId === null) {
            normalizedRootIds.add(normalizedNode.id);
        }
    }
    if (normalizedRootIds.size === 0) {
        for (const node of Object.values(normalizedNodes)) {
            if (node.parentId === null) {
                normalizedRootIds.add(node.id);
            }
        }
    }
    return Array.from(normalizedRootIds);
}
function ensureSiteRoots(nodes, rootNodeIds) {
    const nextNodes = { ...nodes };
    const siteRootIds = rootNodeIds.filter((rootId) => nextNodes[rootId]?.type === 'site');
    const siteEligibleRootIds = rootNodeIds.filter((rootId) => {
        const node = nextNodes[rootId];
        return node?.type === 'building' || node?.type === 'item';
    });
    const otherRootIds = rootNodeIds.filter((rootId) => !siteRootIds.includes(rootId) && !siteEligibleRootIds.includes(rootId));
    if (siteEligibleRootIds.length === 0) {
        return {
            nodes: nextNodes,
            rootNodeIds: Array.from(new Set([...siteRootIds, ...otherRootIds])),
        };
    }
    if (siteRootIds.length > 0) {
        const primarySiteId = siteRootIds[0];
        if (!primarySiteId) {
            return {
                nodes: nextNodes,
                rootNodeIds: Array.from(new Set([...siteRootIds, ...otherRootIds])),
            };
        }
        const primarySite = nextNodes[primarySiteId];
        if (primarySite?.type === 'site') {
            const childIds = new Set(primarySite.children);
            for (const rootId of siteEligibleRootIds) {
                childIds.add(rootId);
                const childNode = nextNodes[rootId];
                if (childNode) {
                    nextNodes[rootId] = { ...childNode, parentId: primarySiteId };
                }
            }
            nextNodes[primarySiteId] = {
                ...primarySite,
                children: Array.from(childIds),
            };
        }
        return {
            nodes: nextNodes,
            rootNodeIds: Array.from(new Set([...siteRootIds, ...otherRootIds])),
        };
    }
    const syntheticSite = SiteNode.parse({
        children: siteEligibleRootIds,
    });
    nextNodes[syntheticSite.id] = syntheticSite;
    for (const rootId of siteEligibleRootIds) {
        const childNode = nextNodes[rootId];
        if (childNode) {
            nextNodes[rootId] = { ...childNode, parentId: syntheticSite.id };
        }
    }
    return {
        nodes: nextNodes,
        rootNodeIds: [syntheticSite.id, ...otherRootIds],
    };
}
export function isSceneGraph(value) {
    if (!(value && typeof value === 'object')) {
        return false;
    }
    const scene = value;
    return Boolean(scene.nodes && typeof scene.nodes === 'object' && Array.isArray(scene.rootNodeIds));
}
export function createDefaultSceneGraph() {
    const level0 = LevelNode.parse({
        level: 0,
        children: [],
    });
    const building = BuildingNode.parse({
        children: [level0.id],
    });
    const site = SiteNode.parse({
        children: [building.id],
    });
    return {
        sceneSchemaVersion: SCENE_SCHEMA_VERSION,
        nodes: {
            [site.id]: site,
            [building.id]: building,
            [level0.id]: level0,
        },
        rootNodeIds: [site.id],
    };
}
export function createSceneGraphSnapshot(nodes, rootNodeIds, sceneSchemaVersion = SCENE_SCHEMA_VERSION) {
    return {
        sceneSchemaVersion,
        nodes,
        rootNodeIds,
    };
}
export function migrateSceneGraph(sceneGraph) {
    if (!(sceneGraph && isSceneGraph(sceneGraph))) {
        return createDefaultSceneGraph();
    }
    const normalizedNodes = {};
    const rootNodeIds = normalizeRootNodeIds(sceneGraph.rootNodeIds, sceneGraph.nodes, normalizedNodes);
    const migratedNodes = migrateLegacyNodes(normalizedNodes);
    const filteredRootIds = rootNodeIds.length > 0
        ? rootNodeIds.filter((rootId) => migratedNodes[rootId])
        : Object.values(migratedNodes)
            .filter((node) => node.parentId === null)
            .map((node) => node.id);
    const siteNormalizedScene = ensureSiteRoots(migratedNodes, filteredRootIds);
    return {
        sceneSchemaVersion: SCENE_SCHEMA_VERSION,
        nodes: siteNormalizedScene.nodes,
        rootNodeIds: siteNormalizedScene.rootNodeIds,
    };
}
