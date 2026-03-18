'use client'

import { emitter } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import Image from 'next/image'
import { ActionButton } from './action-button'

export function CameraActions() {
  const cameraInteractionMode = useViewer((state) => state.cameraInteractionMode)
  const setCameraInteractionMode = useViewer((state) => state.setCameraInteractionMode)

  const goToTopView = () => {
    emitter.emit('camera-controls:top-view')
  }

  const orbitCW = () => {
    emitter.emit('camera-controls:orbit-cw')
  }

  const orbitCCW = () => {
    emitter.emit('camera-controls:orbit-ccw')
  }

  const togglePanMode = () => {
    setCameraInteractionMode(cameraInteractionMode === 'pan' ? 'orbit' : 'pan')
  }

  return (
    <div className="flex items-center gap-1">
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
