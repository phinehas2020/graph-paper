import React from 'react';
import { LucideIcon } from 'lucide-react';
import {
  Home,
  DoorOpen,
  DoorClosed,
  RectangleHorizontal,
  Lightbulb,
  Zap,
  Droplet,
  Flame,
  Wind,
  ArrowUp,
  Bed,
  ChefHat,
  Bath,
  Car,
  TreePine,
  Square,
  Circle,
  Minus,
  Plus,
  RotateCw,
  Move,
  Trash2,
} from 'lucide-react';

// Blueprint symbol types
export type BlueprintSymbolType = 
  | 'door-swing'
  | 'door-sliding'
  | 'door-bifold'
  | 'door-pocket'
  | 'window-single'
  | 'window-double'
  | 'window-casement'
  | 'window-bay'
  | 'stairs-straight'
  | 'stairs-l-shaped'
  | 'stairs-u-shaped'
  | 'stairs-spiral'
  | 'electrical-outlet'
  | 'electrical-switch'
  | 'electrical-ceiling-fan'
  | 'electrical-light-fixture'
  | 'plumbing-sink'
  | 'plumbing-toilet'
  | 'plumbing-shower'
  | 'plumbing-bathtub'
  | 'hvac-vent'
  | 'hvac-return'
  | 'hvac-thermostat'
  | 'appliance-refrigerator'
  | 'appliance-stove'
  | 'appliance-dishwasher'
  | 'appliance-washer'
  | 'appliance-dryer'
  | 'furniture-bed-single'
  | 'furniture-bed-double'
  | 'furniture-bed-queen'
  | 'furniture-bed-king'
  | 'furniture-sofa'
  | 'furniture-chair'
  | 'furniture-table-dining'
  | 'furniture-table-coffee'
  | 'furniture-desk'
  | 'furniture-dresser'
  | 'closet-walk-in'
  | 'closet-reach-in'
  | 'fireplace'
  | 'column'
  | 'beam'
  | 'dimension-line'
  | 'section-line'
  | 'elevation-marker'
  | 'north-arrow'
  | 'scale-indicator';

export interface BlueprintSymbol {
  type: BlueprintSymbolType;
  name: string;
  category: 'doors' | 'windows' | 'stairs' | 'electrical' | 'plumbing' | 'hvac' | 'appliances' | 'furniture' | 'structural' | 'annotations';
  icon: LucideIcon;
  description: string;
  defaultSize: { width: number; height: number }; // in grid units
  rotatable: boolean;
  scalable: boolean;
  color: string;
}

export const BLUEPRINT_SYMBOLS: BlueprintSymbol[] = [
  // Doors
  {
    type: 'door-swing',
    name: 'Swing Door',
    category: 'doors',
    icon: DoorOpen,
    description: 'Standard hinged door with swing arc',
    defaultSize: { width: 3, height: 0.5 },
    rotatable: true,
    scalable: true,
    color: '#8B4513'
  },
  {
    type: 'door-sliding',
    name: 'Sliding Door',
    category: 'doors',
    icon: DoorClosed,
    description: 'Sliding patio or closet door',
    defaultSize: { width: 6, height: 0.5 },
    rotatable: true,
    scalable: true,
    color: '#8B4513'
  },
  {
    type: 'door-bifold',
    name: 'Bifold Door',
    category: 'doors',
    icon: DoorClosed,
    description: 'Folding closet door',
    defaultSize: { width: 4, height: 0.5 },
    rotatable: true,
    scalable: true,
    color: '#8B4513'
  },
  {
    type: 'door-pocket',
    name: 'Pocket Door',
    category: 'doors',
    icon: DoorClosed,
    description: 'Door that slides into wall cavity',
    defaultSize: { width: 3, height: 0.5 },
    rotatable: true,
    scalable: true,
    color: '#8B4513'
  },

  // Windows
  {
    type: 'window-single',
    name: 'Single Window',
    category: 'windows',
    icon: RectangleHorizontal,
    description: 'Standard single window',
    defaultSize: { width: 3, height: 0.5 },
    rotatable: true,
    scalable: true,
    color: '#4A90E2'
  },
  {
    type: 'window-double',
    name: 'Double Window',
    category: 'windows',
    icon: RectangleHorizontal,
    description: 'Double hung or casement window',
    defaultSize: { width: 4, height: 0.5 },
    rotatable: true,
    scalable: true,
    color: '#4A90E2'
  },
  {
    type: 'window-casement',
    name: 'Casement Window',
    category: 'windows',
    icon: RectangleHorizontal,
    description: 'Side-hinged window',
    defaultSize: { width: 2.5, height: 0.5 },
    rotatable: true,
    scalable: true,
    color: '#4A90E2'
  },
  {
    type: 'window-bay',
    name: 'Bay Window',
    category: 'windows',
    icon: RectangleHorizontal,
    description: 'Protruding bay window',
    defaultSize: { width: 6, height: 2 },
    rotatable: true,
    scalable: true,
    color: '#4A90E2'
  },

  // Stairs
  {
    type: 'stairs-straight',
    name: 'Straight Stairs',
    category: 'stairs',
    icon: ArrowUp,
    description: 'Straight staircase',
    defaultSize: { width: 3, height: 12 },
    rotatable: true,
    scalable: true,
    color: '#666666'
  },
  {
    type: 'stairs-l-shaped',
    name: 'L-Shaped Stairs',
    category: 'stairs',
    icon: ArrowUp,
    description: 'L-shaped staircase with landing',
    defaultSize: { width: 6, height: 6 },
    rotatable: true,
    scalable: true,
    color: '#666666'
  },
  {
    type: 'stairs-u-shaped',
    name: 'U-Shaped Stairs',
    category: 'stairs',
    icon: ArrowUp,
    description: 'U-shaped staircase with landing',
    defaultSize: { width: 6, height: 8 },
    rotatable: true,
    scalable: true,
    color: '#666666'
  },
  {
    type: 'stairs-spiral',
    name: 'Spiral Stairs',
    category: 'stairs',
    icon: ArrowUp,
    description: 'Circular spiral staircase',
    defaultSize: { width: 4, height: 4 },
    rotatable: true,
    scalable: true,
    color: '#666666'
  },

  // Electrical
  {
    type: 'electrical-outlet',
    name: 'Electrical Outlet',
    category: 'electrical',
    icon: Zap,
    description: 'Standard electrical outlet',
    defaultSize: { width: 0.5, height: 0.5 },
    rotatable: false,
    scalable: false,
    color: '#FFD700'
  },
  {
    type: 'electrical-switch',
    name: 'Light Switch',
    category: 'electrical',
    icon: Zap,
    description: 'Wall light switch',
    defaultSize: { width: 0.5, height: 0.5 },
    rotatable: false,
    scalable: false,
    color: '#FFD700'
  },
  {
    type: 'electrical-ceiling-fan',
    name: 'Ceiling Fan',
    category: 'electrical',
    icon: Wind,
    description: 'Ceiling mounted fan',
    defaultSize: { width: 4, height: 4 },
    rotatable: false,
    scalable: true,
    color: '#FFD700'
  },
  {
    type: 'electrical-light-fixture',
    name: 'Light Fixture',
    category: 'electrical',
    icon: Lightbulb,
    description: 'Ceiling or wall light fixture',
    defaultSize: { width: 1, height: 1 },
    rotatable: false,
    scalable: true,
    color: '#FFD700'
  },

  // Plumbing
  {
    type: 'plumbing-sink',
    name: 'Sink',
    category: 'plumbing',
    icon: Droplet,
    description: 'Kitchen or bathroom sink',
    defaultSize: { width: 2, height: 1.5 },
    rotatable: true,
    scalable: true,
    color: '#00BFFF'
  },
  {
    type: 'plumbing-toilet',
    name: 'Toilet',
    category: 'plumbing',
    icon: Circle,
    description: 'Standard toilet',
    defaultSize: { width: 1.5, height: 2.5 },
    rotatable: true,
    scalable: false,
    color: '#00BFFF'
  },
  {
    type: 'plumbing-shower',
    name: 'Shower',
    category: 'plumbing',
    icon: Droplet,
    description: 'Shower stall',
    defaultSize: { width: 3, height: 3 },
    rotatable: true,
    scalable: true,
    color: '#00BFFF'
  },
  {
    type: 'plumbing-bathtub',
    name: 'Bathtub',
    category: 'plumbing',
    icon: Bath,
    description: 'Standard bathtub',
    defaultSize: { width: 5, height: 2.5 },
    rotatable: true,
    scalable: true,
    color: '#00BFFF'
  },

  // HVAC
  {
    type: 'hvac-vent',
    name: 'Air Vent',
    category: 'hvac',
    icon: Wind,
    description: 'Supply air vent',
    defaultSize: { width: 1, height: 0.5 },
    rotatable: true,
    scalable: true,
    color: '#32CD32'
  },
  {
    type: 'hvac-return',
    name: 'Return Air',
    category: 'hvac',
    icon: Wind,
    description: 'Return air grille',
    defaultSize: { width: 2, height: 1 },
    rotatable: true,
    scalable: true,
    color: '#32CD32'
  },
  {
    type: 'hvac-thermostat',
    name: 'Thermostat',
    category: 'hvac',
    icon: Wind,
    description: 'Wall thermostat',
    defaultSize: { width: 0.5, height: 0.5 },
    rotatable: false,
    scalable: false,
    color: '#32CD32'
  },

  // Appliances
  {
    type: 'appliance-refrigerator',
    name: 'Refrigerator',
    category: 'appliances',
    icon: Square,
    description: 'Kitchen refrigerator',
    defaultSize: { width: 3, height: 2.5 },
    rotatable: true,
    scalable: true,
    color: '#C0C0C0'
  },
  {
    type: 'appliance-stove',
    name: 'Stove/Range',
    category: 'appliances',
    icon: ChefHat,
    description: 'Kitchen stove or range',
    defaultSize: { width: 2.5, height: 2 },
    rotatable: true,
    scalable: true,
    color: '#C0C0C0'
  },
  {
    type: 'appliance-dishwasher',
    name: 'Dishwasher',
    category: 'appliances',
    icon: Square,
    description: 'Built-in dishwasher',
    defaultSize: { width: 2, height: 2 },
    rotatable: true,
    scalable: true,
    color: '#C0C0C0'
  },
  {
    type: 'appliance-washer',
    name: 'Washer',
    category: 'appliances',
    icon: Circle,
    description: 'Washing machine',
    defaultSize: { width: 2.5, height: 2.5 },
    rotatable: false,
    scalable: true,
    color: '#C0C0C0'
  },
  {
    type: 'appliance-dryer',
    name: 'Dryer',
    category: 'appliances',
    icon: Circle,
    description: 'Clothes dryer',
    defaultSize: { width: 2.5, height: 2.5 },
    rotatable: false,
    scalable: true,
    color: '#C0C0C0'
  },

  // Furniture
  {
    type: 'furniture-bed-single',
    name: 'Single Bed',
    category: 'furniture',
    icon: Bed,
    description: 'Single/twin bed',
    defaultSize: { width: 3, height: 6.5 },
    rotatable: true,
    scalable: false,
    color: '#8B4513'
  },
  {
    type: 'furniture-bed-double',
    name: 'Double Bed',
    category: 'furniture',
    icon: Bed,
    description: 'Full/double bed',
    defaultSize: { width: 4.5, height: 6.5 },
    rotatable: true,
    scalable: false,
    color: '#8B4513'
  },
  {
    type: 'furniture-bed-queen',
    name: 'Queen Bed',
    category: 'furniture',
    icon: Bed,
    description: 'Queen size bed',
    defaultSize: { width: 5, height: 6.5 },
    rotatable: true,
    scalable: false,
    color: '#8B4513'
  },
  {
    type: 'furniture-bed-king',
    name: 'King Bed',
    category: 'furniture',
    icon: Bed,
    description: 'King size bed',
    defaultSize: { width: 6.5, height: 6.5 },
    rotatable: true,
    scalable: false,
    color: '#8B4513'
  },
  {
    type: 'furniture-sofa',
    name: 'Sofa',
    category: 'furniture',
    icon: Minus,
    description: 'Living room sofa',
    defaultSize: { width: 7, height: 3 },
    rotatable: true,
    scalable: true,
    color: '#8B4513'
  },
  {
    type: 'furniture-chair',
    name: 'Chair',
    category: 'furniture',
    icon: Square,
    description: 'Single chair',
    defaultSize: { width: 2, height: 2 },
    rotatable: true,
    scalable: true,
    color: '#8B4513'
  },
  {
    type: 'furniture-table-dining',
    name: 'Dining Table',
    category: 'furniture',
    icon: Square,
    description: 'Dining room table',
    defaultSize: { width: 6, height: 3 },
    rotatable: true,
    scalable: true,
    color: '#8B4513'
  },
  {
    type: 'furniture-table-coffee',
    name: 'Coffee Table',
    category: 'furniture',
    icon: Square,
    description: 'Living room coffee table',
    defaultSize: { width: 4, height: 2 },
    rotatable: true,
    scalable: true,
    color: '#8B4513'
  },
  {
    type: 'furniture-desk',
    name: 'Desk',
    category: 'furniture',
    icon: Square,
    description: 'Office or study desk',
    defaultSize: { width: 4, height: 2 },
    rotatable: true,
    scalable: true,
    color: '#8B4513'
  },
  {
    type: 'furniture-dresser',
    name: 'Dresser',
    category: 'furniture',
    icon: Square,
    description: 'Bedroom dresser',
    defaultSize: { width: 4, height: 1.5 },
    rotatable: true,
    scalable: true,
    color: '#8B4513'
  },

  // Structural
  {
    type: 'closet-walk-in',
    name: 'Walk-in Closet',
    category: 'structural',
    icon: Square,
    description: 'Walk-in closet space',
    defaultSize: { width: 6, height: 6 },
    rotatable: true,
    scalable: true,
    color: '#D3D3D3'
  },
  {
    type: 'closet-reach-in',
    name: 'Reach-in Closet',
    category: 'structural',
    icon: Square,
    description: 'Standard reach-in closet',
    defaultSize: { width: 4, height: 2 },
    rotatable: true,
    scalable: true,
    color: '#D3D3D3'
  },
  {
    type: 'fireplace',
    name: 'Fireplace',
    category: 'structural',
    icon: Flame,
    description: 'Fireplace with hearth',
    defaultSize: { width: 4, height: 2 },
    rotatable: true,
    scalable: true,
    color: '#FF6347'
  },
  {
    type: 'column',
    name: 'Column',
    category: 'structural',
    icon: Circle,
    description: 'Structural column',
    defaultSize: { width: 1, height: 1 },
    rotatable: false,
    scalable: true,
    color: '#696969'
  },
  {
    type: 'beam',
    name: 'Beam',
    category: 'structural',
    icon: Minus,
    description: 'Structural beam',
    defaultSize: { width: 8, height: 0.5 },
    rotatable: true,
    scalable: true,
    color: '#696969'
  },

  // Annotations
  {
    type: 'dimension-line',
    name: 'Dimension Line',
    category: 'annotations',
    icon: Minus,
    description: 'Dimension measurement line',
    defaultSize: { width: 4, height: 0.1 },
    rotatable: true,
    scalable: true,
    color: '#FF0000'
  },
  {
    type: 'section-line',
    name: 'Section Line',
    category: 'annotations',
    icon: Minus,
    description: 'Section cut line',
    defaultSize: { width: 6, height: 0.1 },
    rotatable: true,
    scalable: true,
    color: '#FF0000'
  },
  {
    type: 'elevation-marker',
    name: 'Elevation Marker',
    category: 'annotations',
    icon: Circle,
    description: 'Elevation reference marker',
    defaultSize: { width: 1, height: 1 },
    rotatable: false,
    scalable: false,
    color: '#FF0000'
  },
  {
    type: 'north-arrow',
    name: 'North Arrow',
    category: 'annotations',
    icon: Plus,
    description: 'North direction indicator',
    defaultSize: { width: 2, height: 2 },
    rotatable: true,
    scalable: true,
    color: '#000000'
  },
  {
    type: 'scale-indicator',
    name: 'Scale Indicator',
    category: 'annotations',
    icon: Minus,
    description: 'Drawing scale reference',
    defaultSize: { width: 4, height: 0.5 },
    rotatable: false,
    scalable: false,
    color: '#000000'
  }
];

// Helper function to get symbols by category
export const getSymbolsByCategory = (category: BlueprintSymbol['category']): BlueprintSymbol[] => {
  return BLUEPRINT_SYMBOLS.filter(symbol => symbol.category === category);
};

// Helper function to get symbol by type
export const getSymbolByType = (type: BlueprintSymbolType): BlueprintSymbol | undefined => {
  return BLUEPRINT_SYMBOLS.find(symbol => symbol.type === type);
};

// Categories for organizing the symbols
export const SYMBOL_CATEGORIES = [
  { id: 'doors', name: 'Doors', icon: DoorOpen },
  { id: 'windows', name: 'Windows', icon: RectangleHorizontal },
  { id: 'stairs', name: 'Stairs', icon: ArrowUp },
  { id: 'electrical', name: 'Electrical', icon: Zap },
  { id: 'plumbing', name: 'Plumbing', icon: Droplet },
  { id: 'hvac', name: 'HVAC', icon: Wind },
  { id: 'appliances', name: 'Appliances', icon: ChefHat },
  { id: 'furniture', name: 'Furniture', icon: Bed },
  { id: 'structural', name: 'Structural', icon: Home },
  { id: 'annotations', name: 'Annotations', icon: Plus }
] as const; 