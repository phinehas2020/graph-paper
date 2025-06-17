import *
  as THREE from 'three'; // Using three directly, ensure it's in package.json dependencies
import {
  Model,
  Floor,
  Wall,
  // Truss as TrussType, // Renamed to avoid conflict with THREE.Truss if it existed
  Point as ModelPoint,
  Truss, // Assuming Truss is the type from model/types.ts
  Opening,
} from '@/src/model/types'; // Adjusted path based on tsconfig alias
import { SUBTRACTION, Brush, Evaluator } from 'three-mesh-bvh';

const DEFAULT_FLOOR_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
const DEFAULT_WALL_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
const DEFAULT_TRUSS_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x999999, side: THREE.DoubleSide });

export function generateMesh(model: Model): THREE.Group {
  const group = new THREE.Group();
  group.name = "BuildingModel";

  // Floors
  model.floors.forEach((floorData: Floor) => {
    if (floorData.points.length < 3) return; // Need at least 3 points for a shape

    const shapePoints: THREE.Vector2[] = floorData.points.map(p => new THREE.Vector2(p.x, p.y));
    const floorShape = new THREE.Shape(shapePoints);

    const extrudeSettings = {
      steps: 1,
      depth: floorData.thickness,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(floorShape, extrudeSettings);
    const floorMesh = new THREE.Mesh(geometry, DEFAULT_FLOOR_MATERIAL.clone());
    floorMesh.name = `Floor_${floorData.id}`;

    // Position the base of the floor at its elevation
    // ExtrudeGeometry extrudes along Z, so the base is at Z=0 of its local coords.
    floorMesh.position.set(0, 0, floorData.elevation);
    // Three.js uses Y-up by default in many contexts, but if we model in XY plane and extrude along Z,
    // then Z becomes 'up'. We assume Z is up for architectural models.
    // If the coordinate system from the 2D tool is Y-up, and Three.js is also Y-up,
    // then points (x,y) become (x,y,elevation) for one face, and (x,y,elevation+thickness) for the other.
    // If 2D tool is XY plane as ground, and Three.js Z is up:
    // Floor points are (x,y). Extrude along Z. Mesh position Z is floorData.elevation.

    group.add(floorMesh);
  });

  // Walls
  model.walls.forEach((wallData: Wall) => {
    if (!wallData.start || !wallData.end) return;

    const start = new THREE.Vector2(wallData.start.x, wallData.start.y);
    const end = new THREE.Vector2(wallData.end.x, wallData.end.y);
    const thickness = wallData.thickness;
    const height = wallData.height;

    const dir = new THREE.Vector2().subVectors(end, start);
    const length = dir.length();
    if (length === 0) return; // Cannot create a wall of zero length
    dir.normalize();

    const perp = new THREE.Vector2(-dir.y, dir.x); // Perpendicular to the direction

    // Define 4 points for the base shape of the wall's footprint
    const p0 = new THREE.Vector2().copy(start).addScaledVector(perp, -thickness / 2);
    const p1 = new THREE.Vector2().copy(end).addScaledVector(perp, -thickness / 2);
    const p2 = new THREE.Vector2().copy(end).addScaledVector(perp, thickness / 2);
    const p3 = new THREE.Vector2().copy(start).addScaledVector(perp, thickness / 2);

    const wallFootprintShape = new THREE.Shape([p0, p1, p2, p3]);

    const extrudeSettings = {
      steps: 1,
      depth: height,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(wallFootprintShape, extrudeSettings);
    const wallMesh = new THREE.Mesh(geometry, DEFAULT_WALL_MATERIAL.clone());
    wallMesh.name = `Wall_${wallData.id}`;

    // Position the base of the wall.
    // Assuming walls are built on Z=0 plane, or on a floor.
    // For now, let's assume Z=0 for simplicity, unless wallData has an elevation property.
    // If wallData.start.z is available and means something, use it.
    // The current Point type has z?: number. Let's assume wall base is at start.z or 0.
    const wallBaseElevation = wallData.start.z || 0;
    wallMesh.position.set(0, 0, wallBaseElevation); // Position the entire wall mesh (including potential openings)

    // CSG for Openings
    if (wallData.openings && wallData.openings.length > 0) {
      const csgEvaluator = new Evaluator();
      let wallBrush = new Brush(wallMesh.geometry.clone()); // Operate on a clone of the geometry
      // The wallMesh itself is already positioned and rotated by its matrix.
      // For CSG, we can either:
      // 1. Apply wallMesh.matrixWorld to wallBrush, and also apply matrixWorld to toolBrushes.
      // 2. Or, work in the local space of the wallMesh. Add openings relative to wall's local origin.
      // Option 2 is generally simpler if the base geometry is defined before transformation.
      // The ExtrudeGeometry for the wall is created locally, then the wallMesh is positioned/rotated.
      // So, opening brushes should be defined in the wall's local coordinate system.

      const wallLength = new THREE.Vector2(wallData.start.x, wallData.start.y).distanceTo(
        new THREE.Vector2(wallData.end.x, wallData.end.y)
      );

      wallData.openings.forEach((opening: Opening) => {
        // Geometry for the opening (the "tool" or "brush" for CSG)
        // Width of opening runs along the wall's length (X in local wall shape space)
        // Height of opening is along the extrusion direction (Z in local wall shape space)
        // Thickness of opening cut should match or exceed wall thickness (Y in local wall shape space)
        const openingGeom = new THREE.BoxGeometry(
          opening.width,        // X-dimension in local space (along wall length)
          wallData.thickness * 1.5, // Y-dimension (through wall thickness, make it slightly larger to ensure cut)
          opening.height        // Z-dimension (height of opening)
        );

        // Position the opening brush in the wall's local coordinate system.
        // The wall's ExtrudeGeometry was created from a 2D shape on XY plane, then extruded along Z.
        // The 2D shape's points were (p0,p1,p2,p3) which formed a rectangle.
        // Let's assume the local origin (0,0) of that 2D shape corresponds to the center of the wall's thickness,
        // and the midpoint of the wall's start edge (between p0 and p3).
        // The extrusion happens from Z=0 to Z=wall.height.

        // Position for opening brush center:
        // X: along the wall's length. The wall's local X-axis for the geometry usually aligns with its length.
        //    If the shape was defined from (0,0) to (wallLength, thickness), then position is opening.position.
        //    The current wall shape p0,p1,p2,p3 is not necessarily aligned with origin like that.
        //    It's simpler to think: opening.position is distance from wall.start.
        //    The ExtrudeGeometry's length dimension is `wallLength`.
        //    Local X for opening center: opening.position - wallLength / 2 (if origin is center of length)
        //    OR opening.position (if origin is start of length).
        //    The current wall shape is created directly from world-like coordinates, not shifted to origin.
        //    This makes local space CSG tricky.
        //
        // Let's use world space CSG, it's more straightforward with three-mesh-bvh if objects are transformed.
        // 1. Create wallMesh and add to group (temporarily, or operate on it before adding).
        // 2. For each opening, create a brush mesh, position and rotate it in WORLD space.
        // 3. Perform CSG.

        // Revert to world-space CSG for simplicity of positioning opening brushes:
        // Ensure wallMesh matrix is up-to-date.
        wallMesh.updateMatrixWorld(); // Important!
        wallBrush = new Brush(wallMesh.geometry, wallMesh.matrixWorld.clone()); // Use world matrix


        const openingBrushMesh = new THREE.Mesh(openingGeom); // Material doesn't matter for CSG tool

        // Calculate world position and orientation for the opening brush
        const wallDir = new THREE.Vector3()
            .subVectors(
                new THREE.Vector3(wallData.end.x, wallData.end.y, wallData.end.z || wallBaseElevation),
                new THREE.Vector3(wallData.start.x, wallData.start.y, wallData.start.z || wallBaseElevation)
            );
        const wallLocalLength = wallDir.length(); // This is the true 3D length if Z differs
        wallDir.normalize();

        // Position along the wall line
        const openingCenterWorld = new THREE.Vector3(wallData.start.x, wallData.start.y, wallData.start.z || wallBaseElevation)
          .addScaledVector(wallDir, opening.position + opening.width / 2); // Center of opening width along wallDir

        // Adjust for elevation from wall base
        openingCenterWorld.z += opening.elevation + opening.height / 2;

        openingBrushMesh.position.copy(openingCenterWorld);

        // Align brush with wall. The Box is created with its depth along its local Z.
        // We want Box's local X along wallDir, local Z as opening height, local Y as thickness.
        // So, BoxGeometry(width, height, depth) -> (opening.width, opening.height, wallData.thickness*1.5)
        // And then align this Box's local X with wallDir.
        // The current BoxGeometry is (opening.width, wallData.thickness*1.5, opening.height)
        // This means local X is opening.width, local Y is wallData.thickness, local Z is opening.height.
        // We need its local X (width) to align with wallDir.
        // Its local Z (height) to align with world Z.
        // Its local Y (thickness) to align with wallPerp (across thickness).

        // Make opening brush look in the direction of the wall
        // This is complex. A simpler way: the wall itself is extruded from a 2D footprint.
        // The opening should be a 2D shape cut from that footprint, then extruded.
        // However, three-mesh-bvh works on 3D brushes.

        // Let's align the openingBrushMesh to the wall:
        // The wall mesh is not rotated if dir is along X or Y axis.
        // Its geometry is built such that its length aligns with the segment between start/end in XY plane.
        // And its height extends along Z.
        // So, the opening brush also needs to be positioned in XY and Z, without complex rotation if wall is axis-aligned.
        // The important part is that openingBrushMesh.matrixWorld is correct.
        const angle = Math.atan2(wallDir.y, wallDir.x);
        openingBrushMesh.rotation.z = angle; // Rotate around Z axis to align with wall segment in XY plane

        openingBrushMesh.updateMatrixWorld(); // Crucial for CSG tool

        const toolBrush = new Brush(openingGeom, openingBrushMesh.matrixWorld.clone());

        // Perform CSG
        // The result of evaluate will have its matrix reset (identity).
        // We need to preserve the original wallMesh's world transform.
        const tempResultMesh = csgEvaluator.evaluate(wallBrush, toolBrush, SUBTRACTION);
        tempResultMesh.matrixAutoUpdate = false; // Avoid matrix recalculations by R3F if not needed

        // The result geometry is in world space. We need to transform it back to wall's local space
        // if we want to replace wallMesh.geometry and keep wallMesh.position/rotation.
        // OR, create a new mesh from tempResultMesh and ensure its matrix is identity, then add to group.
        // This is getting complicated.
        // A common pattern:
        // 1. wallMesh (target) and openingBrushMesh (tool) are positioned in world space.
        // 2. wallBrush = new Brush(wallMesh.geometry, wallMesh.matrixWorld);
        // 3. toolBrush = new Brush(openingBrushMesh.geometry, openingBrushMesh.matrixWorld);
        // 4. result = evaluator.evaluate(wallBrush, toolBrush, SUBTRACTION);
        // 5. result.material = wallMesh.material; result.matrix.identity(); group.add(result);
        // This means the original wallMesh is removed/hidden, and this 'result' (which is a new Mesh) is added.
        // This is done for each opening sequentially. wallBrush must be updated from previous result.

        if (tempResultMesh) { // Check if CSG operation was successful
            wallBrush = new Brush(tempResultMesh.geometry); // Next operation uses the result of the previous
            // The geometry in tempResultMesh is already in world coordinates.
            // For the next iteration, wallBrush needs its geometry and matrix correctly set.
            // If we keep wallMesh.matrixWorld as identity and geometry in world space:
            // wallBrush.matrix = new THREE.Matrix4(); // Identity
        } else {
            console.warn("CSG operation resulted in empty geometry for opening:", opening.id, "on wall:", wallData.id);
        }
      });

      // After all openings, create the final mesh for the wall
      if (wallBrush.geometry && wallBrush.geometry.index && wallBrush.geometry.attributes.position) {
          const finalWallMesh = new THREE.Mesh(wallBrush.geometry, DEFAULT_WALL_MATERIAL.clone());
          // The geometry in wallBrush is now in world space because we used matrixWorld for brushes.
          // So, the finalWallMesh should be added at origin with no rotation.
          finalWallMesh.name = `Wall_${wallData.id}_CSG`;
          group.add(finalWallMesh);
      } else {
          console.warn("Wall CSG result was empty or invalid, adding original wall for:", wallData.id);
          group.add(wallMesh); // Add original wall if CSG failed
      }


    } else { // No openings, add original wall mesh
        group.add(wallMesh);
    }
  });

  // Trusses (Instanced) - Simplified v0.1
  if (model.trusses && model.trusses.spacing > 0) {
    const trussSettings = model.trusses;

    // Define a basic geometry for a single truss element
    // For v0.1, a simple long thin box. Dimensions need to be defined.
    // const trussLength = 10; // Placeholder: This will be determined by floor/building span
    const trussHeight = 0.3; // Placeholder
    const trussWidth = 0.1;  // Placeholder
    // Create a unit-length truss geometry (length 1 along X), to be scaled by Matrix4 for each instance
    const singleTrussGeometry = new THREE.BoxGeometry(1, trussHeight, trussWidth);

    // Determine number of trusses and placement
    // This is highly simplified. Assume trusses run along X, spaced along Y.
    // And cover a certain area, e.g., based on first floor's bounding box or a default area.
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    if (model.floors.length > 0) {
        model.floors[0].points.forEach(p => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });
    } else { // Default span if no floors
        minX = -5; maxX = 5; minY = -5; maxY = 5;
    }

    const spanY = (maxY !== -Infinity) ? (maxY - minY) : 10; // Default span if no floor points
    const actualTrussLength = (maxX !== -Infinity && minX !== Infinity) ? (maxX - minX) : 10; // Default to 10 if no valid span

    // singleTrussGeometry is now unit length (1m) along X. It will be scaled for each instance.
    // The if block for disposing geometry is removed.

    const numberOfTrusses = Math.floor(spanY / trussSettings.spacing);
    if (numberOfTrusses > 0 && actualTrussLength > 0) {
        const instancedTrussMesh = new THREE.InstancedMesh(
            singleTrussGeometry, // Unit geometry
            DEFAULT_TRUSS_MATERIAL.clone(),
            numberOfTrusses
        );
        instancedTrussMesh.name = "Trusses";

        const dummy = new THREE.Object3D(); // Used to compute matrices

        for (let i = 0; i < numberOfTrusses; i++) {
            dummy.position.set(
                minX + actualTrussLength / 2, // Center of the truss along X
                minY + i * trussSettings.spacing + trussSettings.spacing / 2, // Position along Y
                (model.floors[0]?.elevation || 0) + (model.walls[0]?.height || 3) + trussHeight / 2 // Position above walls/floor
            );
            dummy.scale.set(actualTrussLength, 1, 1); // Scale the unit truss to actualTrussLength
            // dummy.rotation.set(0, 0, 0); // Default rotation (e.g., along X axis)
            dummy.updateMatrix();
            instancedTrussMesh.setMatrixAt(i, dummy.matrix);
        }
        instancedTrussMesh.instanceMatrix.needsUpdate = true;
        group.add(instancedTrussMesh);
    } else {
        singleTrussGeometry.dispose(); // Dispose if not used
    }
    // TODO: More complex truss logic, orientation, connection to roof geometry etc.
  }

  return group;
}
