import React, { useState, useEffect, useCallback } from 'react';
import useStore from '@/src/model/useStore';
import { Wall, Point, ElectricalOutlet, ElectricalSwitch } from '@/src/model/types';

interface WiringToolProps {
  isActive: boolean;
  onPointerDown?: (point: Point) => void;
  onPointerMove?: (point: Point) => void;
  onPointerUp?: () => void;
}

type WiringMode = 'auto' | 'manual' | 'outlet' | 'switch';

const WiringTool: React.FC<WiringToolProps> = ({ 
  isActive,
  onPointerDown,
  onPointerMove,
  onPointerUp 
}) => {
  const { 
    addWiring, 
    autoPlaceOutlets, 
    addOutletToWiring, 
    addSwitchToWiring,
    selectWalls,
    selectWiring,
    selectBuildingCode,
    validateElectricalCode
  } = useStore();

  const [mode, setMode] = useState<WiringMode>('auto');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('general');
  const [currentWiringId, setCurrentWiringId] = useState<string | null>(null);
  const [placingOutlet, setPlacingOutlet] = useState(false);
  const [placingSwitch, setPlacingSwitch] = useState(false);
  const [outletType, setOutletType] = useState<ElectricalOutlet['type']>('standard');
  const [switchType, setSwitchType] = useState<ElectricalSwitch['type']>('single');
  const [codeViolations, setCodeViolations] = useState<string[]>([]);

  const walls = selectWalls();
  const wiring = selectWiring();
  const buildingCode = selectBuildingCode();

  // Check for code violations
  useEffect(() => {
    if (isActive) {
      const violations = validateElectricalCode();
      setCodeViolations(violations);
    }
  }, [isActive, wiring, validateElectricalCode]);

  // Handle auto placement
  const handleAutoPlacement = useCallback(() => {
    if (walls.length === 0) {
      alert('Please draw walls first before placing electrical outlets.');
      return;
    }
    
    autoPlaceOutlets(selectedRoomType);
    setCodeViolations([]); // Clear violations after auto placement
  }, [walls.length, autoPlaceOutlets, selectedRoomType]);

  // Handle manual outlet placement
  const handleOutletPlacement = useCallback((point: Point) => {
    if (!placingOutlet || !currentWiringId) return;

    // Find nearest wall
    let nearestWall: Wall | null = null;
    let minDistance = Infinity;

    walls.forEach(wall => {
      const wallLength = Math.sqrt(
        Math.pow(wall.end.x - wall.start.x, 2) + 
        Math.pow(wall.end.y - wall.start.y, 2)
      );
      
      // Calculate distance from point to wall line
      const A = point.x - wall.start.x;
      const B = point.y - wall.start.y;
      const C = wall.end.x - wall.start.x;
      const D = wall.end.y - wall.start.y;
      
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      const param = lenSq !== 0 ? dot / lenSq : -1;
      
      let closestPoint: Point;
      if (param < 0) {
        closestPoint = wall.start;
      } else if (param > 1) {
        closestPoint = wall.end;
      } else {
        closestPoint = {
          x: wall.start.x + param * C,
          y: wall.start.y + param * D
        };
      }
      
      const distance = Math.sqrt(
        Math.pow(point.x - closestPoint.x, 2) + 
        Math.pow(point.y - closestPoint.y, 2)
      );
      
      if (distance < minDistance && distance < 50) { // 50 unit threshold
        minDistance = distance;
        nearestWall = wall;
      }
    });

    if (nearestWall) {
      addOutletToWiring(currentWiringId, {
        type: outletType,
        position: point,
        wallId: nearestWall.id,
        height: buildingCode.outletHeight,
        isCodeRequired: false
      });
    } else {
      // Place as free-standing outlet
      addOutletToWiring(currentWiringId, {
        type: outletType,
        position: point,
        height: buildingCode.outletHeight,
        isCodeRequired: false
      });
    }
    
    setPlacingOutlet(false);
  }, [placingOutlet, currentWiringId, walls, outletType, buildingCode.outletHeight, addOutletToWiring]);

  // Handle manual switch placement
  const handleSwitchPlacement = useCallback((point: Point) => {
    if (!placingSwitch || !currentWiringId) return;

    addSwitchToWiring(currentWiringId, {
      type: switchType,
      position: point,
      height: buildingCode.switchHeight,
      controlsOutlets: []
    });
    
    setPlacingSwitch(false);
  }, [placingSwitch, currentWiringId, switchType, buildingCode.switchHeight, addSwitchToWiring]);

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

  // Create new wiring system for manual mode
  const createNewWiring = useCallback(() => {
    const id = addWiring({
      points: [],
      type: '15amp',
      color: '#22c55e', // Green color as requested
      outlets: [],
      switches: []
    });
    setCurrentWiringId(id);
  }, [addWiring]);

  // Start placing outlet
  const startPlacingOutlet = useCallback(() => {
    if (!currentWiringId) {
      createNewWiring();
    }
    setPlacingOutlet(true);
    setPlacingSwitch(false);
  }, [currentWiringId, createNewWiring]);

  // Start placing switch
  const startPlacingSwitch = useCallback(() => {
    if (!currentWiringId) {
      createNewWiring();
    }
    setPlacingSwitch(true);
    setPlacingOutlet(false);
  }, [currentWiringId, createNewWiring]);

  // Attach pointer handlers
  useEffect(() => {
    if (isActive && (placingOutlet || placingSwitch)) {
      // Override parent handlers when placing components
      return;
    }
  }, [isActive, placingOutlet, placingSwitch]);

  if (!isActive) return null;

  return (
    <div style={styles.toolPanel}>
      <h3 style={styles.title}>🔌 Electrical Wiring Tool</h3>
      
      {/* Mode Selection */}
      <div style={styles.section}>
        <label style={styles.label}>Mode:</label>
        <div style={styles.buttonGroup}>
          <button 
            style={{...styles.button, ...(mode === 'auto' ? styles.activeButton : {})}}
            onClick={() => setMode('auto')}
          >
            Auto Code-Compliant
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
            <option value="general">General Room</option>
            <option value="kitchen">Kitchen</option>
            <option value="bathroom">Bathroom</option>
            <option value="bedroom">Bedroom</option>
            <option value="living">Living Room</option>
            <option value="garage">Garage</option>
          </select>
          
          <button 
            onClick={handleAutoPlacement}
            style={styles.primaryButton}
            disabled={walls.length === 0}
          >
            Auto-Place Outlets & Switches
          </button>
          
          <div style={styles.codeInfo}>
            <small>
              • Max {buildingCode.maxOutletSpacing}ft between outlets<br/>
              • {selectedRoomType === 'bathroom' || selectedRoomType === 'kitchen' ? 'GFCI' : 'Standard'} outlets<br/>
              • Switches at {buildingCode.switchHeight}" height
            </small>
          </div>
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <div style={styles.section}>
          <div style={styles.subsection}>
            <h4 style={styles.subtitle}>Place Outlets</h4>
            <label style={styles.label}>Outlet Type:</label>
            <select 
              value={outletType} 
              onChange={(e) => setOutletType(e.target.value as ElectricalOutlet['type'])}
              style={styles.select}
            >
              <option value="standard">Standard</option>
              <option value="gfci">GFCI</option>
              <option value="usb">USB</option>
              <option value="dedicated">Dedicated 20A</option>
            </select>
            
            <button 
              onClick={startPlacingOutlet}
              style={{...styles.button, ...(placingOutlet ? styles.activeButton : {})}}
            >
              {placingOutlet ? 'Click to Place Outlet' : 'Place Outlet'}
            </button>
          </div>

          <div style={styles.subsection}>
            <h4 style={styles.subtitle}>Place Switches</h4>
            <label style={styles.label}>Switch Type:</label>
            <select 
              value={switchType} 
              onChange={(e) => setSwitchType(e.target.value as ElectricalSwitch['type'])}
              style={styles.select}
            >
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="three-way">3-Way</option>
              <option value="dimmer">Dimmer</option>
            </select>
            
            <button 
              onClick={startPlacingSwitch}
              style={{...styles.button, ...(placingSwitch ? styles.activeButton : {})}}
            >
              {placingSwitch ? 'Click to Place Switch' : 'Place Switch'}
            </button>
          </div>
        </div>
      )}

      {/* Code Violations */}
      {codeViolations.length > 0 && (
        <div style={styles.violations}>
          <h4 style={styles.violationTitle}>⚠️ Code Violations:</h4>
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
          Wiring Systems: {wiring.length}
        </div>
        <div style={styles.stat}>
          Total Outlets: {wiring.reduce((sum, w) => sum + w.outlets.length, 0)}
        </div>
        <div style={styles.stat}>
          Total Switches: {wiring.reduce((sum, w) => sum + w.switches.length, 0)}
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
    color: '#22c55e',
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
    backgroundColor: '#22c55e',
    color: 'white',
    borderColor: '#22c55e',
  },
  primaryButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#22c55e',
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
    backgroundColor: '#f0fdf4',
    borderRadius: '6px',
    border: '1px solid #bbf7d0',
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

export default WiringTool;