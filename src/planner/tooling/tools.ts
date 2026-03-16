'use client';

export type PlannerToolId =
  | 'select'
  | 'floor'
  | 'wall'
  | 'door'
  | 'window'
  | 'measure'
  | 'text';

export type PlannerTool = PlannerToolId | null;

export interface PlannerToolDefinition {
  id: PlannerToolId;
  name: string;
  description: string;
  shortcut: string;
  accent: string;
}

export const PLANNER_TOOLS: PlannerToolDefinition[] = [
  {
    id: 'select',
    name: 'Select',
    description: 'Adjust vertices and inspect edges',
    shortcut: 'S',
    accent: 'border-sky-100 bg-sky-50 text-sky-700',
  },
  {
    id: 'floor',
    name: 'Floor Plate',
    description: 'Lay down filled floor polygons',
    shortcut: 'F',
    accent: 'border-amber-100 bg-amber-50 text-amber-700',
  },
  {
    id: 'wall',
    name: 'Wall Run',
    description: 'Chain structural wall segments',
    shortcut: 'W',
    accent: 'border-slate-200 bg-slate-100 text-slate-700',
  },
  {
    id: 'door',
    name: 'Door',
    description: 'Place hinged openings on wall runs',
    shortcut: 'D',
    accent: 'border-rose-100 bg-rose-50 text-rose-700',
  },
  {
    id: 'window',
    name: 'Window',
    description: 'Cut glazed openings into wall runs',
    shortcut: 'O',
    accent: 'border-cyan-100 bg-cyan-50 text-cyan-700',
  },
  {
    id: 'measure',
    name: 'Measure',
    description: 'Check spans and room dimensions',
    shortcut: 'M',
    accent: 'border-violet-100 bg-violet-50 text-violet-700',
  },
  {
    id: 'text',
    name: 'Label',
    description: 'Name rooms and mark notes',
    shortcut: 'T',
    accent: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  },
];

export const PLANNER_TOOL_LABELS = Object.fromEntries(
  PLANNER_TOOLS.map((tool) => [tool.id, tool.name]),
) as Record<PlannerToolId, string>;

const TOOL_BY_SHORTCUT = Object.fromEntries(
  PLANNER_TOOLS.map((tool) => [tool.shortcut.toLowerCase(), tool.id]),
) as Record<string, PlannerToolId>;

export function getPlannerToolForShortcut(key: string): PlannerToolId | null {
  return TOOL_BY_SHORTCUT[key.toLowerCase()] ?? null;
}
