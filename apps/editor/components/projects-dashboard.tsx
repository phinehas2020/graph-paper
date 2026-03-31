'use client'

import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useMemo, useState } from 'react'
import {
  createBlankSceneGraph,
  formatProjectTimestamp,
  makeDefaultProjectName,
  type ProjectRecord,
} from '@/lib/projects'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type DashboardState =
  | {
      status: 'loading'
      user: null
    }
  | {
      status: 'signed-out'
      user: null
    }
  | {
      status: 'signed-in'
      user: User
    }

function AuthCard({
  busy,
  email,
  errorMessage,
  infoMessage,
  onEmailChange,
  onSubmit,
}: {
  busy: boolean
  email: string
  errorMessage: string | null
  infoMessage: string | null
  onEmailChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white/90 p-8 shadow-[0_30px_100px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-slate-500/30 to-transparent" />
      <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Cloud Save</p>
      <h1 className="mt-4 max-w-lg font-semibold text-4xl tracking-tight text-slate-950">
        Sign in to save Pascal projects and keep as many versions as you need.
      </h1>
      <p className="mt-4 max-w-xl text-base text-slate-600">
        Magic-link sign-in is wired through Supabase. Once you are in, new projects get their own
        cloud record and autosave directly from the editor.
      </p>

      <form className="mt-8 flex flex-col gap-4 sm:flex-row" onSubmit={onSubmit}>
        <label className="flex-1">
          <span className="sr-only">Email address</span>
          <input
            autoComplete="email"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-400"
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="you@company.com"
            type="email"
            value={email}
          />
        </label>
        <button
          className="rounded-2xl bg-slate-950 px-5 py-3 font-medium text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={busy || !email.trim()}
          type="submit"
        >
          {busy ? 'Sending link...' : 'Send magic link'}
        </button>
      </form>

      {infoMessage ? <p className="mt-4 text-sm text-emerald-700">{infoMessage}</p> : null}
      {errorMessage ? <p className="mt-4 text-sm text-rose-700">{errorMessage}</p> : null}
    </div>
  )
}

export function ProjectsDashboard() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const router = useRouter()

  const [dashboardState, setDashboardState] = useState<DashboardState>({
    status: 'loading',
    user: null,
  })
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [email, setEmail] = useState('')
  const [busyAction, setBusyAction] = useState<'login' | 'create' | `delete:${string}` | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function syncSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (error) {
        setDashboardState({ status: 'signed-out', user: null })
        setErrorMessage(error.message)
        return
      }

      if (session?.user) {
        setDashboardState({ status: 'signed-in', user: session.user })
        return
      }

      setDashboardState({ status: 'signed-out', user: null })
    }

    syncSession()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return
      }

      if (session?.user) {
        setDashboardState({ status: 'signed-in', user: session.user })
        setInfoMessage(null)
        setErrorMessage(null)
      } else {
        setDashboardState({ status: 'signed-out', user: null })
        setProjects([])
      }
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (dashboardState.status !== 'signed-in') {
      return
    }

    let isMounted = true

    async function loadProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select(
          'id, owner_id, name, description, scene_data, thumbnail_url, created_at, updated_at, last_opened_at',
        )
        .order('updated_at', { ascending: false })

      if (!isMounted) {
        return
      }

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setProjects((data ?? []) as ProjectRecord[])
    }

    loadProjects()

    return () => {
      isMounted = false
    }
  }, [dashboardState, supabase])

  async function handleMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyAction('login')
    setInfoMessage(null)
    setErrorMessage(null)

    const redirectTo = typeof window === 'undefined' ? undefined : `${window.location.origin}/`
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    if (error) {
      setErrorMessage(error.message)
    } else {
      setInfoMessage('Magic link sent. Open the email on this device to finish signing in.')
    }

    setBusyAction(null)
  }

  async function handleCreateProject() {
    if (dashboardState.status !== 'signed-in') {
      return
    }

    setBusyAction('create')
    setErrorMessage(null)

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: makeDefaultProjectName(),
        owner_id: dashboardState.user.id,
        scene_data: createBlankSceneGraph(),
      })
      .select('id')
      .single()

    setBusyAction(null)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    startTransition(() => {
      router.push(`/editor/${data.id}`)
    })
  }

  async function handleDeleteProject(projectId: string) {
    const shouldDelete = window.confirm('Delete this project? This cannot be undone.')
    if (!shouldDelete) {
      return
    }

    setBusyAction(`delete:${projectId}`)
    setErrorMessage(null)

    const { error } = await supabase.from('projects').delete().eq('id', projectId)

    setBusyAction(null)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setProjects((current) => current.filter((project) => project.id !== projectId))
  }

  async function handleSignOut() {
    setErrorMessage(null)
    await supabase.auth.signOut()
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />

        <div className="relative flex flex-1 flex-col gap-8">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">graph paper editor</p>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Supabase-backed auth and project persistence for the current editor structure.
              </p>
            </div>

            {dashboardState.status === 'signed-in' ? (
              <div className="flex items-center gap-3 self-start rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm shadow-sm backdrop-blur">
                <span className="max-w-[16rem] truncate text-slate-600">
                  {dashboardState.user.email ?? 'Signed in'}
                </span>
                <button
                  className="rounded-full bg-slate-950 px-3 py-1.5 font-medium text-white transition hover:bg-slate-800"
                  onClick={handleSignOut}
                  type="button"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </header>

          {dashboardState.status !== 'signed-in' ? (
            <AuthCard
              busy={busyAction === 'login'}
              email={email}
              errorMessage={errorMessage}
              infoMessage={infoMessage}
              onEmailChange={setEmail}
              onSubmit={handleMagicLink}
            />
          ) : (
            <section className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(22rem,0.45fr)]">
              <div className="rounded-[2rem] border border-black/10 bg-white/88 p-6 shadow-[0_24px_90px_-45px_rgba(15,23,42,0.45)] backdrop-blur">
                <div className="flex flex-col gap-4 border-black/8 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Projects</p>
                    <h2 className="mt-3 font-semibold text-3xl tracking-tight text-slate-950">
                      Your saved work
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Open any project, keep editing, and the editor will autosave into Supabase.
                    </p>
                  </div>

                  <button
                    className="rounded-2xl bg-slate-950 px-4 py-3 font-medium text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    disabled={busyAction === 'create'}
                    onClick={handleCreateProject}
                    type="button"
                  >
                    {busyAction === 'create' ? 'Creating...' : 'New project'}
                  </button>
                </div>

                {errorMessage ? <p className="mt-4 text-sm text-rose-700">{errorMessage}</p> : null}

                <div className="mt-6 grid gap-4">
                  {projects.length > 0 ? (
                    projects.map((project) => (
                      <article
                        className="group rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-5 transition hover:border-slate-300 hover:bg-white"
                        key={project.id}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg text-slate-950">{project.name}</h3>
                            <p className="text-sm text-slate-500">
                              Updated {formatProjectTimestamp(project.updated_at)}
                            </p>
                            <p className="text-sm text-slate-500">
                              Created {formatProjectTimestamp(project.created_at)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              className="rounded-full bg-slate-950 px-3 py-2 font-medium text-sm text-white transition hover:bg-slate-800"
                              href={`/editor/${project.id}`}
                            >
                              Open
                            </Link>
                            <button
                              className="rounded-full border border-slate-200 px-3 py-2 font-medium text-sm text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={busyAction === `delete:${project.id}`}
                              onClick={() => handleDeleteProject(project.id)}
                              type="button"
                            >
                              {busyAction === `delete:${project.id}` ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
                      <p className="font-medium text-slate-800">No cloud projects yet.</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Create your first project and it will open straight into the editor.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <aside className="rounded-[2rem] border border-black/10 bg-slate-950 p-6 text-white shadow-[0_24px_90px_-45px_rgba(15,23,42,0.65)]">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">What changed</p>
                <div className="mt-4 space-y-4 text-sm text-slate-300">
                  <p>
                    Signed-in users now get one project row per design instead of a single local
                    draft.
                  </p>
                  <p>
                    The editor’s existing autosave hook writes scene data straight into Supabase.
                  </p>
                  <p>
                    The database is rebuilt around owner-scoped projects with row-level security.
                  </p>
                </div>
              </aside>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
