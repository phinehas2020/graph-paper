import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import useStore from '@/src/model/useStore';
import { Point, Wall, Floor, Measurement, TextElement } from '@/src/model/types';

interface Canvas2DProps {
  width: number;
  height: number;
  activeTool: 'floor' | 'wall' | 'select' | 'measure' | 'text' | null;
  onToolAction?: (action: string, data: any) => void;
}

const GRID_SIZE = 20; // pixels per grid unit
const SNAP_THRESHOLD = 10; // pixels
const CONNECTION_THRESHOLD = 0.5; // grid units

export const Canvas2D: React.FC<Canvas2DProps> = ({ 
  width, 
  height, 
  activeTool, 
  onToolAction 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [previewPoint, setPreviewPoint] = useState<Point | null>(null);
  const [draggedWall, setDraggedWall] = useState<{wallId: string, endpoint: 'start' | 'end'} | null>(null);
  const [editingText, setEditingText] = useState<{id: string, text: string} | null>(null);
  const [textInput, setTextInput] = useState('');
  
  const { 
    walls,
    floors,
    measurements,
    textElements,
    settings,
    addFloor, 
    addWall, 
    updateWall,
    addMeasurement,
    addTextElement,
    updateTextElement,
    updateSettings,
    clearTemporaryMeasurements,
    connectWalls,
    autoConnectNearbyWalls 
  } = useStore();

  // Convert screen coordinates to grid coordinates
  const screenToGrid = useCallback((screenX: number, screenY: number): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    const x = (screenX - rect.left - width / 2) / GRID_SIZE;
    const y = -(screenY - rect.top - height / 2) / GRID_SIZE; // Flip Y axis
    
    return settings.gridVisible ? {
      x: Math.round(x * 2) / 2, // Snap to half-grid
      y: Math.round(y * 2) / 2
    } : { x, y };
  }, [width, height, settings.gridVisible]);

  // Convert grid coordinates to screen coordinates
  const gridToScreen = useCallback((gridX: number, gridY: number): Point => {
    return {
      x: gridX * GRID_SIZE + width / 2,
      y: -gridY * GRID_SIZE + height / 2 // Flip Y axis
    };
  }, [width, height]);

  // Find nearby wall endpoints for snapping
  const findNearbyEndpoint = useCallback((point: Point): {wallId: string, endpoint: 'start' | 'end', point: Point} | null => {
    for (const wall of walls) {
      const startDist = Math.sqrt((wall.start.x - point.x) ** 2 + (wall.start.y - point.y) ** 2);
      const endDist = Math.sqrt((wall.end.x - point.x) ** 2 + (wall.end.y - point.y) ** 2);
      
      if (startDist <= CONNECTION_THRESHOLD) {
        return { wallId: wall.id, endpoint: 'start', point: wall.start };
      }
      if (endDist <= CONNECTION_THRESHOLD) {
        return { wallId: wall.id, endpoint: 'end', point: wall.end };
      }
    }
    return null;
  }, [walls]);

  // Drawing functions
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!settings.gridVisible) return;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    const gridSpacing = GRID_SIZE;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Vertical lines
    for (let x = centerX % gridSpacing; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = centerY % gridSpacing; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Axes
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
  }, [width, height, settings.gridVisible]);

  const drawFloors = useCallback((ctx: CanvasRenderingContext2D) => {
    floors.forEach(floor => {
      if (floor.points.length < 3) return;
      
      ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      const firstPoint = gridToScreen(floor.points[0].x, floor.points[0].y);
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      for (let i = 1; i < floor.points.length; i++) {
        const point = gridToScreen(floor.points[i].x, floor.points[i].y);
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }, [floors, gridToScreen]);

  const drawWalls = useCallback((ctx: CanvasRenderingContext2D) => {
    walls.forEach(wall => {
      const start = gridToScreen(wall.start.x, wall.start.y);
      const end = gridToScreen(wall.end.x, wall.end.y);
      
      // Wall line
      ctx.strokeStyle = wall.connected ? '#4CAF50' : '#2196F3';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      
      // Endpoints
      ctx.fillStyle = wall.connected ? '#4CAF50' : '#2196F3';
      ctx.beginPath();
      ctx.arc(start.x, start.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(end.x, end.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Connection indicators
      if (wall.connections) {
        if (wall.connections.start && wall.connections.start.length > 0) {
          ctx.strokeStyle = '#FF9800';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(start.x, start.y, 10, 0, 2 * Math.PI);
          ctx.stroke();
        }
        if (wall.connections.end && wall.connections.end.length > 0) {
          ctx.strokeStyle = '#FF9800';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(end.x, end.y, 10, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    });
  }, [walls, gridToScreen]);

  const drawMeasurements = useCallback((ctx: CanvasRenderingContext2D) => {
    measurements.forEach(measurement => {
      const start = gridToScreen(measurement.start.x, measurement.start.y);
      const end = gridToScreen(measurement.end.x, measurement.end.y);
      
      // Measurement line
      ctx.strokeStyle = '#9C27B0';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Measurement endpoints
      ctx.fillStyle = '#9C27B0';
      ctx.beginPath();
      ctx.arc(start.x, start.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(end.x, end.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Calculate distance
      const distance = Math.sqrt(
        (measurement.end.x - measurement.start.x) ** 2 + 
        (measurement.end.y - measurement.start.y) ** 2
      );
      
      // Display measurement text
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#9C27B0';
      ctx.lineWidth = 1;
      
      const text = measurement.label || `${distance.toFixed(2)} ${measurement.units === 'metric' ? 'm' : 'ft'}`;
      ctx.font = '12px Arial';
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = 16;
      
      // Background rectangle
      ctx.fillRect(midX - textWidth/2 - 4, midY - textHeight/2 - 2, textWidth + 8, textHeight + 4);
      ctx.strokeRect(midX - textWidth/2 - 4, midY - textHeight/2 - 2, textWidth + 8, textHeight + 4);
      
      // Text
      ctx.fillStyle = '#9C27B0';
      ctx.fillText(text, midX - textWidth/2, midY + 4);
    });
  }, [measurements, gridToScreen]);

  const drawTextElements = useCallback((ctx: CanvasRenderingContext2D) => {
    textElements.forEach(textElement => {
      const position = gridToScreen(textElement.position.x, textElement.position.y);
      
      ctx.save();
      ctx.translate(position.x, position.y);
      ctx.rotate((textElement.rotation * Math.PI) / 180);
      
      ctx.font = `${textElement.fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Use current input text if this element is being edited
      const displayText = editingText?.id === textElement.id ? textInput : textElement.text;
      const textMetrics = ctx.measureText(displayText);
      const textWidth = textMetrics.width;
      const textHeight = textElement.fontSize;
      
      // Background
      ctx.fillStyle = editingText?.id === textElement.id ? 'rgba(255, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(-textWidth/2 - 4, -textHeight/2 - 2, textWidth + 8, textHeight + 4);
      
      // Border for editing
      if (editingText?.id === textElement.id) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(-textWidth/2 - 4, -textHeight/2 - 2, textWidth + 8, textHeight + 4);
      }
      
      // Text
      ctx.fillStyle = textElement.color;
      ctx.fillText(displayText, 0, 0);
      
      // Cursor for editing
      if (editingText?.id === textElement.id) {
        const cursorX = textWidth/2 + 2;
        ctx.strokeStyle = textElement.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cursorX, -textHeight/2);
        ctx.lineTo(cursorX, textHeight/2);
        ctx.stroke();
      }
      
      ctx.restore();
    });
  }, [textElements, gridToScreen, editingText, textInput]);

  const drawCurrentDrawing = useCallback((ctx: CanvasRenderingContext2D) => {
    if (activeTool === 'floor' && currentPoints.length > 0) {
      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      const firstPoint = gridToScreen(currentPoints[0].x, currentPoints[0].y);
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      for (let i = 1; i < currentPoints.length; i++) {
        const point = gridToScreen(currentPoints[i].x, currentPoints[i].y);
        ctx.lineTo(point.x, point.y);
      }
      
      if (previewPoint) {
        const preview = gridToScreen(previewPoint.x, previewPoint.y);
        ctx.lineTo(preview.x, preview.y);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Show points
      currentPoints.forEach(point => {
        const screenPoint = gridToScreen(point.x, point.y);
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(screenPoint.x, screenPoint.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
    
    if (activeTool === 'wall' && currentPoints.length === 1 && previewPoint) {
      const start = gridToScreen(currentPoints[0].x, currentPoints[0].y);
      const end = gridToScreen(previewPoint.x, previewPoint.y);
      
      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    if (activeTool === 'measure' && currentPoints.length === 1 && previewPoint) {
      const start = gridToScreen(currentPoints[0].x, currentPoints[0].y);
      const end = gridToScreen(previewPoint.x, previewPoint.y);
      
      ctx.strokeStyle = '#9C27B0';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Show preview measurement
      const distance = Math.sqrt(
        (previewPoint.x - currentPoints[0].x) ** 2 + 
        (previewPoint.y - currentPoints[0].y) ** 2
      );
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      ctx.fillStyle = '#9C27B0';
      ctx.font = '12px Arial';
      const text = `${distance.toFixed(2)} ${settings.units === 'metric' ? 'm' : 'ft'}`;
      const textWidth = ctx.measureText(text).width;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(midX - textWidth/2 - 4, midY - 8, textWidth + 8, 16);
      ctx.fillStyle = '#9C27B0';
      ctx.fillText(text, midX - textWidth/2, midY + 4);
    }
    
    // Show measurement points being drawn
    if (activeTool === 'measure' && currentPoints.length > 0) {
      currentPoints.forEach(point => {
        const screenPoint = gridToScreen(point.x, point.y);
        ctx.fillStyle = '#9C27B0';
        ctx.beginPath();
        ctx.arc(screenPoint.x, screenPoint.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [activeTool, currentPoints, previewPoint, gridToScreen, settings.units]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw layers
    drawGrid(ctx);
    drawFloors(ctx);
    drawWalls(ctx);
    drawMeasurements(ctx);
    drawTextElements(ctx);
    drawCurrentDrawing(ctx);
  }, [width, height, drawGrid, drawFloors, drawWalls, drawMeasurements, drawTextElements, drawCurrentDrawing]);

  // Event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const point = screenToGrid(e.clientX, e.clientY);
    
    if (activeTool === 'floor') {
      if (!isDrawing) {
        setCurrentPoints([point]);
        setIsDrawing(true);
      } else {
        // Check if clicking near first point to close
        if (currentPoints.length > 2) {
          const firstPoint = currentPoints[0];
          const distance = Math.sqrt((firstPoint.x - point.x) ** 2 + (firstPoint.y - point.y) ** 2);
          if (distance < CONNECTION_THRESHOLD) {
            // Close floor
            addFloor({
              points: currentPoints,
              elevation: 0,
              thickness: 0.2
            });
            setCurrentPoints([]);
            setIsDrawing(false);
            setPreviewPoint(null);
            onToolAction?.('floor-completed', { points: currentPoints });
            return;
          }
        }
        setCurrentPoints(prev => [...prev, point]);
      }
    }
    
    if (activeTool === 'wall') {
      if (!isDrawing) {
        setCurrentPoints([point]);
        setIsDrawing(true);
      } else {
        // Complete wall
        const wallId = addWall({
          start: currentPoints[0],
          end: point,
          height: 3,
          thickness: 0.15
        });
        
        // Auto-connect to nearby walls
        autoConnectNearbyWalls(CONNECTION_THRESHOLD);
        
        // Start new wall from current point
        setCurrentPoints([point]);
        onToolAction?.('wall-completed', { wallId, start: currentPoints[0], end: point });
      }
    }
    
    if (activeTool === 'measure') {
      if (!isDrawing) {
        setCurrentPoints([point]);
        setIsDrawing(true);
      } else {
        // Complete measurement
        const measurementId = addMeasurement({
          start: currentPoints[0],
          end: point,
          showDimensions: true,
          units: settings.units,
          temporary: settings.measurementMode === 'temporary'
        });
        
        // Start new measurement from current point (like wall tool)
        setCurrentPoints([point]);
        onToolAction?.('measurement-completed', { measurementId, start: currentPoints[0], end: point });
      }
    }
    
    if (activeTool === 'text') {
      // Add text element
      const textId = addTextElement({
        position: point,
        text: 'Text',
        fontSize: 16,
        color: '#000000',
        rotation: 0
      });
      setEditingText({ id: textId, text: 'Text' });
      setTextInput('Text');
      updateSettings({ isTextEditing: true });
      onToolAction?.('text-added', { id: textId, position: point });
    }
    
    if (activeTool === 'select') {
      // Check if clicking on wall endpoint for dragging connections
      const nearby = findNearbyEndpoint(point);
      if (nearby) {
        setDraggedWall({ wallId: nearby.wallId, endpoint: nearby.endpoint });
      }
    }
  }, [activeTool, isDrawing, currentPoints, screenToGrid, addFloor, addWall, addMeasurement, addTextElement, updateSettings, autoConnectNearbyWalls, findNearbyEndpoint, settings.units, settings.measurementMode, onToolAction]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = screenToGrid(e.clientX, e.clientY);
    
    if (isDrawing) {
      setPreviewPoint(point);
    }
  }, [isDrawing, screenToGrid]);

  const handleMouseUp = useCallback(() => {
    if (draggedWall) {
      setDraggedWall(null);
    }
  }, [draggedWall]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (editingText) {
        // Finish editing text
        updateTextElement(editingText.id, { text: textInput });
        setEditingText(null);
        setTextInput('');
        updateSettings({ isTextEditing: false });
      } else {
        setCurrentPoints([]);
        setIsDrawing(false);
        setPreviewPoint(null);
        setDraggedWall(null);
      }
    }
    if (e.key === 'Enter' && activeTool === 'wall' && isDrawing) {
      setCurrentPoints([]);
      setIsDrawing(false);
      setPreviewPoint(null);
    }
    if (e.key === 'Enter' && activeTool === 'measure' && isDrawing) {
      setCurrentPoints([]);
      setIsDrawing(false);
      setPreviewPoint(null);
    }
    if (e.key === 'Enter' && editingText) {
      // Finish editing text
      updateTextElement(editingText.id, { text: textInput });
      setEditingText(null);
      setTextInput('');
      updateSettings({ isTextEditing: false });
    }
  }, [activeTool, isDrawing, editingText, textInput, updateTextElement, updateSettings]);

  const handleTextInput = useCallback((e: KeyboardEvent) => {
    if (editingText && settings.isTextEditing) {
      // Prevent all other keyboard shortcuts when editing text
      if (e.key !== 'Escape' && e.key !== 'Enter') {
        e.preventDefault();
        e.stopPropagation();
      }
      
      if (e.key === 'Backspace') {
        setTextInput(prev => prev.slice(0, -1));
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setTextInput(prev => prev + e.key);
      }
    }
  }, [editingText, settings.isTextEditing]);

  // Effects
  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleTextInput);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleTextInput);
    };
  }, [handleKeyDown, handleTextInput]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: '1px solid #ccc', cursor: activeTool ? 'crosshair' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};
