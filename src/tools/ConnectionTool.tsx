import React, { useState, useCallback, useEffect } from 'react';
import useStore from '@/src/model/useStore';
import { Point, FlatPiece, Connection } from '@/src/model/types';

interface ConnectionToolProps {
  isActive: boolean;
}

const ConnectionTool: React.FC<ConnectionToolProps> = ({ isActive }) => {
  const { selectFlatPieces, addConnection } = useStore();

  const [selectedPiece1, setSelectedPiece1] = useState<FlatPiece | null>(null);
  const [selectedPiece2, setSelectedPiece2] = useState<FlatPiece | null>(null);
  const [selectedEdge1, setSelectedEdge1] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
  const [selectedEdge2, setSelectedEdge2] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
  const [connectionLength, setConnectionLength] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const flatPieces = selectFlatPieces();

  const resetConnectionState = useCallback(() => {
    setSelectedPiece1(null);
    setSelectedPiece2(null);
    setSelectedEdge1(null);
    setSelectedEdge2(null);
    setError(null);
  }, []);

  const handlePieceClick = useCallback((piece: FlatPiece) => {
    if (!isActive) return;
    setError(null);

    if (!selectedPiece1) {
      setSelectedPiece1(piece);
    } else if (!selectedPiece2 && piece.id !== selectedPiece1.id) {
      setSelectedPiece2(piece);
    } else {
      // Reset and start over
      setSelectedPiece1(piece);
      setSelectedPiece2(null);
      setSelectedEdge1(null);
      setSelectedEdge2(null);
    }
  }, [isActive, selectedPiece1]);

  const handleEdgeSelect = (pieceNum: 1 | 2, edge: 'top' | 'bottom' | 'left' | 'right') => {
    if (pieceNum === 1) {
      setSelectedEdge1(edge);
    } else {
      setSelectedEdge2(edge);
    }
  };

  const createConnection = useCallback(() => {
    if (!selectedPiece1 || !selectedPiece2 || !selectedEdge1 || !selectedEdge2) {
      setError("Please select two pieces and their connection edges");
      return;
    }

    if (selectedPiece1.id === selectedPiece2.id) {
      setError("Cannot connect a piece to itself");
      return;
    }

    const connectionData: Omit<Connection, 'id'> = {
      fromPieceId: selectedPiece1.id,
      toPieceId: selectedPiece2.id,
      fromEdge: selectedEdge1,
      toEdge: selectedEdge2,
      fromPosition: 0.5, // Center of edge for now
      toPosition: 0.5,   // Center of edge for now
      length: connectionLength,
      color: '#FF6B6B'
    };

    const connectionId = addConnection(connectionData);
    console.log(`ConnectionTool: Created connection: ${connectionId}`);
    
    resetConnectionState();
  }, [selectedPiece1, selectedPiece2, selectedEdge1, selectedEdge2, connectionLength, addConnection, resetConnectionState]);

  const getEdgePosition = (piece: FlatPiece, edge: 'top' | 'bottom' | 'left' | 'right') => {
    const { position, dimensions } = piece;
    switch (edge) {
      case 'top':
        return { x: position.x + dimensions.width / 2, y: position.y };
      case 'bottom':
        return { x: position.x + dimensions.width / 2, y: position.y + dimensions.height };
      case 'left':
        return { x: position.x, y: position.y + dimensions.height / 2 };
      case 'right':
        return { x: position.x + dimensions.width, y: position.y + dimensions.height / 2 };
      default:
        return position;
    }
  };

  // Effect to reset tool state if isActive becomes false
  useEffect(() => {
    if (!isActive) {
      resetConnectionState();
    }
  }, [isActive, resetConnectionState]);

  return (
    <div style={{ display: isActive ? 'block' : 'none', padding: '10px', border: '1px solid grey' }}>
      <h4>Connection Tool</h4>
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <div style={{ marginBottom: '10px' }}>
        <label>
          Connection Length:
          <input
            type="number"
            value={connectionLength}
            onChange={(e) => setConnectionLength(Number(e.target.value))}
            min="1"
            step="0.5"
            style={{ marginLeft: '5px', padding: '2px', width: '60px' }}
          />
          units
        </label>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <h5>Available Pieces:</h5>
        <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #ccc', padding: '5px' }}>
          {flatPieces.map(piece => (
            <div 
              key={piece.id}
              onClick={() => handlePieceClick(piece)}
              style={{
                cursor: 'pointer',
                padding: '3px',
                backgroundColor: 
                  selectedPiece1?.id === piece.id ? '#e3f2fd' :
                  selectedPiece2?.id === piece.id ? '#f3e5f5' : 'transparent',
                border: 
                  selectedPiece1?.id === piece.id ? '2px solid #2196f3' :
                  selectedPiece2?.id === piece.id ? '2px solid #9c27b0' : '1px solid transparent'
              }}
            >
              {piece.label || `${piece.type} ${piece.id.slice(-4)}`} ({piece.dimensions.width}x{piece.dimensions.height})
            </div>
          ))}
        </div>
      </div>

      {selectedPiece1 && (
        <div style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#e3f2fd' }}>
          <h6>Piece 1: {selectedPiece1.label}</h6>
          <div>
            <label>Connection Edge: </label>
            {(['top', 'bottom', 'left', 'right'] as const).map(edge => (
              <label key={edge} style={{ marginLeft: '5px' }}>
                <input
                  type="radio"
                  name="edge1"
                  checked={selectedEdge1 === edge}
                  onChange={() => handleEdgeSelect(1, edge)}
                />
                {edge}
              </label>
            ))}
          </div>
        </div>
      )}

      {selectedPiece2 && (
        <div style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#f3e5f5' }}>
          <h6>Piece 2: {selectedPiece2.label}</h6>
          <div>
            <label>Connection Edge: </label>
            {(['top', 'bottom', 'left', 'right'] as const).map(edge => (
              <label key={edge} style={{ marginLeft: '5px' }}>
                <input
                  type="radio"
                  name="edge2"
                  checked={selectedEdge2 === edge}
                  onChange={() => handleEdgeSelect(2, edge)}
                />
                {edge}
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={createConnection}
          disabled={!selectedPiece1 || !selectedPiece2 || !selectedEdge1 || !selectedEdge2}
          style={{ marginRight: '10px' }}
        >
          Create Connection
        </button>
        <button onClick={resetConnectionState}>
          Clear Selection
        </button>
      </div>

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <p>1. Click on two pieces to connect them</p>
        <p>2. Select which edge of each piece should connect</p>
        <p>3. Set the connection length and create the connection</p>
        <p>Connections define how pieces will be stitched together in 3D</p>
      </div>
    </div>
  );
};

export default ConnectionTool;