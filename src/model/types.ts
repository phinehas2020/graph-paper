export interface Point {
  x: number;
  y: number;
}

// Traditional CAD-style Types for Canvas2D
export interface Wall {
  id: string;
  start: Point;
  end: Point;
  height: number;
  thickness: number;
  connected?: boolean;
  connections?: {
    start?: string[];
    end?: string[];
  };
}

export interface Floor {
  id: string;
  points: Point[];
  elevation: number;
  thickness: number;
}

// Flat Layout Types
export interface FlatPiece {
  id: string;
  type: 'floor' | 'wall';
  position: Point;
  rotation: number;
  dimensions: { width: number; height: number };
  color: string;
  label: string;
  openings: FlatOpening[];
}

export interface FlatOpening {
  id: string;
  type: 'window' | 'door';
  position: Point;
  dimensions: { width: number; height: number };
  material?: string;
  energyRating?: string;
  swingDirection?: 'inward' | 'outward' | 'left' | 'right';
}

// House Design Types
export interface ElectricalOutlet {
  id: string;
  position: Point;
  type: 'standard' | 'gfci' | 'usb' | '20amp' | 'outdoor';
  voltage: number;
  amperage: number;
  height: number; // Height from floor in inches
  circuitId?: string;
}

export interface ElectricalSwitch {
  id: string;
  position: Point;
  type: 'single' | 'double' | 'triple' | 'dimmer' | 'fan' | 'timer';
  height: number; // Height from floor in inches
  controlsOutletId?: string;
}

export interface ElectricalWire {
  id: string;
  fromId: string;
  toId: string;
  wireType: '12AWG' | '14AWG' | '10AWG' | '8AWG';
  voltage: number;
  amperage: number;
  path: Point[];
}

export interface PlumbingFixture {
  id: string;
  position: Point;
  type: 'sink' | 'toilet' | 'shower' | 'bathtub' | 'washer' | 'dishwasher';
  waterPressure: number;
  drainSize: number; // Inches
  hotWater: boolean;
  ventRequired: boolean;
}

export interface PlumbingPipe {
  id: string;
  fromId: string;
  toId: string;
  pipeType: 'hot' | 'cold' | 'drain' | 'vent';
  diameter: number; // Inches
  material: 'PEX' | 'copper' | 'PVC' | 'cast iron';
  path: Point[];
}

export interface BuildingCodeViolation {
  id: string;
  type: 'electrical' | 'plumbing' | 'structural';
  severity: 'warning' | 'error';
  message: string;
  position?: Point;
  affectedElementIds: string[];
}

export interface Connection {
  id: string;
  fromPieceId: string;
  fromEdge: 'top' | 'bottom' | 'left' | 'right';
  toPieceId: string;
  toEdge: 'top' | 'bottom' | 'left' | 'right';
  fromPosition: number;
  toPosition: number;
  length: number;
  color: string;
}

export interface Measurement {
  id: string;
  start: Point;
  end: Point;
  label?: string;
  showDimensions: boolean;
  units: 'metric' | 'imperial';
  temporary?: boolean; // Whether this measurement disappears when switching tools
}

export interface TextElement {
  id: string;
  position: Point;
  text: string;
  fontSize: number;
  color: string;
  rotation: number; // in degrees
}

export interface Model {
  measurements: Measurement[];
  textElements: TextElement[];
  // Traditional CAD Data for Canvas2D
  walls: Wall[];
  floors: Floor[];
  // Flat Layout Data
  flatPieces: FlatPiece[];
  connections: Connection[];
  // House Design Data
  electricalOutlets: ElectricalOutlet[];
  electricalSwitches: ElectricalSwitch[];
  electricalWires: ElectricalWire[];
  plumbingFixtures: PlumbingFixture[];
  plumbingPipes: PlumbingPipe[];
  buildingCodeViolations: BuildingCodeViolation[];
  settings: {
    gridVisible: boolean;
    gridSize: number;
    units: 'metric' | 'imperial';
    measurementMode: 'persistent' | 'temporary'; // New setting for measurements
    isTextEditing: boolean; // New setting to track text editing state
    mode: 'traditional' | 'flat-layout' | 'residential'; // Updated mode setting
    buildingCodeEnabled: boolean; // Building code validation
  };
}
