import * as THREE from 'three';
import {
  Floor,
  PlannerSelection,
  Roof,
  Wall,
  WallOpening,
} from '@/src/model/types';

const WALL_JOIN_EPSILON = 0.001;
const LEGACY_DEFAULT_WALL_COLOR = 0xf5f3ef;
const PREVIEW_DEFAULT_WALL_COLOR = 0xe2d6c6;
const PREVIEW_WALL_EDGE_COLOR = 0x7d8d9c;
const PREVIEW_FLOOR_COLOR = 0xe7dfd2;
const PREVIEW_FLOOR_EDGE_COLOR = 0x8d9dac;

function planToWorld(point: { x: number; y: number }) {
  return {
    x: point.x,
    z: -point.y,
  };
}

function getPreviewWallColor(color?: string) {
  const resolvedColor = new THREE.Color(color ?? LEGACY_DEFAULT_WALL_COLOR);
  return resolvedColor.getHex() === LEGACY_DEFAULT_WALL_COLOR
    ? new THREE.Color(PREVIEW_DEFAULT_WALL_COLOR)
    : resolvedColor;
}

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

function createDoorObject(
  opening: PreparedWallOpening,
  wallThickness: number,
  selected = false,
) {
  const group = new THREE.Group();
  const frameThickness = Math.min(0.12, Math.max(0.06, opening.width * 0.07));
  const frameDepth = Math.max(0.08, wallThickness * 0.75);
  const leafDepth = Math.max(0.04, wallThickness * 0.2);
  const frameMaterial = createFrameMaterial(selected ? 0xf8d17a : 0xf3efe8);
  const leafMaterial = createFrameMaterial(selected ? 0xf4b942 : 0xe0c9ad);

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
      color: selected ? 0x92400e : 0x6b7280,
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

function createWindowObject(
  opening: PreparedWallOpening,
  wallThickness: number,
  selected = false,
) {
  const group = new THREE.Group();
  const frameThickness = Math.min(0.1, Math.max(0.05, opening.width * 0.06));
  const frameDepth = Math.max(0.08, wallThickness * 0.72);
  const glassDepth = Math.max(0.02, wallThickness * 0.14);
  const frameMaterial = createFrameMaterial(selected ? 0xf8d17a : 0xe6edf5);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: selected ? 0xfef3c7 : 0xd7efff,
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
export function wallToMesh(
  wall: Wall,
  walls: Wall[],
  selectedElement: PlannerSelection | null = null,
): THREE.Group {
  const worldStart = planToWorld(wall.start);
  const worldEnd = planToWorld(wall.end);
  const dx = worldEnd.x - worldStart.x;
  const dz = worldEnd.z - worldStart.z;
  const baseLength = Math.sqrt(dx * dx + dz * dz);
  const directionX = baseLength === 0 ? 0 : dx / baseLength;
  const directionZ = baseLength === 0 ? 0 : dz / baseLength;
  const startExtension = getWallEndpointExtension(wall, 'start', walls);
  const endExtension = getWallEndpointExtension(wall, 'end', walls);
  const totalLength = baseLength + startExtension + endExtension;
  const openings = getPreparedWallOpenings(wall, baseLength, totalLength, startExtension);
  const geometry = createWallGeometry(wall, totalLength, openings);
  const isSelectedWall =
    selectedElement?.type === 'wall'
      ? selectedElement.wallId === wall.id
      : selectedElement?.type === 'opening' && selectedElement.wallId === wall.id;
  const selectedOpeningId =
    selectedElement?.type === 'opening' && selectedElement.wallId === wall.id
      ? selectedElement.openingId
      : null;

  const material = new THREE.MeshStandardMaterial({
    color: getPreviewWallColor(wall.color),
    roughness: 0.88,
    metalness: 0.02,
    emissive: isSelectedWall ? new THREE.Color(0xf59e0b).multiplyScalar(0.18) : new THREE.Color(0x000000),
  });

  const wallMesh = new THREE.Mesh(geometry, material);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({
      color: isSelectedWall ? 0xf59e0b : PREVIEW_WALL_EDGE_COLOR,
    }),
  );
  wallMesh.add(edges);

  const group = new THREE.Group();
  const originX = worldStart.x - directionX * startExtension;
  const originZ = worldStart.z - directionZ * startExtension;
  group.position.set(originX, 0, originZ);
  group.rotation.y = baseLength === 0 ? 0 : -Math.atan2(dz, dx);
  group.add(wallMesh);

  openings.forEach((opening) => {
    const openingObject =
      opening.opening.type === 'door'
        ? createDoorObject(
            opening,
            wall.thickness,
            selectedOpeningId === opening.opening.id,
          )
        : createWindowObject(
            opening,
            wall.thickness,
            selectedOpeningId === opening.opening.id,
          );

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
    shape.moveTo(first.x, first.y);
    for (let index = 1; index < floor.points.length; index += 1) {
      const p = floor.points[index];
      shape.lineTo(p.x, p.y);
    }
    shape.closePath();
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: floor.thickness,
    bevelEnabled: false,
  });

  const material = new THREE.MeshStandardMaterial({
    color: PREVIEW_FLOOR_COLOR,
    roughness: 0.94,
    metalness: 0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: PREVIEW_FLOOR_EDGE_COLOR }),
  );
  mesh.add(edges);

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = floor.elevation;

  return mesh;
}

function createRoofPlaneGeometry(
  length: number,
  span: number,
  peakHeight: number,
  side: 'negative' | 'positive',
) {
  const direction = side === 'negative' ? -1 : 1;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array([
    0, peakHeight, 0,
    length, peakHeight, 0,
    0, 0, direction * span,
    length, peakHeight, 0,
    length, 0, direction * span,
    0, 0, direction * span,
  ]);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function createRoofGableGeometry(
  length: number,
  leftSpan: number,
  rightSpan: number,
  peakHeight: number,
  side: 'start' | 'end',
) {
  const x = side === 'start' ? 0 : length;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array([
    x, 0, -leftSpan,
    x, peakHeight, 0,
    x, 0, rightSpan,
  ]);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function roofToMesh(
  roof: Roof,
  floors: Floor[],
  selectedElement: PlannerSelection | null = null,
): THREE.Group {
  const ridgeStart = planToWorld(roof.ridgeStart);
  const ridgeEnd = planToWorld(roof.ridgeEnd);
  const dx = ridgeEnd.x - ridgeStart.x;
  const dz = ridgeEnd.z - ridgeStart.z;
  const ridgeLength = Math.sqrt(dx * dx + dz * dz);
  const directionX = ridgeLength === 0 ? 1 : dx / ridgeLength;
  const directionZ = ridgeLength === 0 ? 0 : dz / ridgeLength;
  const normalX = -directionZ;
  const normalZ = directionX;
  const roofFloors = floors.filter((floor) => (floor.level ?? 0) === (roof.level ?? 0));
  const footprintPoints = roofFloors.flatMap((floor) => floor.points);
  const pitchRadians = THREE.MathUtils.degToRad(roof.pitch);
  const projectionsAlong = footprintPoints.map((point) =>
    (planToWorld(point).x - ridgeStart.x) * directionX +
    (planToWorld(point).z - ridgeStart.z) * directionZ,
  );
  const projectionsAcross = footprintPoints.map((point) =>
    (planToWorld(point).x - ridgeStart.x) * normalX +
    (planToWorld(point).z - ridgeStart.z) * normalZ,
  );

  const alongStart = Math.min(0, ...projectionsAlong) - roof.overhang;
  const alongEnd = Math.max(ridgeLength, ...projectionsAlong) + roof.overhang;
  const totalLength = Math.max(1.5, alongEnd - alongStart);
  const leftSpan = Math.max(
    1.5,
    Math.abs(Math.min(0, ...projectionsAcross)) + roof.overhang,
  );
  const rightSpan = Math.max(
    1.5,
    Math.max(0, ...projectionsAcross) + roof.overhang,
  );
  const halfSpan = Math.max(leftSpan, rightSpan);
  const peakHeight = Math.max(0.6, Math.tan(pitchRadians) * halfSpan);
  const isSelectedRoof =
    selectedElement?.type === 'roof' && selectedElement.roofId === roof.id;

  const roofMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(isSelectedRoof ? 0xf4b740 : 0x9a3412),
    roughness: 0.82,
    metalness: 0.05,
    side: THREE.DoubleSide,
    emissive: isSelectedRoof
      ? new THREE.Color(0xf59e0b).multiplyScalar(0.18)
      : new THREE.Color(0x000000),
  });
  const gableMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(isSelectedRoof ? 0xf7c66d : 0xb45309),
    roughness: 0.88,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const ridgeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(isSelectedRoof ? 0xffedd5 : 0xead7c3),
    roughness: 0.5,
    metalness: 0.18,
  });

  const leftSlope = new THREE.Mesh(
    createRoofPlaneGeometry(totalLength, leftSpan, peakHeight, 'negative'),
    roofMaterial,
  );
  const rightSlope = new THREE.Mesh(
    createRoofPlaneGeometry(totalLength, rightSpan, peakHeight, 'positive'),
    roofMaterial,
  );
  const startGable = new THREE.Mesh(
    createRoofGableGeometry(totalLength, leftSpan, rightSpan, peakHeight, 'start'),
    gableMaterial,
  );
  const endGable = new THREE.Mesh(
    createRoofGableGeometry(totalLength, leftSpan, rightSpan, peakHeight, 'end'),
    gableMaterial,
  );
  const ridgeCap = new THREE.Mesh(
    new THREE.BoxGeometry(totalLength, 0.08, 0.12),
    ridgeMaterial,
  );

  [leftSlope, rightSlope, startGable, endGable, ridgeCap].forEach((mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  ridgeCap.position.set(totalLength / 2, peakHeight + 0.04, 0);

  const edgeLines = [
    new THREE.LineSegments(
      new THREE.EdgesGeometry((leftSlope.geometry as THREE.BufferGeometry)),
      new THREE.LineBasicMaterial({ color: isSelectedRoof ? 0xfcd34d : 0x7c2d12 }),
    ),
    new THREE.LineSegments(
      new THREE.EdgesGeometry((rightSlope.geometry as THREE.BufferGeometry)),
      new THREE.LineBasicMaterial({ color: isSelectedRoof ? 0xfcd34d : 0x7c2d12 }),
    ),
  ];

  leftSlope.add(edgeLines[0]);
  rightSlope.add(edgeLines[1]);

  const group = new THREE.Group();
  const originX = ridgeStart.x + directionX * alongStart;
  const originZ = ridgeStart.z + directionZ * alongStart;
  group.position.set(originX, 0, originZ);
  group.rotation.y = ridgeLength === 0 ? 0 : -Math.atan2(dz, dx);
  group.add(leftSlope, rightSlope, startGable, endGable, ridgeCap);

  return group;
}
