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

export interface Truss {
  spacing: number;
  // other properties as needed - will keep simple for now
}

export interface Model {
  floors: Floor[];
  walls: Wall[];
  trusses: Truss;
  settings: {
    gridVisible: boolean;
    gridSize: number;
    units: 'metric' | 'imperial';
  };
}
