export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface Floor {
  id: string;
  points: Point[];
  elevation: number;
  thickness: number;
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  height: number;
  thickness: number;
  openings: Opening[];
  connected?: boolean;
}

export interface Opening {
  id: string;
  type: 'window' | 'door';
  width: number;
  height: number;
  elevation: number; // from the base of the wall or from floor level? Assuming from floor for now.
  position: number; // distance from the start point of the wall
}

// New types for flat layout system
export interface FlatPiece {
  id: string;
  type: 'floor' | 'wall';
  position: Point; // Position in the flat layout canvas
  rotation: number; // Rotation in degrees
  dimensions: { width: number; height: number };
  color?: string;
  label?: string;
  openings: FlatOpening[];
}

export interface FlatOpening {
  id: string;
  type: 'window' | 'door';
  position: Point; // Position relative to the piece
  dimensions: { width: number; height: number };
  color?: string;
}

export interface Connection {
  id: string;
  fromPieceId: string;
  toPieceId: string;
  fromEdge: 'top' | 'bottom' | 'left' | 'right';
  toEdge: 'top' | 'bottom' | 'left' | 'right';
  fromPosition: number; // Position along the edge (0-1)
  toPosition: number; // Position along the edge (0-1)
  length: number; // Length of the connection
  color?: string;
}

export interface Truss {
  spacing: number;
  // other properties as needed - will keep simple for now
}

export interface Model {
  floors: Floor[];
  walls: Wall[];
  flatPieces: FlatPiece[];
  connections: Connection[];
  trusses: Truss;
  settings: {
    gridVisible: boolean;
    gridSize: number;
    units: 'metric' | 'imperial';
    mode: 'traditional' | 'flat-layout';
  };
}
