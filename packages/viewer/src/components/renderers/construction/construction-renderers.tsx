'use client'

import type {
  BeamLineNode,
  BlockingRunNode,
  ColumnNode,
  DeviceBoxNode,
  DrainRunNode,
  ElectricalPanelNode,
  FloorOpeningNode,
  FloorSystemNode,
  FootingRunNode,
  FoundationSystemNode,
  LightFixtureNode,
  PierNode,
  PlumbingFixtureNode,
  RafterSetNode,
  RoofPlaneNode,
  StemWallNode,
  SupplyRunNode,
  SupportPostNode,
  SwitchLegNode,
  TrussArrayNode,
  VentRunNode,
  WireRunNode,
} from '@pascal-app/core'
import { useRegistry } from '@pascal-app/core'
import { useMemo, useRef } from 'react'
import type { Group, Mesh } from 'three'
import { BoxGeometry, BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Shape } from 'three'
import { useNodeEvents } from '../../../hooks/use-node-events'
import { NodeRenderer } from '../node-renderer'

function createPlanExtrusionGeometry(
  polygon: Array<[number, number]>,
  depth: number,
): BufferGeometry {
  if (polygon.length < 3) {
    return new BoxGeometry(0, 0, 0)
  }

  const shape = new Shape()
  const [firstX, firstZ] = polygon[0]!
  shape.moveTo(firstX, -firstZ)

  for (const [x, z] of polygon.slice(1)) {
    shape.lineTo(x, -z)
  }

  shape.closePath()

  const geometry = new ExtrudeGeometry(shape, {
    depth: Math.max(depth, 0.01),
    bevelEnabled: false,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

function SegmentMesh({
  color,
  depth,
  end,
  height,
  start,
}: {
  color: string
  depth: number
  end: [number, number]
  height: number
  start: [number, number]
}) {
  const dx = end[0] - start[0]
  const dz = end[1] - start[1]
  const length = Math.hypot(dx, dz)
  const angle = Math.atan2(dz, dx)

  return (
    <mesh
      castShadow
      position={[(start[0] + end[0]) / 2, 0, (start[1] + end[1]) / 2]}
      receiveShadow
      rotation-y={angle}
    >
      <boxGeometry args={[Math.max(length, 0.01), Math.max(height, 0.01), Math.max(depth, 0.01)]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function PathSegments({
  color,
  depth,
  path,
  yOffset = 0,
}: {
  color: string
  depth: number
  path: Array<[number, number, number]>
  yOffset?: number
}) {
  if (path.length < 2) {
    return null
  }

  return (
    <group>
      {path.slice(0, -1).map((point, index) => {
        const next = path[index + 1]
        if (!next) return null
        const dx = next[0] - point[0]
        const dy = next[1] - point[1]
        const dz = next[2] - point[2]
        const length = Math.hypot(dx, dy, dz)
        const angle = Math.atan2(dz, dx)
        return (
          <mesh
            castShadow
            key={`${point.join(':')}:${next.join(':')}`}
            position={[(point[0] + next[0]) / 2, (point[1] + next[1]) / 2 + yOffset, (point[2] + next[2]) / 2]}
            receiveShadow
            rotation-y={angle}
          >
            <boxGeometry args={[Math.max(length, 0.01), Math.max(depth, 0.01), Math.max(depth, 0.01)]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )
      })}
    </group>
  )
}

function OutlinePath({
  color,
  path,
}: {
  color: string
  path: Array<[number, number, number]>
}) {
  const geometry = useMemo(() => {
    const nextGeometry = new BufferGeometry()
    const positions = path.flatMap(([x, y, z]) => [x, y, z])
    nextGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return nextGeometry
  }, [path])

  return (
    <line>
      <primitive attach="geometry" object={geometry} />
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  )
}

export const FloorSystemRenderer = ({ node }: { node: FloorSystemNode }) => {
  const ref = useRef<Mesh>(null!)
  const handlers = useNodeEvents(node, 'floor-system')
  const geometry = useMemo(
    () => createPlanExtrusionGeometry(node.polygon, node.memberDepth),
    [node.memberDepth, node.polygon],
  )

  useRegistry(node.id, 'floor-system', ref)

  return (
    <mesh
      castShadow
      geometry={geometry}
      position={[0, -node.elevation, 0]}
      receiveShadow
      ref={ref}
      visible={node.visible}
      {...handlers}
    >
      <meshStandardMaterial color={node.color ?? '#d4b483'} opacity={0.72} transparent />
      {node.children.map((childId) => (
        <NodeRenderer key={childId} nodeId={childId as any} />
      ))}
    </mesh>
  )
}

export const FloorOpeningRenderer = ({ node }: { node: FloorOpeningNode }) => {
  const ref = useRef<Mesh>(null!)
  const handlers = useNodeEvents(node, 'floor-opening')
  const geometry = useMemo(() => createPlanExtrusionGeometry(node.polygon, 0.02), [node.polygon])

  useRegistry(node.id, 'floor-opening', ref)

  return (
    <mesh geometry={geometry} position={[0, 0.005, 0]} ref={ref} visible={node.visible} {...handlers}>
      <meshStandardMaterial color={node.color ?? '#ef4444'} opacity={0.45} transparent />
    </mesh>
  )
}

export const BlockingRunRenderer = ({ node }: { node: BlockingRunNode }) => {
  const ref = useRef<Group>(null!)
  const handlers = useNodeEvents(node, 'blocking-run')

  useRegistry(node.id, 'blocking-run', ref)

  return (
    <group ref={ref} visible={node.visible} {...handlers}>
      <SegmentMesh color={node.color ?? '#f59e0b'} depth={0.05} end={node.end} height={0.05} start={node.start} />
    </group>
  )
}

export const BeamLineRenderer = ({ node }: { node: BeamLineNode }) => {
  const ref = useRef<Group>(null!)
  const handlers = useNodeEvents(node, 'beam-line')

  useRegistry(node.id, 'beam-line', ref)

  return (
    <group position={[0, -node.depth / 2, 0]} ref={ref} visible={node.visible} {...handlers}>
      <SegmentMesh color={node.color ?? '#8b5e34'} depth={node.width} end={node.end} height={node.depth} start={node.start} />
    </group>
  )
}

export const SupportPostRenderer = ({ node }: { node: SupportPostNode }) => {
  const ref = useRef<Mesh>(null!)
  const handlers = useNodeEvents(node, 'support-post')

  useRegistry(node.id, 'support-post', ref)

  return (
    <mesh
      castShadow
      position={[node.center[0], -node.height / 2, node.center[1]]}
      receiveShadow
      ref={ref}
      visible={node.visible}
      {...handlers}
    >
      <boxGeometry args={[node.width, node.height, node.depth]} />
      <meshStandardMaterial color={node.color ?? '#6b7280'} />
    </mesh>
  )
}

export const RoofPlaneRenderer = ({ node }: { node: RoofPlaneNode }) => {
  const ref = useRef<Mesh>(null!)
  const handlers = useNodeEvents(node, 'roof-plane')
  const geometry = useMemo(
    () => createPlanExtrusionGeometry(node.polygon, node.sheathingThickness + node.roofingThickness),
    [node.polygon, node.roofingThickness, node.sheathingThickness],
  )

  useRegistry(node.id, 'roof-plane', ref)

  return (
    <mesh
      castShadow
      geometry={geometry}
      position={[0, node.plateHeight, 0]}
      receiveShadow
      ref={ref}
      visible={node.visible}
      {...handlers}
    >
      <meshStandardMaterial color={node.color ?? '#c2410c'} opacity={0.58} transparent />
      {node.children.map((childId) => (
        <NodeRenderer key={childId} nodeId={childId} />
      ))}
    </mesh>
  )
}

export const TrussArrayRenderer = ({ node }: { node: TrussArrayNode }) => {
  const ref = useRef<Group>(null!)
  const handlers = useNodeEvents(node, 'truss-array')

  useRegistry(node.id, 'truss-array', ref)

  return (
    <group position={[0, node.heelHeight, 0]} ref={ref} visible={node.visible} {...handlers}>
      <SegmentMesh color={node.color ?? '#dc2626'} depth={0.06} end={node.end} height={0.12} start={node.start} />
    </group>
  )
}

export const RafterSetRenderer = ({ node }: { node: RafterSetNode }) => {
  const ref = useRef<Group>(null!)
  const handlers = useNodeEvents(node, 'rafter-set')

  useRegistry(node.id, 'rafter-set', ref)

  return (
    <group position={[0, 0.05, 0]} ref={ref} visible={node.visible} {...handlers}>
      <SegmentMesh color={node.color ?? '#7c3aed'} depth={0.05} end={node.end} height={0.1} start={node.start} />
    </group>
  )
}

export const ElectricalPanelRenderer = ({ node }: { node: ElectricalPanelNode }) => {
  const ref = useRef<Group>(null!)
  const handlers = useNodeEvents(node, 'electrical-panel')

  useRegistry(node.id, 'electrical-panel', ref)

  return (
    <group position={node.position} ref={ref} visible={node.visible} {...handlers}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.8, 0.12]} />
        <meshStandardMaterial color={node.color ?? '#334155'} />
      </mesh>
      {node.children.map((childId) => (
        <NodeRenderer key={childId} nodeId={childId} />
      ))}
    </group>
  )
}

export const DeviceBoxRenderer = ({ node }: { node: DeviceBoxNode }) => {
  const ref = useRef<Mesh>(null!)
  const handlers = useNodeEvents(node, 'device-box')

  useRegistry(node.id, 'device-box', ref)

  return (
    <mesh castShadow position={node.position} receiveShadow ref={ref} visible={node.visible} {...handlers}>
      <boxGeometry args={[0.14, 0.14, 0.06]} />
      <meshStandardMaterial color={node.color ?? '#0f766e'} />
    </mesh>
  )
}

export const LightFixtureRenderer = ({ node }: { node: LightFixtureNode }) => {
  const ref = useRef<Mesh>(null!)
  const handlers = useNodeEvents(node, 'light-fixture')

  useRegistry(node.id, 'light-fixture', ref)

  return (
    <mesh castShadow position={node.position} receiveShadow ref={ref} visible={node.visible} {...handlers}>
      <cylinderGeometry args={[0.14, 0.18, 0.08, 24]} />
      <meshStandardMaterial color={node.color ?? '#facc15'} />
    </mesh>
  )
}

export const WireRunRenderer = ({ node }: { node: WireRunNode }) => {
  const ref = useRef<Group>(null!)
  const handlers = useNodeEvents(node, 'wire-run')

  useRegistry(node.id, 'wire-run', ref)

  return (
    <group ref={ref} visible={node.visible} {...handlers}>
      <PathSegments color={node.color ?? '#38bdf8'} depth={0.03} path={node.path} />
      <OutlinePath color={node.color ?? '#38bdf8'} path={node.path} />
    </group>
  )
}

export const SwitchLegRenderer = ({ node }: { node: SwitchLegNode }) => {
  const ref = useRef<Group>(null!)
  const handlers = useNodeEvents(node, 'switch-leg')

  useRegistry(node.id, 'switch-leg', ref)

  return (
    <group ref={ref} visible={node.visible} {...handlers}>
      <PathSegments color={node.color ?? '#f97316'} depth={0.03} path={node.path} />
      <OutlinePath color={node.color ?? '#f97316'} path={node.path} />
    </group>
  )
}

export const PlumbingFixtureRenderer = ({ node }: { node: PlumbingFixtureNode }) => {
  const ref = useRef<Mesh>(null!)
  const handlers = useNodeEvents(node, 'plumbing-fixture')

  useRegistry(node.id, 'plumbing-fixture', ref)

  return (
    <mesh castShadow position={node.position} receiveShadow ref={ref} visible={node.visible} {...handlers}>
      <boxGeometry args={[0.4, 0.25, 0.4]} />
      <meshStandardMaterial color={node.color ?? '#60a5fa'} />
    </mesh>
  )
}

export const SupplyRunRenderer = ({ node }: { node: SupplyRunNode }) => {
  const ref = useRef<Group>(null!)
  const handlers = useNodeEvents(node, 'supply-run')

  useRegistry(node.id, 'supply-run', ref)

  return (
    <group ref={ref} visible={node.visible} {...handlers}>
      <PathSegments color={node.systemKind === 'hot' ? '#ef4444' : '#3b82f6'} depth={0.035} path={node.path} />
      <OutlinePath color={node.systemKind === 'hot' ? '#ef4444' : '#3b82f6'} path={node.path} />
    </group>
  )
}

export const DrainRunRenderer = ({ node }: { node: DrainRunNode }) => {
  const ref = useRef<Group>(null!)
  const handlers = useNodeEvents(node, 'drain-run')

  useRegistry(node.id, 'drain-run', ref)

  return (
    <group ref={ref} visible={node.visible} {...handlers}>
      <PathSegments color={node.color ?? '#f97316'} depth={0.05} path={node.path} />
      <OutlinePath color={node.color ?? '#f97316'} path={node.path} />
    </group>
  )
}

export const VentRunRenderer = ({ node }: { node: VentRunNode }) => {
  const ref = useRef<Group>(null!)
  const handlers = useNodeEvents(node, 'vent-run')

  useRegistry(node.id, 'vent-run', ref)

  return (
    <group ref={ref} visible={node.visible} {...handlers}>
      <PathSegments color={node.color ?? '#94a3b8'} depth={0.04} path={node.path} />
      <OutlinePath color={node.color ?? '#94a3b8'} path={node.path} />
    </group>
  )
}

export const FoundationSystemRenderer = ({ node }: { node: FoundationSystemNode }) => {
  const ref = useRef<Group>(null!)
  const handlers = useNodeEvents(node, 'foundation-system')

  useRegistry(node.id, 'foundation-system', ref)

  return (
    <group ref={ref} visible={node.visible} {...handlers}>
      {node.children.map((childId) => (
        <NodeRenderer key={childId} nodeId={childId} />
      ))}
    </group>
  )
}

export const FootingRunRenderer = ({ node }: { node: FootingRunNode }) => {
  const ref = useRef<Group>(null!)
  const handlers = useNodeEvents(node, 'footing-run')

  useRegistry(node.id, 'footing-run', ref)

  return (
    <group position={[0, -node.depth / 2, 0]} ref={ref} visible={node.visible} {...handlers}>
      <SegmentMesh color={node.color ?? '#7c2d12'} depth={node.width} end={node.end} height={node.thickness} start={node.start} />
    </group>
  )
}

export const StemWallRenderer = ({ node }: { node: StemWallNode }) => {
  const ref = useRef<Group>(null!)
  const handlers = useNodeEvents(node, 'stem-wall')

  useRegistry(node.id, 'stem-wall', ref)

  return (
    <group position={[0, node.height / 2, 0]} ref={ref} visible={node.visible} {...handlers}>
      <SegmentMesh color={node.color ?? '#78716c'} depth={node.thickness} end={node.end} height={node.height} start={node.start} />
    </group>
  )
}

export const PierRenderer = ({ node }: { node: PierNode }) => {
  const ref = useRef<Mesh>(null!)
  const handlers = useNodeEvents(node, 'pier')

  useRegistry(node.id, 'pier', ref)

  return (
    <mesh
      castShadow
      position={[node.center[0], node.height / 2, node.center[1]]}
      receiveShadow
      ref={ref}
      visible={node.visible}
      {...handlers}
    >
      <boxGeometry args={[node.width, node.height, node.depth]} />
      <meshStandardMaterial color={node.color ?? '#92400e'} />
    </mesh>
  )
}

export const ColumnRenderer = ({ node }: { node: ColumnNode }) => {
  const ref = useRef<Mesh>(null!)
  const handlers = useNodeEvents(node, 'column')

  useRegistry(node.id, 'column', ref)

  return (
    <mesh
      castShadow
      position={[node.center[0], node.height / 2, node.center[1]]}
      receiveShadow
      ref={ref}
      visible={node.visible}
      {...handlers}
    >
      <boxGeometry args={[node.width, node.height, node.depth]} />
      <meshStandardMaterial color={node.color ?? '#475569'} />
    </mesh>
  )
}
