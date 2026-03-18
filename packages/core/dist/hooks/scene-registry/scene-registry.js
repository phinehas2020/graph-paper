import { useLayoutEffect } from 'react';
export const sceneRegistry = {
    // Master lookup: ID -> Object3D
    nodes: new Map(),
    // Categorized lookups: Type -> Set of IDs
    // Using a Set is faster for adding/deleting than an Array
    byType: {
        site: new Set(),
        building: new Set(),
        ceiling: new Set(),
        level: new Set(),
        wall: new Set(),
        item: new Set(),
        slab: new Set(),
        zone: new Set(),
        roof: new Set(),
        scan: new Set(),
        guide: new Set(),
        window: new Set(),
        door: new Set(),
    },
};
export function useRegistry(id, type, ref) {
    useLayoutEffect(() => {
        const obj = ref.current;
        if (!obj)
            return;
        // 1. Add to master map
        sceneRegistry.nodes.set(id, obj);
        // 2. Add to type-specific set
        sceneRegistry.byType[type].add(id);
        // 4. Cleanup when component unmounts
        return () => {
            sceneRegistry.nodes.delete(id);
            sceneRegistry.byType[type].delete(id);
        };
    }, [id, type, ref]);
}
