import type {
  ConstructionComponentResult,
  ConstructionMember,
  ConstructionTopology,
  ConstructionTopologyFloorOpening,
  ConstructionTopologyFloorSystem,
  Vec2,
} from '../../schema/construction-graph'
import type { ConstructionDiagnostic } from '../../schema/diagnostics'
import type { RulePack } from '../../schema/rulepacks'
import {
  createMember,
  createPointMember,
  createSurfaceMember,
  finalizeComponentResult,
  lineLength,
  polygonBounds,
} from '../shared'

const SUBFLOOR_SHEET_WIDTH = 1.2192
const SUBFLOOR_SHEET_LENGTH = 2.4384
const SUBFLOOR_SHEET_AREA = SUBFLOOR_SHEET_WIDTH * SUBFLOOR_SHEET_LENGTH

function pointInPolygon(point: Vec2, polygon: Vec2[]) {
  if (polygon.length < 3) return false

  let inside = false
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const [x1, z1] = polygon[index]!
    const [x2, z2] = polygon[previous]!

    const intersects =
      z1 > point[1] !== z2 > point[1] &&
      point[0] < ((x2 - x1) * (point[1] - z1)) / ((z2 - z1) || 1e-9) + x1

    if (intersects) inside = !inside
  }

  return inside
}

function pointInAnyOpening(point: Vec2, openings: ConstructionTopologyFloorOpening[]) {
  return openings.some((opening) => pointInPolygon(point, opening.polygon))
}

function resolveSupportedFloorSystemId(
  supportFloorSystemId: string | null,
  point: Vec2,
  topology: ConstructionTopology,
) {
  if (supportFloorSystemId && topology.floorSystems.some((system) => system.floorSystemId === supportFloorSystemId)) {
    return supportFloorSystemId
  }

  for (const system of topology.floorSystems) {
    if (pointInPolygon(point, system.polygon)) {
      return system.floorSystemId
    }
  }

  return null
}

function buildJoistMembers(
  system: ConstructionTopologyFloorSystem,
  openings: ConstructionTopologyFloorOpening[],
  diagnostics: ConstructionDiagnostic[],
): ConstructionMember[] {
  const bounds = polygonBounds(system.polygon)
  if (!bounds) return []

  const direction: Vec2 = [Math.cos(system.joistAngle), Math.sin(system.joistAngle)]
  const normal: Vec2 = [-direction[1], direction[0]]
  const spacing = Math.max(system.joistSpacing, 0.1)

  const directionProjections = system.polygon.map(([x, z]) => x * direction[0] + z * direction[1])
  const normalProjections = system.polygon.map(([x, z]) => x * normal[0] + z * normal[1])

  const minDirection = Math.min(...directionProjections)
  const maxDirection = Math.max(...directionProjections)
  const minNormal = Math.min(...normalProjections)
  const maxNormal = Math.max(...normalProjections)

  const members: ConstructionMember[] = []

  for (let offset = minNormal; offset <= maxNormal + spacing * 0.5; offset += spacing) {
    const start: Vec2 = [
      direction[0] * minDirection + normal[0] * offset,
      direction[1] * minDirection + normal[1] * offset,
    ]
    const end: Vec2 = [
      direction[0] * maxDirection + normal[0] * offset,
      direction[1] * maxDirection + normal[1] * offset,
    ]
    const midpoint: Vec2 = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]

    if (!pointInPolygon(midpoint, system.polygon) || pointInAnyOpening(midpoint, openings)) {
      continue
    }

    const length = lineLength(start, end)
    if (length <= 0.05) {
      continue
    }

    const joistIndex = members.length + 1
    members.push(
      createMember({
        id: `floor-joist:${system.floorSystemId}:${joistIndex}`,
        sourceNodeId: system.sourceNodeId,
        scopeId: system.sourceNodeId,
        levelId: system.levelId,
        assemblyId: system.assemblyId,
        type: 'joist',
        category: 'framing',
        label: `Floor Joist ${joistIndex}`,
        materialCode:
          system.framingKind === 'dimensional-lumber'
            ? 'floor.joist'
            : system.framingKind === 'i-joist'
              ? 'floor.i-joist'
              : 'floor.truss',
        unit: 'lf',
        quantity: length,
        count: 1,
        start: [start[0], -system.elevation, start[1]],
        end: [end[0], -system.elevation, end[1]],
      }),
    )
  }

  if (members.length === 0) {
    diagnostics.push({
      id: `floor-joist-layout-empty:${system.floorSystemId}`,
      level: 'warning',
      code: 'construction.floor.joist_layout_empty',
      message: `Floor system ${system.floorSystemId} produced no joists. Check joist direction, spacing, or opening extents.`,
      sourceNodeId: system.sourceNodeId,
    })
  }

  return members
}

function buildRimMembers(system: ConstructionTopologyFloorSystem): ConstructionMember[] {
  if (system.polygon.length < 2) return []

  return system.polygon.map((start, index) => {
    const end = system.polygon[(index + 1) % system.polygon.length]!
    const length = lineLength(start, end)

    return createMember({
      id: `floor-rim:${system.floorSystemId}:${index}`,
      sourceNodeId: system.sourceNodeId,
      scopeId: system.sourceNodeId,
      levelId: system.levelId,
      assemblyId: system.assemblyId,
      type: 'rim-board',
      category: 'framing',
      label: `Rim Board ${index + 1}`,
      materialCode: 'lumber.spf.2x10',
      unit: 'lf',
      quantity: length,
      count: Math.max(1, Math.ceil(length / SUBFLOOR_SHEET_LENGTH)),
      start: [start[0], -system.elevation, start[1]],
      end: [end[0], -system.elevation, end[1]],
    })
  })
}

function buildSheathingMembers(
  system: ConstructionTopologyFloorSystem,
  openings: ConstructionTopologyFloorOpening[],
): ConstructionMember[] {
  const bounds = polygonBounds(system.polygon)
  if (!bounds) return []

  const members: ConstructionMember[] = []

  for (let x = bounds.minX + SUBFLOOR_SHEET_WIDTH / 2; x <= bounds.maxX; x += SUBFLOOR_SHEET_WIDTH) {
    for (let z = bounds.minZ + SUBFLOOR_SHEET_LENGTH / 2; z <= bounds.maxZ; z += SUBFLOOR_SHEET_LENGTH) {
      const center: Vec2 = [x, z]
      if (!pointInPolygon(center, system.polygon) || pointInAnyOpening(center, openings)) {
        continue
      }

      members.push(
        createMember({
          id: `floor-subfloor:${system.floorSystemId}:${members.length + 1}`,
          sourceNodeId: system.sourceNodeId,
          scopeId: system.sourceNodeId,
          levelId: system.levelId,
          assemblyId: system.assemblyId,
          type: 'subfloor',
          category: 'envelope',
          label: 'Subfloor Panel',
          materialCode: 'panel.osb.7-16.4x8',
          unit: 'sheet',
          quantity: 1,
          count: 1,
          start: [x - SUBFLOOR_SHEET_WIDTH / 2, -system.elevation + system.sheathingThickness, z],
          end: [x + SUBFLOOR_SHEET_WIDTH / 2, -system.elevation + system.sheathingThickness, z],
          metadata: {
            panelArea: SUBFLOOR_SHEET_AREA,
          },
        }),
      )
    }
  }

  return members
}

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

    const floorOpenings = topology.floorOpenings.filter(
      (opening) => opening.parentFloorSystemId === system.floorSystemId,
    )

    const members = diagnostics.length
      ? []
      : [
          ...buildJoistMembers(system, floorOpenings, diagnostics),
          ...buildRimMembers(system),
          ...buildSheathingMembers(system, floorOpenings),
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
    const openingBounds = polygonBounds(opening.polygon)
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
              centroid: openingBounds
                ? [(openingBounds.minX + openingBounds.maxX) / 2, (openingBounds.minZ + openingBounds.maxZ) / 2]
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
    const diagnostics: ConstructionDiagnostic[] = []
    const midpoint: Vec2 = [(beam.start[0] + beam.end[0]) / 2, (beam.start[1] + beam.end[1]) / 2]
    const supportedFloorSystemId = resolveSupportedFloorSystemId(beam.supportFloorSystemId, midpoint, topology)

    if (!supportedFloorSystemId) {
      diagnostics.push({
        id: `beam-support-missing:${beam.beamLineId}`,
        level: 'warning',
        code: 'construction.floor.beam_support_missing',
        message: `Beam ${beam.beamLineId} is not hosted by a floor system. Associate it with a floor for coordinated regeneration.`,
        sourceNodeId: beam.sourceNodeId,
      })
    }

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
            metadata: {
              supportFloorSystemId: supportedFloorSystemId,
            },
          }),
        ],
        diagnostics,
        rulePack,
      }),
    )
  })

  topology.supportPosts.forEach((post) => {
    const diagnostics: ConstructionDiagnostic[] = []
    const supportedFloorSystemId = resolveSupportedFloorSystemId(null, post.center, topology)

    if (!supportedFloorSystemId) {
      diagnostics.push({
        id: `post-support-missing:${post.supportPostId}`,
        level: 'warning',
        code: 'construction.floor.post_support_missing',
        message: `Support post ${post.supportPostId} does not fall inside an authored floor system.`,
        sourceNodeId: post.sourceNodeId,
      })
    }

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
            metadata: {
              supportFloorSystemId: supportedFloorSystemId,
            },
          }),
        ],
        diagnostics,
        rulePack,
      }),
    )
  })

  return results
}
