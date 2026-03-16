'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Columns2,
  DraftingCompass,
  EyeOff,
  Layers3,
  MoveDiagonal2,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { cn } from '@/lib/utils';
import { Canvas2D } from '@/src/components/Canvas2D';
import PlannerSelectionInspector from '@/src/components/planner/PlannerSelectionInspector';
import { ToolPanel } from '@/src/components/ToolPanel';
import usePlannerEditorStore from '@/src/planner/stores/usePlannerEditorStore';
import usePlannerSceneStore from '@/src/planner/stores/usePlannerSceneStore';
import usePlannerViewerStore, {
  PlannerViewportMode,
} from '@/src/planner/stores/usePlannerViewerStore';
import PlannerToolManager from '@/src/planner/tooling/PlannerToolManager';
import { PLANNER_TOOL_LABELS } from '@/src/planner/tooling/tools';
import { Viewer } from '@/src/three/Viewer';

function DraftBoardPanel({
  containerRef,
  dimensions,
  isMobile,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  dimensions: { width: number; height: number };
  isMobile: boolean;
}) {
  const activeTool = usePlannerEditorStore((state) => state.activeTool);
  const selectTool = usePlannerEditorStore((state) => state.selectTool);
  const snapToFloorEdges = usePlannerEditorStore(
    (state) => state.snapToFloorEdges,
  );
  const showGuide = usePlannerViewerStore((state) => state.showGuide);
  const gridVisible = usePlannerSceneStore((state) => state.settings.gridVisible);

  const inspectorPositionClass = useMemo(() => {
    if (isMobile) {
      return 'inset-x-4 top-24 bottom-4';
    }

    return showGuide
      ? 'right-5 top-32 bottom-5 w-[320px]'
      : 'right-5 top-5 bottom-5 w-[320px]';
  }, [isMobile, showGuide]);

  const compactToolRailWidthClass = showGuide ? 'w-56 min-w-56 max-w-56' : 'w-[112px] min-w-[112px] max-w-[112px]';

  return (
    <section
      className={cn(
        'canvas-fade flex h-full overflow-hidden p-3',
        showGuide ? 'gap-3 md:gap-4 md:p-4' : 'gap-2 md:gap-2.5 md:p-3',
      )}
    >
      {!isMobile && (
        <aside
          className={cn(
            'hidden min-h-0 shrink-0 md:flex md:max-h-full',
            compactToolRailWidthClass,
          )}
        >
          <ToolPanel
            activeTool={activeTool}
            onToolChange={selectTool}
            compact={!showGuide}
          />
        </aside>
      )}

      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden rounded-[24px] border border-white/80 bg-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
      >
        {showGuide ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-3 p-4 md:p-5">
            <div className="panel-surface max-w-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <DraftingCompass className="h-4 w-4 text-sky-600" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Draft Board
                </p>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {activeTool ? PLANNER_TOOL_LABELS[activeTool] : 'No tool selected'}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Use half-grid snapping for clean wall joins and dimension labels
                that feel architectural instead of sketchy.
              </p>
            </div>

            <div className="panel-surface hidden items-center gap-3 px-4 py-3 md:flex">
              <span className="blueprint-chip border-slate-200 bg-slate-50/80 text-slate-500">
                Snap 0.5&apos;
              </span>
              <span className="blueprint-chip">
                Edge Snap {snapToFloorEdges ? 'On' : 'Off'}
              </span>
              <span className="blueprint-chip">
                {gridVisible ? 'Grid Visible' : 'Grid Hidden'}
              </span>
            </div>
          </div>
        ) : (
          <div className="pointer-events-none absolute left-4 top-4 z-10 md:left-5 md:top-5">
            <div className="panel-surface px-4 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                {activeTool ? PLANNER_TOOL_LABELS[activeTool] : 'Drafting'}
              </p>
            </div>
          </div>
        )}

        <Canvas2D width={dimensions.width} height={dimensions.height} />

        <PlannerSelectionInspector
          className={`absolute z-20 ${inspectorPositionClass}`}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-3 p-4 md:p-5">
          {showGuide && (
            <div className="panel-surface px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Drawing Rhythm
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Floors become slabs. Wall chains become vertical massing. Labels
                and dimensions stay anchored to the same plan.
              </p>
            </div>
          )}

          {isMobile && (
            <div
              className={cn(
                'pointer-events-auto max-h-[65dvh] min-h-0 overflow-y-auto',
                compactToolRailWidthClass,
              )}
            >
              <ToolPanel
                activeTool={activeTool}
                onToolChange={selectTool}
                className="max-h-[65dvh]"
                compact={!showGuide}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PreviewPanel() {
  const showGuide = usePlannerViewerStore((state) => state.showGuide);

  return (
    <section className="relative h-full overflow-hidden bg-[radial-gradient(circle_at_top,#ffffff_0%,#eef4f9_42%,#e6eef6_100%)]">
      {showGuide ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4 md:p-5">
          <div className="panel-surface px-4 py-3">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-sky-600" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Spatial Preview
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The preview is centered automatically so you can judge volume,
              corner accuracy, and overall composition faster.
            </p>
          </div>

          <div className="panel-surface hidden px-4 py-3 md:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Orbit Controls
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Drag to orbit, right drag to pan, scroll to zoom.
            </p>
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute left-4 top-4 z-10 md:left-5 md:top-5">
          <div className="panel-surface px-4 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              3D Preview
            </p>
          </div>
        </div>
      )}

      <Viewer />

      <div className="pointer-events-none absolute bottom-4 right-4 z-10">
        <div className="panel-surface flex items-center gap-3 px-4 py-3">
          <span className="rounded-full bg-slate-100 p-2 text-slate-500">
            <MoveDiagonal2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Camera
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {showGuide
                ? 'Smart fit keeps the model framed as it grows.'
                : 'Drag to orbit, scroll to zoom.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const VIEWPORT_OPTIONS: Array<{
  mode: PlannerViewportMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { mode: 'draft', label: '2D', icon: DraftingCompass },
  { mode: 'split', label: 'Split', icon: Columns2 },
  { mode: 'preview', label: '3D', icon: Layers3 },
];

export function PlannerWorkspace() {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const snapToFloorEdges = usePlannerEditorStore(
    (state) => state.snapToFloorEdges,
  );
  const toggleFloorEdgeSnap = usePlannerEditorStore(
    (state) => state.toggleFloorEdgeSnap,
  );
  const showGuide = usePlannerViewerStore((state) => state.showGuide);
  const toggleGuide = usePlannerViewerStore((state) => state.toggleGuide);
  const viewportMode = usePlannerViewerStore((state) => state.viewportMode);
  const setViewportMode = usePlannerViewerStore(
    (state) => state.setViewportMode,
  );
  const wallNodes = usePlannerSceneStore((state) => state.wallNodes);
  const floorNodes = usePlannerSceneStore((state) => state.floorNodes);
  const openingNodes = usePlannerSceneStore((state) => state.openingNodes);
  const rootNodeIds = usePlannerSceneStore((state) => state.rootNodeIds);

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) {
        return;
      }

      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [viewportMode]);

  const stats = useMemo(
    () => [
      { label: 'Roots', value: rootNodeIds.length.toString().padStart(2, '0') },
      { label: 'Walls', value: wallNodes.length.toString().padStart(2, '0') },
      { label: 'Floors', value: floorNodes.length.toString().padStart(2, '0') },
      {
        label: 'Openings',
        value: openingNodes.length.toString().padStart(2, '0'),
      },
    ],
    [floorNodes.length, openingNodes.length, rootNodeIds.length, wallNodes.length],
  );

  const draftPanel = (
    <DraftBoardPanel
      containerRef={containerRef}
      dimensions={dimensions}
      isMobile={isMobile}
    />
  );

  const previewPanel = <PreviewPanel />;

  return (
    <div className="flex h-screen flex-col overflow-hidden px-3 py-3 text-slate-900 md:px-4 md:py-4">
      <PlannerToolManager />

      <div className="panel-surface panel-glow flex h-full flex-col overflow-hidden border-white/80">
        <header className="border-b border-slate-200/80 bg-white/70 px-4 py-4 backdrop-blur-xl md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-sky-600 shadow-sm">
                <Box className="h-6 w-6" />
              </span>
              <div>
                <div className="blueprint-chip">
                  <Sparkles className="h-3.5 w-3.5" />
                  Spatial Draft Studio
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 md:text-[2rem]">
                  Graph Paper 3D
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-[15px]">
                  Draw the plan in 2D, inspect proportions instantly in 3D, and
                  keep both views reading from the same geometry.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm">
                {VIEWPORT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = viewportMode === option.mode;

                  return (
                    <Button
                      key={option.mode}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'rounded-full px-3',
                        isActive && 'bg-slate-900 text-white hover:bg-slate-900',
                      )}
                      onClick={() => setViewportMode(option.mode)}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                className="rounded-full border-slate-200 bg-white/90 px-4"
                onClick={toggleFloorEdgeSnap}
              >
                Edge Snap {snapToFloorEdges ? 'On' : 'Off'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-full border-slate-200 bg-white/90 px-4"
                onClick={toggleGuide}
              >
                {showGuide ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Hide Guide
                  </>
                ) : (
                  <>
                    <PanelLeftOpen className="h-4 w-4" />
                    Show Guide
                  </>
                )}
              </Button>

              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2 shadow-sm"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-2 md:p-3">
          {viewportMode === 'split' ? (
            <ResizablePanelGroup
              direction="horizontal"
              className="h-full overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/65"
            >
              <ResizablePanel defaultSize={58} minSize={28}>
                {draftPanel}
              </ResizablePanel>

              <ResizableHandle
                withHandle
                className="bg-transparent before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-slate-200/80"
              />

              <ResizablePanel defaultSize={42} minSize={24}>
                {previewPanel}
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="h-full overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/65">
              {viewportMode === 'draft' ? draftPanel : previewPanel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlannerWorkspace;
