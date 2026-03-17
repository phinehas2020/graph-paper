'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Armchair,
  AppWindow,
  BoxSelect,
  Columns2,
  DoorOpen,
  DraftingCompass,
  LayoutGrid,
  Layers3,
  Minus,
  MousePointer2,
  Pencil,
  Ruler,
  Settings,
  Square,
  Trash2,
  TreePine,
  Triangle,
  Type,
  Wrench,
} from 'lucide-react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { Canvas2D } from '@/src/components/Canvas2D';
import PlannerSelectionInspector from '@/src/components/planner/PlannerSelectionInspector';
import { ViewControls } from '@/src/components/view-controls';
import {
  ActionMenu,
  ActionMenuSection,
  ActionMenuButton,
  ActionMenuDivider,
} from '@/src/components/ui/action-menu';
import { IconRail, IconRailButton } from '@/src/components/ui/icon-rail';
import { FloatingPanel } from '@/src/components/ui/floating-panel';
import { SceneTree } from '@/src/components/ui/scene-tree';
import { ToolPanel } from '@/src/components/ToolPanel';
import { SettingsPanel } from '@/src/components/settings-panel';
import usePlannerEditorStore from '@/src/planner/stores/usePlannerEditorStore';
import usePlannerSceneStore from '@/src/planner/stores/usePlannerSceneStore';
import usePlannerViewerStore, {
  PlannerViewportMode,
} from '@/src/planner/stores/usePlannerViewerStore';
import useEnhancedEditorStore from '@/src/planner/stores/useEnhancedEditorStore';
import PlannerToolManager from '@/src/planner/tooling/PlannerToolManager';
import { PLANNER_TOOLS, type PlannerToolId } from '@/src/planner/tooling/tools';
import { PHASES, MODES, type EditorPhase, type EditorMode } from '@/src/model/phases';
import { Viewer } from '@/src/three/Viewer';

/* ------------------------------------------------------------------ */
/*  Tool icon lookup                                                    */
/* ------------------------------------------------------------------ */

const TOOL_ICON_MAP: Record<PlannerToolId, React.ComponentType<{ className?: string }>> = {
  select: MousePointer2,
  floor: Square,
  wall: Minus,
  door: DoorOpen,
  window: AppWindow,
  ceiling: LayoutGrid,
  roof: Triangle,
  zone: BoxSelect,
  item: Armchair,
  measure: Ruler,
  text: Type,
};

/* ------------------------------------------------------------------ */
/*  Mode icon lookup                                                    */
/* ------------------------------------------------------------------ */

const MODE_ICON_MAP: Record<EditorMode, React.ComponentType<{ className?: string }>> = {
  select: MousePointer2,
  edit: Pencil,
  build: Wrench,
  delete: Trash2,
};

/* ------------------------------------------------------------------ */
/*  Viewport mode <-> layout mapping                                    */
/* ------------------------------------------------------------------ */

function viewportLayoutToMode(layout: '2d' | 'split' | '3d'): PlannerViewportMode {
  switch (layout) {
    case '2d':
      return 'draft';
    case '3d':
      return 'preview';
    default:
      return 'split';
  }
}

function viewportModeToLayout(mode: PlannerViewportMode): '2d' | 'split' | '3d' {
  switch (mode) {
    case 'draft':
      return '2d';
    case 'preview':
      return '3d';
    default:
      return 'split';
  }
}

/* ------------------------------------------------------------------ */
/*  Left side-panel content                                             */
/* ------------------------------------------------------------------ */

function LeftPanelContent({
  tab,
}: {
  tab: 'tree' | 'tools' | 'settings';
}) {
  const activeTool = usePlannerEditorStore((s) => s.activeTool);
  const selectTool = usePlannerEditorStore((s) => s.selectTool);
  const nodes = usePlannerSceneStore((s) => s.nodes);
  const rootNodeIds = usePlannerSceneStore((s) => s.rootNodeIds);
  const selectedElement = usePlannerViewerStore((s) => s.selectedElement);

  if (tab === 'tree') {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Scene Tree
          </p>
        </div>
        <SceneTree
          nodes={nodes}
          rootNodeIds={rootNodeIds}
          selectedId={selectedElement?.wallId ?? null}
        />
      </div>
    );
  }

  if (tab === 'tools') {
    return (
      <div className="h-full overflow-y-auto p-2">
        <DarkToolList activeTool={activeTool} onToolChange={selectTool} />
      </div>
    );
  }

  /* settings tab */
  return <SettingsPanel />;
}

/* ------------------------------------------------------------------ */
/*  Dark-themed tool list for left panel                                */
/* ------------------------------------------------------------------ */

function DarkToolList({
  activeTool,
  onToolChange,
}: {
  activeTool: PlannerToolId | null;
  onToolChange: (tool: PlannerToolId) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="px-2 py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Tools
        </p>
      </div>
      {PLANNER_TOOLS.map((tool) => {
        const Icon = TOOL_ICON_MAP[tool.id];
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onToolChange(tool.id)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all',
              isActive
                ? 'bg-blue-500/20 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.3)]'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                isActive ? 'bg-blue-500/20' : 'bg-slate-800/60',
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold">{tool.name}</span>
              <span className="block text-[10px] text-slate-500">
                {tool.shortcut}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main workspace component                                            */
/* ------------------------------------------------------------------ */

export function PlannerWorkspace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  /* Existing stores */
  const activeTool = usePlannerEditorStore((s) => s.activeTool);
  const selectTool = usePlannerEditorStore((s) => s.selectTool);
  const viewportMode = usePlannerViewerStore((s) => s.viewportMode);
  const setViewportMode = usePlannerViewerStore((s) => s.setViewportMode);
  const selectedElement = usePlannerViewerStore((s) => s.selectedElement);
  const gridVisible = usePlannerSceneStore((s) => s.settings.gridVisible);

  /* Enhanced store */
  const phase = useEnhancedEditorStore((s) => s.phase);
  const setPhase = useEnhancedEditorStore((s) => s.setPhase);
  const mode = useEnhancedEditorStore((s) => s.mode);
  const setMode = useEnhancedEditorStore((s) => s.setMode);
  const viewportLayout = useEnhancedEditorStore((s) => s.viewportLayout);
  const setViewportLayout = useEnhancedEditorStore((s) => s.setViewportLayout);
  const viewPrefs = useEnhancedEditorStore((s) => s.viewPrefs);
  const updateViewPrefs = useEnhancedEditorStore((s) => s.updateViewPrefs);
  const currentLevelIndex = useEnhancedEditorStore((s) => s.currentLevelIndex);
  const setCurrentLevelIndex = useEnhancedEditorStore((s) => s.setCurrentLevelIndex);
  const leftPanelTab = useEnhancedEditorStore((s) => s.leftPanelTab);
  const setLeftPanelTab = useEnhancedEditorStore((s) => s.setLeftPanelTab);

  /* Property panel visibility — show when something is selected */
  const [propertyPanelOpen, setPropertyPanelOpen] = useState(false);
  useEffect(() => {
    setPropertyPanelOpen(selectedElement != null);
  }, [selectedElement]);

  /* Sync viewport layout <-> legacy viewport mode */
  useEffect(() => {
    setViewportMode(viewportLayoutToMode(viewportLayout));
  }, [viewportLayout, setViewportMode]);

  /* Canvas resize observer */
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [viewportMode]);

  /* Phase-scoped tools */
  const currentPhase = useMemo(
    () => PHASES.find((p: { id: string }) => p.id === phase) ?? PHASES[1],
    [phase],
  );
  const phaseTools = useMemo(
    () =>
      PLANNER_TOOLS.filter((t) => currentPhase.tools.includes(t.id)),
    [currentPhase],
  );

  /* Handlers */
  const handleViewportLayoutChange = useCallback(
    (layout: '2d' | 'split' | '3d') => {
      setViewportLayout(layout);
    },
    [setViewportLayout],
  );

  const handleToggleLeftPanel = useCallback(
    (tab: 'tree' | 'tools' | 'settings') => {
      setLeftPanelTab(leftPanelTab === tab ? null : tab);
    },
    [leftPanelTab, setLeftPanelTab],
  );

  /* ---------------------------------------------------------------- */
  /*  Canvas panels                                                     */
  /* ---------------------------------------------------------------- */

  const draftPanel = (
    <div ref={containerRef} className="relative h-full w-full bg-slate-900">
      <Canvas2D width={dimensions.width} height={dimensions.height} />
    </div>
  );

  const previewPanel = (
    <div className="relative h-full w-full bg-slate-900">
      <Viewer />
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200">
      {/* Invisible tool manager — handles keyboard shortcuts */}
      <PlannerToolManager />

      {/* ── Icon Rail (left edge, 48px) ────────────────────────────── */}
      <IconRail className="z-30 shrink-0">
        <IconRailButton
          icon={<TreePine size={18} />}
          label="Scene Tree"
          active={leftPanelTab === 'tree'}
          onClick={() => handleToggleLeftPanel('tree')}
        />
        <IconRailButton
          icon={<Wrench size={18} />}
          label="Tools"
          active={leftPanelTab === 'tools'}
          onClick={() => handleToggleLeftPanel('tools')}
        />

        {/* Spacer pushes settings to bottom */}
        <div className="flex-1" />

        {/* Phase indicator */}
        <div className="flex flex-col items-center gap-0.5 pb-1">
          {PHASES.map((p: { id: EditorPhase; label: string; shortcut: string }) => (
            <button
              key={p.id}
              type="button"
              title={`${p.label} (${p.shortcut})`}
              onClick={() => setPhase(p.id)}
              className={cn(
                'flex h-6 w-10 items-center justify-center rounded-md text-[10px] font-semibold transition-all',
                phase === p.id
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-600 hover:text-slate-400',
              )}
            >
              {p.label.charAt(0)}
            </button>
          ))}
        </div>

        <div className="mx-2 h-px bg-slate-800/60" />

        <IconRailButton
          icon={<Settings size={18} />}
          label="Settings"
          active={leftPanelTab === 'settings'}
          onClick={() => handleToggleLeftPanel('settings')}
        />
      </IconRail>

      {/* ── Collapsible left panel ─────────────────────────────────── */}
      {leftPanelTab && (
        <aside
          className="z-20 flex w-[260px] shrink-0 flex-col border-r border-slate-800/60 bg-slate-950/95 backdrop-blur-xl transition-all"
        >
          <LeftPanelContent tab={leftPanelTab} />
        </aside>
      )}

      {/* ── Main canvas area ───────────────────────────────────────── */}
      <main className="relative flex-1 overflow-hidden">
        {/* Canvas fill */}
        <div className="absolute inset-0">
          {viewportMode === 'split' ? (
            <ResizablePanelGroup
              direction="horizontal"
              className="h-full w-full"
            >
              <ResizablePanel defaultSize={55} minSize={25}>
                {draftPanel}
              </ResizablePanel>
              <ResizableHandle
                withHandle
                className="bg-slate-800/60"
              />
              <ResizablePanel defaultSize={45} minSize={25}>
                {previewPanel}
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : viewportMode === 'draft' ? (
            draftPanel
          ) : (
            previewPanel
          )}
        </div>

        {/* ── View Controls overlay (top-right) — compact ─────────── */}
        <ViewControls
          cameraMode={viewPrefs.cameraMode}
          levelDisplayMode={viewPrefs.levelDisplayMode}
          wallViewMode={viewPrefs.wallViewMode}
          gridVisible={viewPrefs.gridVisible}
          guidesVisible={viewPrefs.guidesVisible}
          measurementsVisible={viewPrefs.measurementsVisible}
          onCameraModeChange={(m) => updateViewPrefs({ cameraMode: m })}
          onLevelDisplayModeChange={(m) => updateViewPrefs({ levelDisplayMode: m })}
          onWallViewModeChange={(m) => updateViewPrefs({ wallViewMode: m })}
          onGridVisibleChange={(v) => updateViewPrefs({ gridVisible: v })}
          onGuidesVisibleChange={(v) => updateViewPrefs({ guidesVisible: v })}
          onMeasurementsVisibleChange={(v) => updateViewPrefs({ measurementsVisible: v })}
          onZoomToFit={() => {}}
          onResetCamera={() => {}}
        />

        {/* ── Property Panel (floating, right side) ────────────────── */}
        {propertyPanelOpen && selectedElement && (
          <div className="absolute right-3 top-14 z-40">
            <FloatingPanel
              title="Properties"
              open={propertyPanelOpen}
              onClose={() => setPropertyPanelOpen(false)}
              width={320}
            >
              <PlannerSelectionInspector />
            </FloatingPanel>
          </div>
        )}

        {/* ── Floating Action Menu (bottom center) ─────────────────── */}
        <div className="absolute inset-x-0 bottom-4 z-30 flex items-end justify-center gap-2">
          {/* Mode pills */}
          <ActionMenu>
            <ActionMenuSection>
              {MODES.map((m: { id: EditorMode; label: string; shortcut: string }) => {
                const MIcon = MODE_ICON_MAP[m.id];
                return (
                  <ActionMenuButton
                    key={m.id}
                    icon={<MIcon className="h-4 w-4" />}
                    label={m.label}
                    shortcut={m.shortcut}
                    active={mode === m.id}
                    onClick={() => setMode(m.id)}
                  />
                );
              })}
            </ActionMenuSection>
          </ActionMenu>

          {/* Tool bar — icon-only, phase-scoped */}
          <ActionMenu>
            <ActionMenuSection>
              {phaseTools.filter((t) => t.id !== 'select').map((t) => {
                const TIcon = TOOL_ICON_MAP[t.id];
                return (
                  <ActionMenuButton
                    key={t.id}
                    icon={<TIcon className="h-4 w-4" />}
                    label={t.name}
                    shortcut={t.shortcut}
                    active={activeTool === t.id}
                    onClick={() => selectTool(t.id)}
                  />
                );
              })}
            </ActionMenuSection>

            <ActionMenuDivider />

            {/* Viewport toggle */}
            <ActionMenuSection>
              <ActionMenuButton
                icon={<DraftingCompass className="h-4 w-4" />}
                label="2D"
                shortcut=""
                active={viewportLayout === '2d'}
                onClick={() => handleViewportLayoutChange('2d')}
              />
              <ActionMenuButton
                icon={<Columns2 className="h-4 w-4" />}
                label="Split"
                shortcut=""
                active={viewportLayout === 'split'}
                onClick={() => handleViewportLayoutChange('split')}
              />
              <ActionMenuButton
                icon={<Layers3 className="h-4 w-4" />}
                label="3D"
                shortcut=""
                active={viewportLayout === '3d'}
                onClick={() => handleViewportLayoutChange('3d')}
              />
            </ActionMenuSection>
          </ActionMenu>
        </div>
      </main>
    </div>
  );
}

export default PlannerWorkspace;
