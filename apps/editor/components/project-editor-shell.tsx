'use client'

import { compileConstructionGraph } from '@pascal-app/construction'
import {
  createSceneGraphSnapshot,
  migrateSceneGraph,
  type SceneGraph,
} from '@pascal-app/core/scene-graph'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { createBlankSceneGraph, isSceneGraph, type ProjectRecord } from '@/lib/projects'
import { getSupabaseBrowserClient, hasSupabaseBrowserConfig } from '@/lib/supabase/client'

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'paused' | 'error'

const PROJECT_SELECT_BASE =
  'id, owner_id, name, description, scene_data, thumbnail_url, created_at, updated_at, last_opened_at'

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  idle: 'Ready',
  pending: 'Waiting to save...',
  saving: 'Saving...',
  saved: 'All changes saved',
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

function withLegacyProjectFields<T extends { scene_data?: SceneGraph | null }>(
  project: T,
): T &
  Pick<ProjectRecord, 'rule_pack' | 'compiler_version' | 'construction_snapshot' | 'estimate_snapshot'> {
  return {
    ...project,
    rule_pack: null,
    compiler_version: null,
    construction_snapshot: null,
    estimate_snapshot: null,
  }
}

function normalizeProjectSceneGraph(sceneGraph: SceneGraph | null | undefined): SceneGraph {
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

const PascalEditor = dynamic(
  () => import('@pascal-app/editor').then((module) => module.Editor),
  {
    ssr: false,
    loading: () => <EditorLoadingState message="Loading editor..." />,
  },
)

function ProjectSidebarHeader({
  name,
  renameDisabled,
  saveStatus,
  onRename,
}: {
  name: string
  renameDisabled: boolean
  saveStatus: SaveStatus
  onRename: (nextName: string) => void
}) {
  const [draftName, setDraftName] = useState(name)

  useEffect(() => {
    setDraftName(name)
  }, [name])

  return (
    <div className="w-full space-y-3">
      <Link
        className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-slate-300 transition hover:bg-white/10"
        href="/"
      >
        Projects
      </Link>

      <div className="space-y-2">
        <input
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-medium text-base text-white outline-none transition focus:border-white/25"
          disabled={renameDisabled}
          onBlur={() => onRename(draftName)}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onRename(draftName)
            }
          }}
          value={draftName}
        />
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
          {SAVE_STATUS_LABELS[saveStatus]}
        </p>
      </div>
    </div>
  )
}

type LoadState = 'loading' | 'ready' | 'missing' | 'unconfigured'

export function ProjectEditorShell({ projectId }: { projectId: string }) {
  const supabase = useMemo(
    () => (hasSupabaseBrowserConfig() ? getSupabaseBrowserClient() : null),
    [],
  )
  const router = useRouter()
  const latestSceneGraphRef = useRef<SceneGraph | null>(null)

  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [loadState, setLoadState] = useState<LoadState>(supabase ? 'loading' : 'unconfigured')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [renamePending, startRenameTransition] = useTransition()

  useEffect(() => {
    if (!supabase) {
      setLoadState('unconfigured')
      return
    }
    const client = supabase

    let isMounted = true
    latestSceneGraphRef.current = null
    setLoadState('loading')

    async function loadProject() {
      const {
        data: { session },
      } = await client.auth.getSession()

      if (!session?.user) {
        router.replace('/')
        return
      }

      const { data, error } = await client
        .from('projects')
        .select(PROJECT_SELECT_BASE)
        .eq('id', projectId)
        .single()

      if (!isMounted) {
        return
      }

      if (error || !data) {
        setLoadState('missing')
        return
      }

      const nextProject = withLegacyProjectFields(data as ProjectRecord)
      const normalizedSceneGraph = normalizeProjectSceneGraph(nextProject.scene_data)
      latestSceneGraphRef.current = normalizedSceneGraph
      setProject({
        ...nextProject,
        scene_data: normalizedSceneGraph,
      })
      setLoadState('ready')

      void client
        .from('projects')
        .update({ last_opened_at: new Date().toISOString() })
        .eq('id', projectId)
    }

    loadProject()

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace('/')
      }
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [projectId, router, supabase])

  const handleLoadScene = useCallback(async () => {
    return latestSceneGraphRef.current ?? createBlankSceneGraph()
  }, [])

  const handleSaveScene = useCallback(
    async (scene: SceneGraph) => {
      if (!supabase) {
        throw new Error('Supabase is not configured.')
      }
      const client = supabase

      const timestamp = new Date().toISOString()
      let constructionSnapshot: ReturnType<typeof compileConstructionGraph> | null = null

      try {
        constructionSnapshot = compileConstructionGraph(scene)
      } catch {
        constructionSnapshot = null
      }

      const { error } = await client
        .from('projects')
        .update({
          scene_data: scene,
          updated_at: timestamp,
        })
        .eq('id', projectId)

      if (error) {
        throw error
      }

      latestSceneGraphRef.current = scene
      setProject((current) =>
        current
          ? {
              ...current,
              compiler_version: constructionSnapshot?.compilerVersion ?? null,
              construction_snapshot: constructionSnapshot,
              estimate_snapshot: constructionSnapshot?.estimate ?? null,
              scene_data: scene,
              rule_pack: constructionSnapshot?.rulePackId ?? null,
              updated_at: timestamp,
            }
          : current,
      )
    },
    [projectId, supabase],
  )

  const handleRename = useCallback(
    (nextName: string) => {
      const trimmedName = nextName.trim()
      if (!(project && supabase)) {
        return
      }
      const client = supabase

      if (!trimmedName || trimmedName === project.name) {
        return
      }

      startRenameTransition(() => {
        void (async () => {
          const timestamp = new Date().toISOString()
          const { error } = await client
            .from('projects')
            .update({
              name: trimmedName,
              updated_at: timestamp,
            })
            .eq('id', projectId)

          if (error) {
            return
          }

          setProject((current) =>
            current
              ? {
                  ...current,
                  name: trimmedName,
                  updated_at: timestamp,
                }
              : current,
          )
        })()
      })
    },
    [project, projectId, supabase],
  )

  if (loadState === 'unconfigured') {
    return (
      <EditorLoadingState
        detail="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable cloud-backed project loading."
        message="Supabase is not configured for this editor."
      />
    )
  }

  if (loadState === 'loading') {
    return <EditorLoadingState message="Loading project..." />
  }

  if (loadState === 'missing' || !project) {
    return <EditorLoadingState message="This project could not be loaded." />
  }

  return (
    <div className="h-screen w-screen">
      <PascalEditor
        isLoading={false}
        key={projectId}
        onLoad={handleLoadScene}
        onSave={handleSaveScene}
        onSaveStatusChange={setSaveStatus}
        projectId={projectId}
        sidebarTop={
          <ProjectSidebarHeader
            name={project.name}
            onRename={handleRename}
            renameDisabled={renamePending}
            saveStatus={saveStatus}
          />
        }
      />
    </div>
  )
}
