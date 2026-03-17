'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Rail Button                                                         */
/* ------------------------------------------------------------------ */

interface IconRailButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function IconRailButton({
  icon,
  label,
  active = false,
  onClick,
}: IconRailButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'group flex h-10 w-10 items-center justify-center rounded-lg transition-all',
        active
          ? 'bg-blue-500/20 text-blue-400'
          : 'text-slate-500 hover:bg-slate-800/80 hover:text-slate-300',
      )}
    >
      {icon}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Rail                                                                */
/* ------------------------------------------------------------------ */

interface IconRailProps {
  children: React.ReactNode;
  className?: string;
}

export function IconRail({ children, className }: IconRailProps) {
  return (
    <div
      className={cn(
        'flex w-12 flex-col items-center gap-1 border-r border-slate-800/60 bg-slate-950/80 py-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default IconRail;
