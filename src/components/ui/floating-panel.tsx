'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  FloatingPanel                                                       */
/* ------------------------------------------------------------------ */

export interface FloatingPanelProps {
  title?: string;
  icon?: React.ReactNode;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  defaultPosition?: { x: number; y: number };
  width?: number;
}

export function FloatingPanel({
  title,
  icon,
  open,
  onClose,
  children,
  className,
  defaultPosition,
  width = 320,
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(defaultPosition ?? { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!panelRef.current) return;
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [position],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!open) return null;

  const useAbsolutePosition = defaultPosition != null;

  return (
    <div
      ref={panelRef}
      className={cn(
        'z-40 flex flex-col overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/95 shadow-2xl backdrop-blur-xl transition-opacity',
        isDragging ? 'cursor-grabbing' : '',
        className,
      )}
      style={{
        width,
        ...(useAbsolutePosition
          ? { position: 'absolute', left: position.x, top: position.y }
          : {}),
      }}
    >
      {/* Header / drag handle */}
      <div
        className="flex cursor-grab items-center justify-between border-b border-slate-800/60 px-3 py-2 active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal size={14} className="text-slate-600" />
          {icon && <span className="text-slate-400">{icon}</span>}
          {title && (
            <span className="text-xs font-semibold text-slate-300">
              {title}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-5 w-5 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
        >
          <X size={12} />
        </button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PanelSection                                                        */
/* ------------------------------------------------------------------ */

interface PanelSectionProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export function PanelSection({
  title,
  children,
  defaultCollapsed = false,
}: PanelSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="border-t border-slate-800/60">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-400"
      >
        {title}
        <span
          className={cn(
            'text-slate-600 transition-transform',
            collapsed ? '' : 'rotate-180',
          )}
        >
          ▾
        </span>
      </button>
      {!collapsed && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

export default FloatingPanel;
