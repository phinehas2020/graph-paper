import React, { useRef, useEffect, useState, useCallback } from 'react';
import useStore from '@/src/model/useStore';
import { Point, FlatPiece, Connection, FlatOpening } from '@/src/model/types';
import FlatPieceTool from '@/src/tools/FlatPieceTool';
import ConnectionTool from '@/src/tools/ConnectionTool';

interface FlatLayoutCanvasProps {
  width: number;
  height: number;
  gridSize: number;
  showGrid: boolean;
  zoom: number;
  panOffset: Point;
}

type FlatTool = 'select' | 'floor-piece' | 'wall-piece' | 'connection' | 'opening' | 'wiring' | 'plumbing';

const FlatLayoutCanvas: React.FC<FlatLayoutCanvasProps> = ({
  width,
  height,
  gridSize,
  showGrid,
  zoom,
  panOffset
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTool, setCurrentTool] = useState<FlatTool>('select');
  const [selectedPiece, setSelectedPiece] = useState<FlatPiece | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);

  const { 
    selectFlatPieces, 
    selectConnections, 
    selectElectricalOutlets,
    selectElectricalSwitches,
    selectPlumbingFixtures,
    updateFlatPiece,
    addFlatOpening,
    addElectricalOutlet,
    addElectricalSwitch,
    addPlumbingFixture
  } = useStore();

  const flatPieces = selectFlatPieces();
  const connections = selectConnections();
  const outlets = selectElectricalOutlets();
  const switches = selectElectricalSwitches();
  const fixtures = selectPlumbingFixtures();

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    };
  }, []);

  const getWorldPoint = useCallback((canvasPoint: Point): Point => ({
    x: (canvasPoint.x - panOffset.x) / zoom,
    y: (canvasPoint.y - panOffset.y) / zoom,
  }), [panOffset, zoom]);

  const getSnappedPoint = useCallback((point: Point): Point => {
    const worldPoint = getWorldPoint(point);
    return {
      x: Math.round(worldPoint.x / gridSize) * gridSize,
      y: Math.round(worldPoint.y / gridSize) * gridSize,
    };
  }, [getWorldPoint, gridSize]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;

    const startX = (-panOffset.x / zoom) % gridSize;
    const startY = (-panOffset.y / zoom) % gridSize;

    // Vertical lines
    for (let x = startX; x < width / zoom; x += gridSize) {
      const screenX = x * zoom + panOffset.x;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = startY; y < height / zoom; y += gridSize) {
      const screenY = y * zoom + panOffset.y;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(width, screenY);
      ctx.stroke();
    }
  }, [showGrid, width, height, gridSize, zoom, panOffset]);

  const drawPiece = useCallback((ctx: CanvasRenderingContext2D, piece: FlatPiece) => {
    const screenX = piece.position.x * zoom + panOffset.x;
    const screenY = piece.position.y * zoom + panOffset.y;
    const screenWidth = piece.dimensions.width * zoom;
    const screenHeight = piece.dimensions.height * zoom;

    // Piece background
    ctx.fillStyle = piece.color || (piece.type === 'floor' ? '#8B4513' : '#D2B48C');
    ctx.fillRect(screenX, screenY, screenWidth, screenHeight);

    // Piece border
    ctx.strokeStyle = selectedPiece?.id === piece.id ? '#FF0000' : '#000000';
    ctx.lineWidth = selectedPiece?.id === piece.id ? 3 : 1;
    ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);

    // Draw openings
    piece.openings.forEach(opening => {
      const openingX = screenX + opening.position.x * zoom;
      const openingY = screenY + opening.position.y * zoom;
      const openingWidth = opening.dimensions.width * zoom;
      const openingHeight = opening.dimensions.height * zoom;

      ctx.fillStyle = opening.type === 'window' ? '#87CEEB' : '#8B4513';
      ctx.fillRect(openingX, openingY, openingWidth, openingHeight);
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(openingX, openingY, openingWidth, openingHeight);
    });

    // Label
    if (piece.label) {
      ctx.fillStyle = '#000000';
      ctx.font = `${Math.max(10, 12 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(
        piece.label,
        screenX + screenWidth / 2,
        screenY + screenHeight / 2
      );
    }

    // Type indicator
    ctx.fillStyle = '#666666';
    ctx.font = `${Math.max(8, 10 * zoom)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(
      piece.type.toUpperCase(),
      screenX + 2,
      screenY + 12
    );
  }, [zoom, panOffset, selectedPiece]);

  const drawConnection = useCallback((ctx: CanvasRenderingContext2D, connection: Connection) => {
    const piece1 = flatPieces.find(p => p.id === connection.fromPieceId);
    const piece2 = flatPieces.find(p => p.id === connection.toPieceId);
    
    if (!piece1 || !piece2) return;

    const getEdgePoint = (piece: FlatPiece, edge: string, position: number) => {
      const { position: pos, dimensions } = piece;
      switch (edge) {
        case 'top':
          return { x: pos.x + dimensions.width * position, y: pos.y };
        case 'bottom':
          return { x: pos.x + dimensions.width * position, y: pos.y + dimensions.height };
        case 'left':
          return { x: pos.x, y: pos.y + dimensions.height * position };
        case 'right':
          return { x: pos.x + dimensions.width, y: pos.y + dimensions.height * position };
        default:
          return pos;
      }
    };

    const start = getEdgePoint(piece1, connection.fromEdge, connection.fromPosition);
    const end = getEdgePoint(piece2, connection.toEdge, connection.toPosition);

    const startScreen = {
      x: start.x * zoom + panOffset.x,
      y: start.y * zoom + panOffset.y
    };
    const endScreen = {
      x: end.x * zoom + panOffset.x,
      y: end.y * zoom + panOffset.y
    };

    // Draw connection line
    ctx.strokeStyle = connection.color || '#FF6B6B';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startScreen.x, startScreen.y);
    ctx.lineTo(endScreen.x, endScreen.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw connection points
    ctx.fillStyle = connection.color || '#FF6B6B';
    ctx.beginPath();
    ctx.arc(startScreen.x, startScreen.y, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(endScreen.x, endScreen.y, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Draw length label
    const midX = (startScreen.x + endScreen.x) / 2;
    const midY = (startScreen.y + endScreen.y) / 2;
    ctx.fillStyle = '#000000';
    ctx.font = `${Math.max(10, 12 * zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(`${connection.length}"`, midX, midY - 5);
  }, [flatPieces, zoom, panOffset]);

  // Draw electrical outlets
  const drawElectricalOutlets = useCallback((ctx: CanvasRenderingContext2D) => {
    outlets.forEach(outlet => {
      const screenX = outlet.position.x * zoom + panOffset.x;
      const screenY = outlet.position.y * zoom + panOffset.y;
      const size = 12 * zoom;

      // Outlet box (green as requested)
      ctx.fillStyle = outlet.type === 'gfci' ? '#22c55e' : '#16a34a';
      ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX - size/2, screenY - size/2, size, size);

      // Outlet symbol (two vertical lines)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenX - 3, screenY - 4);
      ctx.lineTo(screenX - 3, screenY + 4);
      ctx.moveTo(screenX + 3, screenY - 4);
      ctx.lineTo(screenX + 3, screenY + 4);
      ctx.stroke();

      // Type label
      if (zoom > 0.5) {
        ctx.fillStyle = '#000000';
        ctx.font = `${Math.max(8, 10 * zoom)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(outlet.type.toUpperCase(), screenX, screenY + size + 10);
      }
    });
  }, [outlets, zoom, panOffset]);

  // Draw electrical switches
  const drawElectricalSwitches = useCallback((ctx: CanvasRenderingContext2D) => {
    switches.forEach(swtch => {
      const screenX = swtch.position.x * zoom + panOffset.x;
      const screenY = swtch.position.y * zoom + panOffset.y;
      const size = 10 * zoom;

      // Switch box (green)
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX - size/2, screenY - size/2, size, size);

      // Switch symbol (S)
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.max(6, 8 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('S', screenX, screenY + 2);
    });
  }, [switches, zoom, panOffset]);

  // Draw plumbing fixtures
  const drawPlumbingFixtures = useCallback((ctx: CanvasRenderingContext2D) => {
    fixtures.forEach(fixture => {
      const screenX = fixture.position.x * zoom + panOffset.x;
      const screenY = fixture.position.y * zoom + panOffset.y;
      let size = 20 * zoom;

      // Different sizes for different fixtures
      if (fixture.type === 'toilet') size = 30 * zoom;
      if (fixture.type === 'shower' || fixture.type === 'bathtub') size = 40 * zoom;

      // Fixture shape (blue as requested)
      ctx.fillStyle = '#3b82f6';
      if (fixture.type === 'sink' || fixture.type === 'toilet') {
        ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(screenX, screenY, size/2, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      if (fixture.type === 'sink' || fixture.type === 'toilet') {
        ctx.strokeRect(screenX - size/2, screenY - size/2, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(screenX, screenY, size/2, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Fixture label
      if (zoom > 0.3) {
        ctx.fillStyle = '#000000';
        ctx.font = `${Math.max(8, 10 * zoom)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(fixture.type.toUpperCase(), screenX, screenY + size + 10);
      }
    });
  }, [fixtures, zoom, panOffset]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up canvas
    ctx.save();

    // Draw grid
    drawGrid(ctx);

    // Draw pieces
    flatPieces.forEach(piece => {
      drawPiece(ctx, piece);
    });

    // Draw connections
    connections.forEach(connection => {
      drawConnection(ctx, connection);
    });

    // Draw electrical elements
    drawElectricalOutlets(ctx);
    drawElectricalSwitches(ctx);

    // Draw plumbing elements
    drawPlumbingFixtures(ctx);

    ctx.restore();
  }, [width, height, drawGrid, drawPiece, drawConnection, drawElectricalOutlets, drawElectricalSwitches, drawPlumbingFixtures, flatPieces, connections]);

  const findPieceAtPoint = useCallback((worldPoint: Point): FlatPiece | null => {
    // Check pieces in reverse order (top-most first)
    for (let i = flatPieces.length - 1; i >= 0; i--) {
      const piece = flatPieces[i];
      if (worldPoint.x >= piece.position.x &&
          worldPoint.x <= piece.position.x + piece.dimensions.width &&
          worldPoint.y >= piece.position.y &&
          worldPoint.y <= piece.position.y + piece.dimensions.height) {
        return piece;
      }
    }
    return null;
  }, [flatPieces]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPoint = getCanvasPoint(e);
    const worldPoint = getWorldPoint(canvasPoint);
    const snappedPoint = getSnappedPoint(canvasPoint);

    if (currentTool === 'select') {
      const clickedPiece = findPieceAtPoint(worldPoint);
      setSelectedPiece(clickedPiece);
      
      if (clickedPiece) {
        setIsDragging(true);
        setDragStart({
          x: worldPoint.x - clickedPiece.position.x,
          y: worldPoint.y - clickedPiece.position.y
        });
      }
    } else if (currentTool === 'wiring') {
      // Place electrical outlet
      addElectricalOutlet({
        position: snappedPoint,
        type: 'standard',
        voltage: 120,
        amperage: 15,
        height: 18 // 18 inches from floor (standard outlet height)
      });
    } else if (currentTool === 'plumbing') {
      // Place plumbing fixture
      addPlumbingFixture({
        position: snappedPoint,
        type: 'sink',
        waterPressure: 40,
        drainSize: 1.5,
        hotWater: true,
        ventRequired: true
      });
    }
    // Other tools would be handled by their respective components
  }, [currentTool, getCanvasPoint, getWorldPoint, getSnappedPoint, findPieceAtPoint, addElectricalOutlet, addPlumbingFixture]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedPiece || !dragStart) return;

    const canvasPoint = getCanvasPoint(e);
    const worldPoint = getWorldPoint(canvasPoint);
    const snappedPoint = getSnappedPoint(canvasPoint);

    updateFlatPiece(selectedPiece.id, {
      position: {
        x: snappedPoint.x - dragStart.x,
        y: snappedPoint.y - dragStart.y
      }
    });
  }, [isDragging, selectedPiece, dragStart, getCanvasPoint, getWorldPoint, getSnappedPoint, updateFlatPiece]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // Effect to redraw canvas when data changes
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ 
          border: '1px solid #ccc',
          cursor: currentTool === 'select' ? 'default' : 'crosshair'
        }}
      />
      
      {/* Tool Controls */}
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        background: 'white', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '5px'
      }}>
        <h4>Flat Layout Tools</h4>
        <div>
          {(['select', 'floor-piece', 'wall-piece', 'connection', 'wiring', 'plumbing'] as FlatTool[]).map(tool => (
            <button
              key={tool}
              onClick={() => setCurrentTool(tool)}
              style={{
                margin: '2px',
                padding: '5px 10px',
                backgroundColor: currentTool === tool ? '#007bff' : '#f8f9fa',
                color: currentTool === tool ? 'white' : 'black',
                border: '1px solid #ccc',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              {tool.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {selectedPiece && (
          <div style={{ marginTop: '10px', padding: '5px', backgroundColor: '#f8f9fa' }}>
            <h6>Selected: {selectedPiece.label}</h6>
            <p>Type: {selectedPiece.type}</p>
            <p>Size: {selectedPiece.dimensions.width} x {selectedPiece.dimensions.height}</p>
            <p>Position: ({selectedPiece.position.x.toFixed(1)}, {selectedPiece.position.y.toFixed(1)})</p>
          </div>
        )}
      </div>

      {/* Tool Panels */}
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <FlatPieceTool 
          isActive={currentTool === 'floor-piece'}
          pieceType="floor"
        />
        <FlatPieceTool 
          isActive={currentTool === 'wall-piece'}
          pieceType="wall"
        />
        <ConnectionTool 
          isActive={currentTool === 'connection'}
        />
      </div>

      {/* Instructions */}
      <div style={{ 
        position: 'absolute', 
        bottom: 10, 
        left: 10, 
        background: 'rgba(255, 255, 255, 0.9)', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '5px',
        maxWidth: '300px'
      }}>
        <h6>Cardboard Box Builder</h6>
        <p style={{ fontSize: '12px', margin: '5px 0' }}>
          1. Create floor and wall pieces using the tools
        </p>
        <p style={{ fontSize: '12px', margin: '5px 0' }}>
          2. Arrange them on the canvas like an unfolded box
        </p>
        <p style={{ fontSize: '12px', margin: '5px 0' }}>
          3. Connect pieces to define how they fold together
        </p>
        <p style={{ fontSize: '12px', margin: '5px 0' }}>
                      4. Use the "Stitch" button to connect your pieces
        </p>
      </div>
    </div>
  );
};

export default FlatLayoutCanvas;