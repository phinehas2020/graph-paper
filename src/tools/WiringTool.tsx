import React, { useState, useCallback, useMemo } from 'react';
import useStore from '@/src/model/useStore';
import { Point, ElectricalOutlet, ElectricalSwitch, ElectricalCircuit, FlatPiece } from '@/src/model/types';
import { WireRoutingEngine, ElectricalCodeChecker } from './WireRoutingUtils';
import { formatMeasurement } from './MeasurementUtils';

interface WiringToolProps {
  isActive: boolean;
  onPointerDown?: (point: Point) => void;
  onPointerMove?: (point: Point) => void;
  onPointerUp?: () => void;
}

type WiringMode = 'auto' | 'outlet' | 'switch' | 'circuit' | 'panel' | 'wire-routing';

const WiringTool: React.FC<WiringToolProps> = ({ 
  isActive,
  onPointerDown
}) => {
  const { 
    addElectricalOutlet, 
    addElectricalSwitch,
    addElectricalCircuit,
    addElectricalPanel,
    addWireRun,
    selectFlatPieces,
    selectElectricalOutlets,
    selectElectricalSwitches,
    selectElectricalCircuits,
    selectElectricalPanels,
    selectWireRuns,
    selectWireUsageSummary,
    selectSettings
  } = useStore();

  const [mode, setMode] = useState<WiringMode>('auto');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('general');
  const [placingOutlet, setPlacingOutlet] = useState(false);
  const [placingSwitch, setPlacingSwitch] = useState(false);
  const [placingPanel, setPlacingPanel] = useState(false);
  const [outletType, setOutletType] = useState<ElectricalOutlet['type']>('standard');
  const [switchType, setSwitchType] = useState<ElectricalSwitch['type']>('single');
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>('');
  const [showWireTracking, setShowWireTracking] = useState(true);

  const flatPieces = selectFlatPieces();
  const outlets = selectElectricalOutlets();
  const switches = selectElectricalSwitches();
  const circuits = selectElectricalCircuits();
  const panels = selectElectricalPanels();
  const wireRuns = selectWireRuns();
  const wireUsageSummary = selectWireUsageSummary();
  const settings = selectSettings();

  // Get walls from flat pieces
  const walls = flatPieces.filter((piece: FlatPiece) => piece.type === 'wall');

  // Initialize wire routing engine
  const wireRoutingEngine = useMemo(() => {
    return new WireRoutingEngine(walls, settings.gridSize);
  }, [walls, settings.gridSize]);

  // Check electrical code compliance
  const codeViolations = useMemo(() => {
    const violations: string[] = [];
    
    // Check outlet spacing
    violations.push(...ElectricalCodeChecker.checkOutletSpacing(outlets, walls));
    
    // Check GFCI requirements
    violations.push(...ElectricalCodeChecker.checkGFCIRequirements(outlets));
    
    // Check circuit loads
    circuits.forEach((circuit: ElectricalCircuit) => {
      const circuitOutlets = outlets.filter((o: ElectricalOutlet) => o.circuitId === circuit.id);
      const circuitSwitches = switches.filter((s: ElectricalSwitch) => s.circuitId === circuit.id);
      const load = ElectricalCodeChecker.calculateCircuitLoad(circuitOutlets, circuitSwitches);
      
      if (load > circuit.maxLoad) {
        violations.push(`Circuit ${circuit.name} is overloaded: ${load}A > ${circuit.maxLoad}A`);
      }
      
      if (!ElectricalCodeChecker.checkWireSizing(circuit.wireType, load)) {
        violations.push(`Wire size ${circuit.wireType} insufficient for circuit ${circuit.name} load: ${load}A`);
      }
    });

    return violations;
  }, [outlets, switches, circuits, walls]);

  // Handle auto placement with enhanced NEC compliance
  const handleAutoPlacement = useCallback(() => {
    if (walls.length === 0) {
      alert('Please draw walls first before placing electrical outlets.');
      return;
    }
    
    // Create a main circuit if none exists
    let mainCircuit = circuits.find((c: ElectricalCircuit) => c.type === 'general');
    if (!mainCircuit) {
      const circuitId = addElectricalCircuit({
        name: 'General Outlets',
        breakerSize: 20,
        wireType: '12AWG',
        voltage: 120,
        outletIds: [],
        switchIds: [],
        wireIds: [],
        currentLoad: 0,
        maxLoad: 16, // 80% of 20A
        panelId: panels[0]?.id || '',
        circuitNumber: 1,
        type: 'general'
      });
      mainCircuit = { id: circuitId } as ElectricalCircuit;
    }

    // Auto place outlets every 12 feet along walls (NEC 210.52)
    walls.forEach((wall: FlatPiece) => {
      const wallLength = Math.max(wall.dimensions.width, wall.dimensions.height);
      const numberOfOutlets = Math.ceil(wallLength / 12); // Every 12 feet
      
      for (let i = 0; i < numberOfOutlets; i++) {
        const position = {
          x: wall.position.x + (wall.dimensions.width * i / numberOfOutlets),
          y: wall.position.y + (wall.dimensions.height * i / numberOfOutlets)
        };
        
        // Determine outlet type based on room
        let autoOutletType: ElectricalOutlet['type'] = 'standard';
        if (selectedRoomType === 'bathroom' || selectedRoomType === 'kitchen') {
          autoOutletType = 'gfci';
        }
        
        const outletId = addElectricalOutlet({
          position,
          type: autoOutletType,
          voltage: 120,
          amperage: 15,
          height: 18, // 18 inches from floor
          circuitId: mainCircuit.id,
          roomType: selectedRoomType,
          wallId: wall.id
        });

        // Create wire run from panel to outlet
        if (panels.length > 0) {
          const wireRun = wireRoutingEngine.calculateWireRoute(
            panels[0].position,
            position,
            '12AWG'
          );
          wireRun.circuitId = mainCircuit.id;
          addWireRun(wireRun);
        }
      }
    });

    // Auto place switches for lighting
    walls.forEach((wall: FlatPiece) => {
      // Place one switch per room entrance (simplified logic)
      const switchPosition = {
        x: wall.position.x + wall.dimensions.width * 0.1,
        y: wall.position.y + wall.dimensions.height * 0.1
      };

      addElectricalSwitch({
        position: switchPosition,
        type: 'single',
        height: 48, // 48 inches from floor (standard switch height)
        circuitId: mainCircuit.id,
        wallId: wall.id
      });
    });
  }, [walls, selectedRoomType, addElectricalOutlet, addElectricalSwitch, addElectricalCircuit, addWireRun, circuits, panels, wireRoutingEngine]);

  // Handle manual outlet placement
  const handleOutletPlacement = useCallback((point: Point) => {
    if (!placingOutlet) return;

    // Find nearest wall
    let nearestWallId = '';
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

    const outletId = addElectricalOutlet({
      position: point,
      type: outletType,
      voltage: 120,
      amperage: outletType === '20amp' ? 20 : 15,
      height: 18,
      circuitId: selectedCircuitId,
      roomType: selectedRoomType,
      wallId: nearestWallId
    });

    // Create wire run if panel exists
    if (panels.length > 0 && selectedCircuitId) {
      const wireRun = wireRoutingEngine.calculateWireRoute(
        panels[0].position,
        point,
        '12AWG'
      );
      wireRun.circuitId = selectedCircuitId;
      addWireRun(wireRun);
    }
    
    setPlacingOutlet(false);
  }, [placingOutlet, outletType, selectedCircuitId, selectedRoomType, addElectricalOutlet, addWireRun, walls, panels, wireRoutingEngine]);

  // Handle manual switch placement
  const handleSwitchPlacement = useCallback((point: Point) => {
    if (!placingSwitch) return;

    // Find nearest wall
    let nearestWallId = '';
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

    addElectricalSwitch({
      position: point,
      type: switchType,
      height: 48,
      circuitId: selectedCircuitId,
      wallId: nearestWallId
    });
    
    setPlacingSwitch(false);
  }, [placingSwitch, switchType, selectedCircuitId, addElectricalSwitch, walls]);

  // Handle panel placement
  const handlePanelPlacement = useCallback((point: Point) => {
    if (!placingPanel) return;

    addElectricalPanel({
      name: 'Main Panel',
      position: point,
      type: 'main',
      amperage: 200,
      voltage: 240,
      circuits: [],
      totalLoad: 0,
      maxLoad: 160, // 80% of 200A
      busySlots: 0,
      totalSlots: 40
    });

    setPlacingPanel(false);
  }, [placingPanel, addElectricalPanel]);

  // Handle pointer events
  const handlePointerDown = useCallback((point: Point) => {
    if (!isActive) return;
    
    if (placingOutlet) {
      handleOutletPlacement(point);
    } else if (placingSwitch) {
      handleSwitchPlacement(point);
    } else if (placingPanel) {
      handlePanelPlacement(point);
    }
    
    onPointerDown?.(point);
  }, [isActive, placingOutlet, placingSwitch, placingPanel, handleOutletPlacement, handleSwitchPlacement, handlePanelPlacement, onPointerDown]);

  // Create new circuit
  const createNewCircuit = useCallback(() => {
    const circuitNumber = circuits.length + 1;
    const wireType = selectedRoomType === 'kitchen' ? '12AWG' : '14AWG';
    const breakerSize = wireType === '12AWG' ? 20 : 15;

    addElectricalCircuit({
      name: `Circuit ${circuitNumber}`,
      breakerSize,
      wireType,
      voltage: 120,
      outletIds: [],
      switchIds: [],
      wireIds: [],
      currentLoad: 0,
      maxLoad: breakerSize * 0.8,
      panelId: panels[0]?.id || '',
      circuitNumber,
      type: selectedRoomType as any || 'general'
    });
  }, [circuits.length, selectedRoomType, panels, addElectricalCircuit]);

  if (!isActive) return null;

  return (
    <div style={styles.toolPanel}>
      <h3 style={styles.title}>⚡ Enhanced Electrical Wiring Tool</h3>
      
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
          <button
            style={{
              ...styles.button,
              ...(mode === 'circuit' ? styles.activeButton : {})
            }}
            onClick={() => setMode('circuit')}
          >
            Circuits
          </button>
          <button
            style={{
              ...styles.button,
              ...(mode === 'panel' ? styles.activeButton : {})
            }}
            onClick={() => setMode('panel')}
          >
            Panel
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
            <option value="kitchen">Kitchen (GFCI + 20A)</option>
            <option value="bathroom">Bathroom (GFCI)</option>
            <option value="bedroom">Bedroom</option>
            <option value="living">Living Room</option>
            <option value="laundry">Laundry Room</option>
          </select>
          <button
            style={styles.primaryButton}
            onClick={handleAutoPlacement}
          >
            Auto-Place NEC Compliant Layout
          </button>
        </div>
      )}

      {/* Manual Outlet Mode */}
      {mode === 'outlet' && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Outlet Configuration</h4>
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
          
          <select
            value={selectedCircuitId}
            onChange={(e) => setSelectedCircuitId(e.target.value)}
            style={styles.select}
          >
            <option value="">Select Circuit</option>
            {circuits.map(circuit => (
              <option key={circuit.id} value={circuit.id}>
                {circuit.name} ({circuit.currentLoad}A/{circuit.maxLoad}A)
              </option>
            ))}
          </select>
          
          <button
            style={{
              ...styles.primaryButton,
              ...(placingOutlet ? styles.activeButton : {})
            }}
            onClick={() => setPlacingOutlet(true)}
          >
            {placingOutlet ? 'Click to Place Outlet' : 'Start Placing Outlets'}
          </button>
        </div>
      )}

      {/* Manual Switch Mode */}
      {mode === 'switch' && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Switch Configuration</h4>
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
          
          <select
            value={selectedCircuitId}
            onChange={(e) => setSelectedCircuitId(e.target.value)}
            style={styles.select}
          >
            <option value="">Select Circuit</option>
            {circuits.map(circuit => (
              <option key={circuit.id} value={circuit.id}>
                {circuit.name}
              </option>
            ))}
          </select>
          
          <button
            style={{
              ...styles.primaryButton,
              ...(placingSwitch ? styles.activeButton : {})
            }}
            onClick={() => setPlacingSwitch(true)}
          >
            {placingSwitch ? 'Click to Place Switch' : 'Start Placing Switches'}
          </button>
        </div>
      )}

      {/* Circuit Management Mode */}
      {mode === 'circuit' && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Circuit Management</h4>
          <button
            style={styles.primaryButton}
            onClick={createNewCircuit}
          >
            Create New Circuit
          </button>
          
          <div style={styles.circuitList}>
            {circuits.map(circuit => (
              <div key={circuit.id} style={styles.circuitItem}>
                <strong>{circuit.name}</strong><br/>
                {circuit.wireType} - {circuit.breakerSize}A<br/>
                Load: {circuit.currentLoad}A / {circuit.maxLoad}A
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panel Mode */}
      {mode === 'panel' && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Electrical Panel</h4>
          <button
            style={{
              ...styles.primaryButton,
              ...(placingPanel ? styles.activeButton : {})
            }}
            onClick={() => setPlacingPanel(true)}
          >
            {placingPanel ? 'Click to Place Panel' : 'Place Main Panel'}
          </button>
          
          {panels.length > 0 && (
            <div style={styles.panelInfo}>
              <strong>Main Panel</strong><br/>
              Load: {panels[0].totalLoad}A / {panels[0].maxLoad}A<br/>
              Slots: {panels[0].busySlots} / {panels[0].totalSlots}
            </div>
          )}
        </div>
      )}

      {/* Wire Tracking Section */}
      {showWireTracking && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Wire Usage & Cost Tracking</h4>
          <div style={styles.wireStats}>
            <div><strong>Total Wire Cost: ${wireUsageSummary.totalCost.toFixed(2)}</strong></div>
            <div>Total Length: {formatMeasurement(wireUsageSummary.totalLength)}</div>
            
            {Object.entries(wireUsageSummary.wireTypes).map(([type, data]) => (
              <div key={type} style={styles.wireTypeStats}>
                {type}: {formatMeasurement(data.length)} - ${data.cost.toFixed(2)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Compliance Section */}
      {codeViolations.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>⚠️ Code Violations</h4>
          <div style={styles.violations}>
            {codeViolations.map((violation, index) => (
              <div key={index} style={styles.violation}>
                {violation}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Status */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Project Status</h4>
        <div style={styles.stats}>
          <div>Outlets: {outlets.length}</div>
          <div>Switches: {switches.length}</div>
          <div>Circuits: {circuits.length}</div>
          <div>Panels: {panels.length}</div>
          <div>Wire Runs: {wireRuns.length}</div>
          <div>Walls: {walls.length}</div>
        </div>
      </div>

      {/* Instructions */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Instructions</h4>
        <div style={styles.instructions}>
          {mode === 'auto' && 'Select room type and click "Auto-Place" for NEC-compliant electrical layout with automatic wire routing.'}
          {mode === 'outlet' && 'Select outlet type and circuit, then click to place outlets. Wire runs will be calculated automatically.'}
          {mode === 'switch' && 'Select switch type and circuit, then click to place switches.'}
          {mode === 'circuit' && 'Manage electrical circuits and monitor load calculations.'}
          {mode === 'panel' && 'Place the main electrical panel to enable automatic wire routing.'}
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
  },
  circuitList: {
    marginTop: '8px',
    maxHeight: '200px',
    overflowY: 'auto' as const
  },
  circuitItem: {
    padding: '8px',
    borderBottom: '1px solid #d1fae5',
    fontSize: '12px',
    color: '#374151'
  },
  panelInfo: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #d1fae5',
    fontSize: '12px',
    color: '#374151'
  },
  wireStats: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#374151'
  },
  wireTypeStats: {
    marginBottom: '4px',
    fontSize: '12px',
    color: '#374151'
  },
  violations: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#374151'
  },
  violation: {
    marginBottom: '4px',
    fontSize: '12px',
    color: '#dc2626',
    padding: '4px',
    backgroundColor: '#fef2f2',
    borderRadius: '4px',
    border: '1px solid #fecaca'
  }
};

export default WiringTool;
