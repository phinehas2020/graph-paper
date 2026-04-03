'use client'

import {
  createSceneGraphSnapshot,
  migrateSceneGraph,
  type SceneGraph,
} from '@pascal-app/core/scene-graph'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { createBlankSceneGraph, isSceneGraph } from '@/lib/projects'

const OFFLINE_SCENE_STORAGE_KEY = 'graph-paper-offline-scene'
const RESET_STORAGE_KEYS = [
  OFFLINE_SCENE_STORAGE_KEY,
  'pascal-editor-scene',
  'pascal-editor-selection',
  'pascal-editor-ui-preferences',
]

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'paused' | 'error'

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  idle: 'Ready',
  pending: 'Waiting to save...',
  saving: 'Saving...',
  saved: 'Saved locally',
  paused: 'Autosave paused',
  error: 'Save failed',
}

function EditorLoadingState({ message, detail }: { message: string; detail?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-6 text-white">
      <div className="max-w-md rounded-[1.75rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
        <p className="text-xs uppercase tracking-[0.32em] text-slate-400">graph paper editor</p>
        <p className="mt-4 font-medium text-lg">{message}</p>
        {detail ? <p className="mt-3 text-sm text-slate-300">{detail}</p> : null}
        <div className="mt-6">
          <Link
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-slate-300 transition hover:bg-white/10"
            href="/"
          >
            Back to projects
          </Link>
        </div>
      </div>
    </div>
  )
}

const PascalEditor = dynamic(
  () => import('@pascal-app/editor').then((module) => module.Editor),
  {
    ssr: false,
    loading: () => <EditorLoadingState message="Loading local editor..." />,
  },
)

function normalizeSceneGraph(sceneGraph: SceneGraph | null | undefined): SceneGraph {
  if (!(sceneGraph && isSceneGraph(sceneGraph))) {
    return createBlankSceneGraph()
  }

  try {
    const migratedScene = migrateSceneGraph(sceneGraph)
    return createSceneGraphSnapshot(
      migratedScene.nodes,
      migratedScene.rootNodeIds,
      migratedScene.sceneSchemaVersion,
    )
  } catch {
    return createBlankSceneGraph()
  }
}

function readOfflineScene(): SceneGraph {
  if (typeof window === 'undefined') {
    return createBlankSceneGraph()
  }

  try {
    const raw = window.localStorage.getItem(OFFLINE_SCENE_STORAGE_KEY)
    if (!raw) {
      return createBlankSceneGraph()
    }

    return normalizeSceneGraph(JSON.parse(raw) as SceneGraph)
  } catch {
    return createBlankSceneGraph()
  }
}

function clearOfflineSession() {
  if (typeof window === 'undefined') {
    return
  }

  for (const key of RESET_STORAGE_KEYS) {
    window.localStorage.removeItem(key)
  }

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index)
    if (key?.startsWith('pascal-editor-selection:')) {
      window.localStorage.removeItem(key)
    }
  }
}

function LocalSidebarHeader({
  saveStatus,
  onReset,
}: {
  saveStatus: SaveStatus
  onReset: () => void
}) {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Local QA Harness</p>
          <p className="mt-1 text-sm text-slate-200">
            Offline editor route for feature testing without Supabase auth.
          </p>
        </div>
        <button
          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-slate-300 transition hover:bg-white/10"
          onClick={onReset}
          type="button"
        >
          Reset scene
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Link
          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-slate-300 transition hover:bg-white/10"
          href="/"
        >
          Projects
        </Link>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
          {SAVE_STATUS_LABELS[saveStatus]}
        </p>
      </div>
    </div>
  )
}

export function LocalEditorShell() {
  const [editorKey, setEditorKey] = useState(0)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const handleLoadScene = useCallback(async () => readOfflineScene(), [])

  const handleSaveScene = useCallback(async (scene: SceneGraph) => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      OFFLINE_SCENE_STORAGE_KEY,
      JSON.stringify({
        sceneSchemaVersion: scene.sceneSchemaVersion,
        ...scene,
      }),
    )
  }, [])

  const handleReset = useCallback(() => {
    clearOfflineSession()
    setEditorKey((current) => current + 1)
    setSaveStatus('idle')
  }, [])

  return (
    <div className="h-screen w-screen">
      <PascalEditor
        isLoading={false}
        key={`offline-editor-${editorKey}`}
        onLoad={handleLoadScene}
        onSave={handleSaveScene}
        onSaveStatusChange={setSaveStatus}
        sidebarTop={<LocalSidebarHeader onReset={handleReset} saveStatus={saveStatus} />}
      />
    </div>
  )
}
