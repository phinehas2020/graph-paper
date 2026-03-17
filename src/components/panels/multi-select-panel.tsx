'use client';

import React from 'react';
import { Layers, Trash2, Group, AlignHorizontalDistributeCenter } from 'lucide-react';
import { FloatingPanel, PanelSection } from '@/src/components/ui/floating-panel';

interface SelectedElementSummary {
  id: string;
  type: 'wall' | 'opening' | 'floor';
  label: string;
}

interface MultiSelectPanelProps {
  selectedElements: SelectedElementSummary[];
  onDeleteAll: () => void;
  onGroup: () => void;
  onAlign: () => void;
  onClose: () => void;
}

export function MultiSelectPanel({
  selectedElements,
  onDeleteAll,
  onGroup,
  onAlign,
  onClose,
}: MultiSelectPanelProps) {
  const grouped = selectedElements.reduce<Record<string, number>>(
    (acc, el) => {
      acc[el.type] = (acc[el.type] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <FloatingPanel
      title={`${selectedElements.length} Selected`}
      icon={<Layers className="h-3.5 w-3.5" />}
      open={true}
      onClose={onClose}
    >
      {/* Summary by type */}
      <PanelSection title="Selection Summary">
        <div className="space-y-1.5">
          {Object.entries(grouped).map(([type, count]) => (
            <div
              key={type}
              className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2"
            >
              <span className="text-xs font-medium capitalize text-slate-400">
                {type}s
              </span>
              <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs font-semibold text-slate-200">
                {count}
              </span>
            </div>
          ))}
        </div>
      </PanelSection>

      <div className="border-t border-slate-700/50" />

      {/* Actions */}
      <PanelSection title="Actions">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onDeleteAll}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/50 px-2 py-2.5 text-red-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-xs font-medium">Delete</span>
          </button>
          <button
            onClick={onGroup}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/50 px-2 py-2.5 text-slate-400 transition-colors hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
          >
            <Group className="h-4 w-4" />
            <span className="text-xs font-medium">Group</span>
          </button>
          <button
            onClick={onAlign}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/50 px-2 py-2.5 text-slate-400 transition-colors hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
          >
            <AlignHorizontalDistributeCenter className="h-4 w-4" />
            <span className="text-xs font-medium">Align</span>
          </button>
        </div>
      </PanelSection>

      <div className="border-t border-slate-700/50" />

      {/* Element list */}
      <PanelSection title="Elements">
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {selectedElements.map((el) => (
            <div
              key={el.id}
              className="flex items-center justify-between rounded-md border border-slate-700/50 bg-slate-800/30 px-2.5 py-1.5"
            >
              <span className="text-xs text-slate-300">{el.label}</span>
              <span className="inline-flex items-center rounded-full bg-slate-700/50 px-1.5 py-0.5 text-[10px] font-medium capitalize text-slate-500">
                {el.type}
              </span>
            </div>
          ))}
        </div>
      </PanelSection>
    </FloatingPanel>
  );
}

export default MultiSelectPanel;
