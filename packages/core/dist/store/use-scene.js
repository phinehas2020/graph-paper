'use client';
import { temporal } from 'zundo';
import { create } from 'zustand';
import { BuildingNode } from '../schema';
import { generateCollectionId } from '../schema/collections';
import { createSceneGraphSnapshot, migrateSceneGraph, SCENE_SCHEMA_VERSION, } from '../schema/scene-graph';
import { LevelNode } from '../schema/nodes/level';
import { SiteNode } from '../schema/nodes/site';
import * as nodeActions from './actions/node-actions';
const useScene = create()(temporal((set, get) => ({
    // 1. Flat dictionary of all nodes
    sceneSchemaVersion: SCENE_SCHEMA_VERSION,
    nodes: {},
    // 2. Root node IDs
    rootNodeIds: [],
    // 3. Dirty set
    dirtyNodes: new Set(),
    // 4. Collections
    collections: {},
    unloadScene: () => {
        set({
            sceneSchemaVersion: SCENE_SCHEMA_VERSION,
            nodes: {},
            rootNodeIds: [],
            dirtyNodes: new Set(),
            collections: {},
        });
    },
    clearScene: () => {
        get().unloadScene();
        get().loadScene(); // Default scene
    },
    setScene: (nodes, rootNodeIds, sceneSchemaVersion = SCENE_SCHEMA_VERSION) => {
        const migratedScene = migrateSceneGraph(createSceneGraphSnapshot(nodes, rootNodeIds, sceneSchemaVersion));
        set({
            sceneSchemaVersion: migratedScene.sceneSchemaVersion,
            nodes: migratedScene.nodes,
            rootNodeIds: migratedScene.rootNodeIds,
            dirtyNodes: new Set(),
        });
        // Mark all nodes as dirty to trigger re-validation
        Object.values(migratedScene.nodes).forEach((node) => {
            get().markDirty(node.id);
        });
    },
    loadScene: () => {
        if (get().rootNodeIds.length > 0) {
            // Assign all nodes as dirty to force re-validation
            Object.values(get().nodes).forEach((node) => {
                get().markDirty(node.id);
            });
            return; // Scene already loaded
        }
        // Create hierarchy: Site → Building → Level
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
        // Define all nodes flat
        const nodes = {
            [site.id]: site,
            [building.id]: building,
            [level0.id]: level0,
        };
        // Site is the root
        const rootNodeIds = [site.id];
        set({ sceneSchemaVersion: SCENE_SCHEMA_VERSION, nodes, rootNodeIds });
    },
    markDirty: (id) => {
        get().dirtyNodes.add(id);
    },
    clearDirty: (id) => {
        get().dirtyNodes.delete(id);
    },
    createNodes: (ops) => nodeActions.createNodesAction(set, get, ops),
    createNode: (node, parentId) => nodeActions.createNodesAction(set, get, [{ node, parentId }]),
    updateNodes: (updates) => nodeActions.updateNodesAction(set, get, updates),
    updateNode: (id, data) => nodeActions.updateNodesAction(set, get, [{ id, data }]),
    // --- DELETE ---
    deleteNodes: (ids) => nodeActions.deleteNodesAction(set, get, ids),
    deleteNode: (id) => nodeActions.deleteNodesAction(set, get, [id]),
    // --- COLLECTIONS ---
    createCollection: (name, nodeIds = []) => {
        const id = generateCollectionId();
        const collection = { id, name, nodeIds };
        set((state) => {
            const nextCollections = { ...state.collections, [id]: collection };
            // Denormalize: stamp collectionId onto each node
            const nextNodes = { ...state.nodes };
            for (const nodeId of nodeIds) {
                const node = nextNodes[nodeId];
                if (!node)
                    continue;
                const existing = ('collectionIds' in node ? node.collectionIds : undefined) ?? [];
                nextNodes[nodeId] = { ...node, collectionIds: [...existing, id] };
            }
            return { collections: nextCollections, nodes: nextNodes };
        });
        return id;
    },
    deleteCollection: (id) => {
        set((state) => {
            const col = state.collections[id];
            const nextCollections = { ...state.collections };
            delete nextCollections[id];
            // Remove collectionId from all member nodes
            const nextNodes = { ...state.nodes };
            for (const nodeId of col?.nodeIds ?? []) {
                const node = nextNodes[nodeId];
                if (!(node && 'collectionIds' in node))
                    continue;
                nextNodes[nodeId] = {
                    ...node,
                    collectionIds: node.collectionIds.filter((cid) => cid !== id),
                };
            }
            return { collections: nextCollections, nodes: nextNodes };
        });
    },
    updateCollection: (id, data) => {
        set((state) => {
            const col = state.collections[id];
            if (!col)
                return state;
            return { collections: { ...state.collections, [id]: { ...col, ...data } } };
        });
    },
    addToCollection: (id, nodeId) => {
        set((state) => {
            const col = state.collections[id];
            if (!col || col.nodeIds.includes(nodeId))
                return state;
            const nextCollections = {
                ...state.collections,
                [id]: { ...col, nodeIds: [...col.nodeIds, nodeId] },
            };
            const node = state.nodes[nodeId];
            if (!node)
                return { collections: nextCollections };
            const existing = ('collectionIds' in node ? node.collectionIds : undefined) ?? [];
            const nextNodes = {
                ...state.nodes,
                [nodeId]: { ...node, collectionIds: [...existing, id] },
            };
            return { collections: nextCollections, nodes: nextNodes };
        });
    },
    removeFromCollection: (id, nodeId) => {
        set((state) => {
            const col = state.collections[id];
            if (!col)
                return state;
            const nextCollections = {
                ...state.collections,
                [id]: { ...col, nodeIds: col.nodeIds.filter((n) => n !== nodeId) },
            };
            const node = state.nodes[nodeId];
            if (!(node && 'collectionIds' in node))
                return { collections: nextCollections };
            const nextNodes = {
                ...state.nodes,
                [nodeId]: {
                    ...node,
                    collectionIds: node.collectionIds.filter((cid) => cid !== id),
                },
            };
            return { collections: nextCollections, nodes: nextNodes };
        });
    },
}), {
    partialize: (state) => {
        const { nodes, rootNodeIds, collections } = state;
        return { nodes, rootNodeIds, collections };
    },
    limit: 50, // Limit to last 50 actions
}));
export default useScene;
// Track previous temporal state lengths and node snapshot for diffing
let prevPastLength = 0;
let prevFutureLength = 0;
let prevNodesSnapshot = null;
export function clearSceneHistory() {
    useScene.temporal.getState().clear();
    prevPastLength = 0;
    prevFutureLength = 0;
    prevNodesSnapshot = null;
}
// Subscribe to the temporal store (Undo/Redo events)
useScene.temporal.subscribe((state) => {
    const currentPastLength = state.pastStates.length;
    const currentFutureLength = state.futureStates.length;
    // Undo: futureStates increases (state moved from past to future)
    // Redo: pastStates increases while futureStates decreases (state moved from future to past)
    const didUndo = currentFutureLength > prevFutureLength;
    const didRedo = currentPastLength > prevPastLength && currentFutureLength < prevFutureLength;
    if (didUndo || didRedo) {
        // Capture the previous snapshot before RAF fires
        const snapshotBefore = prevNodesSnapshot;
        // Use RAF to ensure all middleware and store updates are complete
        requestAnimationFrame(() => {
            const currentNodes = useScene.getState().nodes;
            const { markDirty } = useScene.getState();
            if (snapshotBefore) {
                // Diff: only mark nodes that actually changed
                for (const [id, node] of Object.entries(currentNodes)) {
                    if (snapshotBefore[id] !== node) {
                        markDirty(id);
                        // Also mark parent so merged geometries update
                        if (node.parentId)
                            markDirty(node.parentId);
                    }
                }
                // Nodes that were deleted (exist in prev but not current)
                for (const [id, node] of Object.entries(snapshotBefore)) {
                    if (!currentNodes[id]) {
                        if (node.parentId)
                            markDirty(node.parentId);
                    }
                }
            }
            else {
                // No snapshot to diff against — fall back to marking all
                for (const node of Object.values(currentNodes)) {
                    markDirty(node.id);
                }
            }
        });
    }
    // Update tracked lengths and snapshot
    prevPastLength = currentPastLength;
    prevFutureLength = currentFutureLength;
    prevNodesSnapshot = useScene.getState().nodes;
});
