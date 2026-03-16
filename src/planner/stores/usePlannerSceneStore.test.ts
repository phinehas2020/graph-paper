import useStore from '../../model/useStore';
import usePlannerSceneStore from './usePlannerSceneStore';

function resetPlannerSlices() {
  useStore.setState((state) => ({
    ...state,
    measurements: [],
    textElements: [],
    walls: [],
    floors: [],
    plannerHistoryPast: [],
    plannerHistoryFuture: [],
  }));
}

describe('usePlannerSceneStore', () => {
  beforeEach(() => {
    resetPlannerSlices();
  });

  test('materializes planner geometry as root and child scene nodes', () => {
    const floorId = useStore.getState().addFloor({
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 8 },
        { x: 0, y: 8 },
      ],
      elevation: 0,
      thickness: 0.2,
    });
    const wallId = useStore.getState().addWall({
      start: { x: 0, y: 0 },
      end: { x: 10, y: 0 },
      height: 3,
      thickness: 0.15,
      color: '#f5f3ef',
      openings: [],
    });
    const openingId = useStore.getState().addWallOpening(wallId, {
      type: 'door',
      offset: 0.5,
      width: 3,
      height: 2.2,
      bottom: 0,
      hingeSide: 'start',
    });

    const scene = usePlannerSceneStore.getState();

    expect(scene.rootNodeIds).toEqual(
      expect.arrayContaining([floorId, wallId]),
    );
    expect(scene.floorNodes).toHaveLength(1);
    expect(scene.wallNodes).toHaveLength(1);
    expect(scene.openingNodes).toHaveLength(1);
    expect(scene.nodes[floorId]).toMatchObject({
      id: floorId,
      type: 'floor',
      parentId: null,
      childIds: [],
    });
    expect(scene.nodes[wallId]).toMatchObject({
      id: wallId,
      type: 'wall',
      parentId: null,
      childIds: [openingId],
    });
    expect(scene.nodes[openingId]).toMatchObject({
      id: openingId,
      type: 'opening',
      parentId: wallId,
      childIds: [],
    });
  });
});
