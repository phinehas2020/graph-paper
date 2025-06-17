import { create } from 'zustand';
import { produce } from 'immer';
import { Model, Floor, Wall, Truss, Point, Opening } from './types';

// Helper for ID generation
const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

const initialState: Model = {
  floors: [],
  walls: [],
  trusses: {
    spacing: 24, // Default spacing
  },
  settings: {
    gridVisible: true,
    gridSize: 1,
    units: 'imperial',
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
}

interface StoreSelectors {
  selectFloors: () => Floor[];
  selectWalls: () => Wall[];
  selectFloorById: (id: string) => Floor | undefined;
  selectWallById: (id: string) => Wall | undefined;
  selectOpeningsByWallId: (wallId: string) => Opening[] | undefined;
  selectTrussSettings: () => Truss;
  selectSettings: () => Model['settings'];
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
  })
);

// Export actions and selectors for direct import if needed, though usually used via useStore hook
export const {
  addFloor, updateFloor, deleteFloor,
  addWall, updateWall, deleteWall,
  addOpening, updateOpening, deleteOpening,
  updateTrussSettings, updateSettings, setWallConnected,
} = useStore.getState();

export const {
  selectFloors, selectWalls, selectFloorById, selectWallById,
  selectOpeningsByWallId, selectTrussSettings, selectSettings,
} = useStore.getState();


export default useStore;
