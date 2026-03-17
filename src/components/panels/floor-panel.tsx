'use client';

import React, { useMemo } from 'react';
import { Square } from 'lucide-react';
import { FloatingPanel, PanelSection } from '@/src/components/ui/floating-panel';
import { SliderControl } from '@/src/components/ui/slider-control';
import { Floor, Point } from '@/src/model/types';

interface FloorPanelProps {
  floor: Floor;
  onUpdate: (changes: Partial<Floor>) => void;
  onClose: () => void;
}

function computePolygonArea(points: Point[]): number {
  const n = points.length;
  if (n < 3) return 0;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

function computePolygonPerimeter(points: Point[]): number {
  const n = points.length;
  if (n < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += Math.hypot(
      points[j].x - points[i].x,
      points[j].y - points[i].y,
    );
  }
  return perimeter;
}

export function FloorPanel({ floor, onUpdate, onClose }: FloorPanelProps) {
  const area = useMemo(() => computePolygonArea(floor.points), [floor.points]);
  const perimeter = useMemo(
    () => computePolygonPerimeter(floor.points),
    [floor.points],
  );

  return (
    <FloatingPanel
      title="Floor Slab"
      icon={<Square className="h-3.5 w-3.5" />}
      open={true}
      onClose={onClose}
    >
      {/* Geometry */}
      <PanelSection title="Geometry">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2">
            <p className="text-xs text-slate-500">Points</p>
            <p className="text-sm font-medium text-slate-200">
              {floor.points.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2">
            <p className="text-xs text-slate-500">Area</p>
            <p className="text-sm font-medium text-slate-200">
              {area.toFixed(1)} ft²
            </p>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2">
            <p className="text-xs text-slate-500">Perimeter</p>
            <p className="text-sm font-medium text-slate-200">
              {perimeter.toFixed(1)} ft
            </p>
          </div>
        </div>
      </PanelSection>

      <div className="border-t border-slate-700/50" />

      {/* Properties */}
      <PanelSection title="Properties">
        <SliderControl
          label="Elevation"
          value={floor.elevation}
          min={-5}
          max={20}
          step={0.1}
          unit="ft"
          onChange={(elevation) => onUpdate({ elevation })}
        />
        <SliderControl
          label="Thickness"
          value={floor.thickness}
          min={0.05}
          max={1}
          step={0.05}
          unit="ft"
          onChange={(thickness) => onUpdate({ thickness })}
        />
      </PanelSection>
    </FloatingPanel>
  );
}

export default FloorPanel;
