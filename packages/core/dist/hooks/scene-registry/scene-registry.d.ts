import type * as THREE from 'three';
export declare const sceneRegistry: {
    nodes: Map<string, THREE.Object3D<THREE.Object3DEventMap>>;
    byType: {
        site: Set<string>;
        building: Set<string>;
        ceiling: Set<string>;
        level: Set<string>;
        wall: Set<string>;
        item: Set<string>;
        slab: Set<string>;
        zone: Set<string>;
        roof: Set<string>;
        'roof-plane': Set<string>;
        'roof-segment': Set<string>;
        'truss-array': Set<string>;
        'rafter-set': Set<string>;
        scan: Set<string>;
        guide: Set<string>;
        window: Set<string>;
        door: Set<string>;
        'floor-system': Set<string>;
        'floor-opening': Set<string>;
        'blocking-run': Set<string>;
        'beam-line': Set<string>;
        'support-post': Set<string>;
        'electrical-panel': Set<string>;
        circuit: Set<string>;
        'device-box': Set<string>;
        'light-fixture': Set<string>;
        'wire-run': Set<string>;
        'switch-leg': Set<string>;
        'plumbing-fixture': Set<string>;
        'supply-run': Set<string>;
        'drain-run': Set<string>;
        'vent-run': Set<string>;
        'foundation-system': Set<string>;
        'footing-run': Set<string>;
        'stem-wall': Set<string>;
        pier: Set<string>;
        column: Set<string>;
    };
    /** Remove all entries. Call when unloading a scene to prevent stale 3D refs. */
    clear(): void;
};
export declare function useRegistry(id: string, type: keyof typeof sceneRegistry.byType, ref: React.RefObject<THREE.Object3D>): void;
//# sourceMappingURL=scene-registry.d.ts.map