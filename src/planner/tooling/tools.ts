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
    accent: 'from-sky-500/20 to-cyan-400/10 text-sky-700',
  },
  {
    id: 'floor',
    name: 'Floor Plate',
    description: 'Lay down filled floor polygons',
    shortcut: 'F',
    accent: 'from-amber-400/20 to-orange-300/10 text-amber-700',
  },
  {
    id: 'wall',
    name: 'Wall Run',
    description: 'Chain structural wall segments',
    shortcut: 'W',
    accent: 'from-slate-600/15 to-slate-300/5 text-slate-700',
  },
  {
    id: 'door',
    name: 'Door',
    description: 'Place hinged openings on wall runs',
    shortcut: 'D',
    accent: 'from-rose-500/20 to-orange-300/10 text-rose-700',
  },
  {
    id: 'window',
    name: 'Window',
    description: 'Cut glazed openings into wall runs',
    shortcut: 'O',
    accent: 'from-cyan-500/20 to-sky-300/10 text-cyan-700',
  },
  {
    id: 'measure',
    name: 'Measure',
    description: 'Check spans and room dimensions',
    shortcut: 'M',
    accent: 'from-violet-500/20 to-fuchsia-400/10 text-violet-700',
  },
  {
    id: 'text',
    name: 'Label',
    description: 'Name rooms and mark notes',
    shortcut: 'T',
    accent: 'from-emerald-500/20 to-teal-400/10 text-emerald-700',
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
