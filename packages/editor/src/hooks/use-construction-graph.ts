'use client'

import { compileConstructionGraph } from '@pascal-app/construction'
import { useScene } from '@pascal-app/core'
import { createSceneGraphSnapshot } from '@pascal-app/core/scene-graph'
import { useEffect, useRef, useState } from 'react'
import useEditor from '../store/use-editor'

type ConstructionGraph = ReturnType<typeof compileConstructionGraph>

type GraphCacheEntry = {
  nodes: ReturnType<typeof useScene.getState>['nodes']
  rootNodeIds: ReturnType<typeof useScene.getState>['rootNodeIds']
  sceneSchemaVersion: number
  regenerationMode: 'live' | 'manual'
  refreshVersion: number
  graph: ConstructionGraph | null
}

let graphCache: GraphCacheEntry | null = null

function readConstructionGraph(
  nodes: ReturnType<typeof useScene.getState>['nodes'],
  rootNodeIds: ReturnType<typeof useScene.getState>['rootNodeIds'],
  sceneSchemaVersion: number,
  regenerationMode: 'live' | 'manual',
  refreshVersion: number,
): ConstructionGraph | null {
  if (
    graphCache &&
    graphCache.nodes === nodes &&
    graphCache.rootNodeIds === rootNodeIds &&
    graphCache.sceneSchemaVersion === sceneSchemaVersion &&
    graphCache.regenerationMode === regenerationMode &&
    graphCache.refreshVersion === refreshVersion
  ) {
    return graphCache.graph
  }

  try {
    const graph = compileConstructionGraph(
      createSceneGraphSnapshot(nodes, rootNodeIds, sceneSchemaVersion),
    )
    graphCache = {
      nodes,
      rootNodeIds,
      sceneSchemaVersion,
      regenerationMode,
      refreshVersion,
      graph,
    }
    return graph
  } catch {
    graphCache = {
      nodes,
      rootNodeIds,
      sceneSchemaVersion,
      regenerationMode,
      refreshVersion,
      graph: null,
    }
    return null
  }
}

export function useConstructionGraph() {
  const nodes = useScene((state) => state.nodes)
  const rootNodeIds = useScene((state) => state.rootNodeIds)
  const sceneSchemaVersion = useScene((state) => state.sceneSchemaVersion)
  const regenerationMode = useEditor((state) => state.regenerationMode)
  const constructionRefreshVersion = useEditor((state) => state.constructionRefreshVersion)
  const [graph, setGraph] = useState<ConstructionGraph | null>(null)

  const latestSceneRef = useRef({
    nodes,
    rootNodeIds,
    sceneSchemaVersion,
  })

  useEffect(() => {
    latestSceneRef.current = {
      nodes,
      rootNodeIds,
      sceneSchemaVersion,
    }
  }, [nodes, rootNodeIds, sceneSchemaVersion])

  useEffect(() => {
    if (regenerationMode !== 'live') {
      return
    }

    setGraph(readConstructionGraph(nodes, rootNodeIds, sceneSchemaVersion, 'live', 0))
  }, [nodes, rootNodeIds, sceneSchemaVersion, regenerationMode])

  useEffect(() => {
    if (regenerationMode !== 'manual') {
      return
    }

    const latestScene = latestSceneRef.current
    setGraph(
      readConstructionGraph(
        latestScene.nodes,
        latestScene.rootNodeIds,
        latestScene.sceneSchemaVersion,
        'manual',
        constructionRefreshVersion,
      ),
    )
  }, [constructionRefreshVersion, regenerationMode])

  return graph
}
