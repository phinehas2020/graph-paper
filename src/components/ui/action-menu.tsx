'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Section — no visible label, just groups children                    */
/* ------------------------------------------------------------------ */

interface ActionMenuSectionProps {
  label?: string;
  children: React.ReactNode;
}

export function ActionMenuSection({ children }: ActionMenuSectionProps) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

/* ------------------------------------------------------------------ */
/*  Button — icon-only by default, label in tooltip                     */
/* ------------------------------------------------------------------ */

interface ActionMenuButtonProps {
  active?: boolean;
  icon?: React.ReactNode;
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  tooltip?: string;
  showLabel?: boolean;
  className?: string;
}

export function ActionMenuButton({
  active = false,
  icon,
  label,
  shortcut,
  onClick,
  tooltip,
  showLabel = false,
  className,
}: ActionMenuButtonProps) {
  const title = tooltip ?? (shortcut ? `${label} (${shortcut})` : label);

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'relative flex items-center justify-center rounded-md transition-all',
        showLabel ? 'gap-1.5 px-2.5 py-1.5' : 'h-8 w-8',
        active
          ? 'bg-blue-500/20 text-blue-400'
          : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200',
        className,
      )}
    >
      {icon}
      {showLabel && label && (
        <span className="text-xs font-medium">{label}</span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Divider                                                             */
/* ------------------------------------------------------------------ */

export function ActionMenuDivider() {
  return <div className="mx-1 h-5 w-px bg-slate-700/40" />;
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
        'flex items-center gap-0.5 rounded-xl border border-slate-700/50 bg-slate-900/90 px-1.5 py-1 shadow-2xl backdrop-blur-xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default ActionMenu;
