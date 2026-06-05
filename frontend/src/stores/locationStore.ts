import { create } from 'zustand';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationState {
  position: GPSPosition | null;
  isTracking: boolean;
  isSimulatorActive: boolean;
  lastUpdated: number | null;
  setPosition: (pos: GPSPosition | null) => void;
  setTracking: (isTracking: boolean) => void;
  setSimulatorActive: (active: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  position: null,
  isTracking: false,
  isSimulatorActive: false,
  lastUpdated: null,
  setPosition: (position: GPSPosition | null) =>
    set({ position, lastUpdated: Date.now() }),
  setTracking: (isTracking: boolean) => set({ isTracking }),
  setSimulatorActive: (isSimulatorActive: boolean) => set({ isSimulatorActive }),
}));
