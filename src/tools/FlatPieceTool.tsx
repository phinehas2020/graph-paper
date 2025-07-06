import React, { useState, useCallback, useEffect } from 'react';
import useStore from '@/src/model/useStore';
import { Point, FlatPiece } from '@/src/model/types';
import { formatMeasurement } from './MeasurementUtils';

interface FlatPieceToolProps {
  isActive: boolean;
  pieceType: 'floor' | 'wall';
  onPieceSelected?: (piece: FlatPiece) => void;
}

const FlatPieceTool: React.FC<FlatPieceToolProps> = ({ 
  isActive, 
  pieceType,
  onPieceSelected 
}) => {
  const { addFlatPiece } = useStore.getState();

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [dimensions, setDimensions] = useState({ width: 10, height: 8 });
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetDrawingState = useCallback(() => {
    setStartPoint(null);
    setEndPoint(null);
    setIsDrawing(false);
    setError(null);
  }, []);

  const handlePointerDown = useCallback((point: Point) => {
    if (!isActive) return;
    setError(null);

    if (!isDrawing) {
      setStartPoint(point);
      setIsDrawing(true);
      setEndPoint(point);
    } else {
      // Finalize the piece
      if (startPoint && endPoint) {
        const width = Math.abs(endPoint.x - startPoint.x);
        const height = Math.abs(endPoint.y - startPoint.y);
        
        if (width < 2 || height < 2) {
          setError("Piece must be at least 2x2 units");
          return;
        }

        const newPiece: Omit<FlatPiece, 'id'> = {
          type: pieceType,
          position: {
            x: Math.min(startPoint.x, endPoint.x),
            y: Math.min(startPoint.y, endPoint.y)
          },
          rotation: 0,
          dimensions: { width, height },
          color: pieceType === 'floor' ? '#8B4513' : '#D2B48C',
          label: label || `${pieceType.charAt(0).toUpperCase() + pieceType.slice(1)} ${Date.now().toString().slice(-4)}`,
          openings: []
        };

        const pieceId = addFlatPiece(newPiece);
        console.log(`FlatPieceTool: Added ${pieceType} piece: ${pieceId}`);
        
        // Reset for next piece
        resetDrawingState();
      }
    }
  }, [isActive, isDrawing, startPoint, endPoint, dimensions, label, pieceType, addFlatPiece, resetDrawingState]);

  const handlePointerMove = useCallback((point: Point) => {
    if (!isActive || !isDrawing || !startPoint) return;
    setEndPoint(point);
  }, [isActive, isDrawing, startPoint]);

  const handleFinishDrawing = useCallback(() => {
    if (isDrawing) {
      console.log("FlatPieceTool: Finishing drawing session.");
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

  const getPreviewDimensions = () => {
    if (!startPoint || !endPoint) return null;
    return {
      width: Math.abs(endPoint.x - startPoint.x),
      height: Math.abs(endPoint.y - startPoint.y)
    };
  };

  return (
    <div style={{ display: isActive ? 'block' : 'none', padding: '10px', border: '1px solid grey' }}>
      <h4>
        {pieceType.charAt(0).toUpperCase() + pieceType.slice(1)} Tool
        {isDrawing && " (Drawing...)"}
      </h4>
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <div style={{ marginBottom: '10px' }}>
        <label>
          Piece Label:
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={`Auto-generated ${pieceType} name`}
            style={{ marginLeft: '5px', padding: '2px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>
          Default Width:
          <input
            type="number"
            value={dimensions.width}
            onChange={(e) => setDimensions(prev => ({ ...prev, width: Number(e.target.value) }))}
            min="2"
            step="0.5"
            style={{ marginLeft: '5px', padding: '2px', width: '60px' }}
          />
        </label>
        <label style={{ marginLeft: '10px' }}>
          Default Height:
          <input
            type="number"
            value={dimensions.height}
            onChange={(e) => setDimensions(prev => ({ ...prev, height: Number(e.target.value) }))}
            min="2"
            step="0.5"
            style={{ marginLeft: '5px', padding: '2px', width: '60px' }}
          />
        </label>
      </div>

      {isDrawing && startPoint && endPoint && (
        <div>
          <p>Start: ({formatMeasurement(startPoint.x)}, {formatMeasurement(startPoint.y)})</p>
          <p>End: ({formatMeasurement(endPoint.x)}, {formatMeasurement(endPoint.y)})</p>
          {(() => {
            const previewDims = getPreviewDimensions();
            return previewDims ? (
              <p>Size: {formatMeasurement(previewDims.width)} x {formatMeasurement(previewDims.height)}</p>
            ) : null;
          })()}
        </div>
      )}

      <button onClick={handleFinishDrawing} disabled={!isDrawing}>
        Finish Drawing (Esc/Enter)
      </button>

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <p>Click and drag to create a {pieceType} piece.</p>
        <p>The piece will be positioned flat on the canvas where you can add openings.</p>
      </div>
    </div>
  );
};

export default FlatPieceTool;
