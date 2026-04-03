type Axis = 'x' | 'z'
type FloorPoint = [number, number]

export type FloorLayoutInput = {
  polygon: FloorPoint[]
  holes?: FloorPoint[][]
  joistDirection?: Axis | 'auto'
  joistSpacing?: number
  supportLines?: Array<{
    id: string
    axis: Axis
    kind: 'beam' | 'bearing-line'
    offset: number
    stock: '2x8' | '2x10'
  }>
}

export type FloorLayoutSegment = {
  start: FloorPoint
  end: FloorPoint
}

export type FloorLayoutPreview = {
  axis: Axis
  bounds: {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
    width: number
    depth: number
  }
  netArea: number
  joistSegments: FloorLayoutSegment[]
  supportSegments: Array<
    FloorLayoutSegment & {
      supportLineId: string
      kind: 'beam' | 'bearing-line'
      stock: '2x8' | '2x10'
    }
  >
  rimSegments: FloorLayoutSegment[]
  openingSegments: FloorLayoutSegment[]
}

const EPSILON = 1e-6
const DEFAULT_JOIST_SPACING = 0.4064

function getBounds(polygon: FloorPoint[]) {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY

  for (const [x, z] of polygon) {
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minZ = Math.min(minZ, z)
    maxZ = Math.max(maxZ, z)
  }

  return {
    minX: Number.isFinite(minX) ? minX : 0,
    maxX: Number.isFinite(maxX) ? maxX : 0,
    minZ: Number.isFinite(minZ) ? minZ : 0,
    maxZ: Number.isFinite(maxZ) ? maxZ : 0,
    width: Number.isFinite(maxX - minX) ? Math.max(0, maxX - minX) : 0,
    depth: Number.isFinite(maxZ - minZ) ? Math.max(0, maxZ - minZ) : 0,
  }
}

function getPolygonArea(polygon: FloorPoint[]) {
  if (polygon.length < 3) {
    return 0
  }

  let area = 0

  for (let index = 0; index < polygon.length; index += 1) {
    const [x1, z1] = polygon[index]!
    const [x2, z2] = polygon[(index + 1) % polygon.length]!
    area += x1 * z2 - x2 * z1
  }

  return Math.abs(area) / 2
}

function getPolygonEdges(polygon: FloorPoint[]): FloorLayoutSegment[] {
  if (polygon.length < 2) {
    return []
  }

  return polygon.map((point, index) => ({
    start: point,
    end: polygon[(index + 1) % polygon.length]!,
  }))
}

function getAxisIntersections(polygon: FloorPoint[], axis: Axis, offset: number) {
  const intersections: number[] = []

  for (let index = 0; index < polygon.length; index += 1) {
    const [x1, z1] = polygon[index]!
    const [x2, z2] = polygon[(index + 1) % polygon.length]!
    const offsetA = axis === 'x' ? z1 : x1
    const offsetB = axis === 'x' ? z2 : x2
    const deltaOffset = offsetB - offsetA

    if (Math.abs(deltaOffset) <= EPSILON) {
      continue
    }

    const minOffset = Math.min(offsetA, offsetB)
    const maxOffset = Math.max(offsetA, offsetB)

    if (!(offset >= minOffset && offset < maxOffset)) {
      continue
    }

    const t = (offset - offsetA) / deltaOffset
    intersections.push(axis === 'x' ? x1 + (x2 - x1) * t : z1 + (z2 - z1) * t)
  }

  intersections.sort((left, right) => left - right)
  return intersections
}

function pairIntersections(values: number[]) {
  const segments: Array<[number, number]> = []

  for (let index = 0; index + 1 < values.length; index += 2) {
    const start = values[index]!
    const end = values[index + 1]!
    if (end - start > EPSILON) {
      segments.push([start, end])
    }
  }

  return segments
}

function subtractIntervals(
  segments: Array<[number, number]>,
  cuts: Array<[number, number]>,
): Array<[number, number]> {
  let current = [...segments]

  for (const [cutStart, cutEnd] of cuts) {
    const next: Array<[number, number]> = []

    for (const [segmentStart, segmentEnd] of current) {
      const overlapStart = Math.max(segmentStart, cutStart)
      const overlapEnd = Math.min(segmentEnd, cutEnd)

      if (overlapEnd <= overlapStart + EPSILON) {
        next.push([segmentStart, segmentEnd])
        continue
      }

      if (overlapStart - segmentStart > EPSILON) {
        next.push([segmentStart, overlapStart])
      }

      if (segmentEnd - overlapEnd > EPSILON) {
        next.push([overlapEnd, segmentEnd])
      }
    }

    current = next
  }

  return current
}

function buildSegmentsForAxis(
  polygon: FloorPoint[],
  holes: FloorPoint[][],
  axis: Axis,
  offset: number,
) {
  const outerSegments = pairIntersections(getAxisIntersections(polygon, axis, offset))
  const holeSegments = holes.flatMap((hole) =>
    pairIntersections(getAxisIntersections(hole, axis, offset)),
  )
  const trimmedSegments = subtractIntervals(outerSegments, holeSegments)

  return trimmedSegments.map(([start, end]) =>
    axis === 'x'
      ? { start: [start, offset] as FloorPoint, end: [end, offset] as FloorPoint }
      : { start: [offset, start] as FloorPoint, end: [offset, end] as FloorPoint },
  )
}

export function resolveFloorJoistAxis(
  input: Pick<FloorLayoutInput, 'polygon' | 'joistDirection'>,
): Axis {
  if (input.joistDirection === 'x' || input.joistDirection === 'z') {
    return input.joistDirection
  }

  const bounds = getBounds(input.polygon)
  return bounds.width <= bounds.depth ? 'x' : 'z'
}

export function buildFloorLayoutPreview(input: FloorLayoutInput): FloorLayoutPreview {
  const polygon = input.polygon
  const holes = input.holes ?? []
  const bounds = getBounds(polygon)
  const axis = resolveFloorJoistAxis(input)
  const spacing = Math.max(EPSILON, input.joistSpacing ?? DEFAULT_JOIST_SPACING)
  const scanMin = axis === 'x' ? bounds.minZ : bounds.minX
  const scanMax = axis === 'x' ? bounds.maxZ : bounds.maxX
  const joistSegments: FloorLayoutSegment[] = []

  for (let offset = scanMin + spacing / 2; offset < scanMax - EPSILON; offset += spacing) {
    joistSegments.push(...buildSegmentsForAxis(polygon, holes, axis, offset))
  }

  if (joistSegments.length === 0 && scanMax - scanMin > EPSILON) {
    joistSegments.push(...buildSegmentsForAxis(polygon, holes, axis, (scanMin + scanMax) / 2))
  }

  const supportSegments =
    input.supportLines?.flatMap((supportLine) =>
      buildSegmentsForAxis(polygon, holes, supportLine.axis, supportLine.offset).map((segment) => ({
        ...segment,
        kind: supportLine.kind,
        stock: supportLine.stock,
        supportLineId: supportLine.id,
      })),
    ) ?? []

  return {
    axis,
    bounds,
    netArea: Math.max(
      0,
      getPolygonArea(polygon) - holes.reduce((sum, hole) => sum + getPolygonArea(hole), 0),
    ),
    joistSegments,
    supportSegments,
    rimSegments: getPolygonEdges(polygon),
    openingSegments: holes.flatMap((hole) => getPolygonEdges(hole)),
  }
}
