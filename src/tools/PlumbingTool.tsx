import React, { useState, useCallback } from 'react';
import useStore from '@/src/model/useStore';
import { Point, PlumbingFixture } from '@/src/model/types';

interface PlumbingToolProps {
  isActive: boolean;
  onPointerDown?: (point: Point) => void;
}

type PlumbingMode = 'auto' | 'fixture';

const PlumbingTool: React.FC<PlumbingToolProps> = ({ 
  isActive,
  onPointerDown
}) => {
  const { 
    addPlumbingFixture,
    selectFlatPieces,
    selectPlumbingFixtures
  } = useStore();

  const [mode, setMode] = useState<PlumbingMode>('auto');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('bathroom');
  const [placingFixture, setPlacingFixture] = useState(false);
  const [fixtureType, setFixtureType] = useState<PlumbingFixture['type']>('sink');

  const flatPieces = selectFlatPieces();
  const fixtures = selectPlumbingFixtures();

  // Get walls from flat pieces
  const walls = flatPieces.filter(piece => piece.type === 'wall');

  // Handle auto placement for complete bathroom/kitchen
  const handleAutoPlacement = useCallback(() => {
    if (walls.length === 0) {
      alert('Please draw walls first before placing plumbing fixtures.');
      return;
    }
    
    // Find a suitable corner for fixture placement
    const roomCorner = {
      x: walls[0].position.x + 20,
      y: walls[0].position.y + 20
    };

    if (selectedRoomType === 'bathroom') {
      // Place complete bathroom set
      addPlumbingFixture({
        position: { x: roomCorner.x, y: roomCorner.y },
        type: 'toilet',
        waterPressure: 80,
        drainSize: 3,
        hotWater: false,
        ventRequired: true
      });

      addPlumbingFixture({
        position: { x: roomCorner.x + 40, y: roomCorner.y },
        type: 'sink',
        waterPressure: 60,
        drainSize: 1.25,
        hotWater: true,
        ventRequired: true
      });

      addPlumbingFixture({
        position: { x: roomCorner.x, y: roomCorner.y + 60 },
        type: 'shower',
        waterPressure: 80,
        drainSize: 2,
        hotWater: true,
        ventRequired: true
      });
    } else if (selectedRoomType === 'kitchen') {
      // Place kitchen fixtures
      addPlumbingFixture({
        position: { x: roomCorner.x, y: roomCorner.y },
        type: 'sink',
        waterPressure: 60,
        drainSize: 1.5,
        hotWater: true,
        ventRequired: true
      });

      addPlumbingFixture({
        position: { x: roomCorner.x + 40, y: roomCorner.y },
        type: 'dishwasher',
        waterPressure: 60,
        drainSize: 1.5,
        hotWater: true,
        ventRequired: false
      });
    }
  }, [walls, selectedRoomType, addPlumbingFixture]);

  // Handle manual fixture placement
  const handleFixturePlacement = useCallback((point: Point) => {
    if (!placingFixture) return;

    const fixtureConfig = {
      sink: { waterPressure: 60, drainSize: 1.25, hotWater: true, ventRequired: true },
      toilet: { waterPressure: 80, drainSize: 3, hotWater: false, ventRequired: true },
      shower: { waterPressure: 80, drainSize: 2, hotWater: true, ventRequired: true },
      bathtub: { waterPressure: 80, drainSize: 1.5, hotWater: true, ventRequired: true },
      washer: { waterPressure: 60, drainSize: 2, hotWater: true, ventRequired: true },
      dishwasher: { waterPressure: 60, drainSize: 1.5, hotWater: true, ventRequired: false }
    };

    addPlumbingFixture({
      position: point,
      type: fixtureType,
      ...fixtureConfig[fixtureType]
    });
    
    setPlacingFixture(false);
  }, [placingFixture, fixtureType, addPlumbingFixture]);

  // Handle pointer events
  const handlePointerDown = useCallback((point: Point) => {
    if (!isActive) return;
    
    if (placingFixture) {
      handleFixturePlacement(point);
    }
    
    onPointerDown?.(point);
  }, [isActive, placingFixture, handleFixturePlacement, onPointerDown]);

  // Start placing fixture
  const startPlacingFixture = useCallback(() => {
    setPlacingFixture(true);
  }, []);

  if (!isActive) return null;

  return (
    <div style={styles.toolPanel}>
      <h3 style={styles.title}>🔧 Plumbing Tool</h3>
      
      {/* Mode Selection */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Mode</h4>
        <div style={styles.buttonGroup}>
          <button
            style={{
              ...styles.button,
              ...(mode === 'auto' ? styles.activeButton : {})
            }}
            onClick={() => setMode('auto')}
          >
            Auto Layout
          </button>
          <button
            style={{
              ...styles.button,
              ...(mode === 'fixture' ? styles.activeButton : {})
            }}
            onClick={() => setMode('fixture')}
          >
            Manual Fixture
          </button>
        </div>
      </div>

      {/* Auto Mode Controls */}
      {mode === 'auto' && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Room Type</h4>
          <select
            value={selectedRoomType}
            onChange={(e) => setSelectedRoomType(e.target.value)}
            style={styles.select}
          >
            <option value="bathroom">Full Bathroom</option>
            <option value="kitchen">Kitchen</option>
            <option value="half-bath">Half Bath</option>
            <option value="laundry">Laundry Room</option>
          </select>
          <button
            style={styles.primaryButton}
            onClick={handleAutoPlacement}
          >
            Auto-Place Complete Layout
          </button>
        </div>
      )}

      {/* Manual Fixture Mode */}
      {mode === 'fixture' && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Fixture Type</h4>
          <select
            value={fixtureType}
            onChange={(e) => setFixtureType(e.target.value as PlumbingFixture['type'])}
            style={styles.select}
          >
            <option value="sink">Sink</option>
            <option value="toilet">Toilet</option>
            <option value="shower">Shower</option>
            <option value="bathtub">Bathtub</option>
            <option value="washer">Washing Machine</option>
            <option value="dishwasher">Dishwasher</option>
          </select>
          <button
            style={{
              ...styles.primaryButton,
              ...(placingFixture ? styles.activeButton : {})
            }}
            onClick={startPlacingFixture}
          >
            {placingFixture ? 'Click to Place Fixture' : 'Start Placing Fixtures'}
          </button>
        </div>
      )}

      {/* Current Status */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Current Design</h4>
        <div style={styles.stats}>
          <div>Fixtures: {fixtures.length}</div>
          <div>Walls: {walls.length}</div>
        </div>
      </div>

      {/* Instructions */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Instructions</h4>
        <div style={styles.instructions}>
          {mode === 'auto' && 'Select room type and click "Auto-Place" for complete plumbing layout with proper connections.'}
          {mode === 'fixture' && 'Select fixture type and click "Start Placing" then click to place individual fixtures.'}
        </div>
      </div>
    </div>
  );
};

// Styles for the tool panel
const styles = {
  toolPanel: {
    padding: '16px',
    backgroundColor: '#f0f8ff',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    minWidth: '300px',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    margin: '0 0 16px 0',
    color: '#1e40af',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  section: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #bfdbfe'
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    color: '#2563eb',
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
    border: '1px solid #3b82f6',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#3b82f6',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  activeButton: {
    backgroundColor: '#3b82f6',
    color: 'white'
  },
  primaryButton: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3b82f6',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    width: '100%',
    marginTop: '8px'
  },
  select: {
    width: '100%',
    padding: '8px',
    border: '1px solid #3b82f6',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '8px'
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#2563eb'
  },
  instructions: {
    fontSize: '12px',
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: '1.4'
  }
};

export default PlumbingTool;