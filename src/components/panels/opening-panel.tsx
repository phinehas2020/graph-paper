'use client';

import React from 'react';
import { AppWindow, DoorOpen } from 'lucide-react';
import { FloatingPanel, PanelSection } from '@/src/components/ui/floating-panel';
import { SliderControl } from '@/src/components/ui/slider-control';
import { WallOpening } from '@/src/model/types';

interface OpeningPanelProps {
  opening: WallOpening;
  wallId: string;
  onUpdate: (changes: Partial<WallOpening>) => void;
  onClose: () => void;
}

export function OpeningPanel({
  opening,
  wallId,
  onUpdate,
  onClose,
}: OpeningPanelProps) {
  const isDoor = opening.type === 'door';
  const title = isDoor ? 'Door Properties' : 'Window Properties';
  const icon = isDoor ? (
    <DoorOpen className="h-3.5 w-3.5" />
  ) : (
    <AppWindow className="h-3.5 w-3.5" />
  );
  const bottomLabel = isDoor ? 'Base Height' : 'Sill Height';

  return (
    <FloatingPanel title={title} icon={icon} open={true} onClose={onClose}>
      {/* Dimensions */}
      <PanelSection title="Dimensions">
        <SliderControl
          label="Width"
          value={opening.width}
          min={0.5}
          max={4}
          step={0.1}
          unit="ft"
          onChange={(width) => onUpdate({ width })}
        />
        <SliderControl
          label="Height"
          value={opening.height}
          min={0.5}
          max={3.5}
          step={0.1}
          unit="ft"
          onChange={(height) => onUpdate({ height })}
        />
      </PanelSection>

      <div className="border-t border-slate-700/50" />

      {/* Position */}
      <PanelSection title="Position">
        <SliderControl
          label="Offset Along Wall"
          value={opening.offset}
          min={0}
          max={1}
          step={0.01}
          onChange={(offset) => onUpdate({ offset })}
        />
        <SliderControl
          label={bottomLabel}
          value={opening.bottom}
          min={0}
          max={2.5}
          step={0.05}
          unit="ft"
          onChange={(bottom) => onUpdate({ bottom })}
        />
      </PanelSection>

      <div className="border-t border-slate-700/50" />

      {/* Type Info */}
      <PanelSection title="Type Info">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold capitalize text-blue-400">
            {opening.type}
          </span>
          <span className="font-mono text-xs text-slate-500">
            on wall {wallId.slice(0, 8)}...
          </span>
        </div>

        {isDoor && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">
              Hinge Side
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate({ hingeSide: 'start' })}
                className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  opening.hingeSide === 'start'
                    ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                Start
              </button>
              <button
                onClick={() => onUpdate({ hingeSide: 'end' })}
                className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  opening.hingeSide === 'end'
                    ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                End
              </button>
            </div>
          </div>
        )}
      </PanelSection>
    </FloatingPanel>
  );
}

export default OpeningPanel;
