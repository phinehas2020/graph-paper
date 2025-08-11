import React, { useState, useCallback, useMemo } from 'react';
import useStore from '@/src/model/useStore';
import { Point, PlumbingFixture, FlatPiece, PlumbingPipe } from '@/src/model/types';
import { PlumbingRoutingEngine } from './PlumbingRoutingUtils';

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
    addPlumbingPipe,
    selectFlatPieces,
    selectPlumbingFixtures,
    selectPlumbingPipes,
    selectSettings
  } = useStore();

  const [mode, setMode] = useState<PlumbingMode>('auto');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('bathroom');
  const [placingFixture, setPlacingFixture] = useState(false);
  const [fixtureType, setFixtureType] = useState<PlumbingFixture['type']>('sink');

  const flatPieces = selectFlatPieces();
  const fixtures = selectPlumbingFixtures();
  const pipes = selectPlumbingPipes();
  const settings = selectSettings();

  // Get walls from flat pieces
  const walls = flatPieces.filter((piece: FlatPiece) => piece.type === 'wall');

  const pipeRoutingEngine = useMemo(() => {
    return new PlumbingRoutingEngine(walls, settings.gridSize, 2, settings.pipePrices);
  }, [walls, settings.gridSize, settings.pipePrices]);

  const pipeUsageSummary = useMemo(() => {
    const summary = {
      totalCost: 0,
      totalLength: 0,
      materials: {} as { [key: string]: { length: number; cost: number } }
    };

    pipes.forEach((pipe: PlumbingPipe) => {
      summary.totalCost += pipe.cost;
      summary.totalLength += pipe.length;
      if (!summary.materials[pipe.material]) {
        summary.materials[pipe.material] = { length: 0, cost: 0 };
      }
      summary.materials[pipe.material].length += pipe.length;
      summary.materials[pipe.material].cost += pipe.cost;
    });

    return summary;
  }, [pipes]);

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
      const toiletId = addPlumbingFixture({
        position: { x: roomCorner.x, y: roomCorner.y },
        type: 'toilet',
        waterPressure: 80,
        drainSize: 3,
        hotWater: false,
        ventRequired: true
      });

      const sinkId = addPlumbingFixture({
        position: { x: roomCorner.x + 40, y: roomCorner.y },
        type: 'sink',
        waterPressure: 60,
        drainSize: 1.25,
        hotWater: true,
        ventRequired: true
      });

      const showerId = addPlumbingFixture({
        position: { x: roomCorner.x, y: roomCorner.y + 60 },
        type: 'shower',
        waterPressure: 80,
        drainSize: 2,
        hotWater: true,
        ventRequired: true
      });

      const toiletPos = { x: roomCorner.x, y: roomCorner.y };
      const sinkPos = { x: roomCorner.x + 40, y: roomCorner.y };
      const showerPos = { x: roomCorner.x, y: roomCorner.y + 60 };

      const pipe1 = pipeRoutingEngine.calculatePipeRoute(
        toiletId,
        sinkId,
        toiletPos,
        sinkPos,
        'cold',
        'PEX',
        1
      );
      const pipe2 = pipeRoutingEngine.calculatePipeRoute(
        toiletId,
        showerId,
        toiletPos,
        showerPos,
        'cold',
        'PEX',
        1
      );
      addPlumbingPipe(pipe1);
      addPlumbingPipe(pipe2);
    } else if (selectedRoomType === 'kitchen') {
      const sinkId = addPlumbingFixture({
        position: { x: roomCorner.x, y: roomCorner.y },
        type: 'sink',
        waterPressure: 60,
        drainSize: 1.5,
        hotWater: true,
        ventRequired: true
      });

      const dishId = addPlumbingFixture({
        position: { x: roomCorner.x + 40, y: roomCorner.y },
        type: 'dishwasher',
        waterPressure: 60,
        drainSize: 1.5,
        hotWater: true,
        ventRequired: false
      });

      const pipe = pipeRoutingEngine.calculatePipeRoute(
        sinkId,
        dishId,
        { x: roomCorner.x, y: roomCorner.y },
        { x: roomCorner.x + 40, y: roomCorner.y },
        'hot',
        'PEX',
        1
      );
      addPlumbingPipe(pipe);
    }
  }, [walls, selectedRoomType, addPlumbingFixture, addPlumbingPipe, pipeRoutingEngine]);

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

    const fixtureId = addPlumbingFixture({
      position: point,
      type: fixtureType,
      ...fixtureConfig[fixtureType]
    });

    const existing = selectPlumbingFixtures();
    if (existing.length > 1) {
      const source = existing[0];
      const pipe = pipeRoutingEngine.calculatePipeRoute(
        source.id,
        fixtureId,
        source.position,
        point,
        fixtureConfig[fixtureType].hotWater ? 'hot' : 'cold',
        'PEX',
        1
      );
      addPlumbingPipe(pipe);
    }

    setPlacingFixture(false);
  }, [placingFixture, fixtureType, addPlumbingFixture, selectPlumbingFixtures, addPlumbingPipe, pipeRoutingEngine]);

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

      {/* Pipe Summary */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Pipe Summary</h4>
        <div style={styles.stats}>
          <div>Total Length: {pipeUsageSummary.totalLength.toFixed(2)}ft</div>
          <div>Total Cost: ${pipeUsageSummary.totalCost.toFixed(2)}</div>
        </div>
        {Object.entries(pipeUsageSummary.materials).map(([material, data]) => (
          <div key={material} style={styles.materialStats}>
            {material}: {data.length.toFixed(2)}ft (${data.cost.toFixed(2)})
          </div>
        ))}
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
  materialStats: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#374151'
  },
  instructions: {
    fontSize: '12px',
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: '1.4'
  }
};

export default PlumbingTool;
