import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import useStore from '@/src/model/useStore';
import useDefaultsStore from '@/src/planner/stores/useDefaultsStore';
import useEnhancedEditorStore from '@/src/planner/stores/useEnhancedEditorStore';
import usePlannerEditorStore from '@/src/planner/stores/usePlannerEditorStore';
import usePlannerViewerStore from '@/src/planner/stores/usePlannerViewerStore';
import * as levelUtils from '@/src/planner/level-utils';
import { PlannerWorkspace } from './PlannerWorkspace';

jest.mock('@/src/components/Canvas2D', () => ({
  Canvas2D: () => <div data-testid="canvas-2d">Canvas</div>,
}));

jest.mock('@/src/three/Viewer', () => ({
  Viewer: () => <div data-testid="viewer">Viewer</div>,
}));

jest.mock('@/src/planner/tooling/PlannerToolManager', () => () => null);

jest.mock('@/src/components/ui/scene-tree', () => ({
  SceneTree: () => <div data-testid="scene-tree">Scene Tree</div>,
}));

jest.mock('@/src/components/settings-panel', () => ({
  SettingsPanel: () => <div data-testid="settings-panel">Settings Panel</div>,
}));

jest.mock('@/components/ui/resizable', () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="resizable-group">{children}</div>
  ),
  ResizablePanel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ResizableHandle: () => <div data-testid="resizable-handle" />,
}));

class ResizeObserverMock {
  observe() {}

  disconnect() {}

  unobserve() {}
}

function resetPlannerStores() {
  window.localStorage.clear();

  useStore.setState((state) => ({
    ...state,
    levels: [
      {
        id: 'level-0',
        name: 'Ground Floor',
        elevation: 0,
        height: 10,
        index: 0,
      },
    ],
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

describe('PlannerWorkspace', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      value: ResizeObserverMock,
    });
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    resetPlannerStores();
  });

  test('toggles the left rail panels', () => {
    render(<PlannerWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: 'Scene Tree' }));
    expect(screen.getByTestId('scene-tree')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Scene Tree' }));
    expect(screen.queryByTestId('scene-tree')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tools' }));
    const aside = document.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(
      within(aside as HTMLElement).getByRole('button', { name: 'Door (D)' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
  });

  test('keeps mode and tool selection in sync across toolbar clicks', () => {
    render(<PlannerWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: 'Wall (W)' }));
    expect(usePlannerEditorStore.getState().activeTool).toBe('wall');
    expect(useEnhancedEditorStore.getState().mode).toBe('build');

    fireEvent.click(screen.getByRole('button', { name: 'Select (V)' }));
    expect(usePlannerEditorStore.getState().activeTool).toBe('select');
    expect(useEnhancedEditorStore.getState().mode).toBe('select');

    fireEvent.click(screen.getByRole('button', { name: 'Build (B)' }));
    expect(usePlannerEditorStore.getState().activeTool).toBe('wall');
    expect(useEnhancedEditorStore.getState().mode).toBe('build');

    fireEvent.click(screen.getByRole('button', { name: 'Measure (M)' }));
    expect(usePlannerEditorStore.getState().activeTool).toBe('measure');
    expect(useEnhancedEditorStore.getState().mode).toBe('select');
  });

  test('phase buttons swap the visible tool set and clear disallowed active tools', () => {
    render(<PlannerWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: 'Wall (W)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Site (1)' }));

    expect(useEnhancedEditorStore.getState().phase).toBe('site');
    expect(usePlannerEditorStore.getState().activeTool).toBe('select');
    expect(screen.queryByRole('button', { name: 'Wall (W)' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Measure (M)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Label (T)' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Furnish (3)' }));
    expect(screen.getByRole('button', { name: 'Furniture (I)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Wall (W)' })).not.toBeInTheDocument();
  });

  test('viewport buttons switch the rendered layout and viewer mode', () => {
    render(<PlannerWorkspace />);

    expect(screen.getByTestId('canvas-2d')).toBeInTheDocument();
    expect(screen.getByTestId('viewer')).toBeInTheDocument();
    expect(usePlannerViewerStore.getState().viewportMode).toBe('split');

    fireEvent.click(screen.getByRole('button', { name: '2D' }));
    expect(screen.getByTestId('canvas-2d')).toBeInTheDocument();
    expect(screen.queryByTestId('viewer')).not.toBeInTheDocument();
    expect(usePlannerViewerStore.getState().viewportMode).toBe('draft');

    fireEvent.click(screen.getByRole('button', { name: '3D' }));
    expect(screen.queryByTestId('canvas-2d')).not.toBeInTheDocument();
    expect(screen.getByTestId('viewer')).toBeInTheDocument();
    expect(usePlannerViewerStore.getState().viewportMode).toBe('preview');

    fireEvent.click(screen.getByRole('button', { name: 'Split' }));
    expect(screen.getByTestId('canvas-2d')).toBeInTheDocument();
    expect(screen.getByTestId('viewer')).toBeInTheDocument();
    expect(usePlannerViewerStore.getState().viewportMode).toBe('split');
  });

  test('adds a level and selects it', () => {
    jest
      .spyOn(levelUtils, 'getSuggestedLevelElevation')
      .mockReturnValue(14);

    render(<PlannerWorkspace />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Level' }));

    const state = useStore.getState();
    const levelHeightDefault = useDefaultsStore.getState().levelHeight;

    expect(levelUtils.getSuggestedLevelElevation).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        levels: expect.any(Array),
        walls: expect.any(Array),
        floors: expect.any(Array),
        ceilings: expect.any(Array),
      }),
    );
    expect(state.levels).toHaveLength(2);
    expect(state.levels[1]).toMatchObject({
      name: 'Level 2',
      elevation: 14,
      height: levelHeightDefault,
      index: 1,
    });
    expect(useEnhancedEditorStore.getState().currentLevelIndex).toBe(1);
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });
});
