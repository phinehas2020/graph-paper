import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import useStore from '@/src/model/useStore';
import useEnhancedEditorStore from '@/src/planner/stores/useEnhancedEditorStore';
import usePlannerEditorStore from '@/src/planner/stores/usePlannerEditorStore';
import usePlannerViewerStore from '@/src/planner/stores/usePlannerViewerStore';
import PlannerToolManager from './PlannerToolManager';

function resetStores() {
  window.localStorage.clear();

  useStore.setState((state) => ({
    ...state,
    measurements: [],
    textElements: [],
    walls: [],
    floors: [],
    zones: [],
    ceilings: [],
    roofs: [],
    plannerHistoryPast: [],
    plannerHistoryFuture: [],
  }));

  usePlannerEditorStore.setState({
    activeTool: 'select',
    snapToFloorEdges: true,
  });

  usePlannerViewerStore.setState({
    selectedElement: null,
    showGuide: true,
    viewportMode: 'split',
  });

  useEnhancedEditorStore.setState({
    phase: 'structure',
    mode: 'select',
    gridVisible: true,
    guidesVisible: true,
    viewportLayout: 'split',
    viewPrefs: {
      cameraMode: 'perspective',
      levelDisplayMode: 'stacked',
      wallViewMode: 'full',
      gridVisible: true,
      guidesVisible: true,
      measurementsVisible: true,
    },
    currentLevelIndex: 0,
    leftPanelTab: null,
  });
}

describe('PlannerToolManager delete selection shortcut', () => {
  beforeEach(() => {
    resetStores();
  });

  test('deletes the selected planner element on Delete', () => {
    render(<PlannerToolManager />);

    const store = useStore.getState();
    const wallId = store.addWall({
      start: { x: 0, y: 0 },
      end: { x: 10, y: 0 },
      height: 3,
      thickness: 0.15,
      color: '#f5f3ef',
      openings: [],
      level: 0,
    });
    const openingId = useStore.getState().addWallOpening(wallId, {
      type: 'door',
      offset: 0.4,
      width: 3,
      height: 2.2,
      bottom: 0,
      hingeSide: 'start',
    });
    const floorId = useStore.getState().addFloor({
      points: [
        { x: 0, y: 0 },
        { x: 8, y: 0 },
        { x: 8, y: 8 },
      ],
      elevation: 0,
      thickness: 0.2,
      level: 0,
    });
    const zoneId = useStore.getState().addZone({
      name: 'Kitchen',
      points: [
        { x: 1, y: 1 },
        { x: 4, y: 1 },
        { x: 4, y: 4 },
      ],
      color: '#818cf880',
      level: 0,
    });
    const ceilingId = useStore.getState().addCeiling({
      points: [
        { x: 0, y: 0 },
        { x: 6, y: 0 },
        { x: 6, y: 6 },
      ],
      height: 3,
      thickness: 0.1,
      level: 0,
    });
    const roofId = useStore.getState().addRoof({
      ridgeStart: { x: 0, y: 5 },
      ridgeEnd: { x: 6, y: 5 },
      pitch: 30,
      overhang: 0.5,
      level: 0,
    });
    const measurementId = useStore.getState().addMeasurement({
      start: { x: 0, y: 0 },
      end: { x: 5, y: 0 },
      showDimensions: true,
      units: 'imperial',
    });
    const textElementId = useStore.getState().addTextElement({
      position: { x: 2, y: 2 },
      text: 'Label',
      fontSize: 16,
      color: '#000000',
      rotation: 0,
    });

    const cases = [
      {
        selection: { type: 'opening' as const, wallId, openingId },
        assertDeleted: () => {
          expect(
            useStore.getState().walls[0]?.openings.some(
              (opening) => opening.id === openingId,
            ),
          ).toBe(false);
        },
      },
      {
        selection: { type: 'wall' as const, wallId },
        assertDeleted: () => {
          expect(
            useStore.getState().walls.some((wall) => wall.id === wallId),
          ).toBe(false);
        },
      },
      {
        selection: { type: 'floor' as const, floorId },
        assertDeleted: () => {
          expect(
            useStore.getState().floors.some((floor) => floor.id === floorId),
          ).toBe(false);
        },
      },
      {
        selection: { type: 'zone' as const, zoneId },
        assertDeleted: () => {
          expect(
            useStore.getState().zones.some((zone) => zone.id === zoneId),
          ).toBe(false);
        },
      },
      {
        selection: { type: 'ceiling' as const, ceilingId },
        assertDeleted: () => {
          expect(
            useStore.getState().ceilings.some((ceiling) => ceiling.id === ceilingId),
          ).toBe(false);
        },
      },
      {
        selection: { type: 'roof' as const, roofId },
        assertDeleted: () => {
          expect(
            useStore.getState().roofs.some((roof) => roof.id === roofId),
          ).toBe(false);
        },
      },
      {
        selection: { type: 'measurement' as const, measurementId },
        assertDeleted: () => {
          expect(
            useStore.getState().measurements.some(
              (measurement) => measurement.id === measurementId,
            ),
          ).toBe(false);
        },
      },
      {
        selection: { type: 'text' as const, textElementId },
        assertDeleted: () => {
          expect(
            useStore.getState().textElements.some(
              (textElement) => textElement.id === textElementId,
            ),
          ).toBe(false);
        },
      },
    ];

    cases.forEach(({ selection, assertDeleted }) => {
      act(() => {
        usePlannerViewerStore.getState().setSelectedElement(selection);
      });

      act(() => {
        fireEvent.keyDown(window, { key: 'Delete' });
      });

      assertDeleted();
      expect(usePlannerViewerStore.getState().selectedElement).toBeNull();
    });
  });

  test('Backspace deletes the selected item when not editing text', () => {
    render(<PlannerToolManager />);

    const textElementId = useStore.getState().addTextElement({
      position: { x: 3, y: 3 },
      text: 'Delete me',
      fontSize: 16,
      color: '#000000',
      rotation: 0,
    });

    act(() => {
      usePlannerViewerStore.getState().setSelectedElement({
        type: 'text',
        textElementId,
      });
    });

    act(() => {
      fireEvent.keyDown(window, { key: 'Backspace' });
    });

    expect(
      useStore.getState().textElements.some(
        (textElement) => textElement.id === textElementId,
      ),
    ).toBe(false);
    expect(usePlannerViewerStore.getState().selectedElement).toBeNull();
  });
});
