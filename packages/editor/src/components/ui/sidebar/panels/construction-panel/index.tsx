'use client'

import { useViewer } from '@pascal-app/viewer'
import { Layers3, ReceiptText, TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { useConstructionGraph } from '../../../../../hooks/use-construction-graph'
import useEditor, { type ConstructionView } from '../../../../../store/use-editor'

const viewLabels: Record<ConstructionView, string> = {
  framing: 'Framing',
  estimate: 'Estimate',
  reports: 'Reports',
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 10 ? 1 : 2,
  }).format(value)
}

export function ConstructionPanel() {
  const graph = useConstructionGraph()
  const constructionView = useEditor((state) => state.constructionView)
  const setConstructionView = useEditor((state) => state.setConstructionView)
  const selectedLevelId = useViewer((state) => state.selection.levelId)

  const visibleWalls = useMemo(
    () =>
      graph?.topology.walls.filter((wall) => !selectedLevelId || wall.levelId === selectedLevelId) ??
      [],
    [graph, selectedLevelId],
  )

  const visibleDiagnostics = useMemo(
    () =>
      graph?.diagnostics.filter(
        (diagnostic) =>
          !selectedLevelId ||
          visibleWalls.some(
            (wall) =>
              wall.wallId === diagnostic.sourceNodeId ||
              wall.levelId === diagnostic.sourceNodeId ||
              wall.openings.some((opening) => opening.openingId === diagnostic.sourceNodeId),
          ),
      ) ?? [],
    [graph, selectedLevelId, visibleWalls],
  )

  const estimateLines = useMemo(
    () =>
      graph ? [...graph.estimate.lines].sort((left, right) => right.totalCost - left.totalCost) : [],
    [graph],
  )

  if (!graph) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-border/50 border-b px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Construction
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The compiler could not derive construction data from the current scene yet.
          </p>
        </div>
        <div className="flex-1 px-4 py-4">
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
            Draw a few walls and openings first, then reopen this panel to inspect framing and
            estimate output.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-border/50 border-b px-4 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Construction
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Derived wall framing, BOM, and estimate data compiled from the authored scene.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border/50 bg-background/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Walls</p>
            <p className="mt-2 font-semibold text-lg">{visibleWalls.length}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Openings
            </p>
            <p className="mt-2 font-semibold text-lg">
              {visibleWalls.reduce((total, wall) => total + wall.openings.length, 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Estimate
            </p>
            <p className="mt-2 font-semibold text-lg">
              ${formatQuantity(graph.estimate.summary.total)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {(Object.keys(viewLabels) as ConstructionView[]).map((view) => (
            <button
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                constructionView === view
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-background/40 text-muted-foreground hover:text-foreground'
              }`}
              key={view}
              onClick={() => setConstructionView(view)}
              type="button"
            >
              {viewLabels[view]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {constructionView === 'framing' ? (
          <div className="space-y-3">
            {visibleWalls.map((wall) => (
              <section
                className="rounded-2xl border border-border/50 bg-background/30 px-4 py-3"
                key={wall.wallId}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">Wall {wall.wallId.replace('wall_', '#')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {wall.assemblyId} · {formatQuantity(wall.length)}m long ·{' '}
                      {formatQuantity(wall.height)}m tall
                    </p>
                  </div>
                  <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                    {wall.openings.length} opening{wall.openings.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="rounded-xl bg-background/50 px-3 py-2">
                    Exterior: {wall.isExterior ? 'Yes' : 'No'}
                  </div>
                  <div className="rounded-xl bg-background/50 px-3 py-2">
                    Bearing: {wall.isBearing ? 'Yes' : 'No'}
                  </div>
                </div>
              </section>
            ))}
            {visibleWalls.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                No walls are available in the current selection yet.
              </div>
            ) : null}
          </div>
        ) : null}

        {constructionView === 'estimate' ? (
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
            <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Total</p>
              <p className="mt-1 font-semibold text-lg text-emerald-100">
                ${formatQuantity(graph.estimate.summary.total)}
              </p>
            </section>
          </div>
        ) : null}

        {constructionView === 'reports' ? (
          <div className="space-y-3">
            <section className="rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Layers3 className="h-4 w-4" />
                Compiler
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Version {graph.compilerVersion} · Rule pack {graph.rulePackId}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {graph.members.length} members · {graph.quantities.length} quantity lines
              </p>
            </section>
            <section className="rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ReceiptText className="h-4 w-4" />
                Quantity Lines
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {graph.quantities.length > 0
                  ? graph.quantities
                      .map(
                        (line) =>
                          `${line.label}: ${formatQuantity(line.totalQuantity)} ${line.unit}`,
                      )
                      .join(' • ')
                  : 'No quantity lines yet.'}
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
