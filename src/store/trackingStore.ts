import { create } from 'zustand';
import type { LivePosition } from '@/types';

interface TrackingState {
  positions: Map<number, LivePosition>;
  updatePosition: (position: LivePosition) => void;
  setPositions: (positions: LivePosition[]) => void;
  clearPositions: () => void;
}

export const useTrackingStore = create<TrackingState>((set) => ({
  positions: new Map(),

  updatePosition: (position: LivePosition) => {
    set((state) => {
      const newPositions = new Map(state.positions);
      newPositions.set(position.vehicleId, position);
      return { positions: newPositions };
    });
  },

  setPositions: (positions: LivePosition[]) => {
    const posMap = new Map(positions.map((pos) => [pos.vehicleId, pos]));
    set({ positions: posMap });
  },

  clearPositions: () => {
    set({ positions: new Map() });
  },
}));
