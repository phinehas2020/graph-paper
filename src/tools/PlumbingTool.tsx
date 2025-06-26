import React, { useState, useEffect, useCallback } from 'react';
import useStore from '@/src/model/useStore';
import { Point, PlumbingFixture, PlumbingPipe } from '@/src/model/types';

interface PlumbingToolProps {
  isActive: boolean;
  onPointerDown?: (point: Point) => void;
  onPointerMove?: (point: Point) => void;
  onPointerUp?: () => void;
}

type PlumbingMode = 'auto' | 'manual' | 'fixture' | 'pipe';

const PlumbingTool: React.FC<PlumbingToolProps> = ({ 
  isActive,
  onPointerDown,
  onPointerMove,
  onPointerUp 
}) => {
  const { 
    addPlumbingSystem,
    autoPlacePlumbing,
    addFixtureToSystem,
    addPipeToSystem,
    selectPlumbing,
    selectFloors,
    validatePlumbingCode
  } = useStore();

  const [mode, setMode] = useState<PlumbingMode>('auto');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('bathroom');
  const [currentSystemId, setCurrentSystemId] = useState<string | null>(null);
  const [placingFixture, setPlacingFixture] = useState(false);
  const [placingPipe, setPlacingPipe] = useState(false);
  const [fixtureType, setFixtureType] = useState<PlumbingFixture['type']>('sink');
  const [pipeType, setPipeType] = useState<PlumbingPipe['type']>('cold');
  const [pipeDiameter, setPipeDiameter] = useState<number>(0.75);
  const [codeViolations, setCodeViolations] = useState<string[]>([]);

  const plumbing = selectPlumbing();
  const floors = selectFloors();

  // Check for code violations
  useEffect(() => {
    if (isActive) {
      const violations = validatePlumbingCode();
      setCodeViolations(violations);
    }
  }, [isActive, plumbing, validatePlumbingCode]);

  // Handle auto placement
  const handleAutoPlacement = useCallback(() => {
    if (floors.length === 0) {
      alert('Please create a floor plan first before placing plumbing.');
      return;
    }
    
    autoPlacePlumbing(selectedRoomType);
    setCodeViolations([]); // Clear violations after auto placement
  }, [floors.length, autoPlacePlumbing, selectedRoomType]);

  // Handle manual fixture placement
  const handleFixturePlacement = useCallback((point: Point) => {
    if (!placingFixture || !currentSystemId) return;

    const fixtureData: Omit<PlumbingFixture, 'id'> = {
      type: fixtureType,
      position: point,
      rotation: 0,
      requiresHotWater: ['sink', 'shower', 'bathtub', 'dishwasher', 'washer'].includes(fixtureType),
      requiresDrain: true,
      waterPressureRequired: fixtureType === 'shower' ? 40 : 30
    };

    addFixtureToSystem(currentSystemId, fixtureData);
    setPlacingFixture(false);
  }, [placingFixture, currentSystemId, fixtureType, addFixtureToSystem]);

  // Handle manual pipe placement (simplified - single click)
  const handlePipeStart = useCallback((point: Point) => {
    if (!placingPipe || !currentSystemId) return;

    // For simplicity, create a short pipe segment
    const endPoint = { x: point.x + 24, y: point.y }; // 2 feet long
    
    const pipeData: Omit<PlumbingPipe, 'id'> = {
      points: [point, endPoint],
      type: pipeType,
      diameter: pipeDiameter,
      color: getPipeColor(pipeType)
    };

    addPipeToSystem(currentSystemId, pipeData);
    setPlacingPipe(false);
  }, [placingPipe, currentSystemId, pipeType, pipeDiameter, addPipeToSystem]);

  // Get pipe color based on type
  const getPipeColor = (type: PlumbingPipe['type']): string => {
    switch (type) {
      case 'hot': return '#dc2626'; // Red
      case 'cold': return '#2563eb'; // Blue
      case 'drain': return '#374151'; // Gray
      case 'vent': return '#6b7280'; // Light gray
      default: return '#374151';
    }
  };

  // Handle pointer events
  const handlePointerDown = useCallback((point: Point) => {
    if (!isActive) return;
    
    if (placingFixture) {
      handleFixturePlacement(point);
    } else if (placingPipe) {
      handlePipeStart(point);
    }
    
    onPointerDown?.(point);
  }, [isActive, placingFixture, placingPipe, handleFixturePlacement, handlePipeStart, onPointerDown]);

  // Create new plumbing system for manual mode
  const createNewSystem = useCallback(() => {
    if (floors.length === 0) {
      alert('Please create a floor plan first.');
      return;
    }

    const mainFloor = floors[0];
    const centerX = mainFloor.points.reduce((sum, p) => sum + p.x, 0) / mainFloor.points.length;
    const centerY = mainFloor.points.reduce((sum, p) => sum + p.y, 0) / mainFloor.points.length;

    const id = addPlumbingSystem({
      fixtures: [],
      pipes: [],
      mainWaterLine: { x: centerX - 120, y: centerY }, // 10 feet from center
      mainDrainLine: { x: centerX - 120, y: centerY - 24 } // 2 feet below water line
    });
    setCurrentSystemId(id);
  }, [addPlumbingSystem, floors]);

  // Start placing fixture
  const startPlacingFixture = useCallback(() => {
    if (!currentSystemId) {
      createNewSystem();
    }
    setPlacingFixture(true);
    setPlacingPipe(false);
  }, [currentSystemId, createNewSystem]);

  // Start placing pipe
  const startPlacingPipe = useCallback(() => {
    if (!currentSystemId) {
      createNewSystem();
    }
    setPlacingPipe(true);
    setPlacingFixture(false);
  }, [currentSystemId, createNewSystem]);

  // Get fixture emoji for UI
  const getFixtureEmoji = (type: PlumbingFixture['type']): string => {
    switch (type) {
      case 'sink': return '🚿';
      case 'toilet': return '🚽';
      case 'shower': return '🚿';
      case 'bathtub': return '🛁';
      case 'washer': return '🌀';
      case 'dishwasher': return '🍽️';
      default: return '🔧';
    }
  };

  if (!isActive) return null;

  return (
    <div style={styles.toolPanel}>
      <h3 style={styles.title}>🔧 Plumbing Tool</h3>
      
      {/* Mode Selection */}
      <div style={styles.section}>
        <label style={styles.label}>Mode:</label>
        <div style={styles.buttonGroup}>
          <button 
            style={{...styles.button, ...(mode === 'auto' ? styles.activeButton : {})}}
            onClick={() => setMode('auto')}
          >
            Auto Layout
          </button>
          <button 
            style={{...styles.button, ...(mode === 'manual' ? styles.activeButton : {})}}
            onClick={() => setMode('manual')}
          >
            Manual Placement
          </button>
        </div>
      </div>

      {/* Auto Mode */}
      {mode === 'auto' && (
        <div style={styles.section}>
          <label style={styles.label}>Room Type:</label>
          <select 
            value={selectedRoomType} 
            onChange={(e) => setSelectedRoomType(e.target.value)}
            style={styles.select}
          >
            <option value="bathroom">Bathroom</option>
            <option value="kitchen">Kitchen</option>
            <option value="laundry">Laundry Room</option>
            <option value="powder">Powder Room</option>
          </select>
          
          <button 
            onClick={handleAutoPlacement}
            style={styles.primaryButton}
            disabled={floors.length === 0}
          >
            Auto-Place {selectedRoomType.charAt(0).toUpperCase() + selectedRoomType.slice(1)} Fixtures
          </button>
          
          <div style={styles.codeInfo}>
            <small>
              • Hot & cold water supply<br/>
              • Proper drain connections<br/>
              • Code-compliant fixture spacing<br/>
              • Vent stack placement
            </small>
          </div>
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <div style={styles.section}>
          <div style={styles.subsection}>
            <h4 style={styles.subtitle}>Place Fixtures</h4>
            <label style={styles.label}>Fixture Type:</label>
            <select 
              value={fixtureType} 
              onChange={(e) => setFixtureType(e.target.value as PlumbingFixture['type'])}
              style={styles.select}
            >
              <option value="sink">{getFixtureEmoji('sink')} Sink</option>
              <option value="toilet">{getFixtureEmoji('toilet')} Toilet</option>
              <option value="shower">{getFixtureEmoji('shower')} Shower</option>
              <option value="bathtub">{getFixtureEmoji('bathtub')} Bathtub</option>
              <option value="washer">{getFixtureEmoji('washer')} Washing Machine</option>
              <option value="dishwasher">{getFixtureEmoji('dishwasher')} Dishwasher</option>
            </select>
            
            <button 
              onClick={startPlacingFixture}
              style={{...styles.button, ...(placingFixture ? styles.activeButton : {})}}
            >
              {placingFixture ? 'Click to Place Fixture' : 'Place Fixture'}
            </button>
          </div>

          <div style={styles.subsection}>
            <h4 style={styles.subtitle}>Place Pipes</h4>
            <label style={styles.label}>Pipe Type:</label>
            <select 
              value={pipeType} 
              onChange={(e) => setPipeType(e.target.value as PlumbingPipe['type'])}
              style={styles.select}
            >
              <option value="hot">🔴 Hot Water</option>
              <option value="cold">🔵 Cold Water</option>
              <option value="drain">⚫ Drain</option>
              <option value="vent">⚪ Vent</option>
            </select>
            
            <label style={styles.label}>Pipe Diameter (inches):</label>
            <select 
              value={pipeDiameter} 
              onChange={(e) => setPipeDiameter(parseFloat(e.target.value))}
              style={styles.select}
            >
              <option value={0.5}>1/2"</option>
              <option value={0.75}>3/4"</option>
              <option value={1}>1"</option>
              <option value={1.25}>1 1/4"</option>
              <option value={1.5}>1 1/2"</option>
              <option value={2}>2"</option>
              <option value={3}>3"</option>
              <option value={4}>4"</option>
            </select>
            
            <button 
              onClick={startPlacingPipe}
              style={{...styles.button, ...(placingPipe ? styles.activeButton : {})}}
            >
              {placingPipe ? 'Click to Place Pipe' : 'Place Pipe'}
            </button>
          </div>
        </div>
      )}

      {/* Code Violations */}
      {codeViolations.length > 0 && (
        <div style={styles.violations}>
          <h4 style={styles.violationTitle}>⚠️ Code Issues:</h4>
          {codeViolations.map((violation, index) => (
            <div key={index} style={styles.violation}>
              {violation}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.stat}>
          Systems: {plumbing.length}
        </div>
        <div style={styles.stat}>
          Fixtures: {plumbing.reduce((sum, s) => sum + s.fixtures.length, 0)}
        </div>
        <div style={styles.stat}>
          Pipes: {plumbing.reduce((sum, s) => sum + s.pipes.length, 0)}
        </div>
      </div>
    </div>
  );
};

const styles = {
  toolPanel: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    width: '320px',
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    fontSize: '14px',
    maxHeight: '80vh',
    overflowY: 'auto' as const,
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center' as const,
  },
  section: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f3f4f6',
  },
  subsection: {
    marginBottom: '16px',
  },
  subtitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6b7280',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '12px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  button: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  activeButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    borderColor: '#2563eb',
  },
  primaryButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '12px',
    transition: 'background-color 0.2s',
  },
  codeInfo: {
    padding: '12px',
    backgroundColor: '#eff6ff',
    borderRadius: '6px',
    border: '1px solid #bfdbfe',
  },
  violations: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    borderRadius: '6px',
    border: '1px solid #fecaca',
    marginBottom: '16px',
  },
  violationTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#dc2626',
    fontWeight: '600',
  },
  violation: {
    fontSize: '12px',
    color: '#991b1b',
    marginBottom: '4px',
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#6b7280',
  },
  stat: {
    textAlign: 'center' as const,
  },
};

export default PlumbingTool;