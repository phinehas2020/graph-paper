import { buildEstimate } from '../estimate/build-estimate'
import { buildQuantityLines } from '../quantities/build-quantity-lines'
import type { ConstructionDiagnostic } from '../schema/diagnostics'
import type { RulePack } from '../schema/rulepacks'
import type {
  ConstructionComponentDiscipline,
  ConstructionComponentResult,
  ConstructionMember,
  ConstructionMemberCategory,
  ConstructionMemberType,
  Vec2,
  Vec3,
} from '../schema/construction-graph'
import type { QuantityLine } from '../schema/quantities'

export function lineLength(start: Vec2, end: Vec2) {
  return Math.hypot(end[0] - start[0], end[1] - start[1])
}

export function pathLength(path: Vec3[]) {
  let total = 0
  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1]!
    const current = path[index]!
    total += Math.hypot(
      current[0] - previous[0],
      current[1] - previous[1],
      current[2] - previous[2],
    )
  }
  return total
}

export function polygonArea(points: Vec2[]) {
  if (points.length < 3) return 0

  let area = 0
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!
    const next = points[(index + 1) % points.length]!
    area += current[0] * next[1] - next[0] * current[1]
  }
  return Math.abs(area) / 2
}

export function polygonPerimeter(points: Vec2[]) {
  if (points.length < 2) return 0

  let perimeter = 0
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!
    const next = points[(index + 1) % points.length]!
    perimeter += lineLength(current, next)
  }
  return perimeter
}

export function polygonCentroid(points: Vec2[]): Vec2 | null {
  if (points.length === 0) return null

  const [sumX, sumZ] = points.reduce(
    (sum, point) => [sum[0] + point[0], sum[1] + point[1]],
    [0, 0],
  )

  return [sumX / points.length, sumZ / points.length]
}

export function polygonBounds(points: Vec2[]) {
  if (points.length === 0) {
    return null
  }

  let minX = points[0]![0]
  let minZ = points[0]![1]
  let maxX = points[0]![0]
  let maxZ = points[0]![1]

  points.forEach(([x, z]) => {
    minX = Math.min(minX, x)
    minZ = Math.min(minZ, z)
    maxX = Math.max(maxX, x)
    maxZ = Math.max(maxZ, z)
  })

  return {
    minX,
    minZ,
    maxX,
    maxZ,
    width: Math.max(maxX - minX, 0),
    depth: Math.max(maxZ - minZ, 0),
  }
}

type MemberInput = {
  id: string
  sourceNodeId: string
  scopeId: string
  levelId: string | null
  assemblyId: string
  type: ConstructionMemberType
  category: ConstructionMemberCategory
  label: string
  materialCode: string
  unit: QuantityLine['unit']
  quantity: number
  count: number
  start?: Vec3
  end?: Vec3
  metadata?: Record<string, unknown>
}

export function createMember(input: MemberInput): ConstructionMember {
  const start = input.start
  const end = input.end
  const span = start && end ? Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]) : 0.1

  return {
    id: input.id,
    wallId: input.scopeId,
    levelId: input.levelId,
    sourceNodeId: input.sourceNodeId,
    assemblyId: input.assemblyId,
    type: input.type,
    category: input.category,
    label: input.label,
    materialCode: input.materialCode,
    unit: input.unit,
    quantity: input.quantity,
    count: input.count,
    geometry: {
      kind: 'box',
      face: 'center',
      localCenter: [0, 0, 0],
      localSize: [Math.max(span, 0.05), 0.05, 0.05],
    },
    start,
    end,
    metadata: input.metadata,
  }
}

export function createPointMember(input: Omit<MemberInput, 'start' | 'end'> & { point: Vec3; height?: number }) {
  const height = input.height ?? 0.3

  return createMember({
    ...input,
    start: [input.point[0], input.point[1], input.point[2]],
    end: [input.point[0], input.point[1] + height, input.point[2]],
  })
}

export function createSurfaceMember(
  input: Omit<MemberInput, 'start' | 'end'> & {
    centroid: Vec2 | null
    elevation?: number
    span?: number
  },
) {
  const centroid = input.centroid ?? [0, 0]
  const span = Math.max(input.span ?? 0.5, 0.25)
  const y = input.elevation ?? 0

  return createMember({
    ...input,
    start: [centroid[0] - span / 2, y, centroid[1]],
    end: [centroid[0] + span / 2, y, centroid[1]],
  })
}

export function finalizeComponentResult(input: {
  sourceNodeId: string
  sourceNodeType: string
  discipline: ConstructionComponentDiscipline
  levelId: string | null
  assemblyId: string
  members: ConstructionMember[]
  diagnostics?: ConstructionDiagnostic[]
  rulePack: RulePack
}): ConstructionComponentResult {
  const quantities = buildQuantityLines(input.members, input.rulePack)
  const estimate = buildEstimate(quantities, input.rulePack.currency)

  return {
    sourceNodeId: input.sourceNodeId,
    sourceNodeType: input.sourceNodeType,
    discipline: input.discipline,
    levelId: input.levelId,
    assemblyId: input.assemblyId,
    members: input.members,
    quantities,
    estimate,
    diagnostics: input.diagnostics ?? [],
    summary: {
      memberCount: input.members.length,
      quantityCount: quantities.length,
      estimatedCost: estimate.summary.total,
    },
  }
}
