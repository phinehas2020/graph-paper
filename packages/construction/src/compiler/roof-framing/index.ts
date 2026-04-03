import type {
  ConstructionComponentResult,
  ConstructionMember,
  ConstructionTopology,
  ConstructionTopologyRafterSet,
  ConstructionTopologyRoofPlane,
  ConstructionTopologyTrussArray,
} from '../../schema/construction-graph'
import type { ConstructionDiagnostic } from '../../schema/diagnostics'
import type { RulePack } from '../../schema/rulepacks'
import {
  createMember,
  createSurfaceMember,
  finalizeComponentResult,
  polygonBounds,
} from '../shared'
import { distance2D, fromBasis, getProjectedBounds } from '../shared/pass-utils'

const ROOF_SHEET_AREA = 1.2192 * 2.4384

function getSlopeFactor(roofPlane: ConstructionTopologyRoofPlane) {
  const pitchRise = roofPlane.pitch / 12
  return Math.sqrt(1 + pitchRise * pitchRise)
}

function buildRoofPlaneResult(
  roofPlane: ConstructionTopologyRoofPlane,
  rulePack: RulePack,
): ConstructionComponentResult {
  const diagnostics: ConstructionDiagnostic[] = []
  const members = []

  if (roofPlane.polygon.length < 3 || roofPlane.area <= 0) {
    diagnostics.push({
      id: `roof-plane-invalid:${roofPlane.roofPlaneId}`,
      level: 'warning',
      code: 'construction.roof.invalid_polygon',
      message: `Roof plane ${roofPlane.roofPlaneId} needs a valid boundary before framing can be generated.`,
      sourceNodeId: roofPlane.sourceNodeId,
    })
  }

  const bounds = polygonBounds(roofPlane.polygon)
  const centroid = bounds
    ? ([(bounds.minX + bounds.maxX) / 2, (bounds.minZ + bounds.maxZ) / 2] as [number, number])
    : null

  if (centroid && roofPlane.area > 0) {
    members.push(
      createSurfaceMember({
        id: `roof-sheathing:${roofPlane.roofPlaneId}`,
        sourceNodeId: roofPlane.sourceNodeId,
        scopeId: roofPlane.sourceNodeId,
        levelId: roofPlane.levelId,
        assemblyId: roofPlane.assemblyId,
        type: 'roof-sheathing',
        category: 'envelope',
        label: 'Roof Sheathing',
        materialCode: 'panel.osb.7-16.4x8',
        unit: 'sheet',
        quantity: (roofPlane.area * getSlopeFactor(roofPlane)) / ROOF_SHEET_AREA,
        count: Math.max(1, Math.ceil((roofPlane.area * getSlopeFactor(roofPlane)) / ROOF_SHEET_AREA)),
        centroid,
        elevation: roofPlane.plateHeight + roofPlane.heelHeight + roofPlane.sheathingThickness,
        span: Math.max(bounds?.width ?? 0, bounds?.depth ?? 0, 0.5),
      }),
    )
  }

  if (roofPlane.trussArrayIds.length === 0 && roofPlane.rafterSetIds.length === 0) {
    diagnostics.push({
      id: `roof-plane-no-framing:${roofPlane.roofPlaneId}`,
      level: 'info',
      code: 'construction.roof.no_framing_children',
      message: `Roof plane ${roofPlane.roofPlaneId} does not yet have a truss array or rafter set authored under it.`,
      sourceNodeId: roofPlane.sourceNodeId,
    })
  }

  return finalizeComponentResult({
    sourceNodeId: roofPlane.sourceNodeId,
    sourceNodeType: 'roof-plane',
    discipline: 'roof',
    levelId: roofPlane.levelId,
    assemblyId: roofPlane.assemblyId,
    members,
    diagnostics,
    rulePack,
  })
}

function buildRoofArrayResult(
  member:
    | (ConstructionTopologyTrussArray & { sourceNodeType: 'truss-array' })
    | (ConstructionTopologyRafterSet & { sourceNodeType: 'rafter-set' }),
  roofPlaneById: Record<string, ConstructionTopologyRoofPlane>,
  rulePack: RulePack,
): ConstructionComponentResult {
  const roofPlane = member.roofPlaneId ? roofPlaneById[member.roofPlaneId] : undefined
  const assemblyId = member.assemblyId ?? roofPlane?.assemblyId ?? rulePack.defaults.roofAssemblyId
  const diagnostics: ConstructionDiagnostic[] = []
  const members: ConstructionMember[] = []

  if (!roofPlane) {
    diagnostics.push({
      id: `roof-framing-missing-plane:${member.sourceNodeId}`,
      level: 'warning',
      code: 'construction.roof.missing_plane',
      message: `Roof framing node ${member.sourceNodeId} is not attached to a roof plane and was skipped.`,
      sourceNodeId: member.sourceNodeId,
    })

    return finalizeComponentResult({
      sourceNodeId: member.sourceNodeId,
      sourceNodeType: member.sourceNodeType,
      discipline: 'roof',
      levelId: member.levelId,
      assemblyId,
      members,
      diagnostics,
      rulePack,
    })
  }

  if (member.length <= 0) {
    diagnostics.push({
      id: `roof-framing-empty-baseline:${member.sourceNodeId}`,
      level: 'warning',
      code: 'construction.roof.empty_baseline',
      message: `Roof framing node ${member.sourceNodeId} needs a valid baseline before members can be generated.`,
      sourceNodeId: member.sourceNodeId,
    })
  } else {
    const angle = Math.atan2(member.end[1] - member.start[1], member.end[0] - member.start[0])
    const bounds = getProjectedBounds(roofPlane.polygon, angle)
    const framingWidth = Math.max(0, bounds.maxAlongNormal - bounds.minAlongNormal)
    const framingRun = Math.max(0, bounds.maxAlongDirection - bounds.minAlongDirection)

    if (framingWidth <= 0 || framingRun <= 0) {
      diagnostics.push({
        id: `roof-framing-invalid-plane:${member.sourceNodeId}`,
        level: 'warning',
        code: 'construction.roof.invalid_plane_extent',
        message: `Roof framing node ${member.sourceNodeId} could not derive a usable roof-plane span.`,
        sourceNodeId: member.sourceNodeId,
      })
    } else {
      const spacing = Math.max(member.spacing, 0.3048)
      const count = Math.max(1, Math.floor(framingWidth / spacing) + 1)
      const y = roofPlane.plateHeight + roofPlane.heelHeight
      const slopeFactor = getSlopeFactor(roofPlane)

      for (let index = 0; index < count; index += 1) {
        const offset = Math.min(bounds.minAlongNormal + spacing * index, bounds.maxAlongNormal)
        const startPlan = fromBasis(
          bounds.minAlongDirection,
          offset,
          bounds.direction,
          bounds.normal,
        )
        const endPlan = fromBasis(
          bounds.maxAlongDirection,
          offset,
          bounds.direction,
          bounds.normal,
        )

        members.push(
          createMember({
            id: `${member.sourceNodeId}:member:${index + 1}`,
            sourceNodeId: member.sourceNodeId,
            scopeId: member.sourceNodeId,
            levelId: member.levelId,
            assemblyId,
            type: member.sourceNodeType === 'truss-array' ? 'truss' : 'rafter',
            category: 'framing',
            label: `${member.sourceNodeType === 'truss-array' ? 'Roof Truss' : 'Rafter'} ${index + 1}`,
            materialCode: member.sourceNodeType === 'truss-array' ? 'roof.truss' : 'roof.rafter',
            unit: 'lf',
            quantity: distance2D(startPlan, endPlan) * slopeFactor,
            count: 1,
            start: [startPlan[0], y, startPlan[1]],
            end: [endPlan[0], y + roofPlane.pitch / 24, endPlan[1]],
            metadata: {
              spacing: member.spacing,
              roofPlaneId: roofPlane.roofPlaneId,
            },
          }),
        )
      }
    }
  }

  return finalizeComponentResult({
    sourceNodeId: member.sourceNodeId,
    sourceNodeType: member.sourceNodeType,
    discipline: 'roof',
    levelId: member.levelId,
    assemblyId,
    members,
    diagnostics,
    rulePack,
  })
}

export function compileRoofFraming(
  topology: ConstructionTopology,
  rulePack: RulePack,
): ConstructionComponentResult[] {
  const roofPlaneById = Object.fromEntries(
    topology.roofPlanes.map((roofPlane) => [roofPlane.roofPlaneId, roofPlane]),
  )

  return [
    ...topology.roofPlanes.map((roofPlane) => buildRoofPlaneResult(roofPlane, rulePack)),
    ...topology.trussArrays.map((trussArray) =>
      buildRoofArrayResult(
        { ...trussArray, sourceNodeType: 'truss-array' },
        roofPlaneById,
        rulePack,
      ),
    ),
    ...topology.rafterSets.map((rafterSet) =>
      buildRoofArrayResult(
        { ...rafterSet, sourceNodeType: 'rafter-set' },
        roofPlaneById,
        rulePack,
      ),
    ),
  ]
}
