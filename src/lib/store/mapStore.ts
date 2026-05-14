import { create } from 'zustand';

interface FlyToCommand {
  lon: number;
  lat: number;
  zoom?: number;
  seq: number; // increment to trigger effect even if coords unchanged
}

interface MapState {
  bearing: number;
  setBearing: (b: number) => void;
  flyToCmd: FlyToCommand | null;
  flyTo: (lon: number, lat: number, zoom?: number) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  bearing: 0,
  setBearing: (bearing) => set({ bearing }),
  flyToCmd: null,
  flyTo: (lon, lat, zoom) =>
    set({ flyToCmd: { lon, lat, zoom, seq: (get().flyToCmd?.seq ?? 0) + 1 } }),
}));
