'use client';

import React from 'react';

/* ------------------------------------------------------------------ */
/*  Shared badge component                                             */
/* ------------------------------------------------------------------ */

interface BadgePosition {
  x: number;
  y: number;
}

function HelperBadge({
  position,
  visible,
  children,
  offset = { x: 16, y: -16 },
}: {
  position: BadgePosition;
  visible: boolean;
  children: React.ReactNode;
  offset?: { x: number; y: number };
}) {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute z-40 flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-900/90 px-2.5 py-1 shadow-lg backdrop-blur-xl"
      style={{
        left: position.x + offset.x,
        top: position.y + offset.y,
        transform: 'translate(0, -100%)',
      }}
    >
      {children}
    </div>
  );
}

function BadgeLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-medium text-slate-200">{children}</span>;
}

function BadgeSecondary({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] text-slate-400">{children}</span>;
}

function BadgeDot({ color = 'bg-blue-500' }: { color?: string }) {
  return <span className={`h-1.5 w-1.5 rounded-full ${color}`} />;
}

/* ------------------------------------------------------------------ */
/*  WallHelper                                                         */
/* ------------------------------------------------------------------ */

interface WallHelperProps {
  position: BadgePosition;
  visible: boolean;
  length: number;
  angle: number;
  snappedAngle: number | null;
  thickness: number;
  units: 'metric' | 'imperial';
}

function formatLength(value: number, units: 'metric' | 'imperial'): string {
  if (units === 'imperial') {
    const feet = Math.floor(value * 3.28084);
    const inches = Math.round((value * 3.28084 - feet) * 12);
    return `${feet}' ${inches}"`;
  }
  if (value >= 1) {
    return `${value.toFixed(2)}m`;
  }
  return `${Math.round(value * 100)}cm`;
}

function formatAngle(degrees: number): string {
  return `${degrees.toFixed(1)}`;
}

export function WallHelper({
  position,
  visible,
  length,
  angle,
  snappedAngle,
  thickness,
  units,
}: WallHelperProps) {
  return (
    <HelperBadge position={position} visible={visible}>
      <BadgeDot color="bg-blue-500" />
      <BadgeLabel>{formatLength(length, units)}</BadgeLabel>
      <BadgeSecondary>
        {formatAngle(angle)}
        {snappedAngle !== null && (
          <span className="ml-1 text-blue-400">snap {formatAngle(snappedAngle)}</span>
        )}
      </BadgeSecondary>
      <BadgeSecondary>{formatLength(thickness, units)} thick</BadgeSecondary>
    </HelperBadge>
  );
}

/* ------------------------------------------------------------------ */
/*  SlabHelper                                                         */
/* ------------------------------------------------------------------ */

interface SlabHelperProps {
  position: BadgePosition;
  visible: boolean;
  area: number;
  vertexCount: number;
  isClosed: boolean;
  units: 'metric' | 'imperial';
}

function formatArea(value: number, units: 'metric' | 'imperial'): string {
  if (units === 'imperial') {
    const sqFt = value * 10.7639;
    return `${sqFt.toFixed(1)} ft\u00B2`;
  }
  return `${value.toFixed(2)} m\u00B2`;
}

export function SlabHelper({
  position,
  visible,
  area,
  vertexCount,
  isClosed,
  units,
}: SlabHelperProps) {
  return (
    <HelperBadge position={position} visible={visible}>
      <BadgeDot color="bg-emerald-500" />
      <BadgeLabel>{formatArea(area, units)}</BadgeLabel>
      <BadgeSecondary>
        {vertexCount} pts{isClosed ? '' : ' (open)'}
      </BadgeSecondary>
    </HelperBadge>
  );
}

/* ------------------------------------------------------------------ */
/*  OpeningHelper                                                      */
/* ------------------------------------------------------------------ */

interface OpeningHelperProps {
  position: BadgePosition;
  visible: boolean;
  openingType: 'door' | 'window';
  width: number;
  height: number;
  offset: number;
  units: 'metric' | 'imperial';
}

export function OpeningHelper({
  position,
  visible,
  openingType,
  width,
  height,
  offset,
  units,
}: OpeningHelperProps) {
  return (
    <HelperBadge position={position} visible={visible}>
      <BadgeDot color={openingType === 'door' ? 'bg-amber-500' : 'bg-sky-400'} />
      <BadgeLabel>
        {openingType === 'door' ? 'Door' : 'Window'}
      </BadgeLabel>
      <BadgeSecondary>
        {formatLength(width, units)} x {formatLength(height, units)}
      </BadgeSecondary>
      <BadgeSecondary>
        at {Math.round(offset * 100)}%
      </BadgeSecondary>
    </HelperBadge>
  );
}

/* ------------------------------------------------------------------ */
/*  MeasurementHelper                                                  */
/* ------------------------------------------------------------------ */

interface MeasurementHelperProps {
  position: BadgePosition;
  visible: boolean;
  distance: number;
  units: 'metric' | 'imperial';
}

export function MeasurementHelper({
  position,
  visible,
  distance,
  units,
}: MeasurementHelperProps) {
  const imperial = units === 'imperial';
  const primaryText = formatLength(distance, units);
  const secondaryText = formatLength(distance, imperial ? 'metric' : 'imperial');

  return (
    <HelperBadge position={position} visible={visible}>
      <BadgeDot color="bg-violet-500" />
      <BadgeLabel>{primaryText}</BadgeLabel>
      <BadgeSecondary>({secondaryText})</BadgeSecondary>
    </HelperBadge>
  );
}

export default {
  WallHelper,
  SlabHelper,
  OpeningHelper,
  MeasurementHelper,
};
