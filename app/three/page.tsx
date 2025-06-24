'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ThreePreview() {
  const mountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(10, 10, 8);
    camera.lookAt(0, 0, 1.5); // Look at the middle height of typical walls

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Improve lighting for better 3D visualization
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 15, 10);
    light.castShadow = true;
    scene.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Add a ground grid for reference
    const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
    scene.add(gridHelper);

    // Add axis helper for orientation reference
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    try {
      const stored = localStorage.getItem('graph-paper-history');
      if (stored) {
        const history = JSON.parse(stored);
        const latest = history[history.length - 1];
        if (latest && Array.isArray(latest.lines)) {
          latest.lines.forEach((line: any) => {
            const start = new THREE.Vector3(line.start.x, line.start.y, 0);
            const end = new THREE.Vector3(line.end.x, line.end.y, 0);
            const height = 3;
            const length = start.distanceTo(end);
            const geom = new THREE.BoxGeometry(length, 0.1, height);
            const material = new THREE.MeshLambertMaterial({ 
              color: 0xcccccc,
              transparent: false
            });
            const wall = new THREE.Mesh(geom, material);
            wall.castShadow = true;
            wall.receiveShadow = true;
            wall.position.set(
              (start.x + end.x) / 2,
              (start.y + end.y) / 2,
              height / 2,
            );
            wall.rotation.z = Math.atan2(end.y - start.y, end.x - start.x);
            scene.add(wall);
          });
        }
      }
    } catch (err) {
      console.error('Failed to build 3D preview', err);
    }

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="w-screen h-screen relative">
      <div ref={mountRef} className="w-full h-full" />
      <Button
        className="absolute top-4 left-4"
        variant="outline"
        onClick={() => router.push('/')}
      >
        Back
      </Button>
    </div>
  );
}
