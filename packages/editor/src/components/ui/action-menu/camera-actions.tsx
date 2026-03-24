'use client'

import { emitter } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import Image from 'next/image'
import { cn } from '../../../lib/utils'
import { ActionButton } from './action-button'

export function CameraActions() {
  const cameraMode = useViewer((state) => state.cameraMode)
  const cameraInteractionMode = useViewer((state) => state.cameraInteractionMode)
  const is2DMode = useViewer((state) => state.is2DMode)
  const setCameraInteractionMode = useViewer((state) => state.setCameraInteractionMode)
  const setCameraMode = useViewer((state) => state.setCameraMode)
  const setIs2DMode = useViewer((state) => state.setIs2DMode)
  const setShowCameraControlsHelper = useViewer((state) => state.setShowCameraControlsHelper)

  const goToTopView = () => {
    setShowCameraControlsHelper(true)
    emitter.emit('camera-controls:top-view')
  }

  const orbitCW = () => {
    setShowCameraControlsHelper(true)
    emitter.emit('camera-controls:orbit-cw')
  }

  const orbitCCW = () => {
    setShowCameraControlsHelper(true)
    emitter.emit('camera-controls:orbit-ccw')
  }

  const togglePanMode = () => {
    setCameraInteractionMode(cameraInteractionMode === 'pan' ? 'orbit' : 'pan')
    setShowCameraControlsHelper(true)
  }

  const toggle2DMode = () => {
    const nextMode = !is2DMode

    setIs2DMode(nextMode)
    setCameraMode(nextMode ? 'orthographic' : 'perspective')

    if (nextMode && cameraInteractionMode === 'pan') {
      setCameraInteractionMode('orbit')
    }

    setShowCameraControlsHelper(true)
  }

  return (
    <div className="flex items-center gap-1">
      <ActionButton
        className={cn(
          'group overflow-visible',
          is2DMode
            ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20'
            : 'hover:bg-white/5 hover:text-emerald-400',
        )}
        label={is2DMode ? 'Exit 2D Drawing' : 'Enter 2D Drawing'}
        onClick={toggle2DMode}
        size="icon"
        tooltipContent={
          <div className="space-y-1">
            <p>{is2DMode ? 'Return to the 3D drafting camera' : 'Jump into orthographic top-down drawing'}</p>
            <p className="text-muted-foreground text-xs">
              {cameraMode === 'orthographic'
                ? 'Keeps the current orthographic camera and snaps to plan view.'
                : 'Switches to orthographic plan view for cleaner 2D drafting.'}
            </p>
          </div>
        }
        variant="ghost"
      >
        <div className="relative flex flex-col items-center justify-center leading-none">
          {!is2DMode && (
            <span className="-top-3.5 absolute rounded-full bg-emerald-500 px-1.5 py-0.5 font-semibold text-[8px] text-black uppercase tracking-[0.18em]">
              New
            </span>
          )}
          <span className="font-semibold text-[11px]">2D</span>
          <span className="text-[9px] text-muted-foreground uppercase tracking-[0.16em]">Draw</span>
        </div>
      </ActionButton>

      <ActionButton
        className={
          cameraInteractionMode === 'pan'
            ? 'group bg-white/10 hover:bg-white/10'
            : 'group hover:bg-white/5'
        }
        label={cameraInteractionMode === 'pan' ? 'Exit Pan Mode' : 'Pan Mode'}
        onClick={togglePanMode}
        shortcut="H"
        size="icon"
        tooltipContent={
          <p>{cameraInteractionMode === 'pan' ? 'Exit pan mode' : 'Pan camera with left drag'}</p>
        }
        variant="ghost"
      >
        <Image
          alt="Pan Mode"
          className="h-[28px] w-[28px] object-contain opacity-70 transition-opacity group-hover:opacity-100"
          height={28}
          src="/icons/pan.png"
          width={28}
        />
      </ActionButton>

      {/* Orbit CCW */}
      <ActionButton
        className="group hover:bg-white/5"
        label="Orbit Left"
        onClick={orbitCCW}
        size="icon"
        variant="ghost"
      >
        <Image
          alt="Orbit Left"
          className="h-[28px] w-[28px] -scale-x-100 object-contain opacity-70 transition-opacity group-hover:opacity-100"
          height={28}
          src="/icons/rotate.png"
          width={28}
        />
      </ActionButton>

      {/* Orbit CW */}
      <ActionButton
        className="group hover:bg-white/5"
        label="Orbit Right"
        onClick={orbitCW}
        size="icon"
        variant="ghost"
      >
        <Image
          alt="Orbit Right"
          className="h-[28px] w-[28px] object-contain opacity-70 transition-opacity group-hover:opacity-100"
          height={28}
          src="/icons/rotate.png"
          width={28}
        />
      </ActionButton>

      {/* Top View */}
      <ActionButton
        className="group hover:bg-white/5"
        label="Top View"
        onClick={goToTopView}
        size="icon"
        variant="ghost"
      >
        <Image
          alt="Top View"
          className="h-[28px] w-[28px] object-contain opacity-70 transition-opacity group-hover:opacity-100"
          height={28}
          src="/icons/topview.png"
          width={28}
        />
      </ActionButton>
    </div>
  )
}
