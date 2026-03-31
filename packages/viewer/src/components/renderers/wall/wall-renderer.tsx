import { getWallGuideLocalY, getWallLength, useRegistry, type WallNode } from '@pascal-app/core'
import { useRef } from 'react'
import type { Mesh } from 'three'
import { useNodeEvents } from '../../../hooks/use-node-events'
import { NodeRenderer } from '../node-renderer'

const GUIDE_COLOR = '#22d3ee'
const GUIDE_HEIGHT = 0.016
const GUIDE_DEPTH = 0.008
const GUIDE_OFFSET = 0.01
const disableRaycast: Mesh['raycast'] = () => null

export const WallRenderer = ({ node }: { node: WallNode }) => {
  const ref = useRef<Mesh>(null!)
  const color = node.color ?? '#e7e5e4'
  const wallLength = getWallLength(node)
  const halfThickness = (node.thickness ?? 0.1) / 2

  useRegistry(node.id, 'wall', ref)

  const handlers = useNodeEvents(node, 'wall')

  return (
    <mesh castShadow receiveShadow ref={ref} visible={node.visible}>
      {/* WallSystem will replace this geometry in the next frame */}
      <boxGeometry args={[0, 0, 0]} />
      <meshStandardMaterial color={color} />
      {/* Collision mesh: full-wall geometry (no cutouts) for pointer events */}
      <mesh name="collision-mesh" visible={false} {...handlers}>
        <boxGeometry args={[0, 0, 0]} />
      </mesh>

      {(node.guides ?? []).map((guide) => {
        const guideY = getWallGuideLocalY(node, guide)
        const guideColor = guide.color ?? GUIDE_COLOR

        return (
          <group key={guide.id}>
            <mesh
              position={[wallLength / 2, guideY, halfThickness + GUIDE_OFFSET]}
              raycast={disableRaycast}
              renderOrder={2}
            >
              <boxGeometry args={[wallLength, GUIDE_HEIGHT, GUIDE_DEPTH]} />
              <meshBasicMaterial
                color={guideColor}
                depthTest={false}
                depthWrite={false}
                opacity={0.92}
                transparent
              />
            </mesh>
            <mesh
              position={[wallLength / 2, guideY, -(halfThickness + GUIDE_OFFSET)]}
              raycast={disableRaycast}
              renderOrder={2}
            >
              <boxGeometry args={[wallLength, GUIDE_HEIGHT, GUIDE_DEPTH]} />
              <meshBasicMaterial
                color={guideColor}
                depthTest={false}
                depthWrite={false}
                opacity={0.92}
                transparent
              />
            </mesh>
          </group>
        )
      })}

      {node.children.map((childId) => (
        <NodeRenderer key={childId} nodeId={childId} />
      ))}
    </mesh>
  )
}
