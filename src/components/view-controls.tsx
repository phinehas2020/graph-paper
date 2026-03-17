'use client';

import React, { useState, useCallback } from 'react';
import {
  Camera,
  Box,
  Layers,
  Scissors,
  Grid3X3,
  Ruler,
  Compass,
  Maximize,
  RotateCcw,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';

export type CameraMode = 'perspective' | 'orthographic';
export type LevelDisplayMode = 'stacked' | 'exploded' | 'solo';
export type WallViewMode = 'full' | 'cutaway' | 'low';

interface ViewControlsProps {
  cameraMode: CameraMode;
  levelDisplayMode: LevelDisplayMode;
  wallViewMode: WallViewMode;
  gridVisible: boolean;
  guidesVisible: boolean;
  measurementsVisible: boolean;
  onCameraModeChange: (mode: CameraMode) => void;
  onLevelDisplayModeChange: (mode: LevelDisplayMode) => void;
  onWallViewModeChange: (mode: WallViewMode) => void;
  onGridVisibleChange: (visible: boolean) => void;
  onGuidesVisibleChange: (visible: boolean) => void;
  onMeasurementsVisibleChange: (visible: boolean) => void;
  onZoomToFit: () => void;
  onResetCamera: () => void;
}

interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

const levelOptions: DropdownOption<LevelDisplayMode>[] = [
  { value: 'stacked', label: 'Stacked' },
  { value: 'exploded', label: 'Exploded' },
  { value: 'solo', label: 'Solo' },
];

const wallOptions: DropdownOption<WallViewMode>[] = [
  { value: 'full', label: 'Full Height' },
  { value: 'cutaway', label: 'Cutaway' },
  { value: 'low', label: 'Low Walls' },
];

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="group relative">
      {children}
      <div className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200 shadow-lg">
          {text}
        </div>
      </div>
    </div>
  );
}

function IconButton({
  active = false,
  onClick,
  children,
  tooltip,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tooltip: string;
}) {
  return (
    <Tooltip text={tooltip}>
      <button
        type="button"
        onClick={onClick}
        aria-label={tooltip}
        aria-pressed={active}
        title={tooltip}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
          active
            ? 'bg-blue-500/20 text-blue-400'
            : 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
        }`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

function MiniDropdown<T extends string>({
  value,
  options,
  onChange,
  icon,
  tooltip,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  icon: React.ReactNode;
  tooltip: string;
}) {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

  const handleSelect = useCallback(
    (v: T) => {
      onChange(v);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div className="relative">
      <Tooltip text={tooltip}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={tooltip}
          aria-expanded={open}
          aria-haspopup="menu"
          title={`${tooltip}: ${currentLabel}`}
          className="flex h-8 items-center gap-1 rounded-md px-2 text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-200"
        >
          {icon}
          <span className="text-xs">{currentLabel}</span>
          <ChevronDown size={12} />
        </button>
      </Tooltip>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border border-slate-700/50 bg-slate-900/95 p-1 shadow-xl backdrop-blur-xl">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                aria-label={option.label}
                className={`flex w-full items-center rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
                  value === option.value
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-slate-700/50" />;
}

export function ViewControls({
  cameraMode,
  levelDisplayMode,
  wallViewMode,
  gridVisible,
  guidesVisible,
  measurementsVisible,
  onCameraModeChange,
  onLevelDisplayModeChange,
  onWallViewModeChange,
  onGridVisibleChange,
  onGuidesVisibleChange,
  onMeasurementsVisibleChange,
  onZoomToFit,
  onResetCamera,
}: ViewControlsProps) {
  const toggleCameraMode = useCallback(() => {
    onCameraModeChange(cameraMode === 'perspective' ? 'orthographic' : 'perspective');
  }, [cameraMode, onCameraModeChange]);

  return (
    <div className="absolute right-3 top-3 z-30 flex items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-900/90 p-1 shadow-xl backdrop-blur-xl">
      {/* Camera mode toggle */}
      <IconButton
        active={cameraMode === 'orthographic'}
        onClick={toggleCameraMode}
        tooltip={cameraMode === 'perspective' ? 'Switch to Orthographic' : 'Switch to Perspective'}
      >
        <Camera size={16} />
      </IconButton>

      <Divider />

      {/* Level display mode */}
      <MiniDropdown
        value={levelDisplayMode}
        options={levelOptions}
        onChange={onLevelDisplayModeChange}
        icon={<Layers size={14} />}
        tooltip="Level display mode"
      />

      {/* Wall view mode */}
      <MiniDropdown
        value={wallViewMode}
        options={wallOptions}
        onChange={onWallViewModeChange}
        icon={<Scissors size={14} />}
        tooltip="Wall view mode"
      />

      <Divider />

      {/* Visibility toggles */}
      <IconButton
        active={gridVisible}
        onClick={() => onGridVisibleChange(!gridVisible)}
        tooltip={gridVisible ? 'Hide Grid' : 'Show Grid'}
      >
        <Grid3X3 size={16} />
      </IconButton>

      <IconButton
        active={guidesVisible}
        onClick={() => onGuidesVisibleChange(!guidesVisible)}
        tooltip={guidesVisible ? 'Hide Guides' : 'Show Guides'}
      >
        <Compass size={16} />
      </IconButton>

      <IconButton
        active={measurementsVisible}
        onClick={() => onMeasurementsVisibleChange(!measurementsVisible)}
        tooltip={measurementsVisible ? 'Hide Measurements' : 'Show Measurements'}
      >
        <Ruler size={16} />
      </IconButton>

      <Divider />

      {/* Zoom and reset */}
      <IconButton onClick={onZoomToFit} tooltip="Zoom to Fit">
        <Maximize size={16} />
      </IconButton>

      <IconButton onClick={onResetCamera} tooltip="Reset Camera">
        <RotateCcw size={16} />
      </IconButton>
    </div>
  );
}

export default ViewControls;
