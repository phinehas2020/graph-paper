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
  const showConstruction = useViewer((state) => state.showConstruction)
  const setShowConstruction = useViewer((state) => state.setShowConstruction)
  const selectedLevelId = useViewer((state) => state.selection.levelId)

  const visibleWalls = useMemo(
    () =>
      graph.topology.walls.filter((wall) => !selectedLevelId || wall.levelId === selectedLevelId),
    [graph.topology.walls, selectedLevelId],
  )
  const visibleFloors = useMemo(
    () =>
      graph.topology.floors.filter((floor) => !selectedLevelId || floor.levelId === selectedLevelId),
    [graph.topology.floors, selectedLevelId],
  )
  const floorResultsById = useMemo(
    () => Object.fromEntries(graph.floorResults.map((result) => [result.floorId, result])),
    [graph.floorResults],
  )

  const visibleDiagnostics = useMemo(
    () =>
      graph.diagnostics.filter(
        (diagnostic) =>
          !selectedLevelId ||
          visibleWalls.some(
            (wall) =>
              wall.wallId === diagnostic.sourceNodeId ||
              wall.levelId === diagnostic.sourceNodeId ||
              wall.openings.some((opening) => opening.openingId === diagnostic.sourceNodeId),
          ) ||
          visibleFloors.some(
            (floor) => floor.floorId === diagnostic.sourceNodeId || floor.levelId === diagnostic.sourceNodeId,
          ),
      ),
    [graph.diagnostics, selectedLevelId, visibleFloors, visibleWalls],
  )

  const estimateLines = useMemo(
    () => [...graph.estimate.lines].sort((left, right) => right.totalCost - left.totalCost),
    [graph.estimate.lines],
  )

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-border/50 border-b px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Construction
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Regenerated wall and floor systems compiled from the authored model, with quantity and estimate output downstream.
            </p>
          </div>

          <button
            className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] transition ${
              showConstruction
                ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
                : 'border-border/60 bg-background/40 text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setShowConstruction(!showConstruction)}
            type="button"
          >
            Overlay {showConstruction ? 'On' : 'Off'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border/50 bg-background/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Floors</p>
            <p className="mt-2 font-semibold text-lg">{visibleFloors.length}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Walls</p>
            <p className="mt-2 font-semibold text-lg">
              {visibleWalls.length}
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Estimate</p>
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
            {visibleFloors.map((floor) => {
              const result = floorResultsById[floor.floorId]

              return (
                <section
                  className="rounded-2xl border border-border/50 bg-background/30 px-4 py-3"
                  key={floor.floorId}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">Floor {floor.floorId.replace('slab_', '#')}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {floor.joistSystem} · {formatQuantity(floor.netArea)}m² net · {formatQuantity(floor.joistSpacing)}m spacing
                      </p>
                    </div>
                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {result?.summary.joistCount ?? 0} joists
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="rounded-xl bg-background/50 px-3 py-2">
                      Strategy: {floor.framingStrategy}
                    </div>
                    <div className="rounded-xl bg-background/50 px-3 py-2">
                      Direction: {floor.joistDirection}
                    </div>
                    <div className="rounded-xl bg-background/50 px-3 py-2">
                      Supports: {floor.supportLines.length}
                    </div>
                    <div className="rounded-xl bg-background/50 px-3 py-2">
                      Openings: {floor.holes.length}
                    </div>
                  </div>
                </section>
              )
            })}

            {visibleWalls.map((wall) => (
              <section
                className="rounded-2xl border border-border/50 bg-background/30 px-4 py-3"
                key={wall.wallId}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">Wall {wall.wallId.replace('wall_', '#')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {wall.assemblyId} · {formatQuantity(wall.length)}m long · {formatQuantity(wall.height)}m tall
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
            {visibleWalls.length === 0 && visibleFloors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                No compiled framing is available in the current selection yet.
              </div>
            ) : null}
          </div>
        ) : null}

        {constructionView === 'estimate' ? (
          <div className="space-y-3">
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
                {graph.summary.floorCount} floors · {graph.summary.wallCount} walls · {graph.members.length} members
              </p>
            </section>
            <section className="rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ReceiptText className="h-4 w-4" />
                Quantity Lines
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {graph.quantities
                  .map((line) => `${line.label}: ${formatQuantity(line.totalQuantity)} ${line.unit}`)
                  .join(' • ')}
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
