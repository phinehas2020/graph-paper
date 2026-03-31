import { ProjectEditorShell } from '@/components/project-editor-shell'

export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  return <ProjectEditorShell projectId={projectId} />
}
