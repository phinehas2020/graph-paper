'use client';

import React, { useState, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Square,
  Minus,
  DoorOpen,
  AppWindow,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlannerSceneNode } from '@/src/model/types';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface SceneTreeProps {
  nodes: Record<string, PlannerSceneNode>;
  rootNodeIds: string[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Icons per node type                                                 */
/* ------------------------------------------------------------------ */

const NODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  floor: Square,
  wall: Minus,
  opening: DoorOpen,
};

function getNodeIcon(type: string) {
  return NODE_ICONS[type] ?? AppWindow;
}

/* ------------------------------------------------------------------ */
/*  Tree Node                                                           */
/* ------------------------------------------------------------------ */

function SceneTreeNode({
  node,
  nodes,
  depth,
  selectedId,
  onSelect,
}: {
  node: PlannerSceneNode;
  nodes: Record<string, PlannerSceneNode>;
  depth: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.childIds.length > 0;
  const isSelected = selectedId === node.id;
  const Icon = getNodeIcon(node.type);

  const toggle = useCallback(() => setExpanded((e) => !e), []);

  const nodeLabel =
    node.type === 'floor'
      ? 'Floor'
      : node.type === 'wall'
        ? 'Wall'
        : (node.entity as { type?: string }).type === 'window'
          ? 'Window'
          : 'Door';

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect?.(node.id)}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs transition-colors',
          isSelected
            ? 'bg-blue-500/20 text-blue-400'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
        )}
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            className="flex h-4 w-4 shrink-0 items-center justify-center"
          >
            {expanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </button>
        ) : (
          <span className="h-4 w-4 shrink-0" />
        )}
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {nodeLabel}{' '}
          <span className="text-slate-600">{node.id.slice(0, 6)}</span>
        </span>
      </button>

      {hasChildren && expanded && (
        <div>
          {node.childIds.map((childId) => {
            const child = nodes[childId];
            if (!child) return null;
            return (
              <SceneTreeNode
                key={childId}
                node={child}
                nodes={nodes}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tree root                                                           */
/* ------------------------------------------------------------------ */

export function SceneTree({
  nodes,
  rootNodeIds,
  selectedId,
  onSelect,
}: SceneTreeProps) {
  if (rootNodeIds.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-xs text-slate-600">
        No elements yet. Start drawing to populate the scene tree.
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-1">
      {rootNodeIds.map((id) => {
        const node = nodes[id];
        if (!node) return null;
        return (
          <SceneTreeNode
            key={id}
            node={node}
            nodes={nodes}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}

export default SceneTree;
