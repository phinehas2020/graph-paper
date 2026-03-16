import { create } from 'zustand';
import { current, isDraft, produce } from 'immer';
import { Model, Measurement, TextElement, Wall, Floor, FlatPiece, FlatOpening, Connection, ElectricalOutlet, ElectricalSwitch, ElectricalWire, ElectricalCircuit, ElectricalPanel, WireRun, ElectricalProject, PlumbingFixture, PlumbingPipe, BuildingCodeViolation, WallOpening } from './types';

// Helper for ID generation
const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);
const DEFAULT_WALL_COLOR = '#f5f3ef';
const PLANNER_HISTORY_LIMIT = 80;

type PlannerSnapshot = Pick<Model, 'measurements' | 'textElements' | 'walls' | 'floors'>;

function clonePlannerSlice<T>(value: T): T {
  const plainValue = isDraft(value) ? current(value as never) : value;
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(plainValue) as T;
  }

  return JSON.parse(JSON.stringify(plainValue)) as T;
}

const clonePlannerSnapshot = (
  source: Pick<Model, 'measurements' | 'textElements' | 'walls' | 'floors'>,
): PlannerSnapshot => ({
  measurements: clonePlannerSlice(source.measurements),
  textElements: clonePlannerSlice(source.textElements),
  walls: clonePlannerSlice(source.walls),
  floors: clonePlannerSlice(source.floors),
});

function getWallLength(wall: Wall) {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

function getOpeningCenterDistance(wall: Wall, opening: WallOpening) {
  return getWallLength(wall) * opening.offset;
}

function clampWallOpening(
  wall: Wall,
  opening: WallOpening,
  openingId?: string,
): WallOpening {
  const wallLength = getWallLength(wall);
  if (wallLength <= 0) {
    return {
      ...opening,
      width: 0.8,
      height: Math.max(0.8, Math.min(opening.height, wall.height)),
      bottom: Math.max(0, Math.min(opening.bottom, Math.max(0, wall.height - 0.8))),
      offset: 0.5,
    };
  }

  const bottom = Math.max(0, Math.min(opening.bottom, Math.max(0, wall.height - 0.8)));
  const maxHeight = Math.max(0.8, wall.height - bottom - 0.08);
  const height = Math.max(0.8, Math.min(opening.height, maxHeight));
  const center = Math.max(0, Math.min(wallLength, opening.offset * wallLength));

  let maxWidth = Math.max(0.8, wallLength - 0.4);
  maxWidth = Math.min(maxWidth, Math.max(0.8, center * 2), Math.max(0.8, (wallLength - center) * 2));

  for (const sibling of wall.openings ?? []) {
    if (sibling.id === openingId) {
      continue;
    }

    const siblingCenter = getOpeningCenterDistance(wall, sibling);
    const clearance = Math.abs(siblingCenter - center) - sibling.width / 2 - 0.25;
    maxWidth = Math.min(maxWidth, Math.max(0.8, clearance * 2));
  }

  const width = Math.max(0.8, Math.min(opening.width, maxWidth));
  const halfRatio = width / (2 * wallLength);
  const offset = Math.max(halfRatio, Math.min(1 - halfRatio, opening.offset));

  return {
    ...opening,
    width,
    height,
    bottom,
    offset,
  };
}

const initialState: Model = {
  measurements: [],
  textElements: [],
  walls: [],
  floors: [],
  flatPieces: [],
  connections: [],
  electricalOutlets: [],
  electricalSwitches: [],
  electricalWires: [],
  electricalCircuits: [],
  electricalPanels: [],
  wireRuns: [],
  electricalProject: undefined,
  plumbingFixtures: [],
  plumbingPipes: [],
  buildingCodeViolations: [],
  settings: {
    gridVisible: true,
    gridSize: 1,
    units: 'imperial',
    measurementMode: 'persistent',
    isTextEditing: false,
    mode: 'traditional',
    buildingCodeEnabled: true,
    wireTracking: true,
    wirePrices: {
      '14AWG': 0.45,
      '12AWG': 0.65,
      '10AWG': 0.95,
      '8AWG': 1.35
    },
    pipePrices: {
      PEX: 0.5,
      copper: 3.0,
      PVC: 0.75,
      'cast iron': 4.0
    }
  },
};

interface StoreActions {
  addMeasurement: (measurementData: Omit<Measurement, 'id'>) => string;
  updateMeasurement: (id: string, updates: Partial<Omit<Measurement, 'id'>>) => void;
  deleteMeasurement: (id: string) => void;
  addTextElement: (textData: Omit<TextElement, 'id'>) => string;
  updateTextElement: (id: string, updates: Partial<Omit<TextElement, 'id'>>) => void;
  deleteTextElement: (id: string) => void;
  updateSettings: (settings: Partial<Model['settings']>) => void;
  clearTemporaryMeasurements: () => void;
  // Traditional CAD Actions for Canvas2D
  addWall: (wallData: Omit<Wall, 'id'>) => string;
  updateWall: (id: string, updates: Partial<Omit<Wall, 'id'>>) => void;
  deleteWall: (id: string) => void;
  addWallOpening: (wallId: string, openingData: Omit<WallOpening, 'id'>) => string;
  updateWallOpening: (wallId: string, openingId: string, updates: Partial<Omit<WallOpening, 'id'>>) => void;
  deleteWallOpening: (wallId: string, openingId: string) => void;
  addFloor: (floorData: Omit<Floor, 'id'>) => string;
  updateFloor: (id: string, updates: Partial<Omit<Floor, 'id'>>) => void;
  deleteFloor: (id: string) => void;
  connectWalls: (wallId1: string, wallId2: string) => void;
  autoConnectNearbyWalls: (threshold: number) => void;
  // Flat Layout Actions
  addFlatPiece: (pieceData: Omit<FlatPiece, 'id'>) => string;
  updateFlatPiece: (id: string, updates: Partial<Omit<FlatPiece, 'id'>>) => void;
  deleteFlatPiece: (id: string) => void;
  addFlatOpening: (pieceId: string, openingData: Omit<FlatOpening, 'id'>) => string;
  updateFlatOpening: (pieceId: string, openingId: string, updates: Partial<Omit<FlatOpening, 'id'>>) => void;
  deleteFlatOpening: (pieceId: string, openingId: string) => void;
  addConnection: (connectionData: Omit<Connection, 'id'>) => string;
  updateConnection: (id: string, updates: Partial<Omit<Connection, 'id'>>) => void;
  deleteConnection: (id: string) => void;
  switchMode: (mode: 'traditional' | 'flat-layout' | 'residential') => void;
  stitchPieces: () => void;
  // House Design Actions
  addElectricalOutlet: (outletData: Omit<ElectricalOutlet, 'id'>) => string;
  updateElectricalOutlet: (id: string, updates: Partial<Omit<ElectricalOutlet, 'id'>>) => void;
  deleteElectricalOutlet: (id: string) => void;
  addElectricalSwitch: (switchData: Omit<ElectricalSwitch, 'id'>) => string;
  updateElectricalSwitch: (id: string, updates: Partial<Omit<ElectricalSwitch, 'id'>>) => void;
  deleteElectricalSwitch: (id: string) => void;
  addElectricalWire: (wireData: Omit<ElectricalWire, 'id'>) => string;
  updateElectricalWire: (id: string, updates: Partial<Omit<ElectricalWire, 'id'>>) => void;
  deleteElectricalWire: (id: string) => void;
  addElectricalCircuit: (circuitData: Omit<ElectricalCircuit, 'id'>) => string;
  updateElectricalCircuit: (id: string, updates: Partial<Omit<ElectricalCircuit, 'id'>>) => void;
  deleteElectricalCircuit: (id: string) => void;
  addElectricalPanel: (panelData: Omit<ElectricalPanel, 'id'>) => string;
  updateElectricalPanel: (id: string, updates: Partial<Omit<ElectricalPanel, 'id'>>) => void;
  deleteElectricalPanel: (id: string) => void;
  addWireRun: (wireRunData: Omit<WireRun, 'id'>) => string;
  updateWireRun: (id: string, updates: Partial<Omit<WireRun, 'id'>>) => void;
  deleteWireRun: (id: string) => void;
  calculateWireRuns: () => void;
  updateWirePrices: (prices: { [key: string]: number }) => void;
  updatePipePrices: (prices: { [key: string]: number }) => void;
  undoPlanner: () => void;
  redoPlanner: () => void;
  addPlumbingFixture: (fixtureData: Omit<PlumbingFixture, 'id'>) => string;
  updatePlumbingFixture: (id: string, updates: Partial<Omit<PlumbingFixture, 'id'>>) => void;
  deletePlumbingFixture: (id: string) => void;
  addPlumbingPipe: (pipeData: Omit<PlumbingPipe, 'id'>) => string;
  updatePlumbingPipe: (id: string, updates: Partial<Omit<PlumbingPipe, 'id'>>) => void;
  deletePlumbingPipe: (id: string) => void;
  addBuildingCodeViolation: (violationData: Omit<BuildingCodeViolation, 'id'>) => string;
  updateBuildingCodeViolation: (id: string, updates: Partial<Omit<BuildingCodeViolation, 'id'>>) => void;
  deleteBuildingCodeViolation: (id: string) => void;
  clearBuildingCodeViolations: () => void;
  validateBuildingCode: () => void;
}

interface StoreSelectors {
  selectMeasurements: () => Measurement[];
  selectTextElements: () => TextElement[];
  selectMeasurementById: (id: string) => Measurement | undefined;
  selectTextElementById: (id: string) => TextElement | undefined;
  selectSettings: () => Model['settings'];
  // Traditional CAD Selectors for Canvas2D
  selectWalls: () => Wall[];
  selectFloors: () => Floor[];
  selectWallById: (id: string) => Wall | undefined;
  selectWallOpenings: (wallId: string) => WallOpening[];
  selectFloorById: (id: string) => Floor | undefined;
  // Flat Layout Selectors
  selectFlatPieces: () => FlatPiece[];
  selectConnections: () => Connection[];
  selectFlatPieceById: (id: string) => FlatPiece | undefined;
  selectConnectionById: (id: string) => Connection | undefined;
  selectFlatOpeningsByPieceId: (pieceId: string) => FlatOpening[] | undefined;
  // House Design Selectors
  selectElectricalOutlets: () => ElectricalOutlet[];
  selectElectricalSwitches: () => ElectricalSwitch[];
  selectElectricalWires: () => ElectricalWire[];
  selectElectricalCircuits: () => ElectricalCircuit[];
  selectElectricalPanels: () => ElectricalPanel[];
  selectWireRuns: () => WireRun[];
  selectWireUsageSummary: () => {
    totalCost: number;
    totalLength: number;
    wireTypes: { [key: string]: { length: number; cost: number } };
  };
  selectElectricalProject: () => ElectricalProject | undefined;
  selectPlumbingFixtures: () => PlumbingFixture[];
  selectPlumbingPipes: () => PlumbingPipe[];
  selectBuildingCodeViolations: () => BuildingCodeViolation[];
  selectElectricalOutletById: (id: string) => ElectricalOutlet | undefined;
  selectElectricalSwitchById: (id: string) => ElectricalSwitch | undefined;
  selectElectricalCircuitById: (id: string) => ElectricalCircuit | undefined;
  selectElectricalPanelById: (id: string) => ElectricalPanel | undefined;
  selectWireRunById: (id: string) => WireRun | undefined;
  selectPlumbingFixtureById: (id: string) => PlumbingFixture | undefined;
}

interface PlannerHistoryState {
  plannerHistoryPast: PlannerSnapshot[];
  plannerHistoryFuture: PlannerSnapshot[];
}

type StoreState = Model & PlannerHistoryState & StoreActions & StoreSelectors;

function pushPlannerHistorySnapshot(draft: StoreState) {
  draft.plannerHistoryPast.push(clonePlannerSnapshot(draft));
  if (draft.plannerHistoryPast.length > PLANNER_HISTORY_LIMIT) {
    draft.plannerHistoryPast.shift();
  }
  draft.plannerHistoryFuture = [];
}

function restorePlannerSnapshot(draft: StoreState, snapshot: PlannerSnapshot) {
  draft.measurements = snapshot.measurements;
  draft.textElements = snapshot.textElements;
  draft.walls = snapshot.walls;
  draft.floors = snapshot.floors;
}

const useStore = create<StoreState>()(
  (set, get) => ({
    ...initialState,
    plannerHistoryPast: [],
    plannerHistoryFuture: [],

    // Actions
    addMeasurement: (measurementData) => {
      const id = generateId();
      set(produce((draft: StoreState) => {
        pushPlannerHistorySnapshot(draft);
        draft.measurements.push({ ...measurementData, id });
      }));
      return id;
    },
    updateMeasurement: (id, updates) => set(produce((draft: StoreState) => {
      const measurement = draft.measurements.find(m => m.id === id);
      if (measurement) {
        pushPlannerHistorySnapshot(draft);
        Object.assign(measurement, updates);
      }
    })),
    deleteMeasurement: (id) => set(produce((draft: StoreState) => {
      pushPlannerHistorySnapshot(draft);
      draft.measurements = draft.measurements.filter(m => m.id !== id);
    })),
    addTextElement: (textData) => {
      const id = generateId();
      set(produce((draft: StoreState) => {
        pushPlannerHistorySnapshot(draft);
        draft.textElements.push({ ...textData, id });
      }));
      return id;
    },
    updateTextElement: (id, updates) => set(produce((draft: StoreState) => {
      const textElement = draft.textElements.find(t => t.id === id);
      if (textElement) {
        pushPlannerHistorySnapshot(draft);
        Object.assign(textElement, updates);
      }
    })),
    deleteTextElement: (id) => set(produce((draft: StoreState) => {
      pushPlannerHistorySnapshot(draft);
      draft.textElements = draft.textElements.filter(t => t.id !== id);
    })),
    updateSettings: (settings) => set(produce((draft: Model) => {
      Object.assign(draft.settings, settings);
    })),
    clearTemporaryMeasurements: () => set(produce((draft: Model) => {
      draft.measurements = draft.measurements.filter(m => !m.temporary);
    })),

    // Traditional CAD Actions for Canvas2D
    addWall: (wallData) => {
      const id = generateId();
      set(produce((draft: StoreState) => {
        pushPlannerHistorySnapshot(draft);
        draft.walls.push({
          ...wallData,
          id,
          color: wallData.color ?? DEFAULT_WALL_COLOR,
          openings: wallData.openings ?? [],
        });
      }));
      return id;
    },
    updateWall: (id, updates) => set(produce((draft: StoreState) => {
      const wall = draft.walls.find(w => w.id === id);
      if (wall) {
        pushPlannerHistorySnapshot(draft);
        Object.assign(wall, updates);
      }
    })),
    deleteWall: (id) => set(produce((draft: StoreState) => {
      pushPlannerHistorySnapshot(draft);
      draft.walls = draft.walls.filter(w => w.id !== id);
    })),
    addWallOpening: (wallId, openingData) => {
      const id = generateId();
      set(produce((draft: StoreState) => {
        const wall = draft.walls.find(w => w.id === wallId);
        if (wall) {
          pushPlannerHistorySnapshot(draft);
          if (!wall.openings) {
            wall.openings = [];
          }
          wall.openings.push(clampWallOpening(wall, { ...openingData, id }, id));
        }
      }));
      return id;
    },
    updateWallOpening: (wallId, openingId, updates) => set(produce((draft: StoreState) => {
      const wall = draft.walls.find(w => w.id === wallId);
      const opening = wall?.openings?.find(o => o.id === openingId);
      if (wall && opening) {
        pushPlannerHistorySnapshot(draft);
        Object.assign(opening, clampWallOpening(wall, { ...opening, ...updates }, openingId));
      }
    })),
    deleteWallOpening: (wallId, openingId) => set(produce((draft: StoreState) => {
      const wall = draft.walls.find(w => w.id === wallId);
      if (wall?.openings) {
        pushPlannerHistorySnapshot(draft);
        wall.openings = wall.openings.filter(o => o.id !== openingId);
      }
    })),
    addFloor: (floorData) => {
      const id = generateId();
      set(produce((draft: StoreState) => {
        pushPlannerHistorySnapshot(draft);
        draft.floors.push({ ...floorData, id });
      }));
      return id;
    },
    updateFloor: (id, updates) => set(produce((draft: StoreState) => {
      const floor = draft.floors.find(f => f.id === id);
      if (floor) {
        pushPlannerHistorySnapshot(draft);
        Object.assign(floor, updates);
      }
    })),
    deleteFloor: (id) => set(produce((draft: StoreState) => {
      pushPlannerHistorySnapshot(draft);
      draft.floors = draft.floors.filter(f => f.id !== id);
    })),
    connectWalls: (wallId1, wallId2) => {
      // Connect walls logic
    },
    autoConnectNearbyWalls: (threshold) => {
      // Auto connect nearby walls logic
    },

    // Flat Layout Actions
    addFlatPiece: (pieceData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.flatPieces.push({ ...pieceData, id });
      }));
      return id;
    },
    updateFlatPiece: (id, updates) => set(produce((draft: Model) => {
      const piece = draft.flatPieces.find(p => p.id === id);
      if (piece) {
        Object.assign(piece, updates);
      }
    })),
    deleteFlatPiece: (id) => set(produce((draft: Model) => {
      draft.flatPieces = draft.flatPieces.filter(p => p.id !== id);
      // Also remove connections involving this piece
      draft.connections = draft.connections.filter(
        c => c.fromPieceId !== id && c.toPieceId !== id
      );
    })),
    addFlatOpening: (pieceId, openingData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        const piece = draft.flatPieces.find(p => p.id === pieceId);
        if (piece) {
          piece.openings.push({ ...openingData, id });
        }
      }));
      return id;
    },
    updateFlatOpening: (pieceId, openingId, updates) => set(produce((draft: Model) => {
      const piece = draft.flatPieces.find(p => p.id === pieceId);
      if (piece) {
        const opening = piece.openings.find(o => o.id === openingId);
        if (opening) {
          Object.assign(opening, updates);
        }
      }
    })),
    deleteFlatOpening: (pieceId, openingId) => set(produce((draft: Model) => {
      const piece = draft.flatPieces.find(p => p.id === pieceId);
      if (piece) {
        piece.openings = piece.openings.filter(o => o.id !== openingId);
      }
    })),
    addConnection: (connectionData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.connections.push({ ...connectionData, id });
      }));
      return id;
    },
    updateConnection: (id, updates) => set(produce((draft: Model) => {
      const connection = draft.connections.find(c => c.id === id);
      if (connection) {
        Object.assign(connection, updates);
      }
    })),
    deleteConnection: (id) => set(produce((draft: Model) => {
      draft.connections = draft.connections.filter(c => c.id !== id);
    })),
    switchMode: (mode) => set(produce((draft: Model) => {
      draft.settings.mode = mode;
    })),
    stitchPieces: () => {
      // Stitching logic for flat layout pieces
    },

    // House Design Actions
    addElectricalOutlet: (outletData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.electricalOutlets.push({ ...outletData, id });
      }));
      return id;
    },
    updateElectricalOutlet: (id, updates) => set(produce((draft: Model) => {
      const outlet = draft.electricalOutlets.find(o => o.id === id);
      if (outlet) {
        Object.assign(outlet, updates);
      }
    })),
    deleteElectricalOutlet: (id) => set(produce((draft: Model) => {
      draft.electricalOutlets = draft.electricalOutlets.filter(o => o.id !== id);
      draft.electricalWires = draft.electricalWires.filter(w => w.fromId !== id && w.toId !== id);
    })),
    addElectricalSwitch: (switchData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.electricalSwitches.push({ ...switchData, id });
      }));
      return id;
    },
    updateElectricalSwitch: (id, updates) => set(produce((draft: Model) => {
      const switch_ = draft.electricalSwitches.find(s => s.id === id);
      if (switch_) {
        Object.assign(switch_, updates);
      }
    })),
    deleteElectricalSwitch: (id) => set(produce((draft: Model) => {
      draft.electricalSwitches = draft.electricalSwitches.filter(s => s.id !== id);
    })),
    addElectricalWire: (wireData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.electricalWires.push({ ...wireData, id });
      }));
      return id;
    },
    updateElectricalWire: (id, updates) => set(produce((draft: Model) => {
      const wire = draft.electricalWires.find(w => w.id === id);
      if (wire) {
        Object.assign(wire, updates);
      }
    })),
    deleteElectricalWire: (id) => set(produce((draft: Model) => {
      draft.electricalWires = draft.electricalWires.filter(w => w.id !== id);
    })),
    addElectricalCircuit: (circuitData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.electricalCircuits.push({ ...circuitData, id });
      }));
      return id;
    },
    updateElectricalCircuit: (id, updates) => set(produce((draft: Model) => {
      const circuit = draft.electricalCircuits.find(c => c.id === id);
      if (circuit) {
        Object.assign(circuit, updates);
      }
    })),
    deleteElectricalCircuit: (id) => set(produce((draft: Model) => {
      draft.electricalCircuits = draft.electricalCircuits.filter(c => c.id !== id);
    })),
    addElectricalPanel: (panelData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.electricalPanels.push({ ...panelData, id });
      }));
      return id;
    },
    updateElectricalPanel: (id, updates) => set(produce((draft: Model) => {
      const panel = draft.electricalPanels.find(p => p.id === id);
      if (panel) {
        Object.assign(panel, updates);
      }
    })),
    deleteElectricalPanel: (id) => set(produce((draft: Model) => {
      draft.electricalPanels = draft.electricalPanels.filter(p => p.id !== id);
    })),
    addWireRun: (wireRunData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.wireRuns.push({ ...wireRunData, id });
      }));
      return id;
    },
    updateWireRun: (id, updates) => set(produce((draft: Model) => {
      const wireRun = draft.wireRuns.find(w => w.id === id);
      if (wireRun) {
        Object.assign(wireRun, updates);
      }
    })),
    deleteWireRun: (id) => set(produce((draft: Model) => {
      draft.wireRuns = draft.wireRuns.filter(w => w.id !== id);
    })),
    calculateWireRuns: () => {
      // Wire run calculation logic
    },
    updateWirePrices: (prices) => set(produce((draft: Model) => {
      Object.assign(draft.settings.wirePrices, prices);
    })),
    updatePipePrices: (prices) => set(produce((draft: Model) => {
      Object.assign(draft.settings.pipePrices, prices);
    })),
    undoPlanner: () => set(produce((draft: StoreState) => {
      const previous = draft.plannerHistoryPast.pop();
      if (!previous) {
        return;
      }

      draft.plannerHistoryFuture.push(clonePlannerSnapshot(draft));
      restorePlannerSnapshot(draft, previous);
    })),
    redoPlanner: () => set(produce((draft: StoreState) => {
      const next = draft.plannerHistoryFuture.pop();
      if (!next) {
        return;
      }

      draft.plannerHistoryPast.push(clonePlannerSnapshot(draft));
      restorePlannerSnapshot(draft, next);
    })),
    addPlumbingFixture: (fixtureData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.plumbingFixtures.push({ ...fixtureData, id });
      }));
      return id;
    },
    updatePlumbingFixture: (id, updates) => set(produce((draft: Model) => {
      const fixture = draft.plumbingFixtures.find(f => f.id === id);
      if (fixture) {
        Object.assign(fixture, updates);
      }
    })),
    deletePlumbingFixture: (id) => set(produce((draft: Model) => {
      draft.plumbingFixtures = draft.plumbingFixtures.filter(f => f.id !== id);
      draft.plumbingPipes = draft.plumbingPipes.filter(p => p.fromId !== id && p.toId !== id);
    })),
    addPlumbingPipe: (pipeData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.plumbingPipes.push({ ...pipeData, id });
      }));
      return id;
    },
    updatePlumbingPipe: (id, updates) => set(produce((draft: Model) => {
      const pipe = draft.plumbingPipes.find(p => p.id === id);
      if (pipe) {
        Object.assign(pipe, updates);
      }
    })),
    deletePlumbingPipe: (id) => set(produce((draft: Model) => {
      draft.plumbingPipes = draft.plumbingPipes.filter(p => p.id !== id);
    })),
    addBuildingCodeViolation: (violationData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.buildingCodeViolations.push({ ...violationData, id });
      }));
      return id;
    },
    updateBuildingCodeViolation: (id, updates) => set(produce((draft: Model) => {
      const violation = draft.buildingCodeViolations.find(v => v.id === id);
      if (violation) {
        Object.assign(violation, updates);
      }
    })),
    deleteBuildingCodeViolation: (id) => set(produce((draft: Model) => {
      draft.buildingCodeViolations = draft.buildingCodeViolations.filter(v => v.id !== id);
    })),
    clearBuildingCodeViolations: () => set(produce((draft: Model) => {
      draft.buildingCodeViolations = [];
    })),
    validateBuildingCode: () => {
      // Building code validation logic
      const state = get();
      if (!state.settings.buildingCodeEnabled) return;
      
      // Clear existing violations
      get().clearBuildingCodeViolations();
      
      // Validate electrical outlets (12 feet spacing)
      const outlets = state.electricalOutlets;
      for (let i = 0; i < outlets.length; i++) {
        for (let j = i + 1; j < outlets.length; j++) {
          const distance = Math.sqrt(
            Math.pow(outlets[i].position.x - outlets[j].position.x, 2) +
            Math.pow(outlets[i].position.y - outlets[j].position.y, 2)
          );
          if (distance > 12) {
            get().addBuildingCodeViolation({
              type: 'electrical',
              severity: 'warning',
              message: 'Outlets should be within 12 feet of each other',
              position: outlets[i].position,
              affectedElementIds: [outlets[i].id, outlets[j].id]
            });
          }
        }
      }
      
    },

    // Selectors
    selectMeasurements: () => get().measurements,
    selectTextElements: () => get().textElements,
    selectMeasurementById: (id) => get().measurements.find(m => m.id === id),
    selectTextElementById: (id) => get().textElements.find(t => t.id === id),
    selectSettings: () => get().settings,
    selectWalls: () => get().walls,
    selectFloors: () => get().floors,
    selectWallById: (id) => get().walls.find(w => w.id === id),
    selectWallOpenings: (wallId) => get().walls.find(w => w.id === wallId)?.openings ?? [],
    selectFloorById: (id) => get().floors.find(f => f.id === id),
    selectFlatPieces: () => get().flatPieces,
    selectConnections: () => get().connections,
    selectFlatPieceById: (id) => get().flatPieces.find(p => p.id === id),
    selectConnectionById: (id) => get().connections.find(c => c.id === id),
    selectFlatOpeningsByPieceId: (pieceId) => {
      const piece = get().flatPieces.find(p => p.id === pieceId);
      return piece?.openings;
    },
    selectElectricalOutlets: () => get().electricalOutlets,
    selectElectricalSwitches: () => get().electricalSwitches,
    selectElectricalWires: () => get().electricalWires,
    selectElectricalCircuits: () => get().electricalCircuits,
    selectElectricalPanels: () => get().electricalPanels,
    selectWireRuns: () => get().wireRuns,
    selectWireUsageSummary: () => {
      const summary: { totalCost: number; totalLength: number; wireTypes: { [key: string]: { length: number; cost: number } } } = {
        totalCost: 0,
        totalLength: 0,
        wireTypes: {}
      };
      const runs = get().wireRuns;
      runs.forEach((run) => {
        summary.totalCost += run.cost;
        summary.totalLength += run.length;
        if (!summary.wireTypes[run.wireType]) {
          summary.wireTypes[run.wireType] = { length: 0, cost: 0 };
        }
        summary.wireTypes[run.wireType].length += run.length;
        summary.wireTypes[run.wireType].cost += run.cost;
      });
      return summary;
    },
    selectElectricalProject: () => get().electricalProject,
    selectPlumbingFixtures: () => get().plumbingFixtures,
    selectPlumbingPipes: () => get().plumbingPipes,
    selectBuildingCodeViolations: () => get().buildingCodeViolations,
    selectElectricalOutletById: (id) => get().electricalOutlets.find(o => o.id === id),
    selectElectricalSwitchById: (id) => get().electricalSwitches.find(s => s.id === id),
    selectElectricalCircuitById: (id) => get().electricalCircuits.find(c => c.id === id),
    selectElectricalPanelById: (id) => get().electricalPanels.find(p => p.id === id),
    selectWireRunById: (id) => get().wireRuns.find(w => w.id === id),
    selectPlumbingFixtureById: (id) => get().plumbingFixtures.find(f => f.id === id),
  })
);

export default useStore;
