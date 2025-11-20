import React, { useState, useCallback, useEffect } from 'react';
import useStore from '@/src/model/useStore'; // Adjusted path based on tsconfig alias
import { Point, Wall } from '@/src/model/types'; // Adjusted path

interface WallToolProps {
  isActive: boolean;
  // onDrawingUpdate?: (points: Point[], previewPoint: Point | null) => void; // To visualize drawing
}

const WallTool: React.FC<WallToolProps> = ({ isActive /*, onDrawingUpdate */ }) => {
  const { addWall } = useStore();

  // currentWallPoints will store the start point of the current segment being drawn.
  // A wall is defined by two points. So, each click after the first one finalizes a wall segment.
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [previewEndPoint, setPreviewEndPoint] = useState<Point | null>(null); // For visual feedback on pointer move
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetDrawingState = useCallback(() => {
    setStartPoint(null);
    setPreviewEndPoint(null);
    setIsDrawing(false);
    setError(null);
    // onDrawingUpdate?.([], null);
  }, [/* onDrawingUpdate */]);

  const handlePointerDown = useCallback((point: Point) => {
    if (!isActive) return;
    setError(null);

    if (!isDrawing) {
      setStartPoint(point);
      setIsDrawing(true);
      setPreviewEndPoint(point); // Initialize preview for the first segment
      // onDrawingUpdate?.([point], point);
    } else if (startPoint) {
      // Finalize the current wall segment
      const newWallDataOmitId: Omit<Wall, 'id' | 'openings' | 'connected'> = {
        start: startPoint,
        end: point,
        height: 3, // Default height
        thickness: 0.15, // Default thickness
      };
      const newWallId = addWall(newWallDataOmitId);

      // Start a new wall segment from the current point
      setStartPoint(point);
      setPreviewEndPoint(point); // Reset preview for the next segment
      // onDrawingUpdate?.([point], point);
    }
  }, [isActive, isDrawing, startPoint, addWall /*, onDrawingUpdate */]);

  const handlePointerMove = useCallback((point: Point) => {
    if (!isActive || !isDrawing || !startPoint) return;
    setPreviewEndPoint(point); // Update the preview end point for the current segment
    // onDrawingUpdate?.(startPoint ? [startPoint] : [], point);
  }, [isActive, isDrawing, startPoint /*, onDrawingUpdate */]);

  const handleFinishDrawing = useCallback(() => {
    // This action effectively cancels the current segment and ends the drawing session.
    // If a wall segment was just completed by a click, that segment is already saved.
    // This is more like an "Escape" or "Enter" key press to stop drawing further walls.
    if (isDrawing) {
    }
    resetDrawingState();
  }, [isDrawing, resetDrawingState]);

  // Effect to reset tool state if isActive becomes false
  useEffect(() => {
    if (!isActive) {
      resetDrawingState();
    }
  }, [isActive, resetDrawingState]);

  // Handle 'Escape' or 'Enter' key to finish drawing
  useEffect(() => {
    if (!isActive || !isDrawing) return () => {};

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        handleFinishDrawing();
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isActive, isDrawing, handleFinishDrawing]);


  return (
    <div style={{ display: isActive ? 'block' : 'none', padding: '10px', border: '1px solid grey' }}>
      <h4>Wall Tool {isDrawing ? `(Drawing from ${JSON.stringify(startPoint)} to ${JSON.stringify(previewEndPoint)})` : ""}</h4>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {isDrawing && startPoint && (
        <div>
          <p>Current segment start: ({startPoint.x}, {startPoint.y})</p>
          {previewEndPoint && <p>Preview end: ({previewEndPoint.x}, {previewEndPoint.y})</p>}
        </div>
      )}
      <button onClick={handleFinishDrawing} disabled={!isDrawing}>
        Finish Drawing Session (Esc/Enter)
      </button>
      {/*
        Placeholder for where edit handle logic might be considered in the future.
        This tool currently focuses on drawing new walls.
      */}
    </div>
  );
};

export default WallTool;
