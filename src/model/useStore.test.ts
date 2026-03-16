import useStore from './useStore';

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

describe('useStore planner history', () => {
  beforeEach(() => {
    resetPlannerSlices();
  });

  test('addFloor stores the floor and captures undo history', () => {
    const addFloor = useStore.getState().addFloor;

    expect(() =>
      addFloor({
        points: [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 4 },
        ],
        elevation: 0,
        thickness: 0.2,
      }),
    ).not.toThrow();

    const state = useStore.getState();

    expect(state.floors).toHaveLength(1);
    expect(state.plannerHistoryPast).toHaveLength(1);

    state.undoPlanner();

    expect(useStore.getState().floors).toHaveLength(0);
    expect(useStore.getState().plannerHistoryFuture).toHaveLength(1);
  });

  test('addWall stores the wall and captures undo history', () => {
    const addWall = useStore.getState().addWall;

    expect(() =>
      addWall({
        start: { x: 0, y: 0 },
        end: { x: 6, y: 0 },
        height: 3,
        thickness: 0.15,
        color: '#f5f3ef',
        openings: [],
      }),
    ).not.toThrow();

    const state = useStore.getState();

    expect(state.walls).toHaveLength(1);
    expect(state.plannerHistoryPast).toHaveLength(1);
  });
});
