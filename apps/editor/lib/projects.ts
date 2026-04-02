import type { ConstructionGraph } from '@pascal-app/construction'
import {
  createDefaultSceneGraph as createDefaultCoreSceneGraph,
  isSceneGraph as isPersistedSceneGraph,
  type SceneGraph,
} from '@pascal-app/core'

export type ProjectRecord = {
  id: string
  owner_id: string
  name: string
  description: string | null
  scene_data: SceneGraph | null
  rule_pack: string | null
  compiler_version: string | null
  construction_snapshot: ConstructionGraph | null
  estimate_snapshot: ConstructionGraph['estimate'] | null
  thumbnail_url: string | null
  created_at: string
  updated_at: string
  last_opened_at: string | null
}

export function createBlankSceneGraph(): SceneGraph {
  return createDefaultCoreSceneGraph()
}

export function isSceneGraph(value: unknown): value is SceneGraph {
  return isPersistedSceneGraph(value)
}

export function makeDefaultProjectName() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return `Project ${formatter.format(new Date())}`
}

export function formatProjectTimestamp(value: string | null | undefined) {
  if (!value) {
    return 'Never'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
