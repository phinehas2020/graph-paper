'use client';

import React from 'react';
import { SliderControl } from '@/src/components/ui/slider-control';
import useDefaultsStore from '@/src/planner/stores/useDefaultsStore';

export function SettingsPanel() {
  const defaults = useDefaultsStore();
  const { updateDefaults, resetDefaults } = defaults;

  return (
    <div className="h-full overflow-y-auto px-3 pb-4">
      {/* Wall Defaults */}
      <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Wall Defaults
      </p>
      <div className="space-y-2">
        <SliderControl
          label="Height"
          value={defaults.wallHeight}
          onChange={(v) => updateDefaults({ wallHeight: v })}
          min={1}
          max={20}
          step={0.5}
          unit="ft"
        />
        <SliderControl
          label="Thickness"
          value={defaults.wallThickness}
          onChange={(v) => updateDefaults({ wallThickness: v })}
          min={0.05}
          max={1}
          step={0.05}
          unit="ft"
        />
        <div className="flex items-center gap-2">
          <span className="min-w-[60px] select-none truncate text-xs text-slate-400">
            Color
          </span>
          <input
            type="color"
            value={defaults.wallColor}
            onChange={(e) => updateDefaults({ wallColor: e.target.value })}
            className="h-6 w-full flex-1 cursor-pointer rounded-md border border-slate-700/50 bg-slate-800"
          />
        </div>
      </div>

      {/* Door Defaults */}
      <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Door Defaults
      </p>
      <div className="space-y-2">
        <SliderControl
          label="Width"
          value={defaults.doorWidth}
          onChange={(v) => updateDefaults({ doorWidth: v })}
          min={1}
          max={8}
          step={0.25}
          unit="ft"
        />
        <SliderControl
          label="Height"
          value={defaults.doorHeight}
          onChange={(v) => updateDefaults({ doorHeight: v })}
          min={1}
          max={4}
          step={0.25}
          unit="ft"
        />
        <SliderControl
          label="Sill Height"
          value={defaults.doorSillHeight}
          onChange={(v) => updateDefaults({ doorSillHeight: v })}
          min={0}
          max={2}
          step={0.05}
          unit="ft"
        />
      </div>

      {/* Window Defaults */}
      <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Window Defaults
      </p>
      <div className="space-y-2">
        <SliderControl
          label="Width"
          value={defaults.windowWidth}
          onChange={(v) => updateDefaults({ windowWidth: v })}
          min={1}
          max={8}
          step={0.25}
          unit="ft"
        />
        <SliderControl
          label="Height"
          value={defaults.windowHeight}
          onChange={(v) => updateDefaults({ windowHeight: v })}
          min={0.5}
          max={4}
          step={0.25}
          unit="ft"
        />
        <SliderControl
          label="Sill Height"
          value={defaults.windowSillHeight}
          onChange={(v) => updateDefaults({ windowSillHeight: v })}
          min={0}
          max={4}
          step={0.1}
          unit="ft"
        />
      </div>

      {/* Floor Defaults */}
      <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Floor Defaults
      </p>
      <div className="space-y-2">
        <SliderControl
          label="Thickness"
          value={defaults.floorThickness}
          onChange={(v) => updateDefaults({ floorThickness: v })}
          min={0.05}
          max={1}
          step={0.05}
          unit="ft"
        />
        <SliderControl
          label="Elevation"
          value={defaults.floorElevation}
          onChange={(v) => updateDefaults({ floorElevation: v })}
          min={-5}
          max={20}
          step={0.5}
          unit="ft"
        />
      </div>

      {/* Ceiling Defaults */}
      <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Ceiling Defaults
      </p>
      <div className="space-y-2">
        <SliderControl
          label="Height"
          value={defaults.ceilingHeight}
          onChange={(v) => updateDefaults({ ceilingHeight: v })}
          min={1}
          max={20}
          step={0.5}
          unit="ft"
        />
        <SliderControl
          label="Thickness"
          value={defaults.ceilingThickness}
          onChange={(v) => updateDefaults({ ceilingThickness: v })}
          min={0.05}
          max={0.5}
          step={0.05}
          unit="ft"
        />
      </div>

      {/* Roof Defaults */}
      <p className="mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Roof Defaults
      </p>
      <div className="space-y-2">
        <SliderControl
          label="Pitch"
          value={defaults.roofPitch}
          onChange={(v) => updateDefaults({ roofPitch: v })}
          min={5}
          max={60}
          step={1}
          unit="deg"
        />
        <SliderControl
          label="Overhang"
          value={defaults.roofOverhang}
          onChange={(v) => updateDefaults({ roofOverhang: v })}
          min={0}
          max={3}
          step={0.25}
          unit="ft"
        />
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={resetDefaults}
        className="mt-6 w-full rounded-lg border border-slate-700 bg-slate-800 py-2 text-xs text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
      >
        Reset to Defaults
      </button>
    </div>
  );
}
