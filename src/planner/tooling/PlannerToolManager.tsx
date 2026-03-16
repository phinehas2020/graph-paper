'use client';

import { useEffect } from 'react';
import usePlannerEditorStore from '@/src/planner/stores/usePlannerEditorStore';
import usePlannerSceneStore from '@/src/planner/stores/usePlannerSceneStore';
import usePlannerViewerStore from '@/src/planner/stores/usePlannerViewerStore';
import { getPlannerToolForShortcut } from './tools';

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable)
  );
}

export function PlannerToolManager() {
  const activeTool = usePlannerEditorStore((state) => state.activeTool);
  const selectTool = usePlannerEditorStore((state) => state.selectTool);
  const clearSelection = usePlannerViewerStore((state) => state.clearSelection);
  const isTextEditing = usePlannerSceneStore((state) => state.settings.isTextEditing);
  const undoPlanner = usePlannerSceneStore((state) => state.undoPlanner);
  const redoPlanner = usePlannerSceneStore((state) => state.redoPlanner);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target) || isTextEditing) {
        return;
      }

      const lowerKey = event.key.toLowerCase();
      const hasCommandModifier = event.metaKey || event.ctrlKey;

      if (hasCommandModifier && !event.altKey) {
        if (lowerKey === 'z' && !event.shiftKey) {
          event.preventDefault();
          undoPlanner();
          return;
        }

        if (
          (lowerKey === 'z' && event.shiftKey) ||
          (!event.metaKey && lowerKey === 'y')
        ) {
          event.preventDefault();
          redoPlanner();
        }

        return;
      }

      if (lowerKey === 'escape') {
        event.preventDefault();
        if (activeTool === 'select' || activeTool === null) {
          clearSelection();
        }
        selectTool(null);
        return;
      }

      const tool = getPlannerToolForShortcut(lowerKey);
      if (!tool) {
        return;
      }

      event.preventDefault();
      selectTool(tool);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTool,
    clearSelection,
    isTextEditing,
    redoPlanner,
    selectTool,
    undoPlanner,
  ]);

  return null;
}

export default PlannerToolManager;
