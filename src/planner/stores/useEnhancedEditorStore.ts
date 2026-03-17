'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EditorPhase, EditorMode } from '@/src/model/phases';

export type ViewportLayout = '2d' | 'split' | '3d';

export interface ViewPrefs {
  cameraMode: 'perspective' | 'orthographic';
  levelDisplayMode: 'stacked' | 'exploded' | 'solo';
  wallViewMode: 'full' | 'cutaway' | 'low';
  gridVisible: boolean;
  guidesVisible: boolean;
  measurementsVisible: boolean;
}

export interface EnhancedEditorState {
  phase: EditorPhase;
  mode: EditorMode;
  gridVisible: boolean;
  guidesVisible: boolean;

  viewportLayout: ViewportLayout;
  viewPrefs: ViewPrefs;
  currentLevelIndex: number;
  leftPanelTab: 'tree' | 'tools' | 'settings' | null;

  setPhase: (phase: EditorPhase) => void;
  setMode: (mode: EditorMode) => void;
  toggleGrid: () => void;
  toggleGuides: () => void;
  setViewportLayout: (layout: ViewportLayout) => void;
  updateViewPrefs: (prefs: Partial<ViewPrefs>) => void;
  setCurrentLevelIndex: (index: number) => void;
  setLeftPanelTab: (tab: 'tree' | 'tools' | 'settings' | null) => void;
}

const useEnhancedEditorStore = create<EnhancedEditorState>()(
  persist(
    (set) => ({
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

      setPhase: (phase) => set({ phase, mode: 'select' }),
      setMode: (mode) => set({ mode }),
      toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),
      toggleGuides: () =>
        set((state) => ({ guidesVisible: !state.guidesVisible })),
      setViewportLayout: (viewportLayout) => set({ viewportLayout }),
      updateViewPrefs: (prefs) =>
        set((state) => ({ viewPrefs: { ...state.viewPrefs, ...prefs } })),
      setCurrentLevelIndex: (currentLevelIndex) => set({ currentLevelIndex }),
      setLeftPanelTab: (leftPanelTab) => set({ leftPanelTab }),
    }),
    {
      name: 'graph-paper-enhanced-editor',
      partialize: (state) => ({
        phase: state.phase,
        viewportLayout: state.viewportLayout,
        viewPrefs: state.viewPrefs,
        gridVisible: state.gridVisible,
        guidesVisible: state.guidesVisible,
        leftPanelTab: state.leftPanelTab,
      }),
    },
  ),
);

export default useEnhancedEditorStore;
