import { renderHook, act } from '@testing-library/react';
import useStore from './useStore'; // Using default export
import { Floor, Wall, Opening, Truss, Model } from './types';

// Helper to get current state from the hook for assertions
const getCurrentState = (result: { current: any }) => result.current;

describe('useStore Zustand Store', () => {
  // Reset store before each test to ensure isolation
  beforeEach(() => {
    act(() => {
      useStore.setState({
        floors: [],
        walls: [],
        trusses: { spacing: 24 },
        settings: { gridVisible: true, gridSize: 1, units: 'imperial' },
      });
    });
  });

  test('should have correct initial state', () => {
    const { result } = renderHook(() => useStore());
    const state = getCurrentState(result);

    expect(state.floors).toEqual([]);
    expect(state.walls).toEqual([]);
    expect(state.trusses).toEqual({ spacing: 24 });
    expect(state.settings).toEqual({ gridVisible: true, gridSize: 1, units: 'imperial' });
  });

  describe('Floor Actions and Selectors', () => {
    const floorData1: Omit<Floor, 'id'> = { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }], elevation: 0, thickness: 0.2 };
    const floorData2: Omit<Floor, 'id'> = { points: [{ x: 5, y: 5 }, { x: 15, y: 5 }, { x: 15, y: 15 }, { x: 5, y: 15 }], elevation: 3, thickness: 0.25 };

    test('addFloor should add a floor and return its ID', () => {
      const { result } = renderHook(() => useStore());
      let floorId: string = '';

      act(() => {
        floorId = result.current.addFloor(floorData1);
      });

      const state = getCurrentState(result);
      expect(state.floors.length).toBe(1);
      expect(state.floors[0]).toEqual(expect.objectContaining({ ...floorData1, id: floorId }));
      expect(result.current.selectFloors().length).toBe(1);
      expect(result.current.selectFloorById(floorId)).toEqual(expect.objectContaining(floorData1));
    });

    test('updateFloor should update an existing floor', () => {
      const { result } = renderHook(() => useStore());
      let floorId: string = '';
      act(() => { floorId = result.current.addFloor(floorData1); });

      const updates: Partial<Floor> = { elevation: 1, thickness: 0.3 };
      act(() => {
        result.current.updateFloor(floorId, updates);
      });

      const updatedFloor = result.current.selectFloorById(floorId);
      expect(updatedFloor?.elevation).toBe(1);
      expect(updatedFloor?.thickness).toBe(0.3);
    });

    test('deleteFloor should remove a floor', () => {
      const { result } = renderHook(() => useStore());
      let floorId1: string = '';
      act(() => { floorId1 = result.current.addFloor(floorData1); });
      act(() => { result.current.addFloor(floorData2); });

      expect(result.current.selectFloors().length).toBe(2);

      act(() => {
        result.current.deleteFloor(floorId1);
      });

      expect(result.current.selectFloors().length).toBe(1);
      expect(result.current.selectFloorById(floorId1)).toBeUndefined();
    });
  });

  describe('Wall Actions and Selectors', () => {
    const wallData1: Omit<Wall, 'id' | 'openings' | 'connected'> = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, height: 3, thickness: 0.15 };

    test('addWall should add a wall with empty openings and connected false', () => {
      const { result } = renderHook(() => useStore());
      let wallId: string = '';
      act(() => {
        wallId = result.current.addWall(wallData1);
      });

      const wall = result.current.selectWallById(wallId);
      expect(wall).toBeDefined();
      expect(wall).toEqual(expect.objectContaining({ ...wallData1, id: wallId, openings: [], connected: false }));
      expect(result.current.selectWalls().length).toBe(1);
    });

    test('updateWall should update an existing wall', () => {
      const { result } = renderHook(() => useStore());
      let wallId: string = '';
      act(() => { wallId = result.current.addWall(wallData1); });

      const updates: Partial<Wall> = { height: 3.5, thickness: 0.2 };
      act(() => {
        result.current.updateWall(wallId, updates);
      });

      const updatedWall = result.current.selectWallById(wallId);
      expect(updatedWall?.height).toBe(3.5);
      expect(updatedWall?.thickness).toBe(0.2);
    });

    test('setWallConnected should update wall connected status', () => {
      const { result } = renderHook(() => useStore());
      let wallId: string = '';
      act(() => { wallId = result.current.addWall(wallData1); });

      act(() => {
        result.current.setWallConnected(wallId, true);
      });

      const updatedWall = result.current.selectWallById(wallId);
      expect(updatedWall?.connected).toBe(true);
    });

    test('deleteWall should remove a wall', () => {
      const { result } = renderHook(() => useStore());
      let wallId: string = '';
      act(() => { wallId = result.current.addWall(wallData1); });
      expect(result.current.selectWalls().length).toBe(1);

      act(() => {
        result.current.deleteWall(wallId);
      });
      expect(result.current.selectWalls().length).toBe(0);
      expect(result.current.selectWallById(wallId)).toBeUndefined();
    });
  });

  describe('Opening Actions and Selectors', () => {
    const wallData: Omit<Wall, 'id' | 'openings' | 'connected'> = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, height: 3, thickness: 0.15 };
    const openingData1: Omit<Opening, 'id'> = { type: 'window', width: 1, height: 1, elevation: 1, position: 2 };
    const openingData2: Omit<Opening, 'id'> = { type: 'door', width: 0.9, height: 2.1, elevation: 0, position: 5 };

    let wallId: string;
    beforeEach(() => { // Use beforeEach from Jest, not from a describe block
        const { result } = renderHook(() => useStore());
        act(() => {
            wallId = result.current.addWall(wallData);
        });
    });


    test('addOpening should add an opening to a wall', () => {
      const { result } = renderHook(() => useStore());
      let openingId: string = '';
      act(() => {
        openingId = result.current.addOpening(wallId, openingData1);
      });

      const openings = result.current.selectOpeningsByWallId(wallId);
      expect(openings).toBeDefined();
      expect(openings?.length).toBe(1);
      expect(openings?.[0]).toEqual(expect.objectContaining({ ...openingData1, id: openingId }));
    });

    test('updateOpening should update an existing opening', () => {
      const { result } = renderHook(() => useStore());
      let openingId: string = '';
      act(() => { openingId = result.current.addOpening(wallId, openingData1); });

      const updates: Partial<Opening> = { width: 1.2, height: 1.1 };
      act(() => {
        result.current.updateOpening(wallId, openingId, updates);
      });

      const updatedOpening = result.current.selectOpeningsByWallId(wallId)?.[0];
      expect(updatedOpening?.width).toBe(1.2);
      expect(updatedOpening?.height).toBe(1.1);
    });

    test('deleteOpening should remove an opening from a wall', () => {
      const { result } = renderHook(() => useStore());
      let openingId1: string = '';
      act(() => { openingId1 = result.current.addOpening(wallId, openingData1); });
      act(() => { result.current.addOpening(wallId, openingData2); });

      expect(result.current.selectOpeningsByWallId(wallId)?.length).toBe(2);
      act(() => {
        result.current.deleteOpening(wallId, openingId1);
      });

      const openings = result.current.selectOpeningsByWallId(wallId);
      expect(openings?.length).toBe(1);
      expect(openings?.[0].type).toBe('door');
    });
  });

  describe('Settings Actions and Selectors', () => {
    test('updateTrussSettings should update truss settings', () => {
      const { result } = renderHook(() => useStore());
      const newTrussSettings: Partial<Truss> = { spacing: 30 };

      act(() => {
        result.current.updateTrussSettings(newTrussSettings);
      });

      expect(result.current.selectTrussSettings()).toEqual({ spacing: 30 });
    });

    test('updateSettings should update general model settings', () => {
      const { result } = renderHook(() => useStore());
      const newSettings: Partial<Model['settings']> = { gridVisible: false, gridSize: 0.5, units: 'metric' };

      act(() => {
        result.current.updateSettings(newSettings);
      });

      expect(result.current.selectSettings()).toEqual(newSettings);
    });
  });
});
