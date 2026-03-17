import { create } from 'zustand';
import useStore from '@/src/model/useStore';
import {
  Ceiling,
  Floor,
  Level,
  Measurement,
  Model,
  PlannerFloorNode,
  PlannerOpeningNode,
  PlannerSceneNode,
  PlannerWallNode,
  Roof,
  TextElement,
  Wall,
  WallOpening,
  Zone,
} from '@/src/model/types';

type LegacyPlannerStoreState = ReturnType<typeof useStore.getState>;

type PlannerSceneActionKeys =
  | 'addMeasurement'
  | 'updateMeasurement'
  | 'deleteMeasurement'
  | 'addTextElement'
  | 'updateTextElement'
  | 'deleteTextElement'
  | 'updateSettings'
  | 'clearTemporaryMeasurements'
  | 'addLevel'
  | 'updateLevel'
  | 'deleteLevel'
  | 'addWall'
  | 'updateWall'
  | 'deleteWall'
  | 'addWallOpening'
  | 'updateWallOpening'
  | 'deleteWallOpening'
  | 'addFloor'
  | 'updateFloor'
  | 'deleteFloor'
  | 'addZone'
  | 'updateZone'
  | 'deleteZone'
  | 'addCeiling'
  | 'updateCeiling'
  | 'deleteCeiling'
  | 'addRoof'
  | 'updateRoof'
  | 'deleteRoof'
  | 'connectWalls'
  | 'autoConnectNearbyWalls'
  | 'undoPlanner'
  | 'redoPlanner';

type PlannerSceneActions = Pick<
  LegacyPlannerStoreState,
  PlannerSceneActionKeys
>;

interface PlannerSceneSnapshot {
  measurements: Measurement[];
  textElements: TextElement[];
  settings: Model['settings'];
  levels: Level[];
  walls: Wall[];
  floors: Floor[];
  zones: Zone[];
  ceilings: Ceiling[];
  roofs: Roof[];
  wallNodes: PlannerWallNode[];
  floorNodes: PlannerFloorNode[];
  openingNodes: PlannerOpeningNode[];
  nodes: Record<string, PlannerSceneNode>;
  rootNodeIds: string[];
}

interface PlannerSceneLocalState {
  activeLevel: number;
}

interface PlannerSceneLocalActions {
  setActiveLevel: (index: number) => void;
  getWallsForLevel: (level: number) => Wall[];
  getFloorsForLevel: (level: number) => Floor[];
}

export interface PlannerSceneStoreState
  extends PlannerSceneSnapshot,
    PlannerSceneLocalState,
    PlannerSceneLocalActions,
    PlannerSceneActions {}

function buildPlannerSceneSnapshot(
  state: LegacyPlannerStoreState,
): PlannerSceneSnapshot {
  const nodes: Record<string, PlannerSceneNode> = {};
  const floorNodes: PlannerFloorNode[] = [];
  const wallNodes: PlannerWallNode[] = [];
  const openingNodes: PlannerOpeningNode[] = [];
  const rootNodeIds: string[] = [];

  state.floors.forEach((floor) => {
    const floorNode: PlannerFloorNode = {
      id: floor.id,
      type: 'floor',
      parentId: null,
      childIds: [],
      entity: floor,
    };

    floorNodes.push(floorNode);
    rootNodeIds.push(floorNode.id);
    nodes[floorNode.id] = floorNode;
  });

  state.walls.forEach((wall) => {
    const openingIds = (wall.openings ?? []).map((opening) => opening.id);
    const wallNode: PlannerWallNode = {
      id: wall.id,
      type: 'wall',
      parentId: null,
      childIds: openingIds,
      entity: wall,
    };

    wallNodes.push(wallNode);
    rootNodeIds.push(wallNode.id);
    nodes[wallNode.id] = wallNode;

    (wall.openings ?? []).forEach((opening) => {
      const openingNode: PlannerOpeningNode = {
        id: opening.id,
        type: 'opening',
        parentId: wall.id,
        childIds: [],
        entity: opening,
      };

      openingNodes.push(openingNode);
      nodes[openingNode.id] = openingNode;
    });
  });

  return {
    measurements: state.measurements,
    textElements: state.textElements,
    settings: state.settings,
    levels: state.levels,
    walls: state.walls,
    floors: state.floors,
    zones: state.zones,
    ceilings: state.ceilings,
    roofs: state.roofs,
    wallNodes,
    floorNodes,
    openingNodes,
    nodes,
    rootNodeIds,
  };
}

const plannerSceneActions: PlannerSceneActions = {
  addLevel: (...args) => useStore.getState().addLevel(...args),
  updateLevel: (...args) => useStore.getState().updateLevel(...args),
  deleteLevel: (...args) => useStore.getState().deleteLevel(...args),
  addMeasurement: (...args) => useStore.getState().addMeasurement(...args),
  updateMeasurement: (...args) => useStore.getState().updateMeasurement(...args),
  deleteMeasurement: (...args) => useStore.getState().deleteMeasurement(...args),
  addTextElement: (...args) => useStore.getState().addTextElement(...args),
  updateTextElement: (...args) => useStore.getState().updateTextElement(...args),
  deleteTextElement: (...args) => useStore.getState().deleteTextElement(...args),
  updateSettings: (...args) => useStore.getState().updateSettings(...args),
  clearTemporaryMeasurements: (...args) =>
    useStore.getState().clearTemporaryMeasurements(...args),
  addWall: (...args) => useStore.getState().addWall(...args),
  updateWall: (...args) => useStore.getState().updateWall(...args),
  deleteWall: (...args) => useStore.getState().deleteWall(...args),
  addWallOpening: (...args) => useStore.getState().addWallOpening(...args),
  updateWallOpening: (...args) => useStore.getState().updateWallOpening(...args),
  deleteWallOpening: (...args) => useStore.getState().deleteWallOpening(...args),
  addFloor: (...args) => useStore.getState().addFloor(...args),
  updateFloor: (...args) => useStore.getState().updateFloor(...args),
  deleteFloor: (...args) => useStore.getState().deleteFloor(...args),
  addZone: (...args) => useStore.getState().addZone(...args),
  updateZone: (...args) => useStore.getState().updateZone(...args),
  deleteZone: (...args) => useStore.getState().deleteZone(...args),
  addCeiling: (...args) => useStore.getState().addCeiling(...args),
  updateCeiling: (...args) => useStore.getState().updateCeiling(...args),
  deleteCeiling: (...args) => useStore.getState().deleteCeiling(...args),
  addRoof: (...args) => useStore.getState().addRoof(...args),
  updateRoof: (...args) => useStore.getState().updateRoof(...args),
  deleteRoof: (...args) => useStore.getState().deleteRoof(...args),
  connectWalls: (...args) => useStore.getState().connectWalls(...args),
  autoConnectNearbyWalls: (...args) =>
    useStore.getState().autoConnectNearbyWalls(...args),
  undoPlanner: (...args) => useStore.getState().undoPlanner(...args),
  redoPlanner: (...args) => useStore.getState().redoPlanner(...args),
};

const usePlannerSceneStore = create<PlannerSceneStoreState>()((set, get) => ({
  ...buildPlannerSceneSnapshot(useStore.getState()),
  ...plannerSceneActions,
  activeLevel: 0,
  setActiveLevel: (index: number) => set({ activeLevel: index }),
  getWallsForLevel: (level: number) => get().walls.filter((w) => (w.level ?? 0) === level),
  getFloorsForLevel: (level: number) => get().floors.filter((f) => (f.level ?? 0) === level),
}));

useStore.subscribe((state) => {
  usePlannerSceneStore.setState(buildPlannerSceneSnapshot(state));
});

export default usePlannerSceneStore;
