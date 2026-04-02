'use client'

import { compileConstructionGraph } from '@pascal-app/construction'
import { createSceneGraphSnapshot, useScene } from '@pascal-app/core'
import { useMemo } from 'react'

export function useConstructionGraph() {
  const nodes = useScene((state) => state.nodes)
  const rootNodeIds = useScene((state) => state.rootNodeIds)
  const sceneSchemaVersion = useScene((state) => state.sceneSchemaVersion)

  return useMemo(() => {
    try {
      return compileConstructionGraph(
        createSceneGraphSnapshot(nodes, rootNodeIds, sceneSchemaVersion),
      )
    } catch {
      return null
    }
  }, [nodes, rootNodeIds, sceneSchemaVersion])
}
