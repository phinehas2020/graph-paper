'use client';

import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Bounds,
  ContactShadows,
  Environment,
  Grid,
  OrbitControls,
  OrthographicCamera,
} from '@react-three/drei';
import usePlannerSceneStore from '@/src/planner/stores/usePlannerSceneStore';
import usePlannerViewerStore from '@/src/planner/stores/usePlannerViewerStore';
import { getRequiredLevelHeight } from '@/src/planner/level-utils';
import { floorToMesh, roofToMesh, wallToMesh } from './meshes';
import type { CameraMode, LevelDisplayMode, WallViewMode } from '@/src/components/view-controls';

const PREVIEW_BACKGROUND = '#d4dee7';
const PREVIEW_GROUND = '#bccbd7';
const PREVIEW_GRID_CELL = '#92a6b8';
const PREVIEW_GRID_SECTION = '#7e95a8';
const PERSPECTIVE_CAMERA_POSITION: [number, number, number] = [9, 8, 9];
const ORTHOGRAPHIC_CAMERA_POSITION: [number, number, number] = [0, 20, 0.01];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface EnhancedViewerProps {
  cameraMode?: CameraMode;
  levelDisplayMode?: LevelDisplayMode;
  wallViewMode?: WallViewMode;
  gridVisible?: boolean;
  currentLevelIndex?: number;
  levelCount?: number;
  levelGap?: number;
  className?: string;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Wall clipping helper                                               */
/* ------------------------------------------------------------------ */

function WallClipPlane({ mode }: { mode: WallViewMode }) {
  const { scene } = useThree();

  useEffect(() => {
    if (mode === 'full') {
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material) {
          const mat = obj.material as THREE.Material;
          mat.clippingPlanes = [];
          mat.needsUpdate = true;
        }
      });
      return;
    }

    const cutHeight = mode === 'cutaway' ? 1.2 : 0.3;
    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), cutHeight);

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material) {
        const mat = obj.material as THREE.Material;
        mat.clippingPlanes = [plane];
        mat.clipShadows = true;
        mat.needsUpdate = true;
      }
    });

    return () => {
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material) {
          const mat = obj.material as THREE.Material;
          mat.clippingPlanes = [];
          mat.needsUpdate = true;
        }
      });
    };
  }, [mode, scene]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  Smooth camera target                                               */
/* ------------------------------------------------------------------ */

function SmoothCameraTarget() {
  const targetRef = useRef(new THREE.Vector3());
  const currentRef = useRef(new THREE.Vector3());

  useFrame((_state, delta) => {
    currentRef.current.lerp(targetRef.current, 1 - Math.pow(0.001, delta));
  });

  return null;
}

/* ------------------------------------------------------------------ */
/*  Geometry group with level display modes                            */
/* ------------------------------------------------------------------ */

function SceneGeometry({
  levelDisplayMode,
  currentLevelIndex,
  levelCount,
  levelGap,
}: {
  levelDisplayMode: LevelDisplayMode;
  currentLevelIndex: number;
  levelCount: number;
  levelGap: number;
}) {
  const wallNodes = usePlannerSceneStore((s) => s.wallNodes);
  const floorNodes = usePlannerSceneStore((s) => s.floorNodes);
  const roofs = usePlannerSceneStore((s) => s.roofs);
  const ceilings = usePlannerSceneStore((s) => s.ceilings);
  const levels = usePlannerSceneStore((s) => s.levels);
  const selectedElement = usePlannerViewerStore((s) => s.selectedElement);

  const walls = useMemo(() => wallNodes.map((n) => n.entity), [wallNodes]);
  const floors = useMemo(() => floorNodes.map((n) => n.entity), [floorNodes]);

  const floorMeshes = useMemo(
    () => floorNodes.map((n) => floorToMesh(n.entity)),
    [floorNodes],
  );

  const wallMeshes = useMemo(
    () => wallNodes.map((n) => wallToMesh(n.entity, walls, selectedElement)),
    [selectedElement, wallNodes, walls],
  );
  const roofMeshes = useMemo(
    () => roofs.map((roof) => roofToMesh(roof, floors, selectedElement)),
    [floors, roofs, selectedElement],
  );

  const hasGeometry =
    floorMeshes.length > 0 || wallMeshes.length > 0 || roofMeshes.length > 0;

  // Compute per-level vertical offsets for exploded view
  const getYOffset = useCallback(
    (levelIndex: number) => {
      if (levelDisplayMode === 'exploded') {
        return levelIndex * levelGap;
      }
      return 0;
    },
    [levelDisplayMode, levelGap],
  );

  const isLevelVisible = useCallback(
    (levelIndex: number) => {
      if (levelDisplayMode === 'solo') {
        return levelIndex === currentLevelIndex;
      }
      return true;
    },
    [levelDisplayMode, currentLevelIndex],
  );

  const getLevelBaseElevation = useCallback(
    (levelIndex: number) => levels[levelIndex]?.elevation ?? 0,
    [levels],
  );
  const getRoofBaseElevation = useCallback(
    (levelIndex: number) =>
      getLevelBaseElevation(levelIndex) +
      getRequiredLevelHeight(levelIndex, {
        levels,
        walls,
        floors,
        ceilings,
      }),
    [ceilings, floors, getLevelBaseElevation, levels, walls],
  );

  return (
    <Bounds fit clip observe margin={1.25}>
      <group>
        {floorMeshes.map((mesh, index) => {
          const levelIndex = Math.min(floorNodes[index].entity.level ?? 0, levelCount - 1);
          if (!isLevelVisible(levelIndex)) return null;
          return (
            <group
              key={`floor-${floorNodes[index].id}`}
              position-y={getLevelBaseElevation(levelIndex) + getYOffset(levelIndex)}
            >
              <primitive object={mesh} />
            </group>
          );
        })}
        {wallMeshes.map((mesh, index) => {
          const levelIndex = Math.min(wallNodes[index].entity.level ?? 0, levelCount - 1);
          if (!isLevelVisible(levelIndex)) return null;
          return (
            <group
              key={`wall-${wallNodes[index].id}`}
              position-y={getLevelBaseElevation(levelIndex) + getYOffset(levelIndex)}
            >
              <primitive object={mesh} />
            </group>
          );
        })}
        {roofMeshes.map((mesh, index) => {
          const levelIndex = Math.min(roofs[index].level ?? 0, levelCount - 1);
          if (!isLevelVisible(levelIndex)) return null;
          return (
            <group
              key={`roof-${roofs[index].id}`}
              position-y={getRoofBaseElevation(levelIndex) + getYOffset(levelIndex)}
            >
              <primitive object={mesh} />
            </group>
          );
        })}

        {!hasGeometry && (
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.6, 0.12, 2.6]} />
            <meshStandardMaterial color="#dce8f4" roughness={0.9} />
          </mesh>
        )}
      </group>
    </Bounds>
  );
}

/* ------------------------------------------------------------------ */
/*  Inner scene                                                        */
/* ------------------------------------------------------------------ */

function EnhancedScene({
  levelDisplayMode,
  wallViewMode,
  gridVisible,
  currentLevelIndex,
  levelCount,
  levelGap,
}: Required<Omit<EnhancedViewerProps, 'className' | 'style'>>) {
  return (
    <>
      <color attach="background" args={[PREVIEW_BACKGROUND]} />

      {/* Lighting */}
      <ambientLight intensity={0.42} />
      <hemisphereLight intensity={0.34} color="#f9fdff" groundColor="#c7d6e3" />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      <Environment preset="apartment" />

      {/* Ground plane */}
      <mesh receiveShadow position={[0, -0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color={PREVIEW_GROUND} roughness={1} metalness={0} />
      </mesh>

      {/* Grid */}
      {gridVisible && (
        <Grid
          position={[0, -0.02, 0]}
          args={[80, 80]}
          cellColor={PREVIEW_GRID_CELL}
          sectionColor={PREVIEW_GRID_SECTION}
          cellSize={1}
          sectionSize={5}
          infiniteGrid
          fadeDistance={48}
          fadeStrength={1.6}
        />
      )}

      {/* Geometry */}
      <SceneGeometry
        levelDisplayMode={levelDisplayMode}
        currentLevelIndex={currentLevelIndex}
        levelCount={levelCount}
        levelGap={levelGap}
      />

      {/* Wall clipping */}
      <WallClipPlane mode={wallViewMode} />

      {/* Contact shadows */}
      <ContactShadows
        position={[0, -0.02, 0]}
        scale={28}
        blur={2.6}
        opacity={0.42}
        far={20}
      />

      {/* Smooth camera */}
      <SmoothCameraTarget />

      {/* Orbit controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={36}
        maxPolarAngle={Math.PI / 2.08}
        enablePan
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported component                                                 */
/* ------------------------------------------------------------------ */

export function EnhancedViewer({
  cameraMode = 'perspective',
  levelDisplayMode = 'stacked',
  wallViewMode = 'full',
  gridVisible = true,
  currentLevelIndex = 0,
  levelCount = 1,
  levelGap = 4,
  className,
  style,
}: EnhancedViewerProps) {
  const cameraProps =
    cameraMode === 'perspective'
      ? { position: PERSPECTIVE_CAMERA_POSITION, fov: 42 }
      : { position: ORTHOGRAPHIC_CAMERA_POSITION, zoom: 30 };

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ localClippingEnabled: true }}
      camera={
        cameraMode === 'perspective'
          ? { position: cameraProps.position, fov: (cameraProps as { fov: number }).fov }
          : undefined
      }
      orthographic={cameraMode === 'orthographic'}
      style={{ width: '100%', height: '100%', ...style }}
      className={className}
    >
      {cameraMode === 'orthographic' && (
        <OrthographicCamera
          makeDefault
          position={cameraProps.position}
          zoom={(cameraProps as { zoom: number }).zoom}
        />
      )}
      <EnhancedScene
        levelDisplayMode={levelDisplayMode}
        wallViewMode={wallViewMode}
        gridVisible={gridVisible}
        currentLevelIndex={currentLevelIndex}
        levelCount={levelCount}
        levelGap={levelGap}
      />
    </Canvas>
  );
}

export default EnhancedViewer;
