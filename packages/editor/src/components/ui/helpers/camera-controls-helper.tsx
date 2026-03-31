'use client'

import { useViewer } from '@pascal-app/viewer'
import { MousePointer2, MoveHorizontal, Search, X } from 'lucide-react'
import useEditor from '../../../store/use-editor'

const hiddenHelperTools = new Set([
  'wall',
  'wall-guide',
  'measure',
  'item',
  'slab',
  'ceiling',
  'roof',
  'zone',
])

const hintCardClassName =
  'pointer-events-auto flex min-w-[260px] items-center gap-4 rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md'

export function CameraControlsHelper() {
  const showCameraControlsHelper = useViewer((state) => state.showCameraControlsHelper)
  const setShowCameraControlsHelper = useViewer((state) => state.setShowCameraControlsHelper)
  const cameraInteractionMode = useViewer((state) => state.cameraInteractionMode)
  const is2DMode = useViewer((state) => state.is2DMode)
  const mode = useEditor((state) => state.mode)
  const tool = useEditor((state) => state.tool)
  const movingNode = useEditor((state) => state.movingNode)

  if (!showCameraControlsHelper || movingNode) return null
  if (mode === 'build' && tool && hiddenHelperTools.has(tool)) return null

  const panHint = cameraInteractionMode === 'pan' ? 'Left drag' : 'Space + drag'

  return (
    <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 text-foreground">
      <div className={hintCardClassName}>
        {is2DMode && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-1 font-medium text-[10px] text-emerald-400 uppercase tracking-[0.18em]">
            2D
          </span>
        )}

        <CameraHint icon={MoveHorizontal} label="Pan" shortcut={panHint} />
        <CameraHint icon={MousePointer2} label="Rotate" shortcut="Right drag" />
        <CameraHint icon={Search} label="Zoom" shortcut="Scroll / pinch" />

        <button
          aria-label="Hide camera controls help"
          className="ml-1 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={() => setShowCameraControlsHelper(false)}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function CameraHint({
  icon: Icon,
  label,
  shortcut,
}: {
  icon: typeof MoveHorizontal
  label: string
  shortcut: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-accent/40 text-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="font-medium text-xs text-foreground">{label}</div>
        <div className="text-[11px] text-muted-foreground whitespace-nowrap">{shortcut}</div>
      </div>
    </div>
  )
}
