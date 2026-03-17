'use client';

import React, { useEffect, useRef } from 'react';
import type { PlannerTool } from '@/src/planner/tooling/tools';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CursorMode = 'default' | 'drawing' | 'placing' | 'dragging';

interface CanvasCursorProps {
  tool: PlannerTool;
  mode?: CursorMode;
  position: { x: number; y: number };
  visible?: boolean;
}

/* ------------------------------------------------------------------ */
/*  SVG cursor shapes                                                  */
/* ------------------------------------------------------------------ */

function CrosshairCursor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Vertical line */}
      <line x1="12" y1="2" x2="12" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="12" y1="14" x2="12" y2="22" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Horizontal line */}
      <line x1="2" y1="12" x2="10" y2="12" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="14" y1="12" x2="22" y2="12" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Center dot */}
      <circle cx="12" cy="12" r="2" fill="#3b82f6" />
    </svg>
  );
}

function PlusCursor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="12" y1="7" x2="12" y2="17" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
      <line x1="7" y1="12" x2="17" y2="12" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HandCursor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 14V7.5a1.5 1.5 0 0 1 3 0V12m0-4.5a1.5 1.5 0 0 1 3 0V12m0-3a1.5 1.5 0 0 1 3 0V12m-9 2.5V6a1.5 1.5 0 0 0-3 0v8.5a6 6 0 0 0 12 0V9.5a1.5 1.5 0 0 0-3 0"
        stroke="#94a3b8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowCursor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 3l14 9-7 1.5L9 21z"
        fill="#1e293b"
        stroke="#94a3b8"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilCursor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M17 3l4 4L7 21H3v-4L17 3z"
        stroke="#94a3b8"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M3 21l2.5-2.5" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Tool-to-cursor mapping                                             */
/* ------------------------------------------------------------------ */

function getCursorForTool(tool: PlannerTool, mode: CursorMode): React.ReactNode {
  if (mode === 'dragging') return <HandCursor />;

  switch (tool) {
    case 'select':
      return <ArrowCursor />;
    case 'wall':
    case 'measure':
      return <CrosshairCursor />;
    case 'door':
    case 'window':
      return <PlusCursor />;
    case 'floor':
    case 'text':
      return <PencilCursor />;
    default:
      return <ArrowCursor />;
  }
}

function getCursorOffset(tool: PlannerTool, mode: CursorMode): { x: number; y: number } {
  if (mode === 'dragging') return { x: -12, y: -12 };

  switch (tool) {
    case 'select':
      return { x: -5, y: -3 };
    case 'wall':
    case 'measure':
      return { x: -12, y: -12 };
    case 'door':
    case 'window':
      return { x: -12, y: -12 };
    case 'floor':
    case 'text':
      return { x: -3, y: -21 };
    default:
      return { x: -5, y: -3 };
  }
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function CanvasCursor({
  tool,
  mode = 'default',
  position,
  visible = true,
}: CanvasCursorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Hide the default cursor on the parent canvas when this cursor is active
  useEffect(() => {
    if (!visible) return;

    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const previousCursor = parent.style.cursor;
    parent.style.cursor = 'none';

    return () => {
      parent.style.cursor = previousCursor;
    };
  }, [visible]);

  if (!visible || !tool) return null;

  const offset = getCursorOffset(tool, mode);
  const cursorSvg = getCursorForTool(tool, mode);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute z-50"
      style={{
        left: position.x + offset.x,
        top: position.y + offset.y,
        willChange: 'transform',
      }}
    >
      {cursorSvg}
    </div>
  );
}

export default CanvasCursor;
