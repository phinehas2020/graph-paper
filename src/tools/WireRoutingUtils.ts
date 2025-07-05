import { Point, FlatPiece, ElectricalOutlet, ElectricalSwitch, WireRun } from '@/src/model/types';

// A* pathfinding algorithm adapted for electrical wire routing
interface PathNode {
  point: Point;
  gCost: number; // Distance from start
  hCost: number; // Heuristic distance to end
  fCost: number; // Total cost
  parent: PathNode | null;
  isWallPath: boolean; // Whether this node is along a wall
}

export class WireRoutingEngine {
  private walls: FlatPiece[];
  private gridSize: number;
  private wallProximityThreshold: number;

  constructor(walls: FlatPiece[], gridSize: number = 1, wallProximityThreshold: number = 2) {
    this.walls = walls.filter(piece => piece.type === 'wall');
    this.gridSize = gridSize;
    this.wallProximityThreshold = wallProximityThreshold;
  }

  /**
   * Calculate the optimal wire route between two points, following walls when possible
   */
  calculateWireRoute(start: Point, end: Point, wireType: '12AWG' | '14AWG' | '10AWG' | '8AWG'): WireRun {
    const path = this.findOptimalPath(start, end);
    const length = this.calculatePathLength(path);
    const cost = this.calculateWireCost(wireType, length);

    return {
      id: this.generateId(),
      name: `Wire Run ${start.x},${start.y} to ${end.x},${end.y}`,
      startPoint: start,
      endPoint: end,
      path,
      wireType,
      wireCount: 1,
      length,
      cost,
      circuitId: '',
      followsWalls: this.pathFollowsWalls(path)
    };
  }

  /**
   * Find the optimal path using A* algorithm with wall preference
   */
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
      // Find node with lowest fCost
      let currentNode = openSet[0];
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].fCost < currentNode.fCost || 
            (openSet[i].fCost === currentNode.fCost && openSet[i].hCost < currentNode.hCost)) {
          currentNode = openSet[i];
        }
      }

      // Move current node from open to closed set
      openSet.splice(openSet.indexOf(currentNode), 1);
      closedSet.push(currentNode);

      // Check if we've reached the destination
      if (this.calculateDistance(currentNode.point, end) < this.gridSize) {
        return this.reconstructPath(currentNode);
      }

      // Check neighbors
      const neighbors = this.getNeighbors(currentNode.point);
      for (const neighbor of neighbors) {
        if (closedSet.some(node => this.pointsEqual(node.point, neighbor))) {
          continue;
        }

        const isWallPath = this.isNearWall(neighbor);
        const gCost = currentNode.gCost + this.calculateDistance(currentNode.point, neighbor);
        
        // Apply wall preference bonus
        const wallBonus = isWallPath ? -0.5 : 0; // Prefer wall paths
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

    // If no path found, return direct line
    return [start, end];
  }

  /**
   * Check if a point is near a wall
   */
  private isNearWall(point: Point): boolean {
    for (const wall of this.walls) {
      const distance = this.distanceToWall(point, wall);
      if (distance <= this.wallProximityThreshold) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate distance from a point to a wall
   */
  private distanceToWall(point: Point, wall: FlatPiece): number {
    // Simplified distance calculation to wall rectangle
    const wallLeft = wall.position.x;
    const wallRight = wall.position.x + wall.dimensions.width;
    const wallTop = wall.position.y;
    const wallBottom = wall.position.y + wall.dimensions.height;

    const dx = Math.max(wallLeft - point.x, 0, point.x - wallRight);
    const dy = Math.max(wallTop - point.y, 0, point.y - wallBottom);

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get neighboring points for pathfinding
   */
  private getNeighbors(point: Point): Point[] {
    const neighbors: Point[] = [];
    const directions = [
      { x: 0, y: this.gridSize },   // North
      { x: this.gridSize, y: 0 },   // East
      { x: 0, y: -this.gridSize },  // South
      { x: -this.gridSize, y: 0 },  // West
      { x: this.gridSize, y: this.gridSize },     // Northeast
      { x: this.gridSize, y: -this.gridSize },    // Southeast
      { x: -this.gridSize, y: -this.gridSize },   // Southwest
      { x: -this.gridSize, y: this.gridSize }     // Northwest
    ];

    for (const dir of directions) {
      neighbors.push({
        x: point.x + dir.x,
        y: point.y + dir.y
      });
    }

    return neighbors;
  }

  /**
   * Reconstruct the path from the final node
   */
  private reconstructPath(node: PathNode): Point[] {
    const path: Point[] = [];
    let current: PathNode | null = node;

    while (current !== null) {
      path.unshift(current.point);
      current = current.parent;
    }

    return this.simplifyPath(path);
  }

  /**
   * Simplify path by removing unnecessary intermediate points
   */
  private simplifyPath(path: Point[]): Point[] {
    if (path.length <= 2) return path;

    const simplified: Point[] = [path[0]];
    
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const next = path[i + 1];

      // Check if current point is necessary (not on straight line)
      const angle1 = Math.atan2(current.y - prev.y, current.x - prev.x);
      const angle2 = Math.atan2(next.y - current.y, next.x - current.x);
      
      const angleDiff = Math.abs(angle1 - angle2);
      
      // If angle difference is significant, keep the point
      if (angleDiff > 0.1) {
        simplified.push(current);
      }
    }

    simplified.push(path[path.length - 1]);
    return simplified;
  }

  /**
   * Calculate the total length of a path
   */
  private calculatePathLength(path: Point[]): number {
    let totalLength = 0;
    for (let i = 1; i < path.length; i++) {
      totalLength += this.calculateDistance(path[i - 1], path[i]);
    }
    return totalLength;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: Point, point2: Point): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + 
      Math.pow(point2.y - point1.y, 2)
    );
  }

  /**
   * Check if two points are equal
   */
  private pointsEqual(point1: Point, point2: Point): boolean {
    return Math.abs(point1.x - point2.x) < 0.01 && Math.abs(point1.y - point2.y) < 0.01;
  }

  /**
   * Check if a path follows walls
   */
  private pathFollowsWalls(path: Point[]): boolean {
    let wallPoints = 0;
    for (const point of path) {
      if (this.isNearWall(point)) {
        wallPoints++;
      }
    }
    return wallPoints / path.length > 0.7; // 70% of path near walls
  }

  /**
   * Calculate wire cost based on type and length
   */
  private calculateWireCost(wireType: '12AWG' | '14AWG' | '10AWG' | '8AWG', length: number): number {
    const wirePrices: { [key: string]: number } = {
      '14AWG': 0.45, // per foot
      '12AWG': 0.65,
      '10AWG': 0.95,
      '8AWG': 1.35
    };

    return (wirePrices[wireType] || 0.45) * length;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
  }
}

/**
 * Electrical Code Compliance Utilities
 */
export class ElectricalCodeChecker {
  /**
   * Check outlet spacing compliance (NEC 210.52)
   */
  static checkOutletSpacing(outlets: ElectricalOutlet[], walls: FlatPiece[]): string[] {
    const violations: string[] = [];
    
    // Check 12-foot rule for general outlets
    for (let i = 0; i < outlets.length; i++) {
      for (let j = i + 1; j < outlets.length; j++) {
        const distance = Math.sqrt(
          Math.pow(outlets[i].position.x - outlets[j].position.x, 2) +
          Math.pow(outlets[i].position.y - outlets[j].position.y, 2)
        );
        
        if (distance > 12) {
          violations.push(`Outlets more than 12 feet apart: ${outlets[i].id} and ${outlets[j].id}`);
        }
      }
    }

    return violations;
  }

  /**
   * Check GFCI requirements
   */
  static checkGFCIRequirements(outlets: ElectricalOutlet[]): string[] {
    const violations: string[] = [];
    
    outlets.forEach(outlet => {
      if ((outlet.roomType === 'bathroom' || outlet.roomType === 'kitchen') && 
          outlet.type !== 'gfci') {
        violations.push(`Outlet ${outlet.id} in ${outlet.roomType} requires GFCI protection`);
      }
    });

    return violations;
  }

  /**
   * Calculate circuit load
   */
  static calculateCircuitLoad(outlets: ElectricalOutlet[], switches: ElectricalSwitch[]): number {
    let totalLoad = 0;
    
    outlets.forEach(outlet => {
      totalLoad += outlet.amperage;
    });
    
    // Switches typically don't add significant load
    return totalLoad;
  }

  /**
   * Check wire sizing for circuit load
   */
  static checkWireSizing(wireType: string, circuitLoad: number): boolean {
    const wireCapacities: { [key: string]: number } = {
      '14AWG': 15, // 15 amp max
      '12AWG': 20, // 20 amp max
      '10AWG': 30, // 30 amp max
      '8AWG': 50   // 50 amp max
    };

    const capacity = wireCapacities[wireType] || 15;
    return circuitLoad <= capacity * 0.8; // 80% rule
  }
}
