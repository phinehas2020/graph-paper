import mitt from 'mitt';

import type { Point } from '@/src/model/types';
import type { EditorPhase, EditorMode } from '@/src/model/phases';

export type PlannerEvents = {
  'grid:move': { point: Point; snapped: Point };
  'grid:click': { point: Point; snapped: Point; button: number };
  'grid:drag-start': { point: Point; snapped: Point };
  'grid:drag-end': { point: Point; snapped: Point };
  'node:created': { nodeId: string; type: string };
  'node:updated': { nodeId: string; changes: Record<string, unknown> };
  'node:deleted': { nodeId: string };
  'selection:changed': { selected: string[] };
  'tool:changed': { tool: string | null; mode: EditorMode; phase: EditorPhase };
  'view:changed': Record<string, unknown>;
};

const plannerEvents = mitt<PlannerEvents>();

export default plannerEvents;
