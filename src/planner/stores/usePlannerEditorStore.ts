'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlannerTool } from '@/src/planner/tooling/tools';
import usePlannerSceneStore from './usePlannerSceneStore';

interface PlannerEditorState {
  activeTool: PlannerTool;
  snapToFloorEdges: boolean;
  selectTool: (tool: PlannerTool) => void;
  toggleFloorEdgeSnap: () => void;
}

const usePlannerEditorStore = create<PlannerEditorState>()(
  persist(
    (set, get) => ({
      activeTool: 'select',
      snapToFloorEdges: true,
      selectTool: (tool) => {
        const previousTool = get().activeTool;
        const scene = usePlannerSceneStore.getState();

        if (
          previousTool === 'measure' &&
          tool !== 'measure' &&
          scene.settings.measurementMode === 'temporary'
        ) {
          scene.clearTemporaryMeasurements();
        }

        set({ activeTool: tool });
      },
      toggleFloorEdgeSnap: () =>
        set((state) => ({ snapToFloorEdges: !state.snapToFloorEdges })),
    }),
    {
      name: 'graph-paper-planner-editor',
      partialize: (state) => ({
        snapToFloorEdges: state.snapToFloorEdges,
      }),
    },
  ),
);

export default usePlannerEditorStore;
