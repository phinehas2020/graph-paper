import React from 'react';
import { AppWindow, DoorOpen, MousePointer2, Square, Minus, Ruler, Type, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  PLANNER_TOOLS,
  PlannerTool,
  PlannerToolId,
} from '@/src/planner/tooling/tools';

interface ToolPanelProps {
  activeTool: PlannerTool;
  onToolChange: (tool: PlannerTool) => void;
  className?: string;
  compact?: boolean;
}

const TOOL_ICONS: Record<PlannerToolId, React.ComponentType<{ className?: string }>> = {
  select: MousePointer2,
  floor: Square,
  wall: Minus,
  door: DoorOpen,
  window: AppWindow,
  measure: Ruler,
  text: Type,
};

const tools = PLANNER_TOOLS.map((tool) => ({
  ...tool,
  icon: TOOL_ICONS[tool.id],
}));

export const ToolPanel: React.FC<ToolPanelProps> = ({
  activeTool,
  onToolChange,
  className,
  compact = false,
}) => {
  const activeToolDefinition = tools.find((tool) => tool.id === activeTool) ?? null;
  const handleToolChange = React.useCallback(
    (tool: PlannerTool) => {
      onToolChange(tool);
    },
    [onToolChange],
  );

  return (
    <Card
      className={cn(
        'pointer-events-auto flex max-h-full flex-none flex-col overflow-hidden',
        compact
          ? 'panel-surface panel-glow w-[112px] min-w-[112px] max-w-[112px] self-start overflow-hidden border-slate-200/80 bg-white/88'
          : 'panel-surface panel-glow w-56 min-w-56 max-w-56 self-start overflow-hidden border-slate-200/80 bg-white/85',
        className,
      )}
    >
      {!compact && (
        <CardHeader className="shrink-0 space-y-3 border-b border-slate-100/90 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                Tool Dock
              </p>
              <CardTitle className="mt-2 text-lg font-semibold text-slate-900">
                Draft With Intent
              </CardTitle>
            </div>
            <span className="rounded-full bg-sky-50 p-2 text-sky-600">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-500">
            Build the plan the same way an architect would: slab first, walls
            second, measurements and labels last.
          </p>
        </CardHeader>
      )}

      <TooltipProvider delayDuration={90}>
        <CardContent
          className={cn(
            'min-h-0 overflow-y-auto overscroll-contain space-y-2 p-2.5',
            compact && 'space-y-2 p-2',
          )}
        >
          {compact && (
            <div className="rounded-[20px] border border-slate-200/80 bg-white/92 px-2 py-2 text-center shadow-sm">
              <p className="text-[10px] font-semibold text-slate-500">Tools</p>
            </div>
          )}

          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;

            const button = (
              <Button
                key={tool.id}
                type="button"
                variant="ghost"
                aria-label={`${tool.name} (${tool.shortcut})`}
                aria-pressed={isActive}
                className={cn(
                  compact
                    ? 'group relative h-16 w-full rounded-[20px] border px-0 py-0'
                    : 'h-auto w-full justify-start rounded-[22px] border px-3 py-3 text-left',
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-900 hover:text-white'
                    : 'border-slate-200/80 bg-white/82 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                )}
                onClick={() => handleToolChange(isActive ? null : tool.id)}
              >
                {compact ? (
                  <>
                    <span
                      className={cn(
                        'absolute left-2 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full transition-colors',
                        isActive ? 'bg-sky-400' : 'bg-transparent',
                      )}
                    />
                    <span className="flex flex-col items-center justify-center gap-1.5">
                      <span
                        className={cn(
                          'flex size-10 items-center justify-center rounded-2xl border shadow-sm transition-colors',
                          isActive
                            ? 'border-white/10 bg-white/10 text-white'
                            : tool.accent,
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <span
                        className={cn(
                          'text-[11px] font-semibold',
                          isActive ? 'text-white' : 'text-slate-700',
                        )}
                      >
                        {tool.name}
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className={cn(
                        'mr-3 flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm',
                        isActive
                          ? 'border-white/10 bg-white/10 text-white'
                          : tool.accent,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            isActive ? 'text-white' : 'text-slate-900',
                          )}
                        >
                          {tool.name}
                        </span>
                        <kbd
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[10px] font-medium text-slate-500',
                            isActive
                              ? 'border-white/10 bg-white/10 text-slate-100'
                              : 'border-slate-200 bg-white text-slate-500',
                          )}
                        >
                          {tool.shortcut}
                        </kbd>
                      </span>
                      <span
                        className={cn(
                          'mt-1 block text-xs leading-5',
                          isActive ? 'text-slate-300' : 'text-slate-500',
                        )}
                      >
                        {tool.description}
                      </span>
                    </span>
                  </>
                )}
              </Button>
            );

            if (!compact) {
              return button;
            }

            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={12}
                  className="rounded-xl border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg"
                >
                  <p className="font-semibold text-slate-900">{tool.name}</p>
                  <p className="mt-1 text-slate-500">Shortcut {tool.shortcut}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {compact && (
            <div className="rounded-[20px] border border-slate-200/80 bg-white/92 px-2.5 py-2 text-center shadow-sm">
              <p className="truncate text-xs font-semibold text-slate-900">
                {activeToolDefinition?.name ?? 'Choose'}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                {activeToolDefinition
                  ? `Shortcut ${activeToolDefinition.shortcut}`
                  : 'Pick a tool'}
              </p>
            </div>
          )}

          {!compact && (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/90 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Workflow Tip
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Close the floor polygon to create the slab, then trace walls so the
                3D preview reads like a real room instead of floating segments.
              </p>
            </div>
          )}
        </CardContent>
      </TooltipProvider>
    </Card>
  );
};

export default ToolPanel;
