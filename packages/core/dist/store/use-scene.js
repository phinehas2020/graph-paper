'use client';
import { temporal } from 'zundo';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BuildingNode } from '../schema';
import { generateCollectionId } from '../schema/collections';
import { LevelNode } from '../schema/nodes/level';
import { SiteNode } from '../schema/nodes/site';
import { isObject } from '../utils/types';
import * as nodeActions from './actions/node-actions';
const useScene = create()(persist(temporal((set, get) => ({
    // 1. Flat dictionary of all nodes
    nodes: {},
    // 2. Root node IDs
    rootNodeIds: [],
    // 3. Dirty set
    dirtyNodes: new Set(),
    // 4. Collections
    collections: {},
    clearScene: () => {
        set({
            nodes: {},
            rootNodeIds: [],
            dirtyNodes: new Set(),
            collections: {},
        });
        get().loadScene(); // Default scene
    },
    setScene: (nodes, rootNodeIds) => {
        // Backward compat: add default scale to item nodes loaded from external sources
        // (pascal_local_projects, Supabase) saved before scale was added to ItemNode
        const patchedNodes = { ...nodes };
        for (const [id, node] of Object.entries(patchedNodes)) {
            if (node.type === 'item' && !('scale' in node)) {
                patchedNodes[id] = { ...node, scale: [1, 1, 1] };
            }
        }
        set({
            nodes: patchedNodes,
            rootNodeIds,
            dirtyNodes: new Set(),
        });
        // Mark all nodes as dirty to trigger re-validation
        Object.values(patchedNodes).forEach((node) => {
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
            children: [building],
        });
        // Define all nodes flat
        const nodes = {
            [site.id]: site,
            [building.id]: building,
            [level0.id]: level0,
        };
        // Site is the root
        const rootNodeIds = [site.id];
        set({ nodes, rootNodeIds });
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
}), {
    name: 'editor-storage',
    version: 1,
    // Keep existing local scenes when the persist version changes.
    migrate: (persistedState) => persistedState,
    partialize: (state) => ({
        nodes: Object.fromEntries(Object.entries(state.nodes).filter(([_, node]) => {
            const meta = node.metadata;
            const isTransient = isObject(meta) && 'isTransient' in meta && meta.isTransient === true;
            return !isTransient;
        })),
        rootNodeIds: state.rootNodeIds,
        collections: state.collections,
    }),
    merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {});
        // Backward compat: add default scale to item nodes saved before scale was added
        if (persisted.nodes) {
            for (const [id, node] of Object.entries(persisted.nodes)) {
                if (node.type === 'item' && !('scale' in node)) {
                    persisted.nodes[id] = {
                        ...node,
                        scale: [1, 1, 1],
                    };
                }
            }
        }
        return { ...currentState, ...persisted };
    },
    onRehydrateStorage: (state) => {
        console.log('hydrating...');
        return (state, error) => {
            if (error) {
                console.log('an error happened during hydration', error);
                return;
            }
            if (!state) {
                console.log('hydration finished - no state');
                return;
            }
            // Migration: Wrap old scenes (where root is not a SiteNode) in a SiteNode
            const rootId = state.rootNodeIds?.[0];
            const rootNode = rootId ? state.nodes[rootId] : null;
            if (rootNode && rootNode.type !== 'site') {
                console.log('Migrating old scene: wrapping in SiteNode');
                // Collect existing root nodes (should be BuildingNode or ItemNode)
                const existingRoots = (state.rootNodeIds || [])
                    .map((id) => state.nodes[id])
                    .filter((node) => node?.type === 'building' || node?.type === 'item');
                // Create a new SiteNode with existing roots as children
                const site = SiteNode.parse({
                    children: existingRoots,
                });
                // Add site to nodes
                state.nodes[site.id] = site;
                // Update root to be the site
                state.rootNodeIds = [site.id];
                console.log('Migration complete: scene now has SiteNode as root');
            }
            console.log('hydration finished');
        };
    },
}));
export default useScene;
// Track previous temporal state lengths
let prevPastLength = 0;
let prevFutureLength = 0;
// Subscribe to the temporal store (Undo/Redo events)
useScene.temporal.subscribe((state) => {
    const currentPastLength = state.pastStates.length;
    const currentFutureLength = state.futureStates.length;
    // Undo: futureStates increases (state moved from past to future)
    // Redo: pastStates increases while futureStates decreases (state moved from future to past)
    const didUndo = currentFutureLength > prevFutureLength;
    const didRedo = currentPastLength > prevPastLength && currentFutureLength < prevFutureLength;
    if (didUndo || didRedo) {
        // Use RAF to ensure all middleware and store updates are complete
        requestAnimationFrame(() => {
            const currentNodes = useScene.getState().nodes;
            // Trigger a full scene re-validation after undo/redo
            Object.values(currentNodes).forEach((node) => {
                useScene.getState().markDirty(node.id);
            });
        });
    }
    // Update tracked lengths
    prevPastLength = currentPastLength;
    prevFutureLength = currentFutureLength;
});
