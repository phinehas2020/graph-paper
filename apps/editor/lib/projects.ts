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

function makeNodeId(prefix: 'site' | 'building' | 'level') {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
}

export function createBlankSceneGraph(): SceneGraph {
  const levelId = makeNodeId('level')
  const buildingId = makeNodeId('building')
  const siteId = makeNodeId('site')

  const level = {
    object: 'node',
    id: levelId,
    type: 'level',
    parentId: buildingId,
    visible: true,
    metadata: {},
    children: [],
    level: 0,
  }

  const building = {
    object: 'node',
    id: buildingId,
    type: 'building',
    parentId: siteId,
    visible: true,
    metadata: {},
    children: [levelId],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  }

  const site = {
    object: 'node',
    id: siteId,
    type: 'site',
    parentId: null,
    visible: true,
    metadata: {},
    polygon: {
      type: 'polygon',
      points: [
        [-15, -15],
        [15, -15],
        [15, 15],
        [-15, 15],
      ],
    },
    children: [building],
  }

  return {
    nodes: {
      [siteId]: site,
      [buildingId]: building,
      [levelId]: level,
    },
    rootNodeIds: [siteId],
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
