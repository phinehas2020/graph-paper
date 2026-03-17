'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Section                                                             */
/* ------------------------------------------------------------------ */

interface ActionMenuSectionProps {
  label: string;
  children: React.ReactNode;
}

export function ActionMenuSection({ label, children }: ActionMenuSectionProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 select-none text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </span>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Button                                                              */
/* ------------------------------------------------------------------ */

interface ActionMenuButtonProps {
  active?: boolean;
  icon?: React.ReactNode;
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  tooltip?: string;
  className?: string;
}

export function ActionMenuButton({
  active = false,
  icon,
  label,
  shortcut,
  onClick,
  tooltip,
  className,
}: ActionMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip ?? (shortcut ? `${label} (${shortcut})` : label)}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
        active
          ? 'bg-blue-500/20 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.3)]'
          : 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200',
        className,
      )}
    >
      {icon}
      {label && <span>{label}</span>}
      {shortcut && (
        <kbd className="ml-0.5 rounded bg-slate-800/80 px-1 py-0.5 text-[10px] text-slate-500">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Divider                                                             */
/* ------------------------------------------------------------------ */

export function ActionMenuDivider() {
  return <div className="mx-1.5 h-6 w-px bg-slate-700/50" />;
}

/* ------------------------------------------------------------------ */
/*  Root                                                                */
/* ------------------------------------------------------------------ */

interface ActionMenuProps {
  children: React.ReactNode;
  className?: string;
}

export function ActionMenu({ children, className }: ActionMenuProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-xl border border-slate-700/50 bg-slate-900/90 px-2 py-1.5 shadow-2xl backdrop-blur-xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default ActionMenu;
