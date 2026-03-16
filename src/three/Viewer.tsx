'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Bounds,
  ContactShadows,
  Environment,
  Grid,
  OrbitControls,
} from '@react-three/drei';
import usePlannerSceneStore from '@/src/planner/stores/usePlannerSceneStore';
import usePlannerViewerStore from '@/src/planner/stores/usePlannerViewerStore';
import { floorToMesh, wallToMesh } from './meshes';

function DraftScene() {
  const wallNodes = usePlannerSceneStore((state) => state.wallNodes);
  const floorNodes = usePlannerSceneStore((state) => state.floorNodes);
  const selectedElement = usePlannerViewerStore((state) => state.selectedElement);
  const walls = useMemo(
    () => wallNodes.map((node) => node.entity),
    [wallNodes],
  );

  const floorMeshes = useMemo(
    () => floorNodes.map((node) => floorToMesh(node.entity)),
    [floorNodes],
  );
  const wallMeshes = useMemo(
    () => wallNodes.map((node) => wallToMesh(node.entity, walls, selectedElement)),
    [selectedElement, wallNodes, walls],
  );
  const hasGeometry = floorMeshes.length > 0 || wallMeshes.length > 0;

  return (
    <>
      <color attach="background" args={['#edf4fa']} />

      <ambientLight intensity={0.65} />
      <hemisphereLight
        intensity={0.45}
        color="#f9fdff"
        groundColor="#d9e7f2"
      />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.45}
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

      <mesh
        receiveShadow
        position={[0, -0.026, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#eef4f8" roughness={1} metalness={0} />
      </mesh>

      <Grid
        position={[0, -0.02, 0]}
        args={[80, 80]}
        cellColor="#d3ddea"
        sectionColor="#b9c7d8"
        cellSize={1}
        sectionSize={5}
        infiniteGrid
        fadeDistance={48}
        fadeStrength={1.6}
      />

      <Bounds fit clip observe margin={1.25}>
        <group>
          {floorMeshes.map((mesh, index) => (
            <primitive object={mesh} key={`floor-${floorNodes[index].id}`} />
          ))}
          {wallMeshes.map((mesh, index) => (
            <primitive object={mesh} key={`wall-${wallNodes[index].id}`} />
          ))}

          {!hasGeometry && (
            <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.6, 0.12, 2.6]} />
              <meshStandardMaterial color="#dce8f4" roughness={0.9} />
            </mesh>
          )}
        </group>
      </Bounds>

      <ContactShadows
        position={[0, -0.02, 0]}
        scale={28}
        blur={2.6}
        opacity={0.3}
        far={20}
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={36}
        maxPolarAngle={Math.PI / 2.08}
      />
    </>
  );
}

export function Viewer() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [9, 8, 9], fov: 42 }}
      style={{ width: '100%', height: '100%' }}
    >
      <DraftScene />
    </Canvas>
  );
}

export default Viewer;
