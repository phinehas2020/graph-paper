'use client';

import type { PlannerToolId } from '@/src/planner/tooling/tools';

/** High-level project phases that group related tools together. */
export type EditorPhase = 'site' | 'structure' | 'furnish';

/** Interaction modes within a phase. */
export type EditorMode = 'select' | 'edit' | 'build' | 'delete';

export interface PhaseDefinition {
  id: EditorPhase;
  label: string;
  name: string;
  shortcut: string;
  description: string;
  tools: PlannerToolId[];
}

export const EDITOR_PHASES: PhaseDefinition[] = [
  {
    id: 'site',
    label: 'Site',
    name: 'Site',
    shortcut: '1',
    description: 'Define the property boundary and terrain',
    tools: ['select', 'measure', 'text'],
  },
  {
    id: 'structure',
    label: 'Structure',
    name: 'Structure',
    shortcut: '2',
    description: 'Build walls, floors, roofs, and openings',
    tools: ['select', 'wall', 'floor', 'door', 'window', 'ceiling', 'roof', 'zone', 'measure', 'text'],
  },
  {
    id: 'furnish',
    label: 'Furnish',
    name: 'Furnish',
    shortcut: '3',
    description: 'Place furniture and interior items',
    tools: ['select', 'item', 'measure', 'text'],
  },
];

/** Alias used by PlannerWorkspace */
export const PHASES = EDITOR_PHASES;

export interface ModeDefinition {
  id: EditorMode;
  label: string;
  name: string;
  shortcut: string;
  description: string;
}

export const EDITOR_MODES: ModeDefinition[] = [
  {
    id: 'select',
    label: 'Select',
    name: 'Select',
    shortcut: 'V',
    description: 'Select and inspect elements',
  },
  {
    id: 'edit',
    label: 'Edit',
    name: 'Edit',
    shortcut: 'E',
    description: 'Move and resize elements',
  },
  {
    id: 'build',
    label: 'Build',
    name: 'Build',
    shortcut: 'B',
    description: 'Create new elements with tools',
  },
  {
    id: 'delete',
    label: 'Delete',
    name: 'Delete',
    shortcut: 'D',
    description: 'Remove elements by clicking',
  },
];

/** Alias used by PlannerWorkspace */
export const MODES = EDITOR_MODES;
