import React, { useState, useCallback } from 'react';
import useStore from '@/src/model/useStore';
import { Point, ElectricalOutlet, ElectricalSwitch } from '@/src/model/types';

interface WiringToolProps {
  isActive: boolean;
  onPointerDown?: (point: Point) => void;
  onPointerMove?: (point: Point) => void;
  onPointerUp?: () => void;
}

type WiringMode = 'auto' | 'outlet' | 'switch';

const WiringTool: React.FC<WiringToolProps> = ({ 
  isActive,
  onPointerDown
}) => {
  const { 
    addElectricalOutlet, 
    addElectricalSwitch,
    selectFlatPieces,
    selectElectricalOutlets,
    selectElectricalSwitches
  } = useStore();

  const [mode, setMode] = useState<WiringMode>('auto');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('general');
  const [placingOutlet, setPlacingOutlet] = useState(false);
  const [placingSwitch, setPlacingSwitch] = useState(false);
  const [outletType, setOutletType] = useState<ElectricalOutlet['type']>('standard');
  const [switchType, setSwitchType] = useState<ElectricalSwitch['type']>('single');

  const flatPieces = selectFlatPieces();
  const outlets = selectElectricalOutlets();
  const switches = selectElectricalSwitches();

  // Get walls from flat pieces
  const walls = flatPieces.filter(piece => piece.type === 'wall');

  // Handle auto placement
  const handleAutoPlacement = useCallback(() => {
    if (walls.length === 0) {
      alert('Please draw walls first before placing electrical outlets.');
      return;
    }
    
    // Auto place outlets every 12 feet along walls
    walls.forEach(wall => {
      const wallLength = Math.max(wall.dimensions.width, wall.dimensions.height);
      const numberOfOutlets = Math.ceil(wallLength / 12); // Every 12 feet
      
      for (let i = 0; i < numberOfOutlets; i++) {
        const position = {
          x: wall.position.x + (wall.dimensions.width * i / numberOfOutlets),
          y: wall.position.y + (wall.dimensions.height * i / numberOfOutlets)
        };
        
        // Determine outlet type based on room
        let outletType: ElectricalOutlet['type'] = 'standard';
        if (selectedRoomType === 'bathroom' || selectedRoomType === 'kitchen') {
          outletType = 'gfci';
        }
        
        addElectricalOutlet({
          position,
          type: outletType,
          voltage: 120,
          amperage: 15,
          height: 18 // 18 inches from floor
        });
      }
    });
  }, [walls, selectedRoomType, addElectricalOutlet]);

  // Handle manual outlet placement
  const handleOutletPlacement = useCallback((point: Point) => {
    if (!placingOutlet) return;

    addElectricalOutlet({
      position: point,
      type: outletType,
      voltage: 120,
      amperage: outletType === '20amp' ? 20 : 15,
      height: 18 // 18 inches from floor
    });
    
    setPlacingOutlet(false);
  }, [placingOutlet, outletType, addElectricalOutlet]);

  // Handle manual switch placement
  const handleSwitchPlacement = useCallback((point: Point) => {
    if (!placingSwitch) return;

    addElectricalSwitch({
      position: point,
      type: switchType,
      height: 48 // 48 inches from floor (standard switch height)
    });
    
    setPlacingSwitch(false);
  }, [placingSwitch, switchType, addElectricalSwitch]);

  // Handle pointer events
  const handlePointerDown = useCallback((point: Point) => {
    if (!isActive) return;
    
    if (placingOutlet) {
      handleOutletPlacement(point);
    } else if (placingSwitch) {
      handleSwitchPlacement(point);
    }
    
    onPointerDown?.(point);
  }, [isActive, placingOutlet, placingSwitch, handleOutletPlacement, handleSwitchPlacement, onPointerDown]);

  // Start placing outlet
  const startPlacingOutlet = useCallback(() => {
    setPlacingOutlet(true);
    setPlacingSwitch(false);
  }, []);

  // Start placing switch
  const startPlacingSwitch = useCallback(() => {
    setPlacingSwitch(true);
    setPlacingOutlet(false);
  }, []);

  if (!isActive) return null;

  return (
    <div style={styles.toolPanel}>
      <h3 style={styles.title}>🔌 Electrical Wiring Tool</h3>
      
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
            Auto Place
          </button>
          <button
            style={{
              ...styles.button,
              ...(mode === 'outlet' ? styles.activeButton : {})
            }}
            onClick={() => setMode('outlet')}
          >
            Manual Outlet
          </button>
          <button
            style={{
              ...styles.button,
              ...(mode === 'switch' ? styles.activeButton : {})
            }}
            onClick={() => setMode('switch')}
          >
            Manual Switch
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
            <option value="general">General Room</option>
            <option value="kitchen">Kitchen (GFCI)</option>
            <option value="bathroom">Bathroom (GFCI)</option>
            <option value="bedroom">Bedroom</option>
            <option value="living">Living Room</option>
          </select>
          <button
            style={styles.primaryButton}
            onClick={handleAutoPlacement}
          >
            Auto-Place Outlets & Switches
          </button>
        </div>
      )}

      {/* Manual Outlet Mode */}
      {mode === 'outlet' && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Outlet Type</h4>
          <select
            value={outletType}
            onChange={(e) => setOutletType(e.target.value as ElectricalOutlet['type'])}
            style={styles.select}
          >
            <option value="standard">Standard Outlet</option>
            <option value="gfci">GFCI Outlet</option>
            <option value="usb">USB Outlet</option>
            <option value="20amp">20 Amp Outlet</option>
            <option value="outdoor">Outdoor Outlet</option>
          </select>
          <button
            style={{
              ...styles.primaryButton,
              ...(placingOutlet ? styles.activeButton : {})
            }}
            onClick={startPlacingOutlet}
          >
            {placingOutlet ? 'Click to Place Outlet' : 'Start Placing Outlets'}
          </button>
        </div>
      )}

      {/* Manual Switch Mode */}
      {mode === 'switch' && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Switch Type</h4>
          <select
            value={switchType}
            onChange={(e) => setSwitchType(e.target.value as ElectricalSwitch['type'])}
            style={styles.select}
          >
            <option value="single">Single Switch</option>
            <option value="double">Double Switch</option>
            <option value="triple">Triple Switch</option>
            <option value="dimmer">Dimmer Switch</option>
            <option value="fan">Fan Switch</option>
            <option value="timer">Timer Switch</option>
          </select>
          <button
            style={{
              ...styles.primaryButton,
              ...(placingSwitch ? styles.activeButton : {})
            }}
            onClick={startPlacingSwitch}
          >
            {placingSwitch ? 'Click to Place Switch' : 'Start Placing Switches'}
          </button>
        </div>
      )}

      {/* Current Status */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Current Design</h4>
        <div style={styles.stats}>
          <div>Outlets: {outlets.length}</div>
          <div>Switches: {switches.length}</div>
          <div>Walls: {walls.length}</div>
        </div>
      </div>

      {/* Instructions */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Instructions</h4>
        <div style={styles.instructions}>
          {mode === 'auto' && 'Select room type and click "Auto-Place" for code-compliant electrical layout.'}
          {mode === 'outlet' && 'Select outlet type and click "Start Placing" then click on walls to place outlets.'}
          {mode === 'switch' && 'Select switch type and click "Start Placing" then click on walls to place switches.'}
        </div>
      </div>
    </div>
  );
};

// Styles for the tool panel
const styles = {
  toolPanel: {
    padding: '16px',
    backgroundColor: '#f8fdf8',
    border: '2px solid #22c55e',
    borderRadius: '8px',
    minWidth: '300px',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    margin: '0 0 16px 0',
    color: '#15803d',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  section: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #d1fae5'
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    color: '#059669',
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
    border: '1px solid #22c55e',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#22c55e',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  activeButton: {
    backgroundColor: '#22c55e',
    color: 'white'
  },
  primaryButton: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#22c55e',
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
    border: '1px solid #22c55e',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '8px'
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#059669'
  },
  instructions: {
    fontSize: '12px',
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: '1.4'
  }
};

export default WiringTool;