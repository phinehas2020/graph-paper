import React, { useState, useCallback, useEffect } from 'react';
import useStore from '@/src/model/useStore'; // Adjusted path based on tsconfig alias
import { Point, Floor } from '@/src/model/types'; // Adjusted path

// Props for the FloorTool - to be expanded as canvas interaction is defined
interface FloorToolProps {
  isActive: boolean;
  // Example: Callbacks for canvas interaction
  // onDrawingUpdate?: (points: Point[], isPreview: boolean) => void; // To visualize drawing
  // requestPointerCapture?: (pointerId: number) => void;
  // releasePointerCapture?: (pointerId: number) => void;
}

// Helper function to calculate polygon area (Shoelace formula)
export const calculatePolygonArea = (points: Point[]): number => {
  let area = 0;
  const n = points.length;
  if (n < 3) return 0;

  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n]; // Wrap around for the last point
    area += (p1.x * p2.y) - (p2.x * p1.y);
  }
  return Math.abs(area / 2);
};

// Helper function to check if points are in clockwise order
// (sum over edges (x2-x1)(y2+y1); >0 for clockwise)
export const isClockwise = (points: Point[]): boolean => {
  let sum = 0;
  const n = points.length;
  if (n < 3) return false; // Not a polygon

  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    sum += (p2.x - p1.x) * (p2.y + p1.y);
  }
  return sum > 0;
};


const FloorTool: React.FC<FloorToolProps> = ({ isActive }) => {
  const { addFloor } = useStore.getState(); // Get actions directly for now

  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate pointer events - these would be props from a canvas component
  // For now, we can call these manually or via useEffect for testing logic

  const handlePointerDown = useCallback((point: Point) => {
    if (!isActive) return;
    setError(null);

    if (!isDrawing) {
      setCurrentPoints([point]);
      setIsDrawing(true);
      // onDrawingUpdate?.([point], true);
    } else {
      // Check if clicking near the first point to close polygon (simplified)
      if (currentPoints.length > 2) {
        const firstPoint = currentPoints[0];
        const distance = Math.sqrt(Math.pow(firstPoint.x - point.x, 2) + Math.pow(firstPoint.y - point.y, 2));
        if (distance < 0.5) { // Assuming 0.5 grid units as a threshold for closing
          handleFinishFloor();
          return;
        }
      }
      setCurrentPoints(prevPoints => [...prevPoints, point]);
      // onDrawingUpdate?.([...currentPoints, point], true);
    }
  }, [isActive, isDrawing, currentPoints]);

  const handlePointerMove = useCallback((point: Point) => {
    if (!isActive || !isDrawing || currentPoints.length === 0) return;

    setCurrentPoints(prevPoints => {
      const newPoints = [...prevPoints];
      newPoints[newPoints.length - 1] = point; // Update the last point for live preview
      return newPoints;
    });
    // onDrawingUpdate?.(currentPoints, true); // currentPoints here would be the newPoints
  }, [isActive, isDrawing, currentPoints.length]);


  const handleFinishFloor = useCallback(() => {
    if (!isDrawing || currentPoints.length < 3) {
      setError("A floor must have at least 3 points.");
      setIsDrawing(false); // Reset if invalid attempt to finish
      setCurrentPoints([]);
      // onDrawingUpdate?.([], false);
      return;
    }

    let finalPoints = [...currentPoints];
    // Optional: Auto-close by connecting last point to first if not already done
    // For simplicity, we assume handlePointerDown near first point handles explicit closing

    if (!isClockwise(finalPoints)) {
      // Option 1: Show error
      // setError("Floor points must be in clockwise order. Please redraw.");
      // Option 2: Auto-correct (reverse the points)
      finalPoints.reverse();
      if (!isClockwise(finalPoints)) {
         // This should not happen if reversal works, but as a safeguard
        setError("Failed to auto-correct point order. Please redraw clockwise.");
        setIsDrawing(false);
        setCurrentPoints([]);
        // onDrawingUpdate?.([], false);
        return;
      }
       console.log("FloorTool: Points were counter-clockwise, automatically reversed.");
    }

    const area = calculatePolygonArea(finalPoints);
    console.log(`FloorTool: Calculated area: ${area}`); // For debugging

    // Add floor to store (using default elevation/thickness for now)
    addFloor({
      points: finalPoints,
      elevation: 0, // Default elevation
      thickness: 0.2, // Default thickness
    });

    console.log("FloorTool: Floor added successfully.");
    setCurrentPoints([]);
    setIsDrawing(false);
    setError(null);
    // onDrawingUpdate?.([], false); // Clear drawing from canvas
  }, [isDrawing, currentPoints, addFloor]);

  // Effect to reset tool state if isActive becomes false
  useEffect(() => {
    if (!isActive) {
      setCurrentPoints([]);
      setIsDrawing(false);
      setError(null);
    }
  }, [isActive]);

  // This tool itself doesn't render much.
  // It provides logic to a parent canvas/SVG component.
  // UI elements like a "Finish" button could be added here if needed.
  return (
    <div style={{ display: isActive ? 'block' : 'none', padding: '10px', border: '1px solid grey' }}>
      <h4>Floor Tool {isDrawing ? "(Drawing...)" : ""}</h4>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <p>Points: {currentPoints.length}</p>
      {/*
        Example buttons for manual control if not using pointer-close
        <button onClick={() => handlePointerDown({x: Math.random()*10, y: Math.random()*10, z:0})} disabled={!isActive}>Add Point (Simulated)</button>
        <button onClick={handleFinishFloor} disabled={!isActive || !isDrawing || currentPoints.length < 3}>Finish Floor</button>
        <button onClick={() => { setIsDrawing(false); setCurrentPoints([]); setError(null); }}>Cancel</button>
      */}
      <div>
        <h5>Current Points (Debug):</h5>
        <pre>{JSON.stringify(currentPoints, null, 2)}</pre>
      </div>
    </div>
  );
};

export default FloorTool;
