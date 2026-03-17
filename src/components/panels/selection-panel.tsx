'use client';

import React, { useMemo } from 'react';
import { PlannerOpeningNode, PlannerWallNode } from '@/src/model/types';
import usePlannerSceneStore from '@/src/planner/stores/usePlannerSceneStore';
import usePlannerViewerStore from '@/src/planner/stores/usePlannerViewerStore';
import { WallPanel } from '@/src/components/panels/wall-panel';
import { OpeningPanel } from '@/src/components/panels/opening-panel';

export function SelectionPanel() {
  const selectedElement = usePlannerViewerStore((s) => s.selectedElement);
  const setSelectedElement = usePlannerViewerStore((s) => s.setSelectedElement);
  const nodes = usePlannerSceneStore((s) => s.nodes);
  const updateWall = usePlannerSceneStore((s) => s.updateWall);
  const updateWallOpening = usePlannerSceneStore((s) => s.updateWallOpening);
  const selectedWallId =
    selectedElement?.type === 'wall' || selectedElement?.type === 'opening'
      ? selectedElement.wallId
      : null;

  const selectedWall = useMemo(() => {
    if (!selectedWallId) return null;
    const node = nodes[selectedWallId] as PlannerWallNode | undefined;
    return node?.type === 'wall' ? node.entity : null;
  }, [nodes, selectedWallId]);

  const selectedOpening = useMemo(() => {
    if (selectedElement?.type !== 'opening') return null;
    const node = nodes[selectedElement.openingId] as
      | PlannerOpeningNode
      | undefined;
    return node?.type === 'opening' ? node.entity : null;
  }, [nodes, selectedElement]);

  const handleClose = () => {
    setSelectedElement(null);
  };

  if (
    !selectedElement ||
    (selectedElement.type !== 'wall' && selectedElement.type !== 'opening') ||
    !selectedWall
  ) {
    return null;
  }

  // If an opening is selected, show the opening panel
  if (selectedElement.type === 'opening' && selectedOpening) {
    return (
      <div className="pointer-events-auto fixed right-4 top-20 z-50">
        <OpeningPanel
          opening={selectedOpening}
          wallId={selectedElement.wallId}
          onUpdate={(changes) =>
            updateWallOpening(
              selectedElement.wallId,
              selectedElement.openingId,
              changes,
            )
          }
          onClose={handleClose}
        />
      </div>
    );
  }

  // Otherwise show the wall panel
  return (
    <div className="pointer-events-auto fixed right-4 top-20 z-50">
      <WallPanel
        wall={selectedWall}
        onUpdate={(changes) => updateWall(selectedWall.id, changes)}
        onClose={handleClose}
      />
    </div>
  );
}

export default SelectionPanel;
