import { create } from 'zustand';

interface MapState {
  bearing: number;
  setBearing: (b: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  bearing: 0,
  setBearing: (bearing) => set({ bearing }),
}));
