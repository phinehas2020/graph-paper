import React, { useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { BufferGeometry, Vector3 } from 'three';
// import useStore from '@/src/model/useStore'; // Not used directly in this component
import { Wall, Floor, Point as ModelPoint } from '@/src/model/types';

// Helper function to find the closest point on a line segment (p1-p2) to a point (p)
function closestPointOnSegment(p: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3): THREE.Vector3 {
  const l2 = p1.distanceToSquared(p2);
  if (l2 === 0) return p1.clone(); // p1 and p2 are the same
  let t = ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y) + (p.z - p1.z) * (p2.z - p1.z)) / l2;
  t = Math.max(0, Math.min(1, t)); // Clamp t to the [0, 1] range
  return new THREE.Vector3().copy(p1).lerp(p2, t);
}

interface StitchConnection {
  id: string; // wall.id
  wallMid: THREE.Vector3;
  floorPoint: THREE.Vector3;
}

interface StitchAnimationProps {
  isActive: boolean;
  walls: Wall[];
  floors: Floor[];
  onAnimationComplete: (connectedWallIds: string[]) => void;
}

const STITCH_ANIMATION_DURATION_MS = 1500; // Total duration for all lines to appear
const LINE_MATERIAL = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 2, transparent: true, opacity: 0 });

const StitchAnimation: React.FC<StitchAnimationProps> = ({ isActive, walls, floors, onAnimationComplete }) => {
  const [animatedLines, setAnimatedLines] = useState<StitchConnection[]>([]);
  const [visibleLineCount, setVisibleLineCount] = useState(0);

  const connectionsToAnimate = useMemo(() => {
    if (!walls || !floors || floors.length === 0) return [];

    const connections: StitchConnection[] = [];
    const targetFloor = floors[0]; // For v0.1, always connect to the first floor.
    // More advanced: find closest floor based on elevation or spatial proximity.

    if (!targetFloor || targetFloor.points.length < 2) return [];

    walls.forEach(wall => {
      if (wall.connected) return; // Skip already connected walls

      const wallBaseZ = wall.start.z || 0;
      const wallMid2D = new THREE.Vector2((wall.start.x + wall.end.x) / 2, (wall.start.y + wall.end.y) / 2);
      const wallMid = new THREE.Vector3(wallMid2D.x, wallMid2D.y, wallBaseZ);

      let overallClosestFloorPoint = new THREE.Vector3();
      let minDistanceSq = Infinity;

      for (let i = 0; i < targetFloor.points.length; i++) {
        const p1Model = targetFloor.points[i];
        const p2Model = targetFloor.points[(i + 1) % targetFloor.points.length];

        // Assuming floor points define the perimeter at floor.elevation
        const p1Floor = new THREE.Vector3(p1Model.x, p1Model.y, targetFloor.elevation);
        const p2Floor = new THREE.Vector3(p2Model.x, p2Model.y, targetFloor.elevation);

        const closestPtOnEdge = closestPointOnSegment(wallMid, p1Floor, p2Floor);
        const distSq = wallMid.distanceToSquared(closestPtOnEdge);

        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          overallClosestFloorPoint.copy(closestPtOnEdge);
        }
      }
      connections.push({ id: wall.id, wallMid, floorPoint: overallClosestFloorPoint });
    });
    return connections;
  }, [walls, floors]);

  useEffect(() => {
    if (isActive && connectionsToAnimate.length > 0) {
      setAnimatedLines(connectionsToAnimate);
      setVisibleLineCount(0); // Reset visibility

      const linesToProcess = connectionsToAnimate.length;
      if (linesToProcess === 0) {
        onAnimationComplete([]);
        return;
      }

      const intervalTime = STITCH_ANIMATION_DURATION_MS / linesToProcess;
      let linesShown = 0;

      const timer = setInterval(() => {
        linesShown++;
        setVisibleLineCount(linesShown);
        if (linesShown >= linesToProcess) {
          clearInterval(timer);
          // Delay onAnimationComplete slightly to allow final line to render fully opaque
          setTimeout(() => {
            onAnimationComplete(connectionsToAnimate.map(c => c.id));
          }, 100);
        }
      }, intervalTime);

      return () => {
        clearInterval(timer);
      };
    } else if (!isActive) {
      setAnimatedLines([]);
      setVisibleLineCount(0);
    }
  }, [isActive, connectionsToAnimate, onAnimationComplete]);

  if (!isActive || animatedLines.length === 0) {
    return null;
  }

  return (
    <group name="StitchAnimationLines">
      {animatedLines.slice(0, visibleLineCount).map((connection, index) => {
        const points = [connection.wallMid, connection.floorPoint];
        const geometry = new BufferGeometry().setFromPoints(points);
        // Note: LineBasicMaterial linewidth does not have an effect in modern three.js due to WebGL limitations.
        // For thicker lines, consider three.meshline, or a thin Cylinder/Box.
        // For animation, we make it appear by adding it to the render list. Opacity can also be animated.
        const material = LINE_MATERIAL.clone();
        material.opacity = 1; // Make it visible once it's time

        return (
          <lineSegments key={connection.id + "_" + index} geometry={geometry} material={material} />
        );
      })}
    </group>
  );
};

export default StitchAnimation;
