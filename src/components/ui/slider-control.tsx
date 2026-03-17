'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface SliderControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  resetValue?: number;
  disabled?: boolean;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function roundToStep(val: number, step: number): number {
  return Math.round(val / step) * step;
}

export function SliderControl({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit,
  resetValue,
  disabled = false,
}: SliderControlProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [showReset, setShowReset] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragStartX = useRef(0);
  const dragStartValue = useRef(0);

  const range = max - min;
  const fraction = range > 0 ? (value - min) / range : 0;

  // Drag handling
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || isEditing) return;
      e.preventDefault();
      setIsDragging(true);
      setShowReset(true);
      dragStartX.current = e.clientX;
      dragStartValue.current = value;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [disabled, isEditing, value],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || disabled) return;
      const track = trackRef.current;
      if (!track) return;
      const trackWidth = track.getBoundingClientRect().width;
      const dx = e.clientX - dragStartX.current;
      const valueDelta = (dx / trackWidth) * range;
      const newValue = clamp(
        roundToStep(dragStartValue.current + valueDelta, step),
        min,
        max,
      );
      onChange(newValue);
    },
    [isDragging, disabled, range, step, min, max, onChange],
  );

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setTimeout(() => setShowReset(false), 1500);
    }
  }, [isDragging]);

  // Scroll wheel handling
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (disabled) return;
      e.preventDefault();
      let multiplier = 1;
      if (e.shiftKey) multiplier = 10;
      if (e.altKey) multiplier = 0.1;
      const delta = e.deltaY > 0 ? -step * multiplier : step * multiplier;
      const newValue = clamp(roundToStep(value + delta, step * multiplier), min, max);
      onChange(newValue);
    },
    [disabled, step, value, min, max, onChange],
  );

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Inline edit mode
  const startEditing = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    setEditText(String(parseFloat(value.toFixed(4))));
  }, [disabled, value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    const parsed = parseFloat(editText);
    if (!Number.isNaN(parsed)) {
      onChange(clamp(roundToStep(parsed, step), min, max));
    }
  }, [editText, onChange, step, min, max]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') commitEdit();
      if (e.key === 'Escape') setIsEditing(false);
    },
    [commitEdit],
  );

  const handleReset = useCallback(() => {
    if (resetValue !== undefined) {
      onChange(resetValue);
      setShowReset(false);
    }
  }, [resetValue, onChange]);

  const displayValue = parseFloat(value.toFixed(4));

  return (
    <div
      className={`group flex items-center gap-2 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
    >
      {label && (
        <span className="text-xs text-slate-400 min-w-[60px] select-none truncate">
          {label}
        </span>
      )}

      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {/* Track */}
        <div
          ref={trackRef}
          className="relative flex-1 h-6 bg-slate-800 rounded-md border border-slate-700/50 cursor-ew-resize select-none overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Fill */}
          <div
            className="absolute inset-y-0 left-0 bg-blue-500/20 transition-[width] duration-75 pointer-events-none"
            style={{ width: `${fraction * 100}%` }}
          />

          {/* Handle indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 transition-[left] duration-75 pointer-events-none"
            style={{ left: `${fraction * 100}%` }}
          />

          {/* Value display / inline edit */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleEditKeyDown}
                className="w-full h-full bg-slate-900 text-xs text-slate-200 text-center outline-none border border-blue-500 rounded-md px-1"
              />
            ) : (
              <span
                className="text-xs text-slate-200 cursor-text hover:text-white transition-colors duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing();
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {displayValue}
                {unit ? (
                  <span className="text-slate-500 ml-0.5">{unit}</span>
                ) : null}
              </span>
            )}
          </div>
        </div>

        {/* Reset button */}
        {resetValue !== undefined && showReset && (
          <button
            type="button"
            onClick={handleReset}
            className="flex-none w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all duration-150 text-xs"
            title={`Reset to ${resetValue}`}
          >
            ↺
          </button>
        )}
      </div>
    </div>
  );
}
