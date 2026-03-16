'use client';

import React, { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PlannerInspector } from '@/src/components/PlannerInspector';
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
  const walls = usePlannerSceneStore((state) => state.walls);
  const updateWall = usePlannerSceneStore((state) => state.updateWall);
  const updateWallOpening = usePlannerSceneStore(
    (state) => state.updateWallOpening,
  );

  const selectedWall = useMemo(() => {
    if (!selectedElement) {
      return null;
    }

    return walls.find((wall) => wall.id === selectedElement.wallId) ?? null;
  }, [selectedElement, walls]);

  const selectedOpening = useMemo(() => {
    if (selectedElement?.type !== 'opening') {
      return null;
    }

    return (
      selectedWall?.openings?.find(
        (opening) => opening.id === selectedElement.openingId,
      ) ?? null
    );
  }, [selectedElement, selectedWall]);

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
