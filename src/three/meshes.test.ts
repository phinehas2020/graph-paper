import * as THREE from 'three';
import { floorToMesh, wallToMesh } from './meshes';

describe('preview mesh materials', () => {
  test('warms the legacy default wall color so it separates from the scene background', () => {
    const wall = wallToMesh(
      {
        id: 'wall-1',
        start: { x: 0, y: 0 },
        end: { x: 8, y: 0 },
        height: 3,
        thickness: 0.15,
        color: '#f5f3ef',
        openings: [],
        level: 0,
      },
      [],
      null,
    );

    const wallMesh = wall.children[0] as THREE.Mesh;
    const wallMaterial = wallMesh.material as THREE.MeshStandardMaterial;
    const edgeLines = wallMesh.children[0] as THREE.LineSegments;
    const edgeMaterial = edgeLines.material as THREE.LineBasicMaterial;

    expect(wallMaterial.color.getHex()).toBe(0xe2d6c6);
    expect(edgeMaterial.color.getHex()).toBe(0x7d8d9c);
  });

  test('uses a distinct floor fill and edge color for the preview slab', () => {
    const floor = floorToMesh({
      id: 'floor-1',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 8 },
      ],
      elevation: 0,
      thickness: 0.2,
      level: 0,
    });

    const floorMaterial = floor.material as THREE.MeshStandardMaterial;
    const edgeLines = floor.children[0] as THREE.LineSegments;
    const edgeMaterial = edgeLines.material as THREE.LineBasicMaterial;

    expect(floorMaterial.color.getHex()).toBe(0xe7dfd2);
    expect(edgeMaterial.color.getHex()).toBe(0x8d9dac);
  });

  test('maps positive plan y upward on the canvas to negative world z in 3D', () => {
    const wall = wallToMesh(
      {
        id: 'wall-2',
        start: { x: 0, y: 6 },
        end: { x: 8, y: 6 },
        height: 3,
        thickness: 0.15,
        color: '#e2d6c6',
        openings: [],
        level: 0,
      },
      [],
      null,
    );

    expect(wall.position.z).toBeCloseTo(-6);
  });

  test('keeps floor geometry in the same handedness as the 2D canvas', () => {
    const floor = floorToMesh({
      id: 'floor-2',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 8 },
        { x: 0, y: 8 },
      ],
      elevation: 0,
      thickness: 0.2,
      level: 0,
    });

    floor.updateMatrixWorld(true);
    const worldBounds = new THREE.Box3().setFromObject(floor);

    expect(worldBounds.min.z).toBeCloseTo(-8);
    expect(worldBounds.max.z).toBeCloseTo(0);
  });
});
