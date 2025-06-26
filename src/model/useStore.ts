import { create } from 'zustand';
import { produce } from 'immer';
import { 
  Model, Floor, Wall, Opening, Truss,
  ElectricalWiring, ElectricalOutlet, ElectricalSwitch,
  PlumbingSystem, PlumbingFixture, PlumbingPipe, BuildingCode
} from './types';

// Helper for ID generation
const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

const defaultBuildingCode: BuildingCode = {
  maxOutletSpacing: 12, // 12 feet maximum between outlets
  minKitchenOutlets: 4, // minimum outlets in kitchen
  minBathroomOutlets: 1, // minimum outlets in bathroom
  gfciRequired: ['bathroom', 'kitchen', 'garage', 'outdoor'], // areas requiring GFCI
  switchHeight: 48, // 48 inches from floor
  outletHeight: 18, // 18 inches from floor
};

const initialState: Model = {
  floors: [],
  walls: [],
  trusses: {
    spacing: 24, // Default spacing
  },
  wiring: [],
  plumbing: [],
  buildingCode: defaultBuildingCode,
  settings: {
    gridVisible: true,
    gridSize: 1,
    units: 'imperial',
    designMode: 'residential',
  },
};

interface StoreActions {
  addFloor: (floorData: Omit<Floor, 'id'>) => string;
  updateFloor: (id: string, updates: Partial<Omit<Floor, 'id'>>) => void;
  deleteFloor: (id: string) => void;
  addWall: (wallData: Omit<Wall, 'id' | 'openings' | 'connected'>) => string;
  updateWall: (id: string, updates: Partial<Omit<Wall, 'id'>>) => void;
  deleteWall: (id: string) => void;
  addOpening: (wallId: string, openingData: Omit<Opening, 'id'>) => string;
  updateOpening: (wallId: string, openingId: string, updates: Partial<Omit<Opening, 'id'>>) => void;
  deleteOpening: (wallId: string, openingId: string) => void;
  updateTrussSettings: (settings: Partial<Truss>) => void;
  updateSettings: (settings: Partial<Model['settings']>) => void;
  setWallConnected: (wallId: string, connected: boolean) => void;
  
  // Electrical wiring actions
  addWiring: (wiringData: Omit<ElectricalWiring, 'id'>) => string;
  updateWiring: (id: string, updates: Partial<Omit<ElectricalWiring, 'id'>>) => void;
  deleteWiring: (id: string) => void;
  addOutletToWiring: (wiringId: string, outletData: Omit<ElectricalOutlet, 'id'>) => string;
  addSwitchToWiring: (wiringId: string, switchData: Omit<ElectricalSwitch, 'id'>) => string;
  autoPlaceOutlets: (roomType?: string) => void; // automatically place outlets per building code
  
  // Plumbing actions
  addPlumbingSystem: (systemData: Omit<PlumbingSystem, 'id'>) => string;
  updatePlumbingSystem: (id: string, updates: Partial<Omit<PlumbingSystem, 'id'>>) => void;
  deletePlumbingSystem: (id: string) => void;
  addFixtureToSystem: (systemId: string, fixtureData: Omit<PlumbingFixture, 'id'>) => string;
  addPipeToSystem: (systemId: string, pipeData: Omit<PlumbingPipe, 'id'>) => string;
  autoPlacePlumbing: (roomType: string) => void; // auto place plumbing for bathrooms/kitchens
  
  // Building code actions
  updateBuildingCode: (code: Partial<BuildingCode>) => void;
  validateElectricalCode: () => string[]; // returns array of violations
  validatePlumbingCode: () => string[]; // returns array of violations
}

interface StoreSelectors {
  selectFloors: () => Floor[];
  selectWalls: () => Wall[];
  selectFloorById: (id: string) => Floor | undefined;
  selectWallById: (id: string) => Wall | undefined;
  selectOpeningsByWallId: (wallId: string) => Opening[] | undefined;
  selectTrussSettings: () => Truss;
  selectSettings: () => Model['settings'];
  selectWiring: () => ElectricalWiring[];
  selectPlumbing: () => PlumbingSystem[];
  selectBuildingCode: () => BuildingCode;
}

type StoreState = Model & StoreActions & StoreSelectors;

const useStore = create<StoreState>()(
  (set, get) => ({
    ...initialState,

    // Actions
    addFloor: (floorData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.floors.push({ ...floorData, id });
      }));
      return id;
    },
    updateFloor: (id, updates) => set(produce((draft: Model) => {
      const floor = draft.floors.find(f => f.id === id);
      if (floor) {
        Object.assign(floor, updates);
      }
    })),
    deleteFloor: (id) => set(produce((draft: Model) => {
      draft.floors = draft.floors.filter(f => f.id !== id);
    })),
    addWall: (wallData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.walls.push({ ...wallData, id, openings: [], connected: false });
      }));
      return id;
    },
    updateWall: (id, updates) => set(produce((draft: Model) => {
      const wall = draft.walls.find(w => w.id === id);
      if (wall) {
        Object.assign(wall, updates);
      }
    })),
    deleteWall: (id) => set(produce((draft: Model) => {
      draft.walls = draft.walls.filter(w => w.id !== id);
    })),
    addOpening: (wallId, openingData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        const wall = draft.walls.find(w => w.id === wallId);
        if (wall) {
          wall.openings.push({ ...openingData, id });
        }
      }));
      return id;
    },
    updateOpening: (wallId, openingId, updates) => set(produce((draft: Model) => {
      const wall = draft.walls.find(w => w.id === wallId);
      if (wall) {
        const opening = wall.openings.find(o => o.id === openingId);
        if (opening) {
          Object.assign(opening, updates);
        }
      }
    })),
    deleteOpening: (wallId, openingId) => set(produce((draft: Model) => {
      const wall = draft.walls.find(w => w.id === wallId);
      if (wall) {
        wall.openings = wall.openings.filter(o => o.id !== openingId);
      }
    })),
    updateTrussSettings: (settings) => set(produce((draft: Model) => {
      draft.trusses = { ...draft.trusses, ...settings };
    })),
    updateSettings: (settings) => set(produce((draft: Model) => {
      draft.settings = { ...draft.settings, ...settings };
    })),
    setWallConnected: (wallId, connected) => set(produce((draft: Model) => {
        const wall = draft.walls.find(w => w.id === wallId);
        if (wall) {
            wall.connected = connected;
        }
    })),

    // Electrical wiring actions
    addWiring: (wiringData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.wiring.push({ ...wiringData, id });
      }));
      return id;
    },
    updateWiring: (id: string, updates: Partial<Omit<ElectricalWiring, 'id'>>) => set(produce((draft: Model) => {
      const wiring = draft.wiring.find(w => w.id === id);
      if (wiring) {
        Object.assign(wiring, updates);
      }
    })),
    deleteWiring: (id) => set(produce((draft: Model) => {
      draft.wiring = draft.wiring.filter(w => w.id !== id);
    })),
    addOutletToWiring: (wiringId, outletData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        const wiring = draft.wiring.find(w => w.id === wiringId);
        if (wiring) {
          wiring.outlets.push({ ...outletData, id });
        }
      }));
      return id;
    },
    addSwitchToWiring: (wiringId, switchData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        const wiring = draft.wiring.find(w => w.id === wiringId);
        if (wiring) {
          wiring.switches.push({ ...switchData, id });
        }
      }));
      return id;
    },
    autoPlaceOutlets: (roomType = 'general') => {
      const { walls, buildingCode } = get();
      const wiringId = generateId();
      
      set(produce((draft: Model) => {
        const newWiring: ElectricalWiring = {
          id: wiringId,
          points: [],
          type: '15amp',
          color: '#22c55e', // Green color as requested
          outlets: [],
          switches: []
        };

        // Auto-place outlets along walls according to building code
        walls.forEach(wall => {
          const wallLength = Math.sqrt(
            Math.pow(wall.end.x - wall.start.x, 2) + 
            Math.pow(wall.end.y - wall.start.y, 2)
          );
          
          // Calculate number of outlets needed based on code
          const outletsNeeded = Math.max(1, Math.ceil(wallLength / buildingCode.maxOutletSpacing));
          
          for (let i = 0; i < outletsNeeded; i++) {
            const position = (i + 1) * (wallLength / (outletsNeeded + 1));
            const outletX = wall.start.x + (wall.end.x - wall.start.x) * (position / wallLength);
            const outletY = wall.start.y + (wall.end.y - wall.start.y) * (position / wallLength);
            
            const outletType = roomType === 'bathroom' || roomType === 'kitchen' ? 'gfci' : 'standard';
            
            newWiring.outlets.push({
              id: generateId(),
              type: outletType,
              position: { x: outletX, y: outletY },
              wallId: wall.id,
              height: buildingCode.outletHeight,
              isCodeRequired: true
            });
          }
        });

        draft.wiring.push(newWiring);
      }));
    },

    // Plumbing actions
    addPlumbingSystem: (systemData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        draft.plumbing.push({ ...systemData, id });
      }));
      return id;
    },
    updatePlumbingSystem: (id, updates) => set(produce((draft: Model) => {
      const system = draft.plumbing.find(s => s.id === id);
      if (system) {
        Object.assign(system, updates);
      }
    })),
    deletePlumbingSystem: (id) => set(produce((draft: Model) => {
      draft.plumbing = draft.plumbing.filter(s => s.id !== id);
    })),
    addFixtureToSystem: (systemId, fixtureData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        const system = draft.plumbing.find(s => s.id === systemId);
        if (system) {
          system.fixtures.push({ ...fixtureData, id });
        }
      }));
      return id;
    },
    addPipeToSystem: (systemId, pipeData) => {
      const id = generateId();
      set(produce((draft: Model) => {
        const system = draft.plumbing.find(s => s.id === systemId);
        if (system) {
          system.pipes.push({ ...pipeData, id });
        }
      }));
      return id;
    },
    autoPlacePlumbing: (roomType) => {
      const { floors } = get();
      if (floors.length === 0) return;
      
      const systemId = generateId();
      const mainFloor = floors[0];
      const centerX = mainFloor.points.reduce((sum, p) => sum + p.x, 0) / mainFloor.points.length;
      const centerY = mainFloor.points.reduce((sum, p) => sum + p.y, 0) / mainFloor.points.length;
      
      set(produce((draft: Model) => {
        const newSystem: PlumbingSystem = {
          id: systemId,
          fixtures: [],
          pipes: [],
          mainWaterLine: { x: centerX - 10, y: centerY },
          mainDrainLine: { x: centerX - 10, y: centerY - 2 }
        };

        // Auto-place fixtures based on room type
        if (roomType === 'bathroom') {
          // Standard bathroom layout
          newSystem.fixtures.push(
            {
              id: generateId(),
              type: 'toilet',
              position: { x: centerX - 3, y: centerY },
              rotation: 0,
              requiresHotWater: false,
              requiresDrain: true,
              waterPressureRequired: 30
            },
            {
              id: generateId(),
              type: 'sink',
              position: { x: centerX, y: centerY + 3 },
              rotation: 0,
              requiresHotWater: true,
              requiresDrain: true,
              waterPressureRequired: 30
            },
            {
              id: generateId(),
              type: 'shower',
              position: { x: centerX + 3, y: centerY },
              rotation: 0,
              requiresHotWater: true,
              requiresDrain: true,
              waterPressureRequired: 40
            }
          );
        } else if (roomType === 'kitchen') {
          // Standard kitchen layout
          newSystem.fixtures.push(
            {
              id: generateId(),
              type: 'sink',
              position: { x: centerX, y: centerY },
              rotation: 0,
              requiresHotWater: true,
              requiresDrain: true,
              waterPressureRequired: 30
            },
            {
              id: generateId(),
              type: 'dishwasher',
              position: { x: centerX + 2, y: centerY },
              rotation: 0,
              requiresHotWater: true,
              requiresDrain: true,
              waterPressureRequired: 30
            }
          );
        }

        draft.plumbing.push(newSystem);
      }));
    },

    // Building code validation
    updateBuildingCode: (code) => set(produce((draft: Model) => {
      draft.buildingCode = { ...draft.buildingCode, ...code };
    })),
    validateElectricalCode: () => {
      const { walls, wiring, buildingCode } = get();
      const violations: string[] = [];
      
      // Check outlet spacing
      walls.forEach(wall => {
        const wallLength = Math.sqrt(
          Math.pow(wall.end.x - wall.start.x, 2) + 
          Math.pow(wall.end.y - wall.start.y, 2)
        );
        
        const outletsOnWall = wiring.flatMap(w => w.outlets.filter(o => o.wallId === wall.id));
        if (wallLength > buildingCode.maxOutletSpacing && outletsOnWall.length === 0) {
          violations.push(`Wall ${wall.id.substring(0, 6)} needs outlets - exceeds ${buildingCode.maxOutletSpacing}ft without outlet`);
        }
      });
      
      return violations;
    },
    validatePlumbingCode: () => {
      const { plumbing } = get();
      const violations: string[] = [];
      
      // Basic plumbing validation
      plumbing.forEach(system => {
        if (system.fixtures.length > 0 && system.pipes.length === 0) {
          violations.push(`Plumbing system ${system.id.substring(0, 6)} has fixtures but no supply pipes`);
        }
      });
      
      return violations;
    },

    // Selectors
    selectFloors: () => get().floors,
    selectWalls: () => get().walls,
    selectFloorById: (id) => get().floors.find(f => f.id === id),
    selectWallById: (id) => get().walls.find(w => w.id === id),
    selectOpeningsByWallId: (wallId) => {
      const wall = get().walls.find(w => w.id === wallId);
      return wall?.openings;
    },
    selectTrussSettings: () => get().trusses,
    selectSettings: () => get().settings,
    selectWiring: () => get().wiring,
    selectPlumbing: () => get().plumbing,
    selectBuildingCode: () => get().buildingCode,
  })
);

// Export actions and selectors for direct import if needed, though usually used via useStore hook
export const {
  addFloor, updateFloor, deleteFloor,
  addWall, updateWall, deleteWall,
  addOpening, updateOpening, deleteOpening,
  updateTrussSettings, updateSettings, setWallConnected,
  addWiring, updateWiring, deleteWiring, addOutletToWiring, addSwitchToWiring, autoPlaceOutlets,
  addPlumbingSystem, updatePlumbingSystem, deletePlumbingSystem, addFixtureToSystem, addPipeToSystem, autoPlacePlumbing,
  updateBuildingCode, validateElectricalCode, validatePlumbingCode,
} = useStore.getState();

export const {
  selectFloors, selectWalls, selectFloorById, selectWallById,
  selectOpeningsByWallId, selectTrussSettings, selectSettings,
  selectWiring, selectPlumbing, selectBuildingCode,
} = useStore.getState();

export default useStore;
