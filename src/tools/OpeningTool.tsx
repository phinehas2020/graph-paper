import React, { useState, useEffect, FormEvent } from 'react';
import useStore from '@/src/model/useStore';
import { Wall, Opening } from '@/src/model/types';

interface OpeningToolProps {
  isActive: boolean;
  selectedWall: Wall | null;
  // This would be the proportional distance (0 to 1) along the wall length where the user clicked.
  // For simplicity, let's assume the 'position' for the opening will be entered manually or defaulted.
  // A more advanced tool would use the exact click spot.
  clickPositionAlongWall?: number;
  onClose: () => void; // Callback to hide the tool/form
}

const OpeningTool: React.FC<OpeningToolProps> = ({
  isActive,
  selectedWall,
  // clickPositionAlongWall,
  onClose
}) => {
  const { addOpening } = useStore.getState();

  const [type, setType] = useState<'window' | 'door'>('window');
  const [width, setWidth] = useState<number>(1); // Default width 1m or 1ft
  const [height, setHeight] = useState<number>(1.2); // Default height
  const [elevation, setElevation] = useState<number>(0.8); // Default elevation from wall base
  const [position, setPosition] = useState<number>(1); // Default position from wall start

  useEffect(() => {
    // Reset form when selected wall changes or tool is deactivated
    if (selectedWall && isActive) {
      // If clickPositionAlongWall was provided and accurate, use it:
      // const wallLength = Math.sqrt(Math.pow(selectedWall.end.x - selectedWall.start.x, 2) + Math.pow(selectedWall.end.y - selectedWall.start.y, 2));
      // setPosition(clickPositionAlongWall ? clickPositionAlongWall * wallLength : wallLength / 2);

      // For now, default based on type or keep simple default
      setType('window');
      setWidth(1);
      // Default opening dimensions regardless of wall type
      setHeight(1.2);
      setElevation(0.8);
      setPosition(1); // Default to 1 unit from start. User should adjust.
    } else if (!isActive) {
        onClose(); // Ensure form is hidden if tool becomes inactive
    }
  }, [selectedWall, isActive, onClose]);


  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedWall) {
      alert("No wall selected to add opening to.");
      return;
    }

    const openingData: Omit<Opening, 'id'> = {
      type,
      width: Number(width),
      height: Number(height),
      elevation: Number(elevation), // Relative to wall base
      position: Number(position), // Distance from wall start point along its length
    };

    console.log("Adding opening to wall:", selectedWall.id, openingData);
    addOpening(selectedWall.id, openingData);
    // Optionally close the form/tool after adding
    // onClose();
    // Or reset for another opening on the same wall
    // setWidth(1); setHeight(1.2); setElevation(0.8); setPosition(currentPosition + width + 0.5);
  };

  if (!isActive || !selectedWall) {
    return null; // Don't render if not active or no wall selected
  }

  return (
    <div style={styles.toolPanel}>
      <h4>Add Opening to Wall: {selectedWall.id.substring(0,6)}...</h4>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="openingType" style={styles.label}>Type:</label>
          <select id="openingType" value={type} onChange={e => setType(e.target.value as 'window' | 'door')} style={styles.input}>
            <option value="window">Window</option>
            <option value="door">Door</option>
          </select>
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="openingWidth" style={styles.label}>Width:</label>
          <input id="openingWidth" type="number" value={width} onChange={e => setWidth(parseFloat(e.target.value))} style={styles.input} step="0.1" />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="openingHeight" style={styles.label}>Height:</label>
          <input id="openingHeight" type="number" value={height} onChange={e => setHeight(parseFloat(e.target.value))} style={styles.input} step="0.1" />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="openingElevation" style={styles.label}>Elevation (from wall base):</label>
          <input id="openingElevation" type="number" value={elevation} onChange={e => setElevation(parseFloat(e.target.value))} style={styles.input} step="0.1" />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="openingPosition" style={styles.label}>Position (from wall start):</label>
          <input id="openingPosition" type="number" value={position} onChange={e => setPosition(parseFloat(e.target.value))} style={styles.input} step="0.1" />
        </div>
        <div style={styles.buttonGroup}>
          <button type="submit" style={{...styles.button, ...styles.submitButton}}>Add Opening</button>
          <button type="button" onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Close</button>
        </div>
      </form>
    </div>
  );
};

// Basic styles (can be moved to a CSS file or a styled-components solution)
const styles = {
    toolPanel: {
        position: 'absolute' as 'absolute',
        top: '20px',
        right: '20px',
        padding: '15px',
        background: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        width: '300px',
    } as React.CSSProperties,
    form: {
        display: 'flex',
        flexDirection: 'column' as 'column',
        gap: '10px',
    } as React.CSSProperties,
    formGroup: {
        display: 'flex',
        flexDirection: 'column' as 'column',
    } as React.CSSProperties,
    label: {
        marginBottom: '5px',
        fontSize: '0.9em',
        color: '#333',
    } as React.CSSProperties,
    input: {
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1em',
    } as React.CSSProperties,
    buttonGroup: {
        marginTop: '15px',
        display: 'flex',
        justifyContent: 'space-between',
    } as React.CSSProperties,
    button: {
        padding: '10px 15px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.9em',
    } as React.CSSProperties,
    submitButton: {
        background: '#007bff',
        color: 'white',
    } as React.CSSProperties,
    cancelButton: {
        background: '#6c757d',
        color: 'white',
    } as React.CSSProperties,
};

export default OpeningTool;
