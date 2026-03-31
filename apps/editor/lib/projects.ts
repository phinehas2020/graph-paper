import { BuildingNode, LevelNode, SiteNode } from '@pascal-app/core'
import type { SceneGraph } from '@pascal-app/editor'

export type ProjectRecord = {
  id: string
  owner_id: string
  name: string
  description: string | null
  scene_data: SceneGraph | null
  thumbnail_url: string | null
  created_at: string
  updated_at: string
  last_opened_at: string | null
}

export function createBlankSceneGraph(): SceneGraph {
  const level = LevelNode.parse({
    level: 0,
    children: [],
  })

  const building = BuildingNode.parse({
    children: [level.id],
  })

  const site = SiteNode.parse({
    children: [building],
  })

  return {
    nodes: {
      [site.id]: site,
      [building.id]: building,
      [level.id]: level,
    },
    rootNodeIds: [site.id],
  }
}

export function isSceneGraph(value: unknown): value is SceneGraph {
  if (!value || typeof value !== 'object') {
    return false
  }

  const scene = value as Partial<SceneGraph>
  return Boolean(scene.nodes && typeof scene.nodes === 'object' && Array.isArray(scene.rootNodeIds))
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
