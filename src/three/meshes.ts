import * as THREE from 'three';
import { Wall, Floor } from '@/src/model/types';

/**
 * Create a Three.js mesh representing a wall.
 * The wall is modelled as a box extruded between start and end points
 * with the given height and thickness.
 */
export function wallToMesh(wall: Wall): THREE.Mesh {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Box geometry: length along X, height along Y, thickness along Z
  const geometry = new THREE.BoxGeometry(length, wall.height, wall.thickness);
  const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
  const mesh = new THREE.Mesh(geometry, material);

  // Position wall at midpoint and rotate to match direction
  const midX = (wall.start.x + wall.end.x) / 2;
  const midZ = (wall.start.y + wall.end.y) / 2;
  mesh.position.set(midX, wall.height / 2, midZ);

  const angle = Math.atan2(dy, dx);
  mesh.rotation.y = angle;

  return mesh;
}

/**
 * Create a Three.js mesh representing a floor polygon extruded to thickness.
 */
export function floorToMesh(floor: Floor): THREE.Mesh {
  const shape = new THREE.Shape();
  if (floor.points.length > 0) {
    const first = floor.points[0];
    shape.moveTo(first.x, first.y);
    for (let i = 1; i < floor.points.length; i++) {
      const p = floor.points[i];
      shape.lineTo(p.x, p.y);
    }
    shape.closePath();
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: floor.thickness,
    bevelEnabled: false,
  });
  const material = new THREE.MeshStandardMaterial({ color: 0x999999 });
  const mesh = new THREE.Mesh(geometry, material);

  // Rotate so that extrusion is vertical (along Y)
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = floor.elevation;

  return mesh;
}

