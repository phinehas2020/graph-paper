'use client'

import { Editor, type SaveStatus, type SceneGraph } from '@pascal-app/editor'
import { useViewer } from '@pascal-app/viewer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { createBlankSceneGraph, isSceneGraph, type ProjectRecord } from '@/lib/projects'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  idle: 'Ready',
  pending: 'Waiting to save...',
  saving: 'Saving...',
  saved: 'All changes saved',
  paused: 'Autosave paused',
  error: 'Save failed',
}

function EditorLoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-6 text-white">
      <div className="max-w-md rounded-[1.75rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
        <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Pascal Editor</p>
        <p className="mt-4 font-medium text-lg">{message}</p>
      </div>
    </div>
  )
}

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

export function ProjectEditorShell({ projectId }: { projectId: string }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const router = useRouter()

  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [renamePending, startRenameTransition] = useTransition()

  useEffect(() => {
    useViewer.getState().setProjectId(projectId)
    return () => {
      useViewer.getState().setProjectId(null)
    }
  }, [projectId])

  useEffect(() => {
    let isMounted = true

    async function loadProject() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        router.replace('/')
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select(
          'id, owner_id, name, description, scene_data, thumbnail_url, created_at, updated_at, last_opened_at',
        )
        .eq('id', projectId)
        .single()

      if (!isMounted) {
        return
      }

      if (error || !data) {
        setLoadState('missing')
        return
      }

      const nextProject = data as ProjectRecord
      setProject(nextProject)
      setLoadState('ready')

      void supabase
        .from('projects')
        .update({ last_opened_at: new Date().toISOString() })
        .eq('id', projectId)
    }

    loadProject()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
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
    if (project?.scene_data && isSceneGraph(project.scene_data)) {
      return project.scene_data
    }

    return createBlankSceneGraph()
  }, [project])

  const handleSaveScene = useCallback(
    async (scene: SceneGraph) => {
      const timestamp = new Date().toISOString()
      const { error } = await supabase
        .from('projects')
        .update({
          scene_data: scene,
          updated_at: timestamp,
        })
        .eq('id', projectId)

      if (error) {
        throw error
      }

      setProject((current) =>
        current
          ? {
              ...current,
              scene_data: scene,
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
      if (!project) {
        return
      }

      if (!trimmedName || trimmedName === project.name) {
        return
      }

      startRenameTransition(() => {
        void (async () => {
          const timestamp = new Date().toISOString()
          const { error } = await supabase
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

  if (loadState === 'loading') {
    return <EditorLoadingState message="Loading project..." />
  }

  if (loadState === 'missing' || !project) {
    return <EditorLoadingState message="This project could not be loaded." />
  }

  return (
    <div className="h-screen w-screen">
      <Editor
        isLoading={false}
        onLoad={handleLoadScene}
        onSave={handleSaveScene}
        onSaveStatusChange={setSaveStatus}
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
