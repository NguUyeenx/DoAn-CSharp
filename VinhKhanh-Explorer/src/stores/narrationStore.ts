import { create } from 'zustand';
import type { NarrationItem } from '../types/audio';

interface NarrationState {
  isPlaying: boolean;
  currentItem: NarrationItem | null;
  queue: NarrationItem[];
  cooldownMap: Record<number, number>; // POI ID -> timestamp
  setPlaying: (isPlaying: boolean) => void;
  setCurrentItem: (item: NarrationItem | null) => void;
  addToQueue: (item: NarrationItem) => void;
  removeFromQueue: (poiId: number) => void;
  clearQueue: () => void;
  setCooldown: (poiId: number, timestamp: number) => void;
  clearCooldowns: () => void;
}

export const useNarrationStore = create<NarrationState>((set) => ({
  isPlaying: false,
  currentItem: null,
  queue: [],
  cooldownMap: {},
  setPlaying: (isPlaying: boolean) => set({ isPlaying }),
  setCurrentItem: (currentItem: NarrationItem | null) => set({ currentItem }),
  addToQueue: (item: NarrationItem) =>
    set((state) => ({
      queue: state.queue.some((q) => q.poiId === item.poiId)
        ? state.queue
        : [...state.queue, item],
    })),
  removeFromQueue: (poiId: number) =>
    set((state) => ({
      queue: state.queue.filter((q) => q.poiId !== poiId),
    })),
  clearQueue: () => set({ queue: [] }),
  setCooldown: (poiId: number, timestamp: number) =>
    set((state) => ({
      cooldownMap: { ...state.cooldownMap, [poiId]: timestamp },
    })),
  clearCooldowns: () => set({ cooldownMap: {} }),
}));
