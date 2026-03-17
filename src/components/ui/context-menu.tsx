'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

export interface ContextMenuItemDef {
  type: 'item' | 'separator' | 'submenu';
  id?: string;
  icon?: LucideIcon;
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: ContextMenuItemDef[];
}

export interface ContextMenuProps {
  items: ContextMenuItemDef[];
  position: { x: number; y: number };
  onClose: () => void;
}

function MenuItemRow({
  item,
  onClose,
}: {
  item: ContextMenuItemDef;
  onClose: () => void;
}) {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [submenuPos, setSubmenuPos] = useState<{ x: number; y: number } | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const openSubmenu = useCallback(() => {
    if (item.type !== 'submenu' || item.disabled) return;
    const rect = rowRef.current?.getBoundingClientRect();
    if (rect) {
      setSubmenuPos({ x: rect.right, y: rect.top });
      setSubmenuOpen(true);
    }
  }, [item]);

  const closeSubmenu = useCallback(() => {
    timeoutRef.current = setTimeout(() => setSubmenuOpen(false), 150);
  }, []);

  const keepSubmenu = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  if (item.type === 'separator') {
    return <div className="h-px bg-slate-700/50 my-1 mx-2" />;
  }

  const Icon = item.icon;
  const hasSubmenu = item.type === 'submenu' && item.children && item.children.length > 0;

  return (
    <div
      ref={rowRef}
      className="relative"
      onMouseEnter={() => {
        keepSubmenu();
        openSubmenu();
      }}
      onMouseLeave={closeSubmenu}
    >
      <button
        type="button"
        disabled={item.disabled}
        onClick={() => {
          if (hasSubmenu) return;
          item.onClick?.();
          onClose();
        }}
        className={`
          flex items-center gap-2 w-full px-3 py-1.5 text-left
          transition-all duration-100
          ${
            item.disabled
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/80 cursor-pointer'
          }
        `}
      >
        <span className="w-4 h-4 flex items-center justify-center flex-none">
          {Icon && <Icon className="w-3.5 h-3.5" />}
        </span>
        <span className="text-xs flex-1 truncate">{item.label}</span>
        {item.shortcut && (
          <kbd className="text-[10px] text-slate-500 font-mono ml-4 flex-none">
            {item.shortcut}
          </kbd>
        )}
        {hasSubmenu && <ChevronRight className="w-3 h-3 text-slate-500 flex-none" />}
      </button>

      {/* Submenu */}
      {hasSubmenu && submenuOpen && submenuPos && (
        <div
          className="fixed z-[60]"
          style={{ left: submenuPos.x, top: submenuPos.y }}
          onMouseEnter={keepSubmenu}
          onMouseLeave={closeSubmenu}
        >
          <ContextMenuInner items={item.children!} onClose={onClose} />
        </div>
      )}
    </div>
  );
}

function ContextMenuInner({
  items,
  onClose,
}: {
  items: ContextMenuItemDef[];
  onClose: () => void;
}) {
  return (
    <div className="min-w-[180px] py-1 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-xl shadow-black/40">
      {items.map((item, idx) => (
        <MenuItemRow
          key={item.id ?? `menu-item-${idx}`}
          item={item}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState(position);

  // Adjust position to stay within viewport
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x =
      position.x + rect.width > window.innerWidth
        ? window.innerWidth - rect.width - 8
        : position.x;
    const y =
      position.y + rect.height > window.innerHeight
        ? window.innerHeight - rect.height - 8
        : position.y;
    setAdjustedPos({ x: Math.max(0, x), y: Math.max(0, y) });
  }, [position]);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      <ContextMenuInner items={items} onClose={onClose} />
    </div>
  );
}
