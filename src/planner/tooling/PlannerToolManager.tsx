'use client';

import { useEffect } from 'react';
import usePlannerEditorStore from '@/src/planner/stores/usePlannerEditorStore';
import usePlannerSceneStore from '@/src/planner/stores/usePlannerSceneStore';
import usePlannerViewerStore from '@/src/planner/stores/usePlannerViewerStore';
import useEnhancedEditorStore from '@/src/planner/stores/useEnhancedEditorStore';
import { EditorPhase, EditorMode } from '@/src/model/phases';
import { PlannerToolId } from './tools';

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable)
  );
}

// Phase shortcuts: number keys
const PHASE_SHORTCUTS: Record<string, EditorPhase> = {
  '1': 'site',
  '2': 'structure',
  '3': 'furnish',
};

// Mode shortcuts: letter keys
const MODE_SHORTCUTS: Record<string, EditorMode> = {
  v: 'select',
  e: 'edit',
  b: 'build',
  d: 'delete',
};

// Build-mode-only tool shortcuts
const BUILD_TOOL_SHORTCUTS: Record<string, PlannerToolId> = {
  w: 'wall',
  f: 'floor',
  o: 'window',
  r: 'roof',
  z: 'zone',
};

// Tool shortcuts active regardless of mode
const GENERAL_TOOL_SHORTCUTS: Record<string, PlannerToolId> = {
  s: 'select',
  m: 'measure',
  t: 'text',
};

export function PlannerToolManager() {
  const activeTool = usePlannerEditorStore((state) => state.activeTool);
  const selectTool = usePlannerEditorStore((state) => state.selectTool);
  const clearSelection = usePlannerViewerStore(
    (state) => state.clearSelection,
  );
  const isTextEditing = usePlannerSceneStore(
    (state) => state.settings.isTextEditing,
  );
  const undoPlanner = usePlannerSceneStore((state) => state.undoPlanner);
  const redoPlanner = usePlannerSceneStore((state) => state.redoPlanner);

  const mode = useEnhancedEditorStore((state) => state.mode);
  const setPhase = useEnhancedEditorStore((state) => state.setPhase);
  const setMode = useEnhancedEditorStore((state) => state.setMode);
  const toggleGrid = useEnhancedEditorStore((state) => state.toggleGrid);
  const toggleGuides = useEnhancedEditorStore(
    (state) => state.toggleGuides,
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Always ignore when actively editing text in the scene
      if (isTextEditing) return;

      const lowerKey = event.key.toLowerCase();
      const hasCommandModifier = event.metaKey || event.ctrlKey;
      const inEditable = isEditableTarget(event.target);

      // --- Modifier shortcuts (work even in inputs for undo/redo) ---
      if (hasCommandModifier && !event.altKey) {
        // Cmd/Ctrl+Z → Undo
        if (lowerKey === 'z' && !event.shiftKey) {
          event.preventDefault();
          undoPlanner();
          return;
        }

        // Cmd/Ctrl+Shift+Z or Ctrl+Y → Redo
        if (
          (lowerKey === 'z' && event.shiftKey) ||
          (!event.metaKey && lowerKey === 'y')
        ) {
          event.preventDefault();
          redoPlanner();
          return;
        }

        // Cmd/Ctrl+A → Select all (only outside editable fields)
        if (lowerKey === 'a' && !inEditable) {
          event.preventDefault();
          // Select-all is dispatched via the existing selection system;
          // future implementation can hook into the viewer store here.
          return;
        }

        // Consume other modifier combos so they don't trigger tool shortcuts
        return;
      }

      // --- Everything below ignores editable fields ---
      if (inEditable) return;

      // Escape: cancel tool → clear selection → select mode
      if (lowerKey === 'escape') {
        event.preventDefault();
        if (activeTool !== 'select' && activeTool !== null) {
          selectTool(null);
          return;
        }
        clearSelection();
        selectTool('select');
        setMode('select');
        return;
      }

      // Delete / Backspace → delete selected elements
      if (lowerKey === 'delete' || lowerKey === 'backspace') {
        event.preventDefault();
        // Deletion is handled by the canvas / selection layer.
        // This prevents the browser from navigating back on Backspace.
        return;
      }

      // --- Phase shortcuts (number keys) ---
      const phase = PHASE_SHORTCUTS[event.key];
      if (phase) {
        event.preventDefault();
        setPhase(phase); // also resets mode to 'select'
        selectTool('select');
        return;
      }

      // --- Mode shortcuts ---
      const modeTarget = MODE_SHORTCUTS[lowerKey];
      if (modeTarget) {
        event.preventDefault();
        setMode(modeTarget);
        if (modeTarget === 'select') {
          selectTool('select');
        } else if (modeTarget === 'build') {
          // Default to wall tool when entering build mode with no tool selected
          const current = usePlannerEditorStore.getState().activeTool;
          if (!current || current === 'select') {
            selectTool('wall');
          }
        }
        return;
      }

      // --- Build-mode tool shortcuts ---
      if (mode === 'build') {
        const buildTool = BUILD_TOOL_SHORTCUTS[lowerKey];
        if (buildTool) {
          event.preventDefault();
          selectTool(buildTool);
          return;
        }
      }

      // --- General tool shortcuts (any mode) ---
      const generalTool = GENERAL_TOOL_SHORTCUTS[lowerKey];
      if (generalTool) {
        event.preventDefault();
        if (generalTool === 'select') {
          setMode('select');
        }
        selectTool(generalTool);
        return;
      }

      // --- Toggle shortcuts ---
      if (lowerKey === 'g') {
        event.preventDefault();
        toggleGrid();
        return;
      }

      if (lowerKey === 'h') {
        event.preventDefault();
        toggleGuides();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTool,
    clearSelection,
    isTextEditing,
    mode,
    redoPlanner,
    selectTool,
    setMode,
    setPhase,
    toggleGrid,
    toggleGuides,
    undoPlanner,
  ]);

  return null;
}

export default PlannerToolManager;
