'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment } from '@react-three/drei';
import useStore from '@/src/model/useStore';
import { wallToMesh, floorToMesh } from './meshes';

export function Viewer() {
  const walls = useStore((state) => state.walls);
  const floors = useStore((state) => state.floors);

  const wallMeshes = useMemo(() => walls.map(wallToMesh), [walls]);
  const floorMeshes = useMemo(() => floors.map(floorToMesh), [floors]);

  return (
    <Canvas
      shadows
      camera={{ position: [10, 10, 10], fov: 50 }}
      style={{ width: '100%', height: '100%', background: '#f0f0f0' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      >
        <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
      </directionalLight>

      <Sky sunPosition={[20, 30, 10]} turbidity={0.5} rayleigh={0.5} />
      <Environment preset="city" />

      <group>
        {floorMeshes.map((mesh, i) => (
          <primitive object={mesh} key={`floor-${floors[i].id}`} />
        ))}
        {wallMeshes.map((mesh, i) => (
          <primitive object={mesh} key={`wall-${walls[i].id}`} />
        ))}
      </group>

      <gridHelper args={[50, 50, 0xdddddd, 0xeeeeee]} />
      <OrbitControls makeDefault />
    </Canvas>
  );
}

export default Viewer;
