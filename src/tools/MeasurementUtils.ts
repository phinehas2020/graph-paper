// Utility functions for measurement conversion and display
export interface MeasurementDisplay {
  feet: number;
  inches: number;
  display: string;
}

/**
 * Converts a measurement in units (where 1 unit = 1 foot) to feet and inches display
 * @param units - The measurement in units (1 unit = 1 foot)
 * @returns Object with feet, inches, and formatted display string
 */
export function convertUnitsToFeetInches(units: number): MeasurementDisplay {
  const totalInches = units * 12; // Convert feet to inches
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  
  let display = '';
  if (feet > 0) {
    display += `${feet}'`;
  }
  if (inches > 0) {
    display += `${inches}"`;
  }
  if (display === '') {
    display = '0"';
  }
  
  return {
    feet,
    inches,
    display
  };
}

/**
 * Formats a measurement for display based on the value
 * @param units - The measurement in units
 * @param precision - Number of decimal places for small measurements
 * @returns Formatted string for display
 */
export function formatMeasurement(units: number, precision: number = 1): string {
  const feetInches = convertUnitsToFeetInches(units);
  
  // For measurements less than 1 foot, show decimal inches
  if (units < 1) {
    const totalInches = units * 12;
    return `${totalInches.toFixed(precision)}"`;
  }
  
  return feetInches.display;
}

/**
 * Converts feet and inches input to units (where 1 unit = 1 foot)
 * @param feet - Number of feet
 * @param inches - Number of inches
 * @returns Measurement in units
 */
export function convertFeetInchesToUnits(feet: number, inches: number): number {
  return feet + (inches / 12);
}

/**
 * Parses a measurement string like "10'6\"" or "6\"" into units
 * @param input - String input like "10'6\"" or "6\"" or "10.5"
 * @returns Measurement in units
 */
export function parseMeasurementString(input: string): number {
  const cleaned = input.trim();
  
  // Handle feet and inches format: "10'6\""
  const feetInchesMatch = cleaned.match(/^(\d+)'(\d+)"?$/);
  if (feetInchesMatch) {
    const feet = parseInt(feetInchesMatch[1], 10);
    const inches = parseInt(feetInchesMatch[2], 10);
    return convertFeetInchesToUnits(feet, inches);
  }
  
  // Handle just inches: "6\""
  const inchesMatch = cleaned.match(/^(\d+(?:\.\d+)?)"?$/);
  if (inchesMatch) {
    const inches = parseFloat(inchesMatch[1]);
    return convertFeetInchesToUnits(0, inches);
  }
  
  // Handle just feet: "10'"
  const feetMatch = cleaned.match(/^(\d+(?:\.\d+)?)'$/);
  if (feetMatch) {
    const feet = parseFloat(feetMatch[1]);
    return convertFeetInchesToUnits(feet, 0);
  }
  
  // Handle decimal numbers (assume feet)
  const decimal = parseFloat(cleaned);
  if (!isNaN(decimal)) {
    return decimal;
  }
  
  return 0;
}

/**
 * Calculates area in square feet from dimensions in units
 * @param width - Width in units
 * @param height - Height in units
 * @returns Area in square feet with formatted display
 */
export function calculateAreaDisplay(width: number, height: number): string {
  const areaSquareFeet = width * height;
  return `${areaSquareFeet.toFixed(1)} sq ft`;
}

/**
 * Calculates perimeter in feet from dimensions in units
 * @param width - Width in units
 * @param height - Height in units
 * @returns Perimeter formatted as feet/inches
 */
export function calculatePerimeterDisplay(width: number, height: number): string {
  const perimeter = 2 * (width + height);
  return formatMeasurement(perimeter);
} 