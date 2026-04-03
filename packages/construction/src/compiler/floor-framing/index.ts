import type { ConstructionDiagnostic } from '../../schema/diagnostics'
import type { ConstructionEstimate } from '../../schema/estimate'
import type {
  ConstructionMember,
  FloorCompileResult,
  ConstructionTopologyFloor,
} from '../../schema/construction-graph'
import type { QuantityLine } from '../../schema/quantities'
import type { RulePack } from '../../schema/rulepacks'
import type { FloorAssemblyDefinition } from '../../schema/assemblies'
import { buildEstimate, createEmptyEstimate } from '../../estimate/build-estimate'
import { buildQuantityLines } from '../../quantities/build-quantity-lines'
import { buildFloorLayoutPreview } from './layout'

const EPSILON = 1e-6
const SUBFLOOR_PANEL_WIDTH = 1.2192
const SUBFLOOR_PANEL_HEIGHT = 2.4384
const SUBFLOOR_PANEL_AREA = SUBFLOOR_PANEL_WIDTH * SUBFLOOR_PANEL_HEIGHT

const STOCK_SPECS = {
  '2x8': {
    actualDepth: 0.18415,
    actualThickness: 0.0381,
    materialCode: 'lumber.spf.2x8',
  },
  '2x10': {
    actualDepth: 0.23495,
    actualThickness: 0.0381,
    materialCode: 'lumber.spf.2x10',
  },
} as const

const ENGINEERED_JOIST_CODES = {
  'i-joist': 'joist.i-11-7-8',
  'open-web': 'truss.open-web.12',
} as const

function getSegmentLength(segment: { start: [number, number]; end: [number, number] }) {
  return Math.hypot(segment.end[0] - segment.start[0], segment.end[1] - segment.start[1])
}

function resolveJoistMaterialCode(floor: ConstructionTopologyFloor) {
  if (floor.joistSystem === 'dimensional-lumber') {
    return STOCK_SPECS[floor.joistStock].materialCode
  }

  return ENGINEERED_JOIST_CODES[floor.joistSystem]
}

function resolveJoistLabel(floor: ConstructionTopologyFloor) {
  if (floor.joistSystem === 'i-joist') {
    return 'I-joist'
  }

  if (floor.joistSystem === 'open-web') {
    return 'Open-web floor truss'
  }

  return 'Floor joist'
}

function createFloorMemberFactory(floor: ConstructionTopologyFloor) {
  let index = 0

  return (input: {
    sourceNodeId: string
    type: ConstructionMember['type']
    category: ConstructionMember['category']
    label: string
    materialCode: string
    unit: ConstructionMember['unit']
    quantity: number
    count?: number
    start?: [number, number, number]
    end?: [number, number, number]
    center?: [number, number, number]
    size?: [number, number, number]
    metadata?: Record<string, unknown>
  }): ConstructionMember => ({
    id: `${floor.floorId}:${input.type}:${((index += 1)).toString()}`,
    wallId: floor.floorId,
    levelId: floor.levelId,
    sourceNodeId: input.sourceNodeId,
    assemblyId: floor.assemblyId,
    type: input.type,
    category: input.category,
    label: input.label,
    materialCode: input.materialCode,
    unit: input.unit,
    quantity: input.quantity,
    count: input.count ?? 1,
    geometry: {
      kind: 'box',
      face: 'center',
      localCenter: input.center ?? [0, floor.elevation, 0],
      localSize: input.size ?? [0, 0, 0],
    },
    start: input.start,
    end: input.end,
    metadata: input.metadata,
  })
}

function toMemberSegment(
  floor: ConstructionTopologyFloor,
  lengthSegment: { start: [number, number]; end: [number, number] },
  y: number,
): [[number, number, number], [number, number, number], number] {
  const length = getSegmentLength(lengthSegment)

  return [
    [lengthSegment.start[0], y, lengthSegment.start[1]],
    [lengthSegment.end[0], y, lengthSegment.end[1]],
    length,
  ]
}

export function compileFloorFraming(input: {
  floor: ConstructionTopologyFloor
  assembly: FloorAssemblyDefinition
  rulePack: RulePack
}): FloorCompileResult {
  const { floor, rulePack } = input
  const diagnostics: ConstructionDiagnostic[] = []
  const members: ConstructionMember[] = []

  if (floor.polygon.length < 3 || floor.netArea <= EPSILON) {
    diagnostics.push({
      id: `floor-not-compiled:${floor.floorId}`,
      level: 'warning',
      code: 'construction.floor.invalid_polygon',
      message: `Floor ${floor.floorId} has an invalid polygon and did not emit framing members.`,
      sourceNodeId: floor.floorId,
    })

    return {
      floorId: floor.floorId,
      levelId: floor.levelId,
      assemblyId: floor.assemblyId,
      floor,
      members: [],
      quantities: [],
      estimate: createEmptyEstimate(rulePack.currency),
      diagnostics,
      summary: {
        supportLineCount: floor.supportLines.length,
        openingCount: floor.holes.length,
        joistCount: 0,
        memberCount: 0,
        quantityCount: 0,
        estimatedCost: 0,
      },
    }
  }

  if (floor.framingStrategy === 'slab-on-grade') {
    diagnostics.push({
      id: `floor-slab-on-grade:${floor.floorId}`,
      level: 'info',
      code: 'construction.floor.slab_on_grade',
      message: `Floor ${floor.floorId} is authored as slab-on-grade, so the framing compiler skips joist generation.`,
      sourceNodeId: floor.floorId,
    })

    return {
      floorId: floor.floorId,
      levelId: floor.levelId,
      assemblyId: floor.assemblyId,
      floor,
      members: [],
      quantities: [],
      estimate: createEmptyEstimate(rulePack.currency),
      diagnostics,
      summary: {
        supportLineCount: floor.supportLines.length,
        openingCount: floor.holes.length,
        joistCount: 0,
        memberCount: 0,
        quantityCount: 0,
        estimatedCost: 0,
      },
    }
  }

  const preview = buildFloorLayoutPreview({
    polygon: floor.polygon,
    holes: floor.holes,
    joistDirection: floor.joistDirection,
    joistSpacing: floor.joistSpacing,
    supportLines: floor.supportLines,
  })
  const createMember = createFloorMemberFactory(floor)
  const joistSpec = STOCK_SPECS[floor.joistStock]
  const joistMaterialCode = resolveJoistMaterialCode(floor)
  const joistY = floor.elevation + joistSpec.actualDepth / 2
  const rimY = joistY
  const beamY = floor.elevation + STOCK_SPECS[floor.beamStock].actualDepth / 2

  if (floor.joistSystem !== 'dimensional-lumber') {
    diagnostics.push({
      id: `floor-engineered-sizing:${floor.floorId}`,
      level: 'info',
      code: 'construction.floor.engineered_visualized_with_nominal_depth',
      message: `Floor ${floor.floorId} uses ${floor.joistSystem}, but layout depth still follows the authored nominal stock until engineered section catalogs land.`,
      sourceNodeId: floor.floorId,
    })
  }

  for (const [segmentIndex, segment] of preview.joistSegments.entries()) {
    const [start, end, length] = toMemberSegment(floor, segment, joistY)
    if (length <= EPSILON) {
      continue
    }

    const pieceCount = Math.max(1, Math.ceil(length / Math.max(floor.stockLength, EPSILON)))
    members.push(
      createMember({
        sourceNodeId: floor.floorId,
        type: 'joist',
        category: 'framing',
        label: resolveJoistLabel(floor),
        materialCode: joistMaterialCode,
        unit: 'lf',
        quantity: length,
        count: pieceCount,
        start,
        end,
        center: [(start[0] + end[0]) / 2, joistY, (start[2] + end[2]) / 2],
        size:
          preview.axis === 'x'
            ? [length, joistSpec.actualDepth, joistSpec.actualThickness]
            : [joistSpec.actualThickness, joistSpec.actualDepth, length],
        metadata: {
          floorId: floor.floorId,
          joistIndex: segmentIndex,
          pieceCount,
          stockLength: floor.stockLength,
        },
      }),
    )

    if (length - floor.stockLength > EPSILON) {
      diagnostics.push({
        id: `floor-joist-splice:${floor.floorId}:${segmentIndex}`,
        level: 'warning',
        code: 'construction.floor.joist_exceeds_stock_length',
        message: `Floor ${floor.floorId} has a joist span longer than the authored stock length and will require splicing or a different stock rule.`,
        sourceNodeId: floor.floorId,
      })
    }
  }

  for (const [segmentIndex, segment] of preview.rimSegments.entries()) {
    const [start, end, length] = toMemberSegment(floor, segment, rimY)
    if (length <= EPSILON) {
      continue
    }
    const isXAxisSegment = Math.abs(segment.start[0] - segment.end[0]) > EPSILON

    members.push(
      createMember({
        sourceNodeId: floor.floorId,
        type: 'rim-board',
        category: 'framing',
        label: 'Rim board',
        materialCode: joistSpec.materialCode,
        unit: 'lf',
        quantity: length,
        count: Math.max(1, Math.ceil(length / Math.max(floor.stockLength, EPSILON))),
        start,
        end,
        center: [(start[0] + end[0]) / 2, rimY, (start[2] + end[2]) / 2],
        size: isXAxisSegment
          ? [length, joistSpec.actualDepth, joistSpec.actualThickness]
          : [joistSpec.actualThickness, joistSpec.actualDepth, length],
        metadata: {
          floorId: floor.floorId,
          rimIndex: segmentIndex,
          scope: 'perimeter',
        },
      }),
    )
  }

  for (const [segmentIndex, segment] of preview.openingSegments.entries()) {
    const [start, end, length] = toMemberSegment(floor, segment, rimY)
    if (length <= EPSILON) {
      continue
    }
    const isXAxisSegment = Math.abs(segment.start[0] - segment.end[0]) > EPSILON

    members.push(
      createMember({
        sourceNodeId: floor.floorId,
        type: 'rim-board',
        category: 'framing',
        label: 'Framed opening edge',
        materialCode: joistSpec.materialCode,
        unit: 'lf',
        quantity: length,
        count: Math.max(1, Math.ceil(length / Math.max(floor.stockLength, EPSILON))),
        start,
        end,
        center: [(start[0] + end[0]) / 2, rimY, (start[2] + end[2]) / 2],
        size: isXAxisSegment
          ? [length, joistSpec.actualDepth, joistSpec.actualThickness]
          : [joistSpec.actualThickness, joistSpec.actualDepth, length],
        metadata: {
          floorId: floor.floorId,
          openingEdgeIndex: segmentIndex,
          scope: 'opening',
        },
      }),
    )
  }

  for (const [segmentIndex, segment] of preview.supportSegments.entries()) {
    const [start, end, length] = toMemberSegment(floor, segment, beamY)
    if (length <= EPSILON) {
      continue
    }
    const supportSpec = STOCK_SPECS[segment.stock]

    members.push(
      createMember({
        sourceNodeId: floor.floorId,
        type: 'beam',
        category: 'framing',
        label: segment.kind === 'bearing-line' ? 'Bearing line' : 'Support beam',
        materialCode: STOCK_SPECS[segment.stock].materialCode,
        unit: 'lf',
        quantity: length,
        count: Math.max(1, Math.ceil(length / Math.max(floor.stockLength, EPSILON))),
        start,
        end,
        center: [(start[0] + end[0]) / 2, beamY, (start[2] + end[2]) / 2],
        size:
          segment.start[0] !== segment.end[0]
            ? [length, supportSpec.actualDepth, supportSpec.actualThickness]
            : [supportSpec.actualThickness, supportSpec.actualDepth, length],
        metadata: {
          floorId: floor.floorId,
          supportLineId: segment.supportLineId,
          kind: segment.kind,
        },
      }),
    )
  }

  members.push(
    createMember({
      sourceNodeId: floor.floorId,
      type: 'subfloor-panel',
      category: 'framing',
      label: 'Subfloor panel',
      materialCode: 'panel.osb.7-16.4x8',
      unit: 'sheet',
      quantity: floor.netArea / SUBFLOOR_PANEL_AREA,
      count: Math.max(1, Math.ceil(floor.netArea / SUBFLOOR_PANEL_AREA)),
      center: [
        (preview.bounds.minX + preview.bounds.maxX) / 2,
        floor.elevation + joistSpec.actualDepth + 0.01,
        (preview.bounds.minZ + preview.bounds.maxZ) / 2,
      ],
      size: [preview.bounds.width, 0.019, preview.bounds.depth],
      metadata: {
        floorId: floor.floorId,
        netArea: floor.netArea,
      },
    }),
  )

  const quantities: QuantityLine[] = buildQuantityLines(members, rulePack)
  const estimate: ConstructionEstimate = buildEstimate(quantities, rulePack.currency)

  return {
    floorId: floor.floorId,
    levelId: floor.levelId,
    assemblyId: floor.assemblyId,
    floor,
    members,
    quantities,
    estimate,
    diagnostics,
    summary: {
      supportLineCount: floor.supportLines.length,
      openingCount: floor.holes.length,
      joistCount: preview.joistSegments.length,
      memberCount: members.length,
      quantityCount: quantities.length,
      estimatedCost: estimate.summary.total,
    },
  }
}

export { buildFloorLayoutPreview, resolveFloorJoistAxis } from './layout'
export type { FloorLayoutInput, FloorLayoutPreview, FloorLayoutSegment } from './layout'
