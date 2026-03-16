import * as THREE from 'three';
import { Floor, Wall, WallOpening } from '@/src/model/types';

const WALL_JOIN_EPSILON = 0.001;

interface PreparedWallOpening {
  opening: WallOpening;
  centerX: number;
  width: number;
  height: number;
  bottom: number;
}

function pointsMatch(pointA: { x: number; y: number }, pointB: { x: number; y: number }) {
  return (
    Math.abs(pointA.x - pointB.x) < WALL_JOIN_EPSILON &&
    Math.abs(pointA.y - pointB.y) < WALL_JOIN_EPSILON
  );
}

function getWallEndpointExtension(
  wall: Wall,
  endpoint: 'start' | 'end',
  walls: Wall[],
) {
  const point = endpoint === 'start' ? wall.start : wall.end;
  const hasConnectedNeighbor = walls.some((candidateWall) => {
    if (candidateWall.id === wall.id) {
      return false;
    }

    return (
      pointsMatch(point, candidateWall.start) ||
      pointsMatch(point, candidateWall.end)
    );
  });

  return hasConnectedNeighbor ? wall.thickness / 2 : 0;
}

function getPreparedWallOpenings(
  wall: Wall,
  baseLength: number,
  totalLength: number,
  startExtension: number,
): PreparedWallOpening[] {
  if (baseLength === 0) {
    return [];
  }

  return (wall.openings ?? []).flatMap((opening) => {
    const maxWidth = Math.max(0.8, baseLength - 0.4);
    const width = Math.min(opening.width, maxWidth);
    const halfWidth = width / 2;
    const minCenter = startExtension + halfWidth;
    const maxCenter = startExtension + baseLength - halfWidth;

    if (maxCenter <= minCenter) {
      return [];
    }

    const centerX = THREE.MathUtils.clamp(
      startExtension + opening.offset * baseLength,
      minCenter,
      maxCenter,
    );
    const bottom = THREE.MathUtils.clamp(opening.bottom, 0, Math.max(wall.height - 0.35, 0));
    const maxHeight = Math.max(0.75, wall.height - bottom - 0.12);
    const height = Math.min(opening.height, maxHeight);

    if (height <= 0.6 || width <= 0.6 || centerX - halfWidth < 0 || centerX + halfWidth > totalLength) {
      return [];
    }

    return [{
      opening,
      centerX,
      width,
      height,
      bottom,
    }];
  });
}

function createWallGeometry(
  wall: Wall,
  totalLength: number,
  openings: PreparedWallOpening[],
) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(totalLength, 0);
  shape.lineTo(totalLength, wall.height);
  shape.lineTo(0, wall.height);
  shape.closePath();

  openings.forEach(({ centerX, width, height, bottom }) => {
    const hole = new THREE.Path();
    const left = centerX - width / 2;
    const right = centerX + width / 2;
    const top = Math.min(wall.height - 0.06, bottom + height);

    if (right - left <= 0.4 || top - bottom <= 0.4) {
      return;
    }

    hole.moveTo(left, bottom);
    hole.lineTo(right, bottom);
    hole.lineTo(right, top);
    hole.lineTo(left, top);
    hole.closePath();
    shape.holes.push(hole);
  });

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: wall.thickness,
    bevelEnabled: false,
  });

  geometry.translate(0, 0, -wall.thickness / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createFrameMaterial(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.75,
    metalness: 0.08,
  });
}

function createDoorObject(opening: PreparedWallOpening, wallThickness: number) {
  const group = new THREE.Group();
  const frameThickness = Math.min(0.12, Math.max(0.06, opening.width * 0.07));
  const frameDepth = Math.max(0.08, wallThickness * 0.75);
  const leafDepth = Math.max(0.04, wallThickness * 0.2);
  const frameMaterial = createFrameMaterial(0xf3efe8);
  const leafMaterial = createFrameMaterial(0xe0c9ad);

  const leftFrame = new THREE.Mesh(
    new THREE.BoxGeometry(frameThickness, opening.height, frameDepth),
    frameMaterial,
  );
  leftFrame.position.set(
    opening.centerX - opening.width / 2 + frameThickness / 2,
    opening.bottom + opening.height / 2,
    0,
  );
  leftFrame.castShadow = true;
  leftFrame.receiveShadow = true;

  const rightFrame = leftFrame.clone();
  rightFrame.position.x = opening.centerX + opening.width / 2 - frameThickness / 2;

  const topFrame = new THREE.Mesh(
    new THREE.BoxGeometry(opening.width, frameThickness, frameDepth),
    frameMaterial,
  );
  topFrame.position.set(
    opening.centerX,
    opening.bottom + opening.height - frameThickness / 2,
    0,
  );
  topFrame.castShadow = true;
  topFrame.receiveShadow = true;

  const leafWidth = Math.max(0.45, opening.width - frameThickness * 2.2);
  const leafHeight = Math.max(0.6, opening.height - frameThickness * 1.4);
  const leaf = new THREE.Mesh(
    new THREE.BoxGeometry(leafWidth, leafHeight, leafDepth),
    leafMaterial,
  );
  leaf.position.set(
    opening.centerX,
    opening.bottom + leafHeight / 2,
    wallThickness / 2 - leafDepth / 2 - 0.01,
  );
  leaf.castShadow = true;
  leaf.receiveShadow = true;

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.12, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0x6b7280,
      roughness: 0.4,
      metalness: 0.8,
    }),
  );
  handle.position.set(
    opening.centerX + leafWidth * 0.28,
    opening.bottom + leafHeight * 0.52,
    wallThickness / 2 + 0.005,
  );
  handle.castShadow = true;

  group.add(leftFrame, rightFrame, topFrame, leaf, handle);
  return group;
}

function createWindowObject(opening: PreparedWallOpening, wallThickness: number) {
  const group = new THREE.Group();
  const frameThickness = Math.min(0.1, Math.max(0.05, opening.width * 0.06));
  const frameDepth = Math.max(0.08, wallThickness * 0.72);
  const glassDepth = Math.max(0.02, wallThickness * 0.14);
  const frameMaterial = createFrameMaterial(0xe6edf5);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd7efff,
    roughness: 0.08,
    metalness: 0,
    transmission: 0.72,
    transparent: true,
    opacity: 0.55,
  });

  const frameParts = [
    new THREE.Mesh(new THREE.BoxGeometry(frameThickness, opening.height, frameDepth), frameMaterial),
    new THREE.Mesh(new THREE.BoxGeometry(frameThickness, opening.height, frameDepth), frameMaterial),
    new THREE.Mesh(new THREE.BoxGeometry(opening.width, frameThickness, frameDepth), frameMaterial),
    new THREE.Mesh(new THREE.BoxGeometry(opening.width, frameThickness, frameDepth), frameMaterial),
  ];

  frameParts[0].position.set(
    opening.centerX - opening.width / 2 + frameThickness / 2,
    opening.bottom + opening.height / 2,
    0,
  );
  frameParts[1].position.set(
    opening.centerX + opening.width / 2 - frameThickness / 2,
    opening.bottom + opening.height / 2,
    0,
  );
  frameParts[2].position.set(
    opening.centerX,
    opening.bottom + opening.height - frameThickness / 2,
    0,
  );
  frameParts[3].position.set(
    opening.centerX,
    opening.bottom + frameThickness / 2,
    0,
  );

  for (const framePart of frameParts) {
    framePart.castShadow = true;
    framePart.receiveShadow = true;
    group.add(framePart);
  }

  const muntin = new THREE.Mesh(
    new THREE.BoxGeometry(frameThickness * 0.9, Math.max(0.3, opening.height - frameThickness * 2), frameDepth * 0.85),
    frameMaterial,
  );
  muntin.position.set(
    opening.centerX,
    opening.bottom + opening.height / 2,
    0,
  );
  muntin.castShadow = true;
  muntin.receiveShadow = true;

  const glassWidth = Math.max(0.35, opening.width - frameThickness * 2.4);
  const glassHeight = Math.max(0.35, opening.height - frameThickness * 2.2);
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(glassWidth, glassHeight, glassDepth),
    glassMaterial,
  );
  glass.position.set(
    opening.centerX,
    opening.bottom + opening.height / 2,
    0,
  );

  const sill = new THREE.Mesh(
    new THREE.BoxGeometry(opening.width + 0.14, 0.03, frameDepth + 0.08),
    createFrameMaterial(0xf8fafc),
  );
  sill.position.set(
    opening.centerX,
    opening.bottom - 0.02,
    0,
  );
  sill.receiveShadow = true;

  group.add(muntin, glass, sill);
  return group;
}

/**
 * Create a Three.js object representing a wall with optional doors/windows.
 */
export function wallToMesh(wall: Wall, walls: Wall[]): THREE.Group {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const baseLength = Math.sqrt(dx * dx + dy * dy);
  const directionX = baseLength === 0 ? 0 : dx / baseLength;
  const directionZ = baseLength === 0 ? 0 : dy / baseLength;
  const startExtension = getWallEndpointExtension(wall, 'start', walls);
  const endExtension = getWallEndpointExtension(wall, 'end', walls);
  const totalLength = baseLength + startExtension + endExtension;
  const openings = getPreparedWallOpenings(wall, baseLength, totalLength, startExtension);
  const geometry = createWallGeometry(wall, totalLength, openings);

  const material = new THREE.MeshStandardMaterial({
    color: 0xf5f3ef,
    roughness: 0.88,
    metalness: 0.02,
  });

  const wallMesh = new THREE.Mesh(geometry, material);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0xa1adb8 }),
  );
  wallMesh.add(edges);

  const group = new THREE.Group();
  const originX = wall.start.x - directionX * startExtension;
  const originZ = wall.start.y - directionZ * startExtension;
  group.position.set(originX, 0, originZ);
  group.rotation.y = -Math.atan2(dy, dx);
  group.add(wallMesh);

  openings.forEach((opening) => {
    const openingObject =
      opening.opening.type === 'door'
        ? createDoorObject(opening, wall.thickness)
        : createWindowObject(opening, wall.thickness);

    group.add(openingObject);
  });

  return group;
}

/**
 * Create a Three.js mesh representing a floor polygon extruded to thickness.
 */
export function floorToMesh(floor: Floor): THREE.Mesh {
  const shape = new THREE.Shape();
  if (floor.points.length > 0) {
    const first = floor.points[0];
    shape.moveTo(first.x, -first.y);
    for (let index = 1; index < floor.points.length; index += 1) {
      const p = floor.points[index];
      shape.lineTo(p.x, -p.y);
    }
    shape.closePath();
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: floor.thickness,
    bevelEnabled: false,
  });

  const material = new THREE.MeshStandardMaterial({
    color: 0xf8fbff,
    roughness: 0.95,
    metalness: 0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0xd5e0ea }),
  );
  mesh.add(edges);

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = floor.elevation;

  return mesh;
}
