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
        'roof-plane': new Set(),
        'roof-segment': new Set(),
        'truss-array': new Set(),
        'rafter-set': new Set(),
        scan: new Set(),
        guide: new Set(),
        window: new Set(),
        door: new Set(),
        'floor-system': new Set(),
        'floor-opening': new Set(),
        'blocking-run': new Set(),
        'beam-line': new Set(),
        'support-post': new Set(),
        'electrical-panel': new Set(),
        circuit: new Set(),
        'device-box': new Set(),
        'light-fixture': new Set(),
        'wire-run': new Set(),
        'switch-leg': new Set(),
        'plumbing-fixture': new Set(),
        'supply-run': new Set(),
        'drain-run': new Set(),
        'vent-run': new Set(),
        'foundation-system': new Set(),
        'footing-run': new Set(),
        'stem-wall': new Set(),
        pier: new Set(),
        column: new Set(),
    },
    /** Remove all entries. Call when unloading a scene to prevent stale 3D refs. */
    clear() {
        this.nodes.clear();
        for (const set of Object.values(this.byType)) {
            set.clear();
        }
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
