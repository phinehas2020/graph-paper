'use client'

import {
  CircuitNode,
  ElectricalPanelNode,
  FoundationSystemNode,
  resolveLevelId,
  type AnyNode,
  type AnyNodeId,
  useScene,
} from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import {
  Activity,
  Cable,
  ClipboardList,
  Hammer,
  HousePlug,
  Layers3,
  ListChecks,
  ReceiptText,
  RefreshCcw,
  TriangleAlert,
  WavesLadder,
  Wrench,
} from 'lucide-react'
import { useMemo } from 'react'
import { useConstructionGraph } from '../../../../../hooks/use-construction-graph'
import useEditor, {
  type ConstructionOverlay,
  type ConstructionWorkspace,
  type StructureTool,
} from '../../../../../store/use-editor'

const workspaceLabels: Record<ConstructionWorkspace, string> = {
  walls: 'Walls',
  floors: 'Floors',
  roof: 'Roof / Truss',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  foundation: 'Foundation',
  estimate: 'Estimate',
  reports: 'Reports',
}

const workspaceIcons: Record<ConstructionWorkspace, React.ComponentType<{ className?: string }>> = {
  walls: Hammer,
  floors: Layers3,
  roof: Activity,
  electrical: HousePlug,
  plumbing: Wrench,
  foundation: WavesLadder,
  estimate: ReceiptText,
  reports: ClipboardList,
}

const overlayLabels: Record<ConstructionOverlay, string> = {
  authored: 'Authored',
  generated: 'Generated',
  diagnostics: 'Diagnostics',
  quantities: 'Quantities',
}

const workspaceTools: Record<
  Exclude<ConstructionWorkspace, 'estimate' | 'reports'>,
  Array<{ tool: StructureTool; label: string }>
> = {
  walls: [
    { tool: 'wall', label: 'Wall' },
    { tool: 'window', label: 'Window' },
    { tool: 'door', label: 'Door' },
    { tool: 'wall-guide', label: 'Guide' },
  ],
  floors: [
    { tool: 'floor-system', label: 'Floor System' },
    { tool: 'beam-line', label: 'Beam' },
    { tool: 'support-post', label: 'Post' },
    { tool: 'floor-opening', label: 'Opening' },
    { tool: 'blocking-run', label: 'Blocking' },
  ],
  roof: [
    { tool: 'roof-plane', label: 'Roof Plane' },
    { tool: 'truss-array', label: 'Truss Array' },
    { tool: 'rafter-set', label: 'Rafter Set' },
  ],
  electrical: [
    { tool: 'electrical-panel', label: 'Panel' },
    { tool: 'circuit', label: 'Circuit' },
    { tool: 'device-box', label: 'Device' },
    { tool: 'light-fixture', label: 'Fixture' },
    { tool: 'wire-run', label: 'Wire Run' },
    { tool: 'switch-leg', label: 'Switch Leg' },
  ],
  plumbing: [
    { tool: 'plumbing-fixture', label: 'Fixture' },
    { tool: 'supply-run', label: 'Supply' },
    { tool: 'drain-run', label: 'Drain' },
    { tool: 'vent-run', label: 'Vent' },
  ],
  foundation: [
    { tool: 'foundation-system', label: 'System' },
    { tool: 'footing-run', label: 'Footing' },
    { tool: 'stem-wall', label: 'Stem Wall' },
    { tool: 'pier', label: 'Pier' },
    { tool: 'column', label: 'Column' },
  ],
}

const workspaceNodeTypes: Record<Exclude<ConstructionWorkspace, 'estimate' | 'reports'>, string[]> = {
  walls: ['wall', 'window', 'door'],
  floors: ['floor-system', 'beam-line', 'support-post', 'floor-opening', 'blocking-run'],
  roof: ['roof', 'roof-plane', 'truss-array', 'rafter-set'],
  electrical: [
    'electrical-panel',
    'circuit',
    'device-box',
    'light-fixture',
    'wire-run',
    'switch-leg',
  ],
  plumbing: ['plumbing-fixture', 'supply-run', 'drain-run', 'vent-run'],
  foundation: ['foundation-system', 'footing-run', 'stem-wall', 'pier', 'column'],
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 10 ? 1 : 2,
  }).format(value)
}

function formatNodeLabel(node: AnyNode) {
  if (node.name) return node.name

  const fallbackByType: Record<string, string> = {
    wall: 'Wall',
    window: 'Window',
    door: 'Door',
    'floor-system': 'Floor System',
    'beam-line': 'Beam',
    'support-post': 'Support Post',
    'floor-opening': 'Floor Opening',
    'blocking-run': 'Blocking Run',
    roof: 'Roof',
    'roof-plane': 'Roof Plane',
    'truss-array': 'Truss Array',
    'rafter-set': 'Rafter Set',
    'electrical-panel': 'Panel',
    circuit: 'Circuit',
    'device-box': 'Device',
    'light-fixture': 'Fixture',
    'wire-run': 'Wire Run',
    'switch-leg': 'Switch Leg',
    'plumbing-fixture': 'Fixture',
    'supply-run': 'Supply Run',
    'drain-run': 'Drain Run',
    'vent-run': 'Vent Run',
    'foundation-system': 'Foundation',
    'footing-run': 'Footing',
    'stem-wall': 'Stem Wall',
    pier: 'Pier',
    column: 'Column',
  }

  return fallbackByType[node.type] ?? node.type
}

export function ConstructionPanel() {
  const graph = useConstructionGraph()
  const nodes = useScene((state) => state.nodes)
  const createNode = useScene((state) => state.createNode)
  const selectedIds = useViewer((state) => state.selection.selectedIds)
  const selectedLevelId = useViewer((state) => state.selection.levelId)
  const setSelection = useViewer((state) => state.setSelection)
  const constructionWorkspace = useEditor((state) => state.constructionWorkspace)
  const setConstructionWorkspace = useEditor((state) => state.setConstructionWorkspace)
  const constructionTool = useEditor((state) => state.constructionTool)
  const setConstructionTool = useEditor((state) => state.setConstructionTool)
  const constructionOverlay = useEditor((state) => state.constructionOverlay)
  const setConstructionOverlay = useEditor((state) => state.setConstructionOverlay)
  const regenerationMode = useEditor((state) => state.regenerationMode)
  const setRegenerationMode = useEditor((state) => state.setRegenerationMode)
  const requestConstructionRegenerate = useEditor((state) => state.requestConstructionRegenerate)

  const activeWorkspaceNodes = useMemo(() => {
    if (constructionWorkspace === 'estimate' || constructionWorkspace === 'reports') {
      return []
    }

    const relevantTypes = new Set(workspaceNodeTypes[constructionWorkspace])

    return Object.values(nodes)
      .filter((node): node is AnyNode => Boolean(node))
      .filter((node) => relevantTypes.has(node.type))
      .filter((node) => !selectedLevelId || resolveLevelId(node, nodes) === selectedLevelId)
      .sort((left, right) => formatNodeLabel(left).localeCompare(formatNodeLabel(right)))
  }, [constructionWorkspace, nodes, selectedLevelId])

  const currentSelection = useMemo(
    () =>
      selectedIds
        .map((id) => nodes[id as AnyNodeId])
        .filter((node): node is AnyNode => Boolean(node)),
    [nodes, selectedIds],
  )

  const visibleDiagnostics = useMemo(() => {
    if (!graph) return []
    if (!selectedLevelId) return graph.diagnostics

    return graph.diagnostics.filter((diagnostic) => {
      const sourceNode = nodes[diagnostic.sourceNodeId as AnyNodeId]
      return sourceNode ? resolveLevelId(sourceNode, nodes) === selectedLevelId : true
    })
  }, [graph, nodes, selectedLevelId])

  const estimateLines = useMemo(
    () => (graph ? [...graph.estimate.lines].sort((left, right) => right.totalCost - left.totalCost) : []),
    [graph],
  )

  const activateTool = (tool: StructureTool) => {
    if (tool === 'circuit') {
      if (!selectedLevelId) return

      const panel =
        currentSelection.find((node) => node.type === 'electrical-panel') ??
        activeWorkspaceNodes.find((node) => node.type === 'electrical-panel')

      let panelId: string

      if (panel?.type === 'electrical-panel') {
        panelId = panel.id
      } else {
        const newPanel = ElectricalPanelNode.parse({
          name: 'Main Panel',
          position: [0, 1.8, 0],
        })
        createNode(newPanel, selectedLevelId as AnyNodeId)
        panelId = newPanel.id
      }

      const circuitCount = Object.values(nodes).filter((node) => node?.type === 'circuit').length
      const circuit = CircuitNode.parse({
        name: `Circuit ${circuitCount + 1}`,
        label: `Circuit ${circuitCount + 1}`,
      })

      createNode(circuit, panelId as AnyNodeId)
      setSelection({ selectedIds: [circuit.id] })
      return
    }

    if (tool === 'foundation-system') {
      if (!selectedLevelId) return

      const existingFoundation = activeWorkspaceNodes.find((node) => node.type === 'foundation-system')
      if (existingFoundation?.type === 'foundation-system') {
        setSelection({ selectedIds: [existingFoundation.id] })
        setConstructionTool(tool)
        return
      }

      const foundation = FoundationSystemNode.parse({
        name: 'Foundation System',
      })
      createNode(foundation, selectedLevelId as AnyNodeId)
      setSelection({ selectedIds: [foundation.id] })
    }

    setConstructionTool(tool)
  }

  const totalEstimate = graph?.estimate.summary.total ?? 0
  const memberCount = graph?.members.length ?? 0
  const quantityCount = graph?.quantities.length ?? 0

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-border/50 border-b px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Construction
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Author structure systems directly in-scene, then inspect generated members, quantities,
          and reports downstream.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border/50 bg-background/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Authored</p>
            <p className="mt-2 font-semibold text-lg">{activeWorkspaceNodes.length}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Members</p>
            <p className="mt-2 font-semibold text-lg">{memberCount}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Estimate</p>
            <p className="mt-2 font-semibold text-lg">${formatQuantity(totalEstimate)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(Object.keys(workspaceLabels) as ConstructionWorkspace[]).map((workspace) => {
            const Icon = workspaceIcons[workspace]
            const isActive = constructionWorkspace === workspace

            return (
              <button
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border/50 bg-background/40 text-muted-foreground hover:text-foreground'
                }`}
                key={workspace}
                onClick={() => setConstructionWorkspace(workspace)}
                type="button"
              >
                <Icon className="h-4 w-4" />
                <span>{workspaceLabels[workspace]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {constructionWorkspace !== 'estimate' && constructionWorkspace !== 'reports' ? (
          <div className="space-y-4">
            <section className="rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Hammer className="h-4 w-4" />
                Workspace Tools
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {workspaceTools[constructionWorkspace].map(({ tool, label }) => {
                  const isActive = constructionTool === tool
                  return (
                    <button
                      className={`rounded-full px-3 py-1.5 text-xs transition ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-background/50 text-muted-foreground hover:text-foreground'
                      }`}
                      key={tool}
                      onClick={() => activateTool(tool)}
                      type="button"
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Active tool: <span className="text-foreground">{constructionTool ?? 'None'}</span>
              </p>
            </section>

            <section className="rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ListChecks className="h-4 w-4" />
                Generation
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(Object.keys(overlayLabels) as ConstructionOverlay[]).map((overlay) => (
                  <button
                    className={`rounded-full px-3 py-1.5 text-xs transition ${
                      constructionOverlay === overlay
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-background/50 text-muted-foreground hover:text-foreground'
                    }`}
                    key={overlay}
                    onClick={() => setConstructionOverlay(overlay)}
                    type="button"
                  >
                    {overlayLabels[overlay]}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    regenerationMode === 'live'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-background/50 text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setRegenerationMode('live')}
                  type="button"
                >
                  Live
                </button>
                <button
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    regenerationMode === 'manual'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-background/50 text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setRegenerationMode('manual')}
                  type="button"
                >
                  Manual
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-background/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                  onClick={() => requestConstructionRegenerate()}
                  type="button"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Regenerate
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Cable className="h-4 w-4" />
                Active Level Nodes
              </div>
              <div className="mt-3 space-y-2">
                {activeWorkspaceNodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nothing authored in this workspace on the current level yet.
                  </p>
                ) : (
                  activeWorkspaceNodes.map((node) => (
                    <button
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                        selectedIds.includes(node.id)
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-background/50 text-muted-foreground hover:text-foreground'
                      }`}
                      key={node.id}
                      onClick={() => setSelection({ selectedIds: [node.id] })}
                      type="button"
                    >
                      <span>{formatNodeLabel(node)}</span>
                      <span className="font-mono text-[11px] opacity-70">{node.type}</span>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Layers3 className="h-4 w-4" />
                Selection
              </div>
              <div className="mt-3 space-y-2">
                {currentSelection.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Select an authored object to inspect its dedicated property panel.
                  </p>
                ) : (
                  currentSelection.map((node) => (
                    <div className="rounded-xl bg-background/50 px-3 py-2" key={node.id}>
                      <p className="font-medium text-sm">{formatNodeLabel(node)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{node.type}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : null}

        {constructionWorkspace === 'estimate' ? (
          <div className="space-y-3">
            {estimateLines.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                No estimate lines have been generated yet.
              </div>
            ) : null}
            {estimateLines.map((line) => (
              <section
                className="rounded-2xl border border-border/50 bg-background/30 px-4 py-3"
                key={line.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{line.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {line.code} · {formatQuantity(line.quantity)} {line.unit}
                    </p>
                  </div>
                  <p className="font-semibold text-sm">${formatQuantity(line.totalCost)}</p>
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {constructionWorkspace === 'reports' ? (
          <div className="space-y-3">
            <section className="rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ReceiptText className="h-4 w-4" />
                Quantities
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {quantityCount} quantity lines generated from authored systems.
              </p>
            </section>
            <section className="rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TriangleAlert className="h-4 w-4" />
                Diagnostics
              </div>
              <div className="mt-3 space-y-2">
                {visibleDiagnostics.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No diagnostics for the current scope.</p>
                ) : (
                  visibleDiagnostics.map((diagnostic) => (
                    <div className="rounded-xl bg-background/50 px-3 py-2" key={diagnostic.id}>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {diagnostic.level}
                      </p>
                      <p className="mt-1 text-sm">{diagnostic.message}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  )
}
