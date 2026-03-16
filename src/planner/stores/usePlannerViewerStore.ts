'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlannerSelection } from '@/src/model/types';

export type PlannerViewportMode = 'split' | 'draft' | 'preview';

interface PlannerViewerState {
  selectedElement: PlannerSelection | null;
  showGuide: boolean;
  viewportMode: PlannerViewportMode;
  setSelectedElement: (selection: PlannerSelection | null) => void;
  clearSelection: () => void;
  toggleGuide: () => void;
  setViewportMode: (mode: PlannerViewportMode) => void;
}

const usePlannerViewerStore = create<PlannerViewerState>()(
  persist(
    (set) => ({
      selectedElement: null,
      showGuide: true,
      viewportMode: 'split',
      setSelectedElement: (selectedElement) => set({ selectedElement }),
      clearSelection: () => set({ selectedElement: null }),
      toggleGuide: () => set((state) => ({ showGuide: !state.showGuide })),
      setViewportMode: (viewportMode) => set({ viewportMode }),
    }),
    {
      name: 'graph-paper-planner-viewer',
      partialize: (state) => ({
        showGuide: state.showGuide,
        viewportMode: state.viewportMode,
      }),
    },
  ),
);

export default usePlannerViewerStore;
