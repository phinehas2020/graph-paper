import type {
  ConstructionCompileResult,
  ConstructionDiagnostic,
  ConstructionMember,
  QuantityLine,
} from '@pascal-app/construction'
import { type AnyNode, type AnyNodeId, resolveLevelId, useScene } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { useConstructionGraph } from '../../../hooks/use-construction-graph'
import useEditor from '../../../store/use-editor'

type Vec3 = [number, number, number]

function averageVec3(points: Vec3[]): Vec3 | null {
  if (points.length === 0) return null

  const [x, y, z] = points.reduce<Vec3>(
    (sum, point) => [sum[0] + point[0], sum[1] + point[1], sum[2] + point[2]],
    [0, 0, 0],
  )

  return [x / points.length, y / points.length, z / points.length]
}

function getPlanCentroid(points: Array<[number, number]>): [number, number] | null {
  if (points.length === 0) return null

  const [x, z] = points.reduce<[number, number]>(
    (sum, point) => [sum[0] + point[0], sum[1] + point[1]],
    [0, 0],
  )

  return [x / points.length, z / points.length]
}

function getSourceNodeAnchor(
  node: AnyNode | undefined,
  nodes: Record<string, AnyNode>,
): Vec3 | null {
  if (!node) return null

  switch (node.type) {
    case 'wall':
      return [
        (node.start[0] + node.end[0]) / 2,
        Math.max((node.height ?? 0) / 2, 0.4),
        (node.start[1] + node.end[1]) / 2,
      ]
    case 'floor-system': {
      const centroid = getPlanCentroid(node.polygon)
      return centroid
        ? [centroid[0], -node.elevation + Math.max(node.memberDepth / 2, 0.05), centroid[1]]
        : null
    }
    case 'floor-opening': {
      const centroid = getPlanCentroid(node.polygon)
      return centroid ? [centroid[0], 0.1, centroid[1]] : null
    }
    case 'beam-line':
    case 'blocking-run':
    case 'footing-run':
    case 'stem-wall':
      return [
        (node.start[0] + node.end[0]) / 2,
        Math.max(('depth' in node ? node.depth : 'height' in node ? node.height : 0.2) / 2, 0.1),
        (node.start[1] + node.end[1]) / 2,
      ]
    case 'support-post':
      return [node.center[0], Math.max(node.height / 2, 0.4), node.center[1]]
    case 'roof-plane': {
      const centroid = getPlanCentroid(node.polygon)
      return centroid
        ? [
            centroid[0],
            node.plateHeight + Math.max((node.sheathingThickness + node.roofingThickness) / 2, 0.15),
            centroid[1],
          ]
        : null
    }
    case 'truss-array':
    case 'rafter-set':
      return [
        (node.start[0] + node.end[0]) / 2,
        ((node as { heelHeight?: number }).heelHeight ?? 0.2) +
          Math.max(
            (((node as { memberDepth?: number }).memberDepth ??
              (node as { depth?: number }).depth ??
              0.2) as number) / 2,
            0.15,
          ),
        (node.start[1] + node.end[1]) / 2,
      ]
    case 'electrical-panel':
    case 'device-box':
    case 'light-fixture':
    case 'plumbing-fixture':
      return [node.position[0], node.position[1], node.position[2]]
    case 'wire-run':
    case 'switch-leg':
    case 'supply-run':
    case 'drain-run':
    case 'vent-run':
      return averageVec3(node.path as Vec3[])
    case 'pier':
    case 'column':
      return [node.center[0], Math.max(node.height / 2, 0.4), node.center[1]]
    case 'circuit':
    case 'foundation-system': {
      const childAnchors = node.children
        .map((childId) => getSourceNodeAnchor(nodes[childId], nodes))
        .filter((anchor): anchor is Vec3 => Boolean(anchor))
      return averageVec3(childAnchors)
    }
    case 'roof': {
      const childAnchors = node.children
        .map((childId) => getSourceNodeAnchor(nodes[childId], nodes))
        .filter((anchor): anchor is Vec3 => Boolean(anchor))
      return averageVec3(childAnchors)
    }
    default:
      return null
  }
}

function getWallMemberPose(
  member: ConstructionMember,
  graph: ConstructionCompileResult,
): { position: Vec3; rotationY: number; size: Vec3 } | null {
  if (member.start || member.end) {
    return null
  }

  const wall = graph.topology.walls.find((entry) => entry.wallId === member.wallId)
  if (!wall) {
    return null
  }

  const dx = wall.end[0] - wall.start[0]
  const dz = wall.end[1] - wall.start[1]
  const length = Math.hypot(dx, dz) || 1
  const direction: [number, number] = [dx / length, dz / length]
  const normal: [number, number] = [-dz / length, dx / length]
  const [localX, localY, localZ] = member.geometry.localCenter

  return {
    position: [
      wall.start[0] + direction[0] * localX + normal[0] * localZ,
      localY,
      wall.start[1] + direction[1] * localX + normal[1] * localZ,
    ],
    rotationY: Math.atan2(dz, dx),
    size: [
      Math.max(member.geometry.localSize[0], 0.02),
      Math.max(member.geometry.localSize[1], 0.02),
      Math.max(member.geometry.localSize[2], 0.02),
    ],
  }
}

function getCategoryColor(member: ConstructionMember) {
  switch (member.category) {
    case 'framing':
      return '#f59e0b'
    case 'envelope':
      return '#38bdf8'
    case 'finish':
      return '#a855f7'
    default:
      return '#94a3b8'
  }
}

function getDiagnosticColor(diagnostic: ConstructionDiagnostic) {
  switch (diagnostic.level) {
    case 'error':
      return '#ef4444'
    case 'warning':
      return '#f59e0b'
    default:
      return '#38bdf8'
  }
}

function getQuantityMarkerColor(totalCost: number) {
  if (totalCost > 1000) return '#ef4444'
  if (totalCost > 250) return '#f97316'
  return '#22c55e'
}

function ConstructionMemberLine({
  canSelect,
  color,
  member,
  onSelect,
}: {
  canSelect: boolean
  color: string
  member: ConstructionMember
  onSelect: (sourceNodeId: string) => void
}) {
  const geometry = useMemo(() => {
    const nextGeometry = new BufferGeometry()
    const start = member.start
    const end = member.end

    if (!(start && end)) {
      return nextGeometry
    }

    nextGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(
        [start[0], start[1], start[2], end[0], end[1], end[2]],
        3,
      ),
    )
    return nextGeometry
  }, [member.end, member.start])

  if (!(member.start && member.end)) {
    return null
  }

  return (
    <line
      onClick={
        canSelect
          ? (event) => {
              event.stopPropagation()
              onSelect(member.sourceNodeId)
            }
          : undefined
      }
    >
      <primitive attach="geometry" object={geometry} />
      <lineBasicMaterial color={color} depthTest={false} transparent opacity={0.95} />
    </line>
  )
}

export function ConstructionOverlaySystem() {
  const graph = useConstructionGraph()
  const nodes = useScene((state) => state.nodes)
  const selectedIds = useViewer((state) => state.selection.selectedIds)
  const selectedLevelId = useViewer((state) => state.selection.levelId)
  const setSelection = useViewer((state) => state.setSelection)
  const overlay = useEditor((state) => state.constructionOverlay)
  const mode = useEditor((state) => state.mode)

  const visibleMembers = useMemo(() => {
    if (!graph) return []

    return graph.members.filter((member) => {
      if (selectedLevelId && member.levelId && member.levelId !== selectedLevelId) {
        return false
      }

      const sourceNode = nodes[member.sourceNodeId as AnyNodeId]
      return !(selectedLevelId && sourceNode && resolveLevelId(sourceNode, nodes) !== selectedLevelId)
    })
  }, [graph, nodes, selectedLevelId])

  const visibleDiagnostics = useMemo(() => {
    if (!graph) return []

    return graph.diagnostics.filter((diagnostic) => {
      if (!diagnostic.sourceNodeId) return !selectedLevelId
      const sourceNode = nodes[diagnostic.sourceNodeId as AnyNodeId]
      return !(selectedLevelId && sourceNode && resolveLevelId(sourceNode, nodes) !== selectedLevelId)
    })
  }, [graph, nodes, selectedLevelId])

  const quantityMarkers = useMemo(() => {
    if (!graph) return []

    const membersById = Object.fromEntries(graph.members.map((member) => [member.id, member]))
    const totals = new Map<
      string,
      {
        sourceNodeId: string
        lineCount: number
        totalQuantity: number
        totalCost: number
      }
    >()

    graph.quantities.forEach((line: QuantityLine) => {
      const sourceNodeIds = new Set(
        line.sourceMemberIds
          .map((memberId) => membersById[memberId]?.sourceNodeId)
          .filter((sourceNodeId): sourceNodeId is string => Boolean(sourceNodeId)),
      )

      sourceNodeIds.forEach((sourceNodeId) => {
        const current = totals.get(sourceNodeId) ?? {
          sourceNodeId,
          lineCount: 0,
          totalQuantity: 0,
          totalCost: 0,
        }

        current.lineCount += 1
        current.totalQuantity += line.totalQuantity
        current.totalCost += line.estimatedTotalCost ?? 0
        totals.set(sourceNodeId, current)
      })
    })

    return [...totals.values()].filter((entry) => {
      const sourceNode = nodes[entry.sourceNodeId as AnyNodeId]
      return !(selectedLevelId && sourceNode && resolveLevelId(sourceNode, nodes) !== selectedLevelId)
    })
  }, [graph, nodes, selectedLevelId])

  const handleSourceSelect = (sourceNodeId: string) => {
    setSelection({ selectedIds: [sourceNodeId] })
  }

  if (!(graph && overlay !== 'authored')) {
    return null
  }

  return (
    <group>
      {overlay === 'generated' &&
        visibleMembers.map((member) => {
          if (member.start && member.end) {
            return (
              <ConstructionMemberLine
                canSelect={mode === 'select'}
                color={getCategoryColor(member)}
                key={member.id}
                member={member}
                onSelect={handleSourceSelect}
              />
            )
          }

          const pose = getWallMemberPose(member, graph)
          if (!pose) return null

          const isSelected = selectedIds.includes(member.sourceNodeId)

          return (
            <mesh
              key={member.id}
              onClick={
                mode === 'select'
                  ? (event: any) => {
                      event.stopPropagation()
                      handleSourceSelect(member.sourceNodeId)
                    }
                  : undefined
              }
              position={pose.position}
              renderOrder={11}
              rotation={[0, pose.rotationY, 0]}
            >
              <boxGeometry args={pose.size} />
              <meshStandardMaterial
                color={getCategoryColor(member)}
                emissive={isSelected ? '#ffffff' : '#000000'}
                opacity={isSelected ? 0.85 : 0.4}
                transparent
              />
            </mesh>
          )
        })}

      {overlay === 'diagnostics' &&
        visibleDiagnostics.map((diagnostic) => {
          const sourceNodeId = diagnostic.sourceNodeId
          const anchor = getSourceNodeAnchor(
            sourceNodeId ? nodes[sourceNodeId as AnyNodeId] : undefined,
            nodes,
          )

          if (!(sourceNodeId && anchor)) {
            return null
          }

          return (
            <mesh
              key={diagnostic.id}
              onClick={
                mode === 'select'
                  ? (event: any) => {
                      event.stopPropagation()
                      handleSourceSelect(sourceNodeId)
                    }
                  : undefined
              }
              position={[anchor[0], anchor[1] + 0.35, anchor[2]]}
              renderOrder={12}
            >
              <sphereGeometry args={[diagnostic.level === 'error' ? 0.22 : 0.16, 18, 18]} />
              <meshStandardMaterial
                color={getDiagnosticColor(diagnostic)}
                emissive={getDiagnosticColor(diagnostic)}
                emissiveIntensity={0.45}
                opacity={0.9}
                transparent
              />
            </mesh>
          )
        })}

      {overlay === 'quantities' &&
        quantityMarkers.map((marker) => {
          const anchor = getSourceNodeAnchor(nodes[marker.sourceNodeId as AnyNodeId], nodes)
          if (!anchor) return null

          const radius = Math.min(0.42, 0.14 + marker.lineCount * 0.03)
          const isSelected = selectedIds.includes(marker.sourceNodeId)

          return (
            <mesh
              key={marker.sourceNodeId}
              onClick={
                mode === 'select'
                  ? (event: any) => {
                      event.stopPropagation()
                      handleSourceSelect(marker.sourceNodeId)
                    }
                  : undefined
              }
              position={[anchor[0], anchor[1] + 0.3, anchor[2]]}
              renderOrder={12}
            >
              <sphereGeometry args={[radius, 16, 16]} />
              <meshStandardMaterial
                color={getQuantityMarkerColor(marker.totalCost)}
                emissive={isSelected ? '#ffffff' : '#111827'}
                opacity={0.78}
                transparent
              />
            </mesh>
          )
        })}
    </group>
  )
}
