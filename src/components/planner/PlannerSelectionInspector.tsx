'use client';

import React, { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PlannerInspector } from '@/src/components/PlannerInspector';
import { PlannerOpeningNode, PlannerWallNode } from '@/src/model/types';
import usePlannerSceneStore from '@/src/planner/stores/usePlannerSceneStore';
import usePlannerViewerStore from '@/src/planner/stores/usePlannerViewerStore';

interface PlannerSelectionInspectorProps {
  className?: string;
}

export function PlannerSelectionInspector({
  className,
}: PlannerSelectionInspectorProps) {
  const selectedElement = usePlannerViewerStore((state) => state.selectedElement);
  const setSelectedElement = usePlannerViewerStore(
    (state) => state.setSelectedElement,
  );
  const nodes = usePlannerSceneStore((state) => state.nodes);
  const updateWall = usePlannerSceneStore((state) => state.updateWall);
  const updateWallOpening = usePlannerSceneStore(
    (state) => state.updateWallOpening,
  );

  const selectedWall = useMemo(() => {
    if (!selectedElement) {
      return null;
    }

    const wallNode = nodes[selectedElement.wallId] as PlannerWallNode | undefined;
    return wallNode?.type === 'wall' ? wallNode.entity : null;
  }, [nodes, selectedElement]);

  const selectedOpening = useMemo(() => {
    if (selectedElement?.type !== 'opening') {
      return null;
    }

    const openingNode = nodes[selectedElement.openingId] as
      | PlannerOpeningNode
      | undefined;

    return openingNode?.type === 'opening' ? openingNode.entity : null;
  }, [nodes, selectedElement]);

  useEffect(() => {
    if (!selectedElement) {
      return;
    }

    if (!selectedWall) {
      setSelectedElement(null);
      return;
    }

    if (selectedElement.type === 'opening' && !selectedOpening) {
      setSelectedElement(null);
    }
  }, [selectedElement, selectedOpening, selectedWall, setSelectedElement]);

  if (!selectedWall) {
    return null;
  }

  return (
    <div className={cn(className)}>
      <PlannerInspector
        selectedWall={selectedWall}
        selectedOpening={selectedOpening}
        onWallColorChange={(color) => updateWall(selectedWall.id, { color })}
        onOpeningWidthChange={(width) => {
          if (selectedElement?.type === 'opening') {
            updateWallOpening(selectedElement.wallId, selectedElement.openingId, {
              width,
            });
          }
        }}
        onOpeningHeightChange={(height) => {
          if (selectedElement?.type === 'opening') {
            updateWallOpening(selectedElement.wallId, selectedElement.openingId, {
              height,
            });
          }
        }}
        onOpeningBottomChange={(bottom) => {
          if (selectedElement?.type === 'opening') {
            updateWallOpening(selectedElement.wallId, selectedElement.openingId, {
              bottom,
            });
          }
        }}
      />
    </div>
  );
}

export default PlannerSelectionInspector;
