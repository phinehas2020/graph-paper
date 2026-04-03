import { notFound } from 'next/navigation'
import { LocalEditorShell } from '@/components/local-editor-shell'

export default function OfflineEditorPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  return <LocalEditorShell />
}
