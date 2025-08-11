'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import useStore from '@/src/model/useStore';
import { wallToMesh, floorToMesh } from './meshes';

export function Viewer() {
  const walls = useStore((state) => state.walls);
  const floors = useStore((state) => state.floors);

  const wallMeshes = useMemo(() => walls.map(wallToMesh), [walls]);
  const floorMeshes = useMemo(() => floors.map(floorToMesh), [floors]);

  return (
    <Canvas camera={{ position: [10, 10, 10], fov: 50 }} style={{ width: '100%', height: '100%' }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      {floorMeshes.map((mesh, i) => (
        <primitive object={mesh} key={`floor-${floors[i].id}`} />
      ))}
      {wallMeshes.map((mesh, i) => (
        <primitive object={mesh} key={`wall-${walls[i].id}`} />
      ))}
      <gridHelper args={[50, 50]} />
      <OrbitControls />
    </Canvas>
  );
}

export default Viewer;

