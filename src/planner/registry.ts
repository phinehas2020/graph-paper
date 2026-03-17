import type * as THREE from 'three';

export type RegistryRef = THREE.Object3D | HTMLElement;

export interface RegistryEntry {
  id: string;
  type: string;
  ref: RegistryRef;
}

class SceneRegistry {
  private entries = new Map<string, RegistryEntry>();
  private byType = new Map<string, Set<string>>();

  register(nodeId: string, ref: RegistryRef, type: string = 'unknown'): void {
    const existing = this.entries.get(nodeId);
    if (existing && existing.type !== type) {
      this.removeFromTypeIndex(nodeId, existing.type);
    }

    this.entries.set(nodeId, { id: nodeId, type, ref });

    let typeSet = this.byType.get(type);
    if (!typeSet) {
      typeSet = new Set();
      this.byType.set(type, typeSet);
    }
    typeSet.add(nodeId);
  }

  unregister(nodeId: string): void {
    const entry = this.entries.get(nodeId);
    if (!entry) return;

    this.removeFromTypeIndex(nodeId, entry.type);
    this.entries.delete(nodeId);
  }

  get(nodeId: string): RegistryEntry | undefined {
    return this.entries.get(nodeId);
  }

  getByType(type: string): RegistryEntry[] {
    const ids = this.byType.get(type);
    if (!ids) return [];

    const results: RegistryEntry[] = [];
    for (const id of ids) {
      const entry = this.entries.get(id);
      if (entry) results.push(entry);
    }
    return results;
  }

  clear(): void {
    this.entries.clear();
    this.byType.clear();
  }

  get size(): number {
    return this.entries.size;
  }

  private removeFromTypeIndex(nodeId: string, type: string): void {
    const typeSet = this.byType.get(type);
    if (typeSet) {
      typeSet.delete(nodeId);
      if (typeSet.size === 0) {
        this.byType.delete(type);
      }
    }
  }
}

const sceneRegistry = new SceneRegistry();

export default sceneRegistry;
