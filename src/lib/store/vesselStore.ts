import { create } from 'zustand';
import type { AISVessel } from '../ais/types';
import type { ConnectionState, SerialStats } from '../serial/SerialManager';

const VESSEL_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface VesselStore {
  vessels: Map<number, AISVessel>;
  selectedMMSI: number | null;
  connectionState: ConnectionState;
  stats: SerialStats;
  filterText: string;

  upsertVessel: (partial: Partial<AISVessel>) => void;
  selectVessel: (mmsi: number | null) => void;
  setConnectionState: (state: ConnectionState) => void;
  setStats: (stats: SerialStats) => void;
  setFilter: (text: string) => void;
  purgeStale: () => void;
  getVesselList: () => AISVessel[];
}

export const useVesselStore = create<VesselStore>((set, get) => ({
  vessels: new Map(),
  selectedMMSI: null,
  connectionState: 'disconnected',
  stats: { sentences: 0, vessels: 0, errors: 0, bytesReceived: 0 },
  filterText: '',

  upsertVessel(partial) {
    if (!partial.mmsi) return;
    set((state) => {
      const next = new Map(state.vessels);
      const existing = next.get(partial.mmsi!);
      const merged: AISVessel = {
        ...(existing ?? { mmsi: partial.mmsi!, msgType: 0, lastSeen: Date.now() }),
        ...partial,
      };
      next.set(partial.mmsi!, merged);
      return { vessels: next };
    });
  },

  selectVessel(mmsi) {
    set({ selectedMMSI: mmsi });
  },

  setConnectionState(state) {
    set({ connectionState: state });
  },

  setStats(stats) {
    set({ stats });
  },

  setFilter(text) {
    set({ filterText: text });
  },

  purgeStale() {
    const cutoff = Date.now() - VESSEL_TTL_MS;
    set((state) => {
      const next = new Map(state.vessels);
      for (const [mmsi, v] of next) {
        if (v.lastSeen < cutoff) next.delete(mmsi);
      }
      return { vessels: next };
    });
  },

  getVesselList() {
    const { vessels, filterText } = get();
    const list = Array.from(vessels.values());
    if (!filterText) return list;
    const q = filterText.toLowerCase();
    return list.filter(
      (v) =>
        v.mmsi.toString().includes(q) ||
        v.name?.toLowerCase().includes(q) ||
        v.callsign?.toLowerCase().includes(q)
    );
  },
}));
