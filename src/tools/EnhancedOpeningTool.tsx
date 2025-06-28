import React, { useState, useCallback } from 'react';
import useStore from '@/src/model/useStore';
import { Point, FlatOpening, FlatPiece } from '@/src/model/types';

interface EnhancedOpeningToolProps {
  isActive: boolean;
  onPointerDown?: (point: Point) => void;
}

type OpeningMode = 'window' | 'door';

const EnhancedOpeningTool: React.FC<EnhancedOpeningToolProps> = ({ 
  isActive,
  onPointerDown
}) => {
  const { 
    selectFlatPieces,
    addFlatOpening
  } = useStore();

  const [mode, setMode] = useState<OpeningMode>('window');
  const [placingOpening, setPlacingOpening] = useState(false);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  
  // Window options
  const [windowWidth, setWindowWidth] = useState<number>(36); // inches
  const [windowHeight, setWindowHeight] = useState<number>(48); // inches
  const [windowMaterial, setWindowMaterial] = useState<string>('vinyl');
  const [energyRating, setEnergyRating] = useState<string>('standard');
  
  // Door options
  const [doorWidth, setDoorWidth] = useState<number>(32); // inches
  const [doorHeight, setDoorHeight] = useState<number>(80); // inches
  const [doorMaterial, setDoorMaterial] = useState<string>('wood');
  const [swingDirection, setSwingDirection] = useState<'inward' | 'outward' | 'left' | 'right'>('inward');

  const flatPieces = selectFlatPieces();
  const walls = flatPieces.filter((piece: FlatPiece) => piece.type === 'wall');

  // Handle opening placement
  const handleOpeningPlacement = useCallback((point: Point) => {
    if (!placingOpening) return;

    if (walls.length === 0) {
      alert('Please draw walls first before placing windows or doors.');
      setPlacingOpening(false);
      return;
    }

    // Find the nearest wall to place the opening on
    let nearestWallId: string | null = null;
    let minDistance = Infinity;

    walls.forEach((wall: FlatPiece) => {
      const distance = Math.sqrt(
        Math.pow(point.x - wall.position.x, 2) + 
        Math.pow(point.y - wall.position.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestWallId = wall.id;
      }
    });

    if (nearestWallId) {
      const openingData: Omit<FlatOpening, 'id'> = {
        type: mode,
        position: point,
        dimensions: {
          width: mode === 'window' ? windowWidth : doorWidth,
          height: mode === 'window' ? windowHeight : doorHeight
        },
        material: mode === 'window' ? windowMaterial : doorMaterial,
        energyRating: mode === 'window' ? energyRating : undefined,
        swingDirection: mode === 'door' ? swingDirection : undefined
      };

      addFlatOpening(nearestWallId, openingData);
    }
    
    setPlacingOpening(false);
  }, [placingOpening, mode, walls, windowWidth, windowHeight, windowMaterial, energyRating, doorWidth, doorHeight, doorMaterial, swingDirection, addFlatOpening]);

  // Handle pointer events
  const handlePointerDown = useCallback((point: Point) => {
    if (!isActive) return;
    
    if (placingOpening) {
      handleOpeningPlacement(point);
    }
    
    onPointerDown?.(point);
  }, [isActive, placingOpening, handleOpeningPlacement, onPointerDown]);

  // Start placing opening
  const startPlacingOpening = useCallback(() => {
    setPlacingOpening(true);
  }, []);

  if (!isActive) return null;

  return (
    <div style={styles.toolPanel}>
      <h3 style={styles.title}>🚪 Enhanced Openings Tool</h3>
      
      {/* Mode Selection */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Opening Type</h4>
        <div style={styles.buttonGroup}>
          <button
            style={{
              ...styles.button,
              ...(mode === 'window' ? styles.activeButton : {})
            }}
            onClick={() => setMode('window')}
          >
            🪟 Windows
          </button>
          <button
            style={{
              ...styles.button,
              ...(mode === 'door' ? styles.activeButton : {})
            }}
            onClick={() => setMode('door')}
          >
            🚪 Doors
          </button>
        </div>
      </div>

      {/* Window Configuration */}
      {mode === 'window' && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Window Options</h4>
          
          <label style={styles.label}>Standard Size:</label>
          <select
            value={`${windowWidth}x${windowHeight}`}
            onChange={(e) => {
              const [width, height] = e.target.value.split('x').map(Number);
              setWindowWidth(width);
              setWindowHeight(height);
            }}
            style={styles.select}
          >
            <option value="24x36">24" × 36" (Small)</option>
            <option value="30x48">30" × 48" (Medium)</option>
            <option value="36x48">36" × 48" (Standard)</option>
            <option value="48x48">48" × 48" (Large)</option>
            <option value="60x48">60" × 48" (Wide)</option>
            <option value="36x60">36" × 60" (Tall)</option>
          </select>

          <label style={styles.label}>Material:</label>
          <select
            value={windowMaterial}
            onChange={(e) => setWindowMaterial(e.target.value)}
            style={styles.select}
          >
            <option value="vinyl">Vinyl</option>
            <option value="wood">Wood</option>
            <option value="aluminum">Aluminum</option>
            <option value="fiberglass">Fiberglass</option>
          </select>

          <label style={styles.label}>Energy Rating:</label>
          <select
            value={energyRating}
            onChange={(e) => setEnergyRating(e.target.value)}
            style={styles.select}
          >
            <option value="standard">Standard</option>
            <option value="energy-star">Energy Star</option>
            <option value="high-performance">High Performance</option>
            <option value="triple-pane">Triple Pane</option>
          </select>
        </div>
      )}

      {/* Door Configuration */}
      {mode === 'door' && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Door Options</h4>
          
          <label style={styles.label}>Standard Size:</label>
          <select
            value={`${doorWidth}x${doorHeight}`}
            onChange={(e) => {
              const [width, height] = e.target.value.split('x').map(Number);
              setDoorWidth(width);
              setDoorHeight(height);
            }}
            style={styles.select}
          >
            <option value="24x80">24" × 80" (Closet)</option>
            <option value="28x80">28" × 80" (Small)</option>
            <option value="30x80">30" × 80" (Standard)</option>
            <option value="32x80">32" × 80" (Standard)</option>
            <option value="36x80">36" × 80" (Wide)</option>
            <option value="32x96">32" × 96" (8ft Tall)</option>
            <option value="60x80">60" × 80" (Double Door)</option>
          </select>

          <label style={styles.label}>Material:</label>
          <select
            value={doorMaterial}
            onChange={(e) => setDoorMaterial(e.target.value)}
            style={styles.select}
          >
            <option value="wood">Wood</option>
            <option value="fiberglass">Fiberglass</option>
            <option value="steel">Steel</option>
            <option value="glass">Glass</option>
          </select>

          <label style={styles.label}>Swing Direction:</label>
          <select
            value={swingDirection}
            onChange={(e) => setSwingDirection(e.target.value as any)}
            style={styles.select}
          >
            <option value="inward">Inward</option>
            <option value="outward">Outward</option>
            <option value="left">Left Hinge</option>
            <option value="right">Right Hinge</option>
          </select>
        </div>
      )}

      {/* Placement Controls */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Placement</h4>
        <button
          style={{
            ...styles.primaryButton,
            ...(placingOpening ? styles.activeButton : {})
          }}
          onClick={startPlacingOpening}
        >
          {placingOpening ? `Click on Wall to Place ${mode}` : `Start Placing ${mode}s`}
        </button>
      </div>

      {/* Current Status */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Current Design</h4>
        <div style={styles.stats}>
          <div>Walls: {walls.length}</div>
          <div>Total Openings: {walls.reduce((sum, wall) => sum + wall.openings.length, 0)}</div>
        </div>
        
        {mode === 'window' && (
          <div style={styles.currentConfig}>
            <div>Size: {windowWidth}" × {windowHeight}"</div>
            <div>Material: {windowMaterial}</div>
            <div>Rating: {energyRating}</div>
          </div>
        )}
        
        {mode === 'door' && (
          <div style={styles.currentConfig}>
            <div>Size: {doorWidth}" × {doorHeight}"</div>
            <div>Material: {doorMaterial}</div>
            <div>Swing: {swingDirection}</div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Instructions</h4>
        <div style={styles.instructions}>
          {mode === 'window' && 'Configure window options and click "Start Placing" then click on walls to add windows with proper sizing and materials.'}
          {mode === 'door' && 'Configure door options and click "Start Placing" then click on walls to add doors with proper swing directions and clearances.'}
        </div>
      </div>
    </div>
  );
};

// Styles for the tool panel
const styles = {
  toolPanel: {
    padding: '16px',
    backgroundColor: '#faf5ff',
    border: '2px solid #8b5cf6',
    borderRadius: '8px',
    minWidth: '300px',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    margin: '0 0 16px 0',
    color: '#6b21a8',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  section: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #e9d5ff'
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    color: '#7c3aed',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const
  },
  button: {
    padding: '8px 12px',
    border: '1px solid #8b5cf6',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#8b5cf6',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  activeButton: {
    backgroundColor: '#8b5cf6',
    color: 'white'
  },
  primaryButton: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#8b5cf6',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    width: '100%',
    marginTop: '8px'
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#6b21a8'
  },
  select: {
    width: '100%',
    padding: '6px',
    border: '1px solid #8b5cf6',
    borderRadius: '4px',
    fontSize: '12px',
    marginBottom: '8px'
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#7c3aed',
    marginBottom: '8px'
  },
  currentConfig: {
    fontSize: '11px',
    color: '#6b21a8',
    padding: '8px',
    backgroundColor: '#f3e8ff',
    borderRadius: '4px',
    border: '1px solid #c4b5fd'
  },
  instructions: {
    fontSize: '12px',
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: '1.4'
  }
};

export default EnhancedOpeningTool;