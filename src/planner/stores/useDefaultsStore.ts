'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BuildingDefaults {
  // Wall
  wallHeight: number;
  wallThickness: number;
  wallColor: string;

  // Door
  doorWidth: number;
  doorHeight: number;
  doorSillHeight: number;

  // Window
  windowWidth: number;
  windowHeight: number;
  windowSillHeight: number;

  // Floor
  floorThickness: number;
  floorElevation: number;

  // Ceiling
  ceilingHeight: number;
  ceilingThickness: number;

  // Roof
  roofPitch: number;
  roofOverhang: number;
}

interface DefaultsState extends BuildingDefaults {
  updateDefaults: (changes: Partial<BuildingDefaults>) => void;
  resetDefaults: () => void;
}

const DEFAULT_VALUES: BuildingDefaults = {
  wallHeight: 3,
  wallThickness: 0.15,
  wallColor: '#f5f3ef',

  doorWidth: 3,
  doorHeight: 2.35,
  doorSillHeight: 0,

  windowWidth: 4,
  windowHeight: 1.4,
  windowSillHeight: 1.05,

  floorThickness: 0.2,
  floorElevation: 0,

  ceilingHeight: 3,
  ceilingThickness: 0.1,

  roofPitch: 30,
  roofOverhang: 0.5,
};

const useDefaultsStore = create<DefaultsState>()(
  persist(
    (set) => ({
      ...DEFAULT_VALUES,

      updateDefaults: (changes) => set((state) => ({ ...state, ...changes })),

      resetDefaults: () => set(DEFAULT_VALUES),
    }),
    {
      name: 'graph-paper-defaults',
    },
  ),
);

export default useDefaultsStore;
