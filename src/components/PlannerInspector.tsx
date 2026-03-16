'use client';

import React from 'react';
import { AppWindow, DoorOpen, PaintBucket, Ruler, StretchHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Wall, WallOpening } from '@/src/model/types';
import { formatMeasurement } from '@/src/tools/MeasurementUtils';

interface PlannerInspectorProps {
  selectedWall: Wall | null;
  selectedOpening: WallOpening | null;
  onWallColorChange: (color: string) => void;
  onOpeningWidthChange: (width: number) => void;
  onOpeningHeightChange: (height: number) => void;
  onOpeningBottomChange: (bottom: number) => void;
}

function getWallLength(wall: Wall) {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

function parseNumericInput(
  value: string,
  callback: (nextValue: number) => void,
) {
  const parsedValue = Number.parseFloat(value);
  if (!Number.isNaN(parsedValue)) {
    callback(parsedValue);
  }
}

export function PlannerInspector({
  selectedWall,
  selectedOpening,
  onWallColorChange,
  onOpeningWidthChange,
  onOpeningHeightChange,
  onOpeningBottomChange,
}: PlannerInspectorProps) {
  if (!selectedWall) {
    return null;
  }

  const wallLength = getWallLength(selectedWall);
  const selectionTitle = selectedOpening
    ? selectedOpening.type === 'door'
      ? 'Door Opening'
      : 'Window Opening'
    : 'Wall Finish';
  const selectionIcon = selectedOpening
    ? selectedOpening.type === 'door'
      ? <DoorOpen className="h-4 w-4" />
      : <AppWindow className="h-4 w-4" />
    : <PaintBucket className="h-4 w-4" />;
  const bottomLabel = selectedOpening?.type === 'window' ? 'Sill Height' : 'Base Height';

  return (
    <div className="panel-surface panel-glow flex h-full min-h-0 w-full flex-col overflow-hidden border border-white/80 bg-white/88 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.5)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3 px-4 pb-1 pt-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Inspector
          </p>
          <h3 className="mt-2 text-base font-semibold text-slate-950">
            {selectionTitle}
          </h3>
        </div>
        <span className="rounded-full bg-slate-100 p-2 text-slate-500">
          {selectionIcon}
        </span>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4 pb-4">
        <div className="space-y-4 pr-3 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Length
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatMeasurement(wallLength)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Height
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatMeasurement(selectedWall.height)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="wall-color"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Wall Color
            </Label>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-3">
              <Input
                id="wall-color"
                type="color"
                value={selectedWall.color ?? '#f5f3ef'}
                onChange={(event) => onWallColorChange(event.target.value)}
                className="h-11 w-14 cursor-pointer rounded-xl border-slate-200 bg-white p-1"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {selectedWall.color ?? '#f5f3ef'}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Adjust the wall finish for the 3D preview while keeping the 2D plan legible.
                </p>
              </div>
            </div>
          </div>

          {selectedOpening && (
            <>
              <Separator className="bg-slate-200/80" />

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <StretchHorizontal className="h-4 w-4 text-slate-500" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Opening Controls
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Resize the selected {selectedOpening.type} and adjust how high it sits on the wall.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="opening-width"
                    className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                  >
                    Width
                  </Label>
                  <Input
                    id="opening-width"
                    type="number"
                    min="0.8"
                    step="0.1"
                    value={selectedOpening.width}
                    onChange={(event) => parseNumericInput(event.target.value, onOpeningWidthChange)}
                    className="h-11 rounded-xl border-slate-200 bg-white/90"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="opening-height"
                    className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                  >
                    Height
                  </Label>
                  <Input
                    id="opening-height"
                    type="number"
                    min="0.8"
                    step="0.1"
                    value={selectedOpening.height}
                    onChange={(event) => parseNumericInput(event.target.value, onOpeningHeightChange)}
                    className="h-11 rounded-xl border-slate-200 bg-white/90"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="opening-bottom"
                    className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                  >
                    {bottomLabel}
                  </Label>
                  <Input
                    id="opening-bottom"
                    type="number"
                    min="0"
                    step="0.1"
                    value={selectedOpening.bottom}
                    onChange={(event) => parseNumericInput(event.target.value, onOpeningBottomChange)}
                    className="h-11 rounded-xl border-slate-200 bg-white/90"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Type
                    </p>
                    <p className="mt-2 text-sm font-semibold capitalize text-slate-900">
                      {selectedOpening.type}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-slate-500" />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Span
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatMeasurement(selectedOpening.width)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
