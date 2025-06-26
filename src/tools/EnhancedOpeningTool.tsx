import React, { useState, useEffect, FormEvent } from 'react';
import useStore from '@/src/model/useStore';
import { Wall, Opening } from '@/src/model/types';

interface EnhancedOpeningToolProps {
  isActive: boolean;
  selectedWall: Wall | null;
  clickPositionAlongWall?: number;
  onClose: () => void;
}

type OpeningStyle = 'single' | 'double' | 'casement' | 'double-hung' | 'sliding' | 'fixed' | 'french';
type OpeningMaterial = 'wood' | 'vinyl' | 'aluminum' | 'fiberglass';
type SwingDirection = 'left' | 'right' | 'inward' | 'outward';

interface StandardSizes {
  windows: { width: number; height: number; label: string }[];
  doors: { width: number; height: number; label: string }[];
}

const standardSizes: StandardSizes = {
  windows: [
    { width: 2, height: 3, label: '2\' x 3\' (24" x 36")' },
    { width: 2.5, height: 3, label: '2.5\' x 3\' (30" x 36")' },
    { width: 3, height: 3, label: '3\' x 3\' (36" x 36")' },
    { width: 3, height: 4, label: '3\' x 4\' (36" x 48")' },
    { width: 4, height: 4, label: '4\' x 4\' (48" x 48")' },
    { width: 5, height: 4, label: '5\' x 4\' (60" x 48")' },
    { width: 6, height: 4, label: '6\' x 4\' (72" x 48")' },
  ],
  doors: [
    { width: 2.5, height: 6.67, label: '2.5\' x 6\'8" (30" x 80") - Interior' },
    { width: 2.67, height: 6.67, label: '2\'8" x 6\'8" (32" x 80") - Interior' },
    { width: 3, height: 6.67, label: '3\' x 6\'8" (36" x 80") - Exterior' },
    { width: 3, height: 8, label: '3\' x 8\' (36" x 96") - Tall' },
    { width: 4, height: 6.67, label: '4\' x 6\'8" (48" x 80") - Wide' },
    { width: 5, height: 6.67, label: '5\' x 6\'8" (60" x 80") - French' },
    { width: 6, height: 6.67, label: '6\' x 6\'8" (72" x 80") - Double' },
  ]
};

const EnhancedOpeningTool: React.FC<EnhancedOpeningToolProps> = ({
  isActive,
  selectedWall,
  clickPositionAlongWall,
  onClose
}) => {
  const { addOpening } = useStore.getState();

  const [type, setType] = useState<'window' | 'door'>('window');
  const [useStandardSize, setUseStandardSize] = useState(true);
  const [standardSizeIndex, setStandardSizeIndex] = useState(0);
  const [width, setWidth] = useState<number>(3); // Default width 3ft
  const [height, setHeight] = useState<number>(4); // Default height 4ft
  const [elevation, setElevation] = useState<number>(3); // Default elevation 3ft from floor
  const [position, setPosition] = useState<number>(2); // Default position 2ft from wall start
  const [style, setStyle] = useState<OpeningStyle>('single');
  const [material, setMaterial] = useState<OpeningMaterial>('vinyl');
  const [swingDirection, setSwingDirection] = useState<SwingDirection>('inward');
  const [isExterior, setIsExterior] = useState<boolean>(true);
  const [energyRating, setEnergyRating] = useState<number>(0.3); // U-factor
  const [autoCenter, setAutoCenter] = useState<boolean>(true);

  const currentSizes = type === 'window' ? standardSizes.windows : standardSizes.doors;

  useEffect(() => {
    if (selectedWall && isActive) {
      // Auto-center opening on wall if enabled
      if (autoCenter && selectedWall) {
        const wallLength = Math.sqrt(
          Math.pow(selectedWall.end.x - selectedWall.start.x, 2) + 
          Math.pow(selectedWall.end.y - selectedWall.start.y, 2)
        );
        setPosition(wallLength / 2);
      }

      // Set defaults based on type
      if (type === 'window') {
        setElevation(3); // 3 feet from floor for windows
        setStyle('double-hung');
        if (useStandardSize && currentSizes[standardSizeIndex]) {
          setWidth(currentSizes[standardSizeIndex].width);
          setHeight(currentSizes[standardSizeIndex].height);
        }
      } else {
        setElevation(0); // Floor level for doors
        setStyle('single');
        if (useStandardSize && currentSizes[standardSizeIndex]) {
          setWidth(currentSizes[standardSizeIndex].width);
          setHeight(currentSizes[standardSizeIndex].height);
        }
      }
    } else if (!isActive) {
      onClose();
    }
  }, [selectedWall, isActive, onClose, type, autoCenter, useStandardSize, standardSizeIndex, currentSizes]);

  useEffect(() => {
    // Update dimensions when standard size changes
    if (useStandardSize && currentSizes[standardSizeIndex]) {
      setWidth(currentSizes[standardSizeIndex].width);
      setHeight(currentSizes[standardSizeIndex].height);
    }
  }, [standardSizeIndex, useStandardSize, currentSizes]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedWall) {
      alert("No wall selected to add opening to.");
      return;
    }

    // Validate opening doesn't exceed wall length
    const wallLength = Math.sqrt(
      Math.pow(selectedWall.end.x - selectedWall.start.x, 2) + 
      Math.pow(selectedWall.end.y - selectedWall.start.y, 2)
    );

    if (position + width > wallLength) {
      alert(`Opening extends beyond wall length (${wallLength.toFixed(1)}ft). Please adjust position or size.`);
      return;
    }

    if (position < 0) {
      alert("Opening position cannot be negative. Please adjust position.");
      return;
    }

    // Check for minimum clearances
    const minClearance = 0.5; // 6 inches minimum clearance from wall ends
    if (position < minClearance) {
      alert("Opening too close to wall start. Minimum 6\" clearance required.");
      return;
    }

    if (position + width > wallLength - minClearance) {
      alert("Opening too close to wall end. Minimum 6\" clearance required.");
      return;
    }

    const openingData: Omit<Opening, 'id'> = {
      type,
      width: Number(width),
      height: Number(height),
      elevation: Number(elevation),
      position: Number(position),
    };

    console.log("Adding enhanced opening to wall:", selectedWall.id, {
      ...openingData,
      style,
      material,
      swingDirection: type === 'door' ? swingDirection : undefined,
      isExterior,
      energyRating: type === 'window' ? energyRating : undefined
    });

    addOpening(selectedWall.id, openingData);
    
    // Reset for another opening on the same wall if desired
    if (autoCenter) {
      setPosition(wallLength / 2);
    } else {
      setPosition(position + width + 1); // Move to next logical position
    }
  };

  const getStyleOptions = (): OpeningStyle[] => {
    if (type === 'window') {
      return ['single', 'double', 'casement', 'double-hung', 'sliding', 'fixed'];
    } else {
      return ['single', 'double', 'french'];
    }
  };

  const getRecommendedElevation = (): string => {
    if (type === 'window') {
      return "Standard window sill height: 3' (36\") from floor";
    } else {
      return "Doors are placed at floor level (0' elevation)";
    }
  };

  const getEnergyInfo = (): string => {
    if (energyRating <= 0.25) return "Excellent energy efficiency";
    if (energyRating <= 0.35) return "Good energy efficiency";
    if (energyRating <= 0.5) return "Average energy efficiency";
    return "Poor energy efficiency - consider upgrade";
  };

  if (!isActive || !selectedWall) {
    return null;
  }

  const wallLength = Math.sqrt(
    Math.pow(selectedWall.end.x - selectedWall.start.x, 2) + 
    Math.pow(selectedWall.end.y - selectedWall.start.y, 2)
  );

  return (
    <div style={styles.toolPanel}>
      <h3 style={styles.title}>
        {type === 'window' ? '🪟' : '🚪'} Enhanced {type === 'window' ? 'Window' : 'Door'} Tool
      </h3>
      <div style={styles.wallInfo}>
        Wall: {selectedWall.id.substring(0,8)}... (Length: {wallLength.toFixed(1)}ft)
      </div>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Type Selection */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Type:</label>
          <div style={styles.buttonGroup}>
            <button
              type="button"
              style={{...styles.typeButton, ...(type === 'window' ? styles.activeButton : {})}}
              onClick={() => setType('window')}
            >
              🪟 Window
            </button>
            <button
              type="button"
              style={{...styles.typeButton, ...(type === 'door' ? styles.activeButton : {})}}
              onClick={() => setType('door')}
            >
              🚪 Door
            </button>
          </div>
        </div>

        {/* Size Selection */}
        <div style={styles.formGroup}>
          <div style={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="useStandardSize"
              checked={useStandardSize}
              onChange={(e) => setUseStandardSize(e.target.checked)}
            />
            <label htmlFor="useStandardSize" style={styles.checkboxLabel}>
              Use Standard Sizes
            </label>
          </div>
          
          {useStandardSize ? (
            <select 
              value={standardSizeIndex} 
              onChange={e => setStandardSizeIndex(parseInt(e.target.value))} 
              style={styles.input}
            >
              {currentSizes.map((size, index) => (
                <option key={index} value={index}>{size.label}</option>
              ))}
            </select>
          ) : (
            <>
              <div style={styles.inputRow}>
                <div style={styles.inputGroup}>
                  <label htmlFor="openingWidth" style={styles.smallLabel}>Width (ft):</label>
                  <input 
                    id="openingWidth" 
                    type="number" 
                    value={width} 
                    onChange={e => setWidth(parseFloat(e.target.value))} 
                    style={styles.smallInput} 
                    step="0.1" 
                    min="0.5"
                    max={wallLength - 1}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label htmlFor="openingHeight" style={styles.smallLabel}>Height (ft):</label>
                  <input 
                    id="openingHeight" 
                    type="number" 
                    value={height} 
                    onChange={e => setHeight(parseFloat(e.target.value))} 
                    style={styles.smallInput} 
                    step="0.1" 
                    min="1"
                    max="12"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Style Selection */}
        <div style={styles.formGroup}>
          <label htmlFor="style" style={styles.label}>Style:</label>
          <select 
            id="style" 
            value={style} 
            onChange={e => setStyle(e.target.value as OpeningStyle)} 
            style={styles.input}
          >
            {getStyleOptions().map(styleOption => (
              <option key={styleOption} value={styleOption}>
                {styleOption.charAt(0).toUpperCase() + styleOption.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Material Selection */}
        <div style={styles.formGroup}>
          <label htmlFor="material" style={styles.label}>Material:</label>
          <select 
            id="material" 
            value={material} 
            onChange={e => setMaterial(e.target.value as OpeningMaterial)} 
            style={styles.input}
          >
            <option value="vinyl">Vinyl</option>
            <option value="wood">Wood</option>
            <option value="aluminum">Aluminum</option>
            <option value="fiberglass">Fiberglass</option>
          </select>
        </div>

        {/* Position */}
        <div style={styles.formGroup}>
          <div style={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="autoCenter"
              checked={autoCenter}
              onChange={(e) => setAutoCenter(e.target.checked)}
            />
            <label htmlFor="autoCenter" style={styles.checkboxLabel}>
              Auto-center on wall
            </label>
          </div>
          
          {!autoCenter && (
            <>
              <label htmlFor="openingPosition" style={styles.label}>
                Position from wall start (ft):
              </label>
              <input 
                id="openingPosition" 
                type="number" 
                value={position} 
                onChange={e => setPosition(parseFloat(e.target.value))} 
                style={styles.input} 
                step="0.1" 
                min="0.5"
                max={wallLength - width - 0.5}
              />
            </>
          )}
        </div>

        {/* Elevation */}
        <div style={styles.formGroup}>
          <label htmlFor="openingElevation" style={styles.label}>
            Elevation from floor (ft):
          </label>
          <input 
            id="openingElevation" 
            type="number" 
            value={elevation} 
            onChange={e => setElevation(parseFloat(e.target.value))} 
            style={styles.input} 
            step="0.1" 
            min="0"
            max="8"
          />
          <div style={styles.hint}>{getRecommendedElevation()}</div>
        </div>

        {/* Door-specific options */}
        {type === 'door' && (
          <>
            <div style={styles.formGroup}>
              <label htmlFor="swingDirection" style={styles.label}>Swing Direction:</label>
              <select 
                id="swingDirection" 
                value={swingDirection} 
                onChange={e => setSwingDirection(e.target.value as SwingDirection)} 
                style={styles.input}
              >
                <option value="inward">Inward</option>
                <option value="outward">Outward</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            
            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="isExterior"
                checked={isExterior}
                onChange={(e) => setIsExterior(e.target.checked)}
              />
              <label htmlFor="isExterior" style={styles.checkboxLabel}>
                Exterior Door (weather-sealed)
              </label>
            </div>
          </>
        )}

        {/* Window-specific options */}
        {type === 'window' && (
          <div style={styles.formGroup}>
            <label htmlFor="energyRating" style={styles.label}>
              Energy Rating (U-factor): {energyRating.toFixed(2)}
            </label>
            <input
              id="energyRating"
              type="range"
              min="0.15"
              max="1.0"
              step="0.05"
              value={energyRating}
              onChange={e => setEnergyRating(parseFloat(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.hint}>{getEnergyInfo()}</div>
          </div>
        )}

        {/* Submit Buttons */}
        <div style={styles.buttonGroup}>
          <button 
            type="submit" 
            style={{...styles.button, ...styles.submitButton}}
          >
            Add {type === 'window' ? 'Window' : 'Door'}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            style={{...styles.button, ...styles.cancelButton}}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Info Panel */}
      <div style={styles.infoPanel}>
        <h4 style={styles.infoTitle}>Current Selection:</h4>
        <div style={styles.infoText}>
          {width}' × {height}' {style} {type}<br/>
          Material: {material}<br/>
          {type === 'window' && `Energy: ${getEnergyInfo()}`}
          {type === 'door' && `${isExterior ? 'Exterior' : 'Interior'} - ${swingDirection} swing`}
        </div>
      </div>
    </div>
  );
};

const styles = {
  toolPanel: {
    position: 'absolute' as 'absolute',
    top: '20px',
    right: '20px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.96)',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 1000,
    width: '380px',
    maxHeight: '85vh',
    overflowY: 'auto' as 'auto',
    fontSize: '14px',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center' as 'center',
  },
  wallInfo: {
    backgroundColor: '#f3f4f6',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '16px',
    textAlign: 'center' as 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as 'column',
  },
  label: {
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
  },
  smallLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: '4px',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  },
  smallInput: {
    padding: '6px 8px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '13px',
    width: '100%',
  },
  inputRow: {
    display: 'flex',
    gap: '12px',
  },
  inputGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as 'column',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  typeButton: {
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
  button: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  activeButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    borderColor: '#3b82f6',
  },
  submitButton: {
    backgroundColor: '#10b981',
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    color: 'white',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  checkboxLabel: {
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
  },
  slider: {
    width: '100%',
    marginTop: '8px',
  },
  hint: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px',
    fontStyle: 'italic',
  },
  infoPanel: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  infoTitle: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  infoText: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: 1.4,
  },
};

export default EnhancedOpeningTool;