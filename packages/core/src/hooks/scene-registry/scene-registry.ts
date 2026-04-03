import { useLayoutEffect } from 'react'
import type * as THREE from 'three'

export const sceneRegistry = {
  // Master lookup: ID -> Object3D
  nodes: new Map<string, THREE.Object3D>(),

  // Categorized lookups: Type -> Set of IDs
  // Using a Set is faster for adding/deleting than an Array
  byType: {
    site: new Set<string>(),
    building: new Set<string>(),
    ceiling: new Set<string>(),
    level: new Set<string>(),
    wall: new Set<string>(),
    item: new Set<string>(),
    slab: new Set<string>(),
    zone: new Set<string>(),
    roof: new Set<string>(),
    'roof-plane': new Set<string>(),
    'roof-segment': new Set<string>(),
    'truss-array': new Set<string>(),
    'rafter-set': new Set<string>(),
    scan: new Set<string>(),
    guide: new Set<string>(),
    window: new Set<string>(),
    door: new Set<string>(),
    'floor-system': new Set<string>(),
    'floor-opening': new Set<string>(),
    'blocking-run': new Set<string>(),
    'beam-line': new Set<string>(),
    'support-post': new Set<string>(),
    'electrical-panel': new Set<string>(),
    circuit: new Set<string>(),
    'device-box': new Set<string>(),
    'light-fixture': new Set<string>(),
    'wire-run': new Set<string>(),
    'switch-leg': new Set<string>(),
    'plumbing-fixture': new Set<string>(),
    'supply-run': new Set<string>(),
    'drain-run': new Set<string>(),
    'vent-run': new Set<string>(),
    'foundation-system': new Set<string>(),
    'footing-run': new Set<string>(),
    'stem-wall': new Set<string>(),
    pier: new Set<string>(),
    column: new Set<string>(),
  },

  /** Remove all entries. Call when unloading a scene to prevent stale 3D refs. */
  clear() {
    this.nodes.clear()
    for (const set of Object.values(this.byType)) {
      set.clear()
    }
  },
}

export function useRegistry(
  id: string,
  type: keyof typeof sceneRegistry.byType,
  ref: React.RefObject<THREE.Object3D>,
) {
  useLayoutEffect(() => {
    const obj = ref.current
    if (!obj) return

    // 1. Add to master map
    sceneRegistry.nodes.set(id, obj)

    // 2. Add to type-specific set
    sceneRegistry.byType[type].add(id)

    // 4. Cleanup when component unmounts
    return () => {
      sceneRegistry.nodes.delete(id)
      sceneRegistry.byType[type].delete(id)
    }
  }, [id, type, ref])
}
