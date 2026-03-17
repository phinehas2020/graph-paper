'use client';

import React from 'react';
import { Cuboid } from 'lucide-react';
import { FloatingPanel, PanelSection } from '@/src/components/ui/floating-panel';
import { SliderControl } from '@/src/components/ui/slider-control';
import { Wall } from '@/src/model/types';
import { formatMeasurement } from '@/src/tools/MeasurementUtils';

interface WallPanelProps {
  wall: Wall;
  onUpdate: (changes: Partial<Wall>) => void;
  onClose: () => void;
}

function getWallLength(wall: Wall): number {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

function getConnectedWallCount(wall: Wall): number {
  const startConns = wall.connections?.start?.length ?? 0;
  const endConns = wall.connections?.end?.length ?? 0;
  return startConns + endConns;
}

function getConnectedWallIds(wall: Wall): string[] {
  const ids: string[] = [];
  if (wall.connections?.start) {
    ids.push(...wall.connections.start);
  }
  if (wall.connections?.end) {
    ids.push(...wall.connections.end);
  }
  return ids;
}

export function WallPanel({ wall, onUpdate, onClose }: WallPanelProps) {
  const wallLength = getWallLength(wall);
  const connectedCount = getConnectedWallCount(wall);
  const connectedIds = getConnectedWallIds(wall);

  return (
    <FloatingPanel
      title="Wall Properties"
      icon={<Cuboid className="h-3.5 w-3.5" />}
      open={true}
      onClose={onClose}
    >
      {/* Dimensions */}
      <PanelSection title="Dimensions">
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2">
          <p className="text-xs text-slate-500">Length</p>
          <p className="text-sm font-medium text-slate-200">
            {formatMeasurement(wallLength)}
          </p>
        </div>
        <SliderControl
          label="Height"
          value={wall.height}
          min={1}
          max={20}
          step={0.1}
          unit="ft"
          onChange={(height) => onUpdate({ height })}
        />
        <SliderControl
          label="Thickness"
          value={wall.thickness}
          min={0.1}
          max={2}
          step={0.05}
          unit="ft"
          onChange={(thickness) => onUpdate({ thickness })}
        />
      </PanelSection>

      <div className="border-t border-slate-700/50" />

      {/* Appearance */}
      <PanelSection title="Appearance">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-400">Color</label>
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5">
            <input
              type="color"
              value={wall.color ?? '#f5f3ef'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <span className="text-xs font-medium text-slate-200">
              {wall.color ?? '#f5f3ef'}
            </span>
          </div>
        </div>
      </PanelSection>

      <div className="border-t border-slate-700/50" />

      {/* Position */}
      <PanelSection title="Position">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2">
            <p className="text-xs text-slate-500">Start X</p>
            <p className="text-sm font-medium text-slate-200">
              {wall.start.x.toFixed(1)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2">
            <p className="text-xs text-slate-500">Start Y</p>
            <p className="text-sm font-medium text-slate-200">
              {wall.start.y.toFixed(1)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2">
            <p className="text-xs text-slate-500">End X</p>
            <p className="text-sm font-medium text-slate-200">
              {wall.end.x.toFixed(1)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2">
            <p className="text-xs text-slate-500">End Y</p>
            <p className="text-sm font-medium text-slate-200">
              {wall.end.y.toFixed(1)}
            </p>
          </div>
        </div>
      </PanelSection>

      <div className="border-t border-slate-700/50" />

      {/* Connections */}
      <PanelSection title="Connections">
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2">
          <p className="text-xs text-slate-500">Connected Walls</p>
          <p className="text-sm font-medium text-slate-200">{connectedCount}</p>
        </div>
        {connectedIds.length > 0 && (
          <div className="space-y-1">
            {connectedIds.map((id) => (
              <div
                key={id}
                className="rounded-md border border-slate-700/50 bg-slate-800/30 px-2.5 py-1.5"
              >
                <span className="font-mono text-xs text-slate-400">
                  {id.slice(0, 8)}...
                </span>
              </div>
            ))}
          </div>
        )}
      </PanelSection>
    </FloatingPanel>
  );
}

export default WallPanel;
