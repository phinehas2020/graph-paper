'use client';

import { EditorPhase } from '@/src/model/phases';

export type PlannerToolId =
  | 'select'
  | 'floor'
  | 'wall'
  | 'door'
  | 'window'
  | 'measure'
  | 'text'
  | 'ceiling'
  | 'roof'
  | 'zone'
  | 'item';

export type PlannerTool = PlannerToolId | null;

export interface PlannerToolDefinition {
  id: PlannerToolId;
  name: string;
  shortcut: string;
  description: string;
  phase: EditorPhase | 'any';
  requiresBuildMode: boolean;
  accent: string;
  icon: string;
}

export const PLANNER_TOOLS: PlannerToolDefinition[] = [
  {
    id: 'select',
    name: 'Select',
    shortcut: 'V',
    description: 'Select and move elements',
    phase: 'any',
    requiresBuildMode: false,
    accent: 'border-sky-100 bg-sky-50 text-sky-700',
    icon: 'MousePointer2',
  },
  {
    id: 'wall',
    name: 'Wall',
    shortcut: 'W',
    description: 'Draw wall segments',
    phase: 'structure',
    requiresBuildMode: true,
    accent: 'border-slate-200 bg-slate-100 text-slate-700',
    icon: 'Minus',
  },
  {
    id: 'floor',
    name: 'Floor Slab',
    shortcut: 'F',
    description: 'Draw floor polygons',
    phase: 'structure',
    requiresBuildMode: true,
    accent: 'border-amber-100 bg-amber-50 text-amber-700',
    icon: 'Square',
  },
  {
    id: 'door',
    name: 'Door',
    shortcut: 'D',
    description: 'Place door openings',
    phase: 'structure',
    requiresBuildMode: true,
    accent: 'border-rose-100 bg-rose-50 text-rose-700',
    icon: 'DoorOpen',
  },
  {
    id: 'window',
    name: 'Window',
    shortcut: 'O',
    description: 'Place window openings',
    phase: 'structure',
    requiresBuildMode: true,
    accent: 'border-cyan-100 bg-cyan-50 text-cyan-700',
    icon: 'AppWindow',
  },
  {
    id: 'ceiling',
    name: 'Ceiling',
    shortcut: 'C',
    description: 'Draw ceiling surfaces',
    phase: 'structure',
    requiresBuildMode: true,
    accent: 'border-indigo-100 bg-indigo-50 text-indigo-700',
    icon: 'LayoutGrid',
  },
  {
    id: 'roof',
    name: 'Roof',
    shortcut: 'R',
    description: 'Create roof geometry',
    phase: 'structure',
    requiresBuildMode: true,
    accent: 'border-orange-100 bg-orange-50 text-orange-700',
    icon: 'Triangle',
  },
  {
    id: 'zone',
    name: 'Zone',
    shortcut: 'Z',
    description: 'Define interior spaces',
    phase: 'structure',
    requiresBuildMode: true,
    accent: 'border-purple-100 bg-purple-50 text-purple-700',
    icon: 'BoxSelect',
  },
  {
    id: 'measure',
    name: 'Measure',
    shortcut: 'M',
    description: 'Add dimension lines',
    phase: 'any',
    requiresBuildMode: false,
    accent: 'border-violet-100 bg-violet-50 text-violet-700',
    icon: 'Ruler',
  },
  {
    id: 'text',
    name: 'Label',
    shortcut: 'T',
    description: 'Place text labels',
    phase: 'any',
    requiresBuildMode: false,
    accent: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    icon: 'Type',
  },
  {
    id: 'item',
    name: 'Furniture',
    shortcut: 'I',
    description: 'Place furniture items',
    phase: 'furnish',
    requiresBuildMode: true,
    accent: 'border-teal-100 bg-teal-50 text-teal-700',
    icon: 'Armchair',
  },
];

/** Backward-compatible label map. */
export const PLANNER_TOOL_LABELS = Object.fromEntries(
  PLANNER_TOOLS.map((tool) => [tool.id, tool.name]),
) as Record<PlannerToolId, string>;

const TOOL_BY_SHORTCUT = Object.fromEntries(
  PLANNER_TOOLS.map((tool) => [tool.shortcut.toLowerCase(), tool.id]),
) as Record<string, PlannerToolId>;

export function getPlannerToolForShortcut(
  key: string,
): PlannerToolId | null {
  return TOOL_BY_SHORTCUT[key.toLowerCase()] ?? null;
}

/** Return tools available in a given phase. */
export function getToolsForPhase(
  phase: EditorPhase,
): PlannerToolDefinition[] {
  return PLANNER_TOOLS.filter(
    (tool) => tool.phase === 'any' || tool.phase === phase,
  );
}
