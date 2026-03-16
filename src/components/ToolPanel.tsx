import React from 'react';
import { MousePointer2, Square, Minus, Ruler, Type, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import useStore from '@/src/model/useStore';

interface ToolPanelProps {
  activeTool: 'floor' | 'wall' | 'select' | 'measure' | 'text' | null;
  onToolChange: (
    tool: 'floor' | 'wall' | 'select' | 'measure' | 'text' | null,
  ) => void;
  className?: string;
  compact?: boolean;
}

const tools = [
  {
    id: 'select' as const,
    name: 'Select',
    icon: MousePointer2,
    description: 'Adjust vertices and inspect edges',
    shortcut: 'S',
    accent: 'from-sky-500/20 to-cyan-400/10 text-sky-700',
  },
  {
    id: 'floor' as const,
    name: 'Floor Plate',
    icon: Square,
    description: 'Lay down filled floor polygons',
    shortcut: 'F',
    accent: 'from-amber-400/20 to-orange-300/10 text-amber-700',
  },
  {
    id: 'wall' as const,
    name: 'Wall Run',
    icon: Minus,
    description: 'Chain structural wall segments',
    shortcut: 'W',
    accent: 'from-slate-600/15 to-slate-300/5 text-slate-700',
  },
  {
    id: 'measure' as const,
    name: 'Measure',
    icon: Ruler,
    description: 'Check spans and room dimensions',
    shortcut: 'M',
    accent: 'from-violet-500/20 to-fuchsia-400/10 text-violet-700',
  },
  {
    id: 'text' as const,
    name: 'Label',
    icon: Type,
    description: 'Name rooms and mark notes',
    shortcut: 'T',
    accent: 'from-emerald-500/20 to-teal-400/10 text-emerald-700',
  },
];

export const ToolPanel: React.FC<ToolPanelProps> = ({
  activeTool,
  onToolChange,
  className,
  compact = false,
}) => {
  const { settings, clearTemporaryMeasurements } = useStore();

  const handleKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      if (settings.isTextEditing) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 's':
          onToolChange('select');
          break;
        case 'f':
          onToolChange('floor');
          break;
        case 'w':
          onToolChange('wall');
          break;
        case 'm':
          onToolChange('measure');
          break;
        case 't':
          onToolChange('text');
          break;
        case 'escape':
          onToolChange(null);
          break;
        default:
          break;
      }
    },
    [onToolChange, settings.isTextEditing],
  );

  const handleToolChange = React.useCallback(
    (tool: typeof activeTool) => {
      if (
        activeTool === 'measure' &&
        tool !== 'measure' &&
        settings.measurementMode === 'temporary'
      ) {
        clearTemporaryMeasurements();
      }

      onToolChange(tool);
    },
    [
      activeTool,
      clearTemporaryMeasurements,
      onToolChange,
      settings.measurementMode,
    ],
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Card
      className={cn(
        compact
          ? 'panel-surface panel-glow w-[68px] overflow-hidden border-slate-200/80 bg-white/88'
          : 'panel-surface panel-glow w-[272px] overflow-hidden border-slate-200/80 bg-white/85',
        className,
      )}
    >
      {!compact && (
        <CardHeader className="space-y-3 border-b border-slate-100/90 p-4">
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

      <CardContent className={cn('space-y-2 p-3', compact && 'p-1.5')}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <Button
              key={tool.id}
              type="button"
              variant="ghost"
              className={cn(
                compact
                  ? 'h-14 w-full rounded-[18px] border border-transparent px-0 py-0'
                  : 'h-auto w-full justify-start rounded-2xl border border-transparent px-3 py-3 text-left transition-all duration-200',
                isActive
                  ? 'border-sky-200 bg-sky-50/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_12px_24px_-18px_rgba(14,116,144,0.6)]'
                  : 'hover:border-slate-200 hover:bg-slate-50/90',
              )}
              onClick={() => handleToolChange(isActive ? null : tool.id)}
              title={`${tool.name} (${tool.shortcut})`}
            >
              {compact ? (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1.5">
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-br shadow-sm',
                      tool.accent,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {tool.shortcut}
                  </span>
                </span>
              ) : (
                <>
                  <span
                    className={cn(
                      'mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-br shadow-sm',
                      tool.accent,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {tool.name}
                      </span>
                      <kbd className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                        {tool.shortcut}
                      </kbd>
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {tool.description}
                    </span>
                  </span>
                </>
              )}
            </Button>
          );
        })}

        {!compact && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 px-3 py-3">
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
    </Card>
  );
};
