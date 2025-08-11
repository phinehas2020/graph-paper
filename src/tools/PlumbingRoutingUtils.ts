import { Point, FlatPiece, PlumbingPipe } from '@/src/model/types';

interface PathNode {
  point: Point;
  gCost: number;
  hCost: number;
  fCost: number;
  parent: PathNode | null;
  isWallPath: boolean;
}

export class PlumbingRoutingEngine {
  private walls: FlatPiece[];
  private gridSize: number;
  private wallProximityThreshold: number;
  private pipePrices: { [key: string]: number };

  constructor(
    walls: FlatPiece[],
    gridSize: number = 1,
    wallProximityThreshold: number = 2,
    pipePrices: { [key: string]: number } = {
      PEX: 0.5,
      copper: 3.0,
      PVC: 0.75,
      'cast iron': 4.0
    }
  ) {
    this.walls = walls.filter(piece => piece.type === 'wall');
    this.gridSize = gridSize;
    this.wallProximityThreshold = wallProximityThreshold;
    this.pipePrices = pipePrices;
  }

  calculatePipeRoute(
    fromId: string,
    toId: string,
    start: Point,
    end: Point,
    pipeType: 'hot' | 'cold' | 'drain' | 'vent',
    material: 'PEX' | 'copper' | 'PVC' | 'cast iron',
    diameter: number = 1
  ): PlumbingPipe {
    const path = this.findOptimalPath(start, end);
    const length = this.calculatePathLength(path);
    const cost = this.calculatePipeCost(material, length);

    return {
      id: this.generateId(),
      fromId,
      toId,
      pipeType,
      diameter,
      material,
      path,
      length,
      cost
    };
  }

  private findOptimalPath(start: Point, end: Point): Point[] {
    const openSet: PathNode[] = [];
    const closedSet: PathNode[] = [];
    const startNode: PathNode = {
      point: start,
      gCost: 0,
      hCost: this.calculateDistance(start, end),
      fCost: 0,
      parent: null,
      isWallPath: this.isNearWall(start)
    };
    startNode.fCost = startNode.gCost + startNode.hCost;
    openSet.push(startNode);

    while (openSet.length > 0) {
      let currentNode = openSet[0];
      for (let i = 1; i < openSet.length; i++) {
        if (
          openSet[i].fCost < currentNode.fCost ||
          (openSet[i].fCost === currentNode.fCost && openSet[i].hCost < currentNode.hCost)
        ) {
          currentNode = openSet[i];
        }
      }

      openSet.splice(openSet.indexOf(currentNode), 1);
      closedSet.push(currentNode);

      if (this.calculateDistance(currentNode.point, end) < this.gridSize) {
        return this.reconstructPath(currentNode);
      }

      const neighbors = this.getNeighbors(currentNode.point);
      for (const neighbor of neighbors) {
        if (closedSet.some(node => this.pointsEqual(node.point, neighbor))) {
          continue;
        }

        const isWallPath = this.isNearWall(neighbor);
        const gCost = currentNode.gCost + this.calculateDistance(currentNode.point, neighbor);
        const wallBonus = isWallPath ? -0.5 : 0;
        const adjustedGCost = gCost + wallBonus;
        const existingNode = openSet.find(node => this.pointsEqual(node.point, neighbor));

        if (!existingNode) {
          const newNode: PathNode = {
            point: neighbor,
            gCost: adjustedGCost,
            hCost: this.calculateDistance(neighbor, end),
            fCost: 0,
            parent: currentNode,
            isWallPath
          };
          newNode.fCost = newNode.gCost + newNode.hCost;
          openSet.push(newNode);
        } else if (adjustedGCost < existingNode.gCost) {
          existingNode.gCost = adjustedGCost;
          existingNode.fCost = existingNode.gCost + existingNode.hCost;
          existingNode.parent = currentNode;
        }
      }
    }

    return [start, end];
  }

  private isNearWall(point: Point): boolean {
    for (const wall of this.walls) {
      const distance = this.distanceToWall(point, wall);
      if (distance <= this.wallProximityThreshold) {
        return true;
      }
    }
    return false;
  }

  private distanceToWall(point: Point, wall: FlatPiece): number {
    const wallLeft = wall.position.x;
    const wallRight = wall.position.x + wall.dimensions.width;
    const wallTop = wall.position.y;
    const wallBottom = wall.position.y + wall.dimensions.height;

    const dx = Math.max(wallLeft - point.x, 0, point.x - wallRight);
    const dy = Math.max(wallTop - point.y, 0, point.y - wallBottom);

    return Math.sqrt(dx * dx + dy * dy);
  }

  private getNeighbors(point: Point): Point[] {
    const neighbors: Point[] = [];
    const directions = [
      { x: 0, y: this.gridSize },
      { x: this.gridSize, y: 0 },
      { x: 0, y: -this.gridSize },
      { x: -this.gridSize, y: 0 },
      { x: this.gridSize, y: this.gridSize },
      { x: this.gridSize, y: -this.gridSize },
      { x: -this.gridSize, y: -this.gridSize },
      { x: -this.gridSize, y: this.gridSize }
    ];

    for (const dir of directions) {
      neighbors.push({ x: point.x + dir.x, y: point.y + dir.y });
    }

    return neighbors;
  }

  private reconstructPath(node: PathNode): Point[] {
    const path: Point[] = [];
    let current: PathNode | null = node;
    while (current !== null) {
      path.unshift(current.point);
      current = current.parent;
    }
    return this.simplifyPath(path);
  }

  private simplifyPath(path: Point[]): Point[] {
    if (path.length <= 2) return path;
    const simplified: Point[] = [path[0]];
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const next = path[i + 1];
      const angle1 = Math.atan2(current.y - prev.y, current.x - prev.x);
      const angle2 = Math.atan2(next.y - current.y, next.x - current.x);
      const angleDiff = Math.abs(angle1 - angle2);
      if (angleDiff > 0.1) {
        simplified.push(current);
      }
    }
    simplified.push(path[path.length - 1]);
    return simplified;
  }

  private calculatePathLength(path: Point[]): number {
    let totalLength = 0;
    for (let i = 1; i < path.length; i++) {
      totalLength += this.calculateDistance(path[i - 1], path[i]);
    }
    return totalLength;
  }

  private calculateDistance(point1: Point, point2: Point): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) +
      Math.pow(point2.y - point1.y, 2)
    );
  }

  private pointsEqual(point1: Point, point2: Point): boolean {
    return Math.abs(point1.x - point2.x) < 0.01 && Math.abs(point1.y - point2.y) < 0.01;
  }

  private calculatePipeCost(material: string, length: number): number {
    return (this.pipePrices[material] || 0) * length;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
  }
}

