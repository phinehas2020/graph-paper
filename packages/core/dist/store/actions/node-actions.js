export const createNodesAction = (set, get, ops) => {
    set((state) => {
        const nextNodes = { ...state.nodes };
        const nextRootIds = [...state.rootNodeIds];
        for (const { node, parentId } of ops) {
            // 1. Assign parentId to the child (Safe because BaseNode has parentId)
            const newNode = {
                ...node,
                parentId: parentId ?? null,
            };
            nextNodes[newNode.id] = newNode;
            // 2. Update the Parent's children list
            if (parentId && nextNodes[parentId]) {
                const parent = nextNodes[parentId];
                // Type Guard: Check if the parent node is a container that supports children
                if ('children' in parent && Array.isArray(parent.children)) {
                    nextNodes[parentId] = {
                        ...parent,
                        // Use Set to prevent duplicate IDs if createNode is called twice
                        children: Array.from(new Set([...parent.children, newNode.id])), // We don't verify child types here
                    };
                }
            }
            else if (!parentId) {
                // 3. Handle Root nodes
                if (!nextRootIds.includes(newNode.id)) {
                    nextRootIds.push(newNode.id);
                }
            }
        }
        return { nodes: nextNodes, rootNodeIds: nextRootIds };
    });
    // 4. System Sync
    ops.forEach(({ node, parentId }) => {
        get().markDirty(node.id);
        if (parentId)
            get().markDirty(parentId);
    });
};
export const updateNodesAction = (set, get, updates) => {
    const parentsToUpdate = new Set();
    set((state) => {
        const nextNodes = { ...state.nodes };
        for (const { id, data } of updates) {
            const currentNode = nextNodes[id];
            if (!currentNode)
                continue;
            // Handle Reparenting Logic
            if (data.parentId !== undefined && data.parentId !== currentNode.parentId) {
                // 1. Remove from old parent
                const oldParentId = currentNode.parentId;
                if (oldParentId && nextNodes[oldParentId]) {
                    const oldParent = nextNodes[oldParentId];
                    nextNodes[oldParent.id] = {
                        ...oldParent,
                        children: oldParent.children.filter((childId) => childId !== id),
                    };
                    parentsToUpdate.add(oldParent.id);
                }
                // 2. Add to new parent
                const newParentId = data.parentId;
                if (newParentId && nextNodes[newParentId]) {
                    const newParent = nextNodes[newParentId];
                    nextNodes[newParent.id] = {
                        ...newParent,
                        children: Array.from(new Set([...newParent.children, id])),
                    };
                    parentsToUpdate.add(newParent.id);
                }
            }
            // Apply the update
            nextNodes[id] = { ...nextNodes[id], ...data };
        }
        return { nodes: nextNodes };
    });
    // Mark dirty after the next frame to ensure React renders complete
    requestAnimationFrame(() => {
        updates.forEach((u) => {
            get().markDirty(u.id);
        });
        parentsToUpdate.forEach((pId) => {
            get().markDirty(pId);
        });
    });
};
export const deleteNodesAction = (set, get, ids) => {
    const parentsToMarkDirty = new Set();
    set((state) => {
        const nextNodes = { ...state.nodes };
        const nextCollections = { ...state.collections };
        let nextRootIds = [...state.rootNodeIds];
        for (const id of ids) {
            const node = nextNodes[id];
            if (!node)
                continue;
            // 1. Remove reference from Parent
            const parentId = node.parentId;
            if (parentId && nextNodes[parentId]) {
                const parent = nextNodes[parentId];
                if (parent.children) {
                    nextNodes[parent.id] = {
                        ...parent,
                        children: parent.children.filter((cid) => cid !== id),
                    };
                    parentsToMarkDirty.add(parent.id);
                }
            }
            // 2. Remove from Root list
            nextRootIds = nextRootIds.filter((rid) => rid !== id);
            // 3. Remove from any collections it belongs to
            if ('collectionIds' in node && node.collectionIds) {
                for (const cid of node.collectionIds) {
                    const col = nextCollections[cid];
                    if (col) {
                        nextCollections[cid] = { ...col, nodeIds: col.nodeIds.filter((nid) => nid !== id) };
                    }
                }
            }
            // 4. Delete the node itself
            delete nextNodes[id];
            // Inside the deleteNodes loop
            if ('children' in node && node.children.length > 0) {
                // Recursively delete all children first
                get().deleteNodes(node.children);
            }
        }
        return { nodes: nextNodes, rootNodeIds: nextRootIds, collections: nextCollections };
    });
    // Mark affected nodes dirty: parents of deleted nodes and their remaining children
    // (e.g. deleting a slab affects sibling walls via level elevation changes)
    parentsToMarkDirty.forEach((parentId) => {
        get().markDirty(parentId);
        const parent = get().nodes[parentId];
        if (parent && 'children' in parent && Array.isArray(parent.children)) {
            for (const childId of parent.children) {
                get().markDirty(childId);
            }
        }
    });
};
