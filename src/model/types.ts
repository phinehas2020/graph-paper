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

// New types for wiring system
export interface ElectricalOutlet {
  id: string;
  type: 'standard' | 'gfci' | 'usb' | 'dedicated' | 'switched';
  position: Point;
  wallId?: string; // if attached to a wall
  height: number; // height from floor
  isCodeRequired: boolean; // automatically placed for code compliance
}

export interface ElectricalSwitch {
  id: string;
  type: 'single' | 'double' | 'three-way' | 'dimmer';
  position: Point;
  wallId?: string;
  height: number;
  controlsOutlets: string[]; // outlet IDs this switch controls
}

export interface ElectricalWiring {
  id: string;
  points: Point[]; // wire path
  type: '15amp' | '20amp' | '30amp' | 'dedicated';
  color: string;
  outlets: ElectricalOutlet[];
  switches: ElectricalSwitch[];
}

// New types for plumbing system
export interface PlumbingFixture {
  id: string;
  type: 'sink' | 'toilet' | 'shower' | 'bathtub' | 'washer' | 'dishwasher';
  position: Point;
  rotation: number; // rotation angle in degrees
  requiresHotWater: boolean;
  requiresDrain: boolean;
  waterPressureRequired: number; // PSI
}

export interface PlumbingPipe {
  id: string;
  points: Point[];
  type: 'hot' | 'cold' | 'drain' | 'vent';
  diameter: number; // inches
  color: string;
}

export interface PlumbingSystem {
  id: string;
  fixtures: PlumbingFixture[];
  pipes: PlumbingPipe[];
  mainWaterLine: Point;
  mainDrainLine: Point;
}

// Enhanced opening types
export interface EnhancedOpening extends Opening {
  style?: 'casement' | 'double-hung' | 'sliding' | 'fixed' | 'single' | 'double' | 'french';
  material?: 'wood' | 'vinyl' | 'aluminum' | 'fiberglass';
  energyRating?: number; // U-factor for windows
  swingDirection?: 'left' | 'right' | 'inward' | 'outward'; // for doors
  isExterior?: boolean;
}

export interface Truss {
  spacing: number;
  // other properties as needed - will keep simple for now
}

export interface BuildingCode {
  maxOutletSpacing: number; // feet - maximum distance between outlets
  minKitchenOutlets: number;
  minBathroomOutlets: number;
  gfciRequired: string[]; // room types requiring GFCI
  switchHeight: number; // standard switch height
  outletHeight: number; // standard outlet height
}

export interface Model {
  floors: Floor[];
  walls: Wall[];
  trusses: Truss;
  wiring: ElectricalWiring[];
  plumbing: PlumbingSystem[];
  buildingCode: BuildingCode;
  settings: {
    gridVisible: boolean;
    gridSize: number;
    units: 'metric' | 'imperial';
    designMode: 'graph' | 'residential';
  };
}
