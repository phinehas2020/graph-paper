import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei'; // Use Grid component from Drei
import * as THREE from 'three'; // Import three directly
import { generateMesh } from './generateMesh';
// import useStore from '@/src/model/useStore'; // Not used directly if model is a prop
import { Model } from '@/src/model/types';

interface ViewerProps {
  model: Model;
}

const Viewer: React.FC<ViewerProps> = ({ model }) => {
  const [sceneObjects, setSceneObjects] = useState<THREE.Group | null>(null);

  useEffect(() => {
    console.log("Viewer: Model prop changed, regenerating mesh.", model);
    const newGroup = generateMesh(model);
    setSceneObjects(newGroup);

    // Cleanup function to dispose geometries/materials when model changes or component unmounts
    return () => {
      console.log("Viewer: Cleaning up old mesh group.", newGroup);
      newGroup.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          // Check if material is an array (multi-material object)
          if (Array.isArray(object.material)) {
            object.material.forEach(m => {
              if (m instanceof THREE.Material) m.dispose();
            });
          } else if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
      // Optionally, clear the sceneObjects state if desired, though re-rendering will replace it
      // setSceneObjects(null);
    };
  }, [model]); // Dependency array ensures this runs when model changes

  return (
    <Canvas
      camera={{ fov: 75, position: [50, 50, 50] }} // Corrected camera position
      style={{ background: '#f0f0f0' }}
      shadows // Enable shadows if lights are configured for them
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-10, -5, -10]}
        intensity={0.3}
      />

      <OrbitControls />

      {/* Default Grid from Drei is on XY plane. Configurable via props. */}
      <Grid infiniteGrid cellSize={1} sectionSize={10} fadeDistance={100} sectionColor={new THREE.Color(0x888888)} cellColor={new THREE.Color(0x444444)} />

      {sceneObjects && <primitive object={sceneObjects} />}

      {/* Axes Helper for orientation */}
      <axesHelper args={[5]} />
    </Canvas>
  );
};

export default Viewer;
