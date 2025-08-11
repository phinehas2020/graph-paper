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
  roomType?: string; // For code compliance
  wallId?: string; // Reference to wall it's attached to
}

export interface ElectricalSwitch {
  id: string;
  position: Point;
  type: 'single' | 'double' | 'triple' | 'dimmer' | 'fan' | 'timer';
  height: number; // Height from floor in inches
  controlsOutletId?: string;
  circuitId?: string;
  wallId?: string; // Reference to wall it's attached to
}

export interface ElectricalWire {
  id: string;
  fromId: string;
  toId: string;
  wireType: '12AWG' | '14AWG' | '10AWG' | '8AWG';
  voltage: number;
  amperage: number;
  path: Point[];
  length?: number; // Calculated wire length in feet
  cost?: number; // Calculated cost based on wire type and length
}

// New enhanced electrical types
export interface ElectricalCircuit {
  id: string;
  name: string;
  breakerSize: number; // Amperage rating
  wireType: '12AWG' | '14AWG' | '10AWG' | '8AWG';
  voltage: number;
  outletIds: string[];
  switchIds: string[];
  wireIds: string[];
  currentLoad: number; // Current calculated load in amps
  maxLoad: number; // Maximum safe load (80% of breaker rating)
  panelId: string;
  circuitNumber: number;
  type: 'general' | 'kitchen' | 'bathroom' | 'laundry' | 'lighting' | 'appliance';
}

export interface ElectricalPanel {
  id: string;
  name: string;
  position: Point;
  type: 'main' | 'sub';
  amperage: number; // Panel amperage rating
  voltage: number;
  circuits: ElectricalCircuit[];
  totalLoad: number; // Total calculated load
  maxLoad: number; // Maximum safe load
  busySlots: number; // Number of used breaker slots
  totalSlots: number; // Total available breaker slots
}

export interface WireRun {
  id: string;
  name: string;
  startPoint: Point;
  endPoint: Point;
  path: Point[];
  wireType: '12AWG' | '14AWG' | '10AWG' | '8AWG';
  wireCount: number; // Number of wires in this run
  length: number; // Total length in feet
  cost: number; // Total cost for this run
  circuitId: string;
  followsWalls: boolean; // Whether this run follows wall paths
}

export interface WireCostCalculation {
  wireType: '12AWG' | '14AWG' | '10AWG' | '8AWG';
  pricePerFoot: number;
  totalLength: number;
  totalCost: number;
}

export interface ElectricalCodeViolation extends BuildingCodeViolation {
  codeSection: string; // NEC code section reference
  recommendedFix: string;
}

export interface ElectricalProject {
  id: string;
  name: string;
  panels: ElectricalPanel[];
  circuits: ElectricalCircuit[];
  wireRuns: WireRun[];
  totalWireCost: number;
  totalOutlets: number;
  totalSwitches: number;
  codeViolations: ElectricalCodeViolation[];
  wireUsageSummary: WireCostCalculation[];
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
  length: number; // Total length in feet
  cost: number; // Total cost for this pipe run
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
  electricalCircuits: ElectricalCircuit[];
  electricalPanels: ElectricalPanel[];
  wireRuns: WireRun[];
  electricalProject?: ElectricalProject;
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
    wireTracking: boolean; // Enable wire usage tracking
    wirePrices: { [key: string]: number }; // Wire prices per foot
    pipePrices: { [key: string]: number }; // Pipe prices per foot
  };
}
