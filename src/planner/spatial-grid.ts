export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface SpatialEntry {
  id: string;
  bounds: Bounds;
  cells: string[]; // keys of occupied cells
}

export class SpatialGrid {
  private cellSize: number;
  private entries = new Map<string, SpatialEntry>();
  private cells = new Map<string, Set<string>>();

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
  }

  insert(id: string, bounds: Bounds): void {
    this.remove(id);

    const cellKeys = this.getCellKeys(bounds);
    this.entries.set(id, { id, bounds, cells: cellKeys });

    for (const key of cellKeys) {
      let cell = this.cells.get(key);
      if (!cell) {
        cell = new Set();
        this.cells.set(key, cell);
      }
      cell.add(id);
    }
  }

  remove(id: string): void {
    const entry = this.entries.get(id);
    if (!entry) return;

    for (const key of entry.cells) {
      const cell = this.cells.get(key);
      if (cell) {
        cell.delete(id);
        if (cell.size === 0) {
          this.cells.delete(key);
        }
      }
    }

    this.entries.delete(id);
  }

  query(bounds: Bounds): string[] {
    const cellKeys = this.getCellKeys(bounds);
    const seen = new Set<string>();
    const results: string[] = [];

    for (const key of cellKeys) {
      const cell = this.cells.get(key);
      if (!cell) continue;

      for (const id of cell) {
        if (seen.has(id)) continue;
        seen.add(id);

        const entry = this.entries.get(id);
        if (entry && this.boundsOverlap(entry.bounds, bounds)) {
          results.push(id);
        }
      }
    }

    return results;
  }

  clear(): void {
    this.entries.clear();
    this.cells.clear();
  }

  get size(): number {
    return this.entries.size;
  }

  getBounds(id: string): Bounds | undefined {
    return this.entries.get(id)?.bounds;
  }

  private getCellKeys(bounds: Bounds): string[] {
    const minCellX = Math.floor(bounds.minX / this.cellSize);
    const minCellY = Math.floor(bounds.minY / this.cellSize);
    const maxCellX = Math.floor(bounds.maxX / this.cellSize);
    const maxCellY = Math.floor(bounds.maxY / this.cellSize);

    const keys: string[] = [];
    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        keys.push(`${cx}:${cy}`);
      }
    }
    return keys;
  }

  private boundsOverlap(a: Bounds, b: Bounds): boolean {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
  }
}

const spatialGrid = new SpatialGrid();

export default spatialGrid;
