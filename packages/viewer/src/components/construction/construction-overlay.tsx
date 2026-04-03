'use client'

import type { ConstructionGraph } from '@pascal-app/construction'
import { Line } from '@react-three/drei'
import { type LevelNode, useScene } from '@pascal-app/core'
import { useMemo } from 'react'
import useViewer from '../../store/use-viewer'
import { getLevelHeight } from '../../systems/level/level-utils'

const EXPLODED_GAP = 5

const memberStyles: Record<string, { color: string; lineWidth: number }> = {
  plate: { color: '#f59e0b', lineWidth: 1.5 },
  stud: { color: '#38bdf8', lineWidth: 1.5 },
  'king-stud': { color: '#fb7185', lineWidth: 1.5 },
  'jack-stud': { color: '#f97316', lineWidth: 1.5 },
  header: { color: '#c084fc', lineWidth: 1.5 },
  'cripple-stud': { color: '#22d3ee', lineWidth: 1.5 },
  blocking: { color: '#a78bfa', lineWidth: 1.5 },
  joist: { color: '#4ade80', lineWidth: 1.35 },
  'rim-board': { color: '#f97316', lineWidth: 2.2 },
  beam: { color: '#ef4444', lineWidth: 2.8 },
}

function getLevelOffsets(
  nodes: ReturnType<typeof useScene.getState>['nodes'],
  levelMode: ReturnType<typeof useViewer.getState>['levelMode'],
  selectedLevelId: string | null,
) {
  const levels = Object.values(nodes)
    .filter((node): node is LevelNode => node.type === 'level')
    .sort((left, right) => left.level - right.level)

  const offsets = new Map<string, { y: number; visible: boolean }>()
  let cumulativeY = 0

  for (const level of levels) {
    const explodedExtra = levelMode === 'exploded' ? level.level * EXPLODED_GAP : 0
    offsets.set(level.id, {
      y: cumulativeY + explodedExtra,
      visible: levelMode !== 'solo' || selectedLevelId === null || level.id === selectedLevelId,
    })
    cumulativeY += getLevelHeight(level.id, nodes)
  }

  return offsets
}

export function ConstructionOverlay({ graph }: { graph: ConstructionGraph | null }) {
  const showConstruction = useViewer((state) => state.showConstruction)
  const levelMode = useViewer((state) => state.levelMode)
  const selectedLevelId = useViewer((state) => state.selection.levelId)
  const nodes = useScene((state) => state.nodes)

  const levelOffsets = useMemo(
    () => getLevelOffsets(nodes, levelMode, selectedLevelId),
    [levelMode, nodes, selectedLevelId],
  )

  const framingMembers = useMemo(
    () =>
      graph?.members.filter(
        (member) => member.category === 'framing' && member.start && member.end,
      ) ?? [],
    [graph],
  )

  if (!(showConstruction && graph && framingMembers.length > 0)) {
    return null
  }

  return (
    <group name="construction-overlay">
      {framingMembers.map((member) => {
        const levelState = member.levelId ? levelOffsets.get(member.levelId) : undefined
        if (!(levelState?.visible ?? true)) {
          return null
        }

        const start = member.start
        const end = member.end
        if (!(start && end)) {
          return null
        }

        return (
          <group key={member.id} position-y={levelState?.y ?? 0}>
            <Line
              color={memberStyles[member.type]?.color ?? '#f8fafc'}
              lineWidth={memberStyles[member.type]?.lineWidth ?? 1.5}
              points={[start, end]}
              transparent
            />
          </group>
        )
      })}
    </group>
  )
}
