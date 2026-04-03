import type {
  ConstructionComponentResult,
  ConstructionTopology,
} from '../../schema/construction-graph'
import type { ConstructionDiagnostic } from '../../schema/diagnostics'
import type { RulePack } from '../../schema/rulepacks'
import {
  createMember,
  createPointMember,
  createSurfaceMember,
  finalizeComponentResult,
  polygonBounds,
} from '../shared'

const SUBFLOOR_SHEET_AREA = 1.2192 * 2.4384

export function compileFloorFraming(
  topology: ConstructionTopology,
  rulePack: RulePack,
): ConstructionComponentResult[] {
  const results: ConstructionComponentResult[] = []

  topology.floorSystems.forEach((system) => {
    const diagnostics: ConstructionDiagnostic[] = []
    if (system.polygon.length < 3 || system.area <= 0) {
      diagnostics.push({
        id: `floor-system-invalid:${system.floorSystemId}`,
        level: 'warning',
        code: 'construction.floor.invalid_polygon',
        message: `Floor system ${system.floorSystemId} needs a valid boundary before framing can be generated.`,
        sourceNodeId: system.sourceNodeId,
      })
    }

    const bounds = polygonBounds(system.polygon)
    const width = bounds?.width ?? 0
    const depth = bounds?.depth ?? 0
    const span = Math.max(Math.min(width || depth, depth || width, Math.max(width, depth)), 0.1)
    const run = Math.max(width, depth, Math.sqrt(system.area) || 0.1)
    const openingArea = topology.floorOpenings
      .filter((opening) => opening.parentFloorSystemId === system.floorSystemId)
      .reduce((sum, opening) => sum + opening.area, 0)
    const netArea = Math.max(system.area - openingArea, 0)
    const joistCount = Math.max(1, Math.ceil(span / Math.max(system.joistSpacing, 0.1)) + 1)
    const joistQuantity = joistCount * run
    const centroid = bounds
      ? [(bounds.minX + bounds.maxX) / 2, (bounds.minZ + bounds.maxZ) / 2] as [number, number]
      : null

    const members = diagnostics.length > 0 ? [] : [
      createMember({
        id: `floor-joists:${system.floorSystemId}`,
        sourceNodeId: system.sourceNodeId,
        scopeId: system.sourceNodeId,
        levelId: system.levelId,
        assemblyId: system.assemblyId,
        type: 'joist',
        category: 'framing',
        label: 'Floor Joists',
        materialCode:
          system.framingKind === 'dimensional-lumber'
            ? 'floor.joist'
            : system.framingKind === 'i-joist'
              ? 'floor.i-joist'
              : 'floor.truss',
        unit: 'lf',
        quantity: joistQuantity,
        count: joistCount,
        start: bounds
          ? [bounds.minX, -system.elevation, centroid?.[1] ?? bounds.minZ]
          : undefined,
        end: bounds
          ? [bounds.maxX, -system.elevation, centroid?.[1] ?? bounds.minZ]
          : undefined,
      }),
      createSurfaceMember({
        id: `floor-rim:${system.floorSystemId}`,
        sourceNodeId: system.sourceNodeId,
        scopeId: system.sourceNodeId,
        levelId: system.levelId,
        assemblyId: system.assemblyId,
        type: 'rim-board',
        category: 'framing',
        label: 'Rim Board',
        materialCode: 'lumber.spf.2x10',
        unit: 'lf',
        quantity: system.perimeter,
        count: Math.max(1, Math.ceil(system.perimeter / 2.4384)),
        centroid,
        elevation: -system.elevation,
        span: Math.max(width, depth, 0.5),
      }),
      createSurfaceMember({
        id: `floor-subfloor:${system.floorSystemId}`,
        sourceNodeId: system.sourceNodeId,
        scopeId: system.sourceNodeId,
        levelId: system.levelId,
        assemblyId: system.assemblyId,
        type: 'subfloor',
        category: 'envelope',
        label: 'Subfloor Sheathing',
        materialCode: 'panel.osb.7-16.4x8',
        unit: 'sheet',
        quantity: netArea / SUBFLOOR_SHEET_AREA,
        count: Math.max(1, Math.ceil(netArea / SUBFLOOR_SHEET_AREA)),
        centroid,
        elevation: -system.elevation + system.sheathingThickness,
        span: Math.max(width, depth, 0.5),
      }),
    ]

    results.push(
      finalizeComponentResult({
        sourceNodeId: system.sourceNodeId,
        sourceNodeType: 'floor-system',
        discipline: 'floor',
        levelId: system.levelId,
        assemblyId: system.assemblyId,
        members,
        diagnostics,
        rulePack,
      }),
    )
  })

  topology.floorOpenings.forEach((opening) => {
    const diagnostics: ConstructionDiagnostic[] = []
    const members =
      opening.curbHeight > 0 && opening.perimeter > 0
        ? [
            createSurfaceMember({
              id: `floor-opening-curb:${opening.floorOpeningId}`,
              sourceNodeId: opening.sourceNodeId,
              scopeId: opening.sourceNodeId,
              levelId: opening.levelId,
              assemblyId: opening.assemblyId,
              type: 'blocking',
              category: 'framing',
              label: 'Opening Curb',
              materialCode: 'lumber.spf.2x10',
              unit: 'lf',
              quantity: opening.perimeter,
              count: Math.max(1, Math.ceil(opening.perimeter / 1.2192)),
              centroid: polygonBounds(opening.polygon)
                ? [
                    (polygonBounds(opening.polygon)!.minX + polygonBounds(opening.polygon)!.maxX) / 2,
                    (polygonBounds(opening.polygon)!.minZ + polygonBounds(opening.polygon)!.maxZ) / 2,
                  ]
                : null,
              elevation: opening.curbHeight,
              span: Math.max(Math.sqrt(opening.area), 0.4),
            }),
          ]
        : []

    if (members.length === 0) {
      diagnostics.push({
        id: `floor-opening-void:${opening.floorOpeningId}`,
        level: 'info',
        code: 'construction.floor.opening_void_only',
        message: `Floor opening ${opening.floorOpeningId} only subtracts takeoff area because no curb was authored.`,
        sourceNodeId: opening.sourceNodeId,
      })
    }

    results.push(
      finalizeComponentResult({
        sourceNodeId: opening.sourceNodeId,
        sourceNodeType: 'floor-opening',
        discipline: 'floor',
        levelId: opening.levelId,
        assemblyId: opening.assemblyId,
        members,
        diagnostics,
        rulePack,
      }),
    )
  })

  topology.blockingRuns.forEach((blocking) => {
    const count = Math.max(1, Math.ceil(blocking.length / Math.max(blocking.spacing, 0.1)))
    results.push(
      finalizeComponentResult({
        sourceNodeId: blocking.sourceNodeId,
        sourceNodeType: 'blocking-run',
        discipline: 'floor',
        levelId: blocking.levelId,
        assemblyId: blocking.assemblyId,
        members: [
          createMember({
            id: `blocking:${blocking.blockingRunId}`,
            sourceNodeId: blocking.sourceNodeId,
            scopeId: blocking.sourceNodeId,
            levelId: blocking.levelId,
            assemblyId: blocking.assemblyId,
            type: 'blocking',
            category: 'framing',
            label: 'Floor Blocking',
            materialCode: blocking.materialCode,
            unit: 'lf',
            quantity: blocking.length,
            count,
            start: [blocking.start[0], 0, blocking.start[1]],
            end: [blocking.end[0], 0, blocking.end[1]],
          }),
        ],
        rulePack,
      }),
    )
  })

  topology.beamLines.forEach((beam) => {
    results.push(
      finalizeComponentResult({
        sourceNodeId: beam.sourceNodeId,
        sourceNodeType: 'beam-line',
        discipline: 'floor',
        levelId: beam.levelId,
        assemblyId: beam.assemblyId,
        members: [
          createMember({
            id: `beam:${beam.beamLineId}`,
            sourceNodeId: beam.sourceNodeId,
            scopeId: beam.sourceNodeId,
            levelId: beam.levelId,
            assemblyId: beam.assemblyId,
            type: 'beam',
            category: 'framing',
            label: 'Beam',
            materialCode: beam.materialCode,
            unit: 'lf',
            quantity: beam.length,
            count: 1,
            start: [beam.start[0], beam.depth / 2, beam.start[1]],
            end: [beam.end[0], beam.depth / 2, beam.end[1]],
          }),
        ],
        rulePack,
      }),
    )
  })

  topology.supportPosts.forEach((post) => {
    results.push(
      finalizeComponentResult({
        sourceNodeId: post.sourceNodeId,
        sourceNodeType: 'support-post',
        discipline: 'floor',
        levelId: post.levelId,
        assemblyId: post.assemblyId,
        members: [
          createPointMember({
            id: `post:${post.supportPostId}`,
            sourceNodeId: post.sourceNodeId,
            scopeId: post.sourceNodeId,
            levelId: post.levelId,
            assemblyId: post.assemblyId,
            type: 'post',
            category: 'framing',
            label: 'Support Post',
            materialCode: post.materialCode,
            unit: 'ea',
            quantity: 1,
            count: 1,
            point: [post.center[0], 0, post.center[1]],
            height: Math.max(post.height, 0.3),
          }),
        ],
        rulePack,
      }),
    )
  })

  return results
}
