'use client';

import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CameraPreset = 'top' | 'front' | 'right' | 'isometric';

interface CameraPresetConfig {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

interface EnhancedCameraControlsProps {
  /** Which preset to animate to (change triggers animation) */
  preset?: CameraPreset | null;
  /** When changed to true, zoom to fit all geometry */
  zoomToFit?: boolean;
  /** Center point of specific selected element to zoom to */
  zoomToSelection?: THREE.Vector3 | null;
  /** Minimum zoom distance */
  minDistance?: number;
  /** Maximum zoom distance */
  maxDistance?: number;
  /** Animation duration in ms */
  transitionDuration?: number;
  /** Callback when a transition animation completes */
  onTransitionComplete?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Preset configurations                                              */
/* ------------------------------------------------------------------ */

const PRESETS: Record<CameraPreset, CameraPresetConfig> = {
  top: {
    position: new THREE.Vector3(0, 25, 0.01),
    target: new THREE.Vector3(0, 0, 0),
  },
  front: {
    position: new THREE.Vector3(0, 5, 20),
    target: new THREE.Vector3(0, 2, 0),
  },
  right: {
    position: new THREE.Vector3(20, 5, 0),
    target: new THREE.Vector3(0, 2, 0),
  },
  isometric: {
    position: new THREE.Vector3(12, 10, 12),
    target: new THREE.Vector3(0, 0, 0),
  },
};

/* ------------------------------------------------------------------ */
/*  Animation state                                                    */
/* ------------------------------------------------------------------ */

interface AnimationState {
  active: boolean;
  startTime: number;
  duration: number;
  fromPosition: THREE.Vector3;
  toPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function EnhancedCameraControls({
  preset = null,
  zoomToFit = false,
  zoomToSelection = null,
  minDistance = 3,
  maxDistance = 36,
  transitionDuration = 500,
  onTransitionComplete,
}: EnhancedCameraControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const animRef = useRef<AnimationState>({
    active: false,
    startTime: 0,
    duration: 0,
    fromPosition: new THREE.Vector3(),
    toPosition: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
  });

  const { camera, scene, gl } = useThree();

  // Start an animation toward a target position/lookAt
  const animateTo = useCallback(
    (position: THREE.Vector3, target: THREE.Vector3) => {
      const anim = animRef.current;
      anim.active = true;
      anim.startTime = performance.now();
      anim.duration = transitionDuration;
      anim.fromPosition.copy(camera.position);
      anim.toPosition.copy(position);

      if (controlsRef.current) {
        anim.fromTarget.copy(controlsRef.current.target);
      } else {
        anim.fromTarget.set(0, 0, 0);
      }
      anim.toTarget.copy(target);
    },
    [camera, transitionDuration],
  );

  // Handle preset changes
  const prevPresetRef = useRef<CameraPreset | null>(null);
  useEffect(() => {
    if (preset && preset !== prevPresetRef.current) {
      const config = PRESETS[preset];
      animateTo(config.position, config.target);
    }
    prevPresetRef.current = preset;
  }, [preset, animateTo]);

  // Handle zoom to fit
  const prevZoomToFitRef = useRef(false);
  useEffect(() => {
    if (zoomToFit && !prevZoomToFitRef.current) {
      // Compute bounding box of the scene
      const box = new THREE.Box3();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          box.expandByObject(obj);
        }
      });

      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 1.5;

        const offset = new THREE.Vector3(1, 0.8, 1).normalize().multiplyScalar(distance);
        animateTo(center.clone().add(offset), center);
      }
    }
    prevZoomToFitRef.current = zoomToFit;
  }, [zoomToFit, scene, animateTo]);

  // Handle zoom to selection
  useEffect(() => {
    if (zoomToSelection) {
      const direction = camera.position.clone().sub(zoomToSelection).normalize();
      const distance = 8;
      const newPosition = zoomToSelection.clone().add(direction.multiplyScalar(distance));
      animateTo(newPosition, zoomToSelection);
    }
  }, [zoomToSelection, camera, animateTo]);

  // Animation frame loop
  useFrame(() => {
    const anim = animRef.current;
    if (!anim.active) return;

    const elapsed = performance.now() - anim.startTime;
    const progress = Math.min(elapsed / anim.duration, 1);
    const eased = easeInOutCubic(progress);

    // Interpolate position
    camera.position.lerpVectors(anim.fromPosition, anim.toPosition, eased);

    // Interpolate orbit target
    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(anim.fromTarget, anim.toTarget, eased);
      controlsRef.current.update();
    }

    if (progress >= 1) {
      anim.active = false;
      onTransitionComplete?.();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI / 2.08}
      enablePan
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.PAN,
      }}
    />
  );
}

export default EnhancedCameraControls;
