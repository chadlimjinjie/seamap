import { create } from 'zustand';

export type GPSStatus = 'idle' | 'watching' | 'error';

export interface GPSFix {
  lat: number;
  lon: number;
  accuracy: number;       // metres
  heading: number | null; // degrees true
  speed: number | null;   // m/s
  altitude: number | null;
  timestamp: number;
}

const PREF_KEY = 'seamap-gps-enabled';

function readPref(): boolean {
  try { return localStorage.getItem(PREF_KEY) === 'true'; } catch { return false; }
}
function writePref(v: boolean): void {
  try { localStorage.setItem(PREF_KEY, String(v)); } catch {}
}

interface GPSStore {
  status: GPSStatus;
  fix: GPSFix | null;
  error: string | null;
  watchId: number | null;
  enabled: boolean;

  startWatching: () => void;
  stopWatching: () => void;
  _setFix: (fix: GPSFix) => void;
  _setError: (msg: string) => void;
}

export const useGPSStore = create<GPSStore>((set, get) => ({
  status: 'idle',
  fix: null,
  error: null,
  watchId: null,
  enabled: false, // hydrated by GPSAutoStart from localStorage

  startWatching() {
    if (get().watchId != null) return;
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      set({ status: 'error', error: 'Geolocation not supported', enabled: false });
      writePref(false);
      return;
    }
    writePref(true);
    set({ status: 'watching', error: null, enabled: true });
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        get()._setFix({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          altitude: pos.coords.altitude,
          timestamp: pos.timestamp,
        });
      },
      (err) => get()._setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    set({ watchId: id });
  },

  stopWatching() {
    const { watchId } = get();
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    writePref(false);
    set({ status: 'idle', watchId: null, fix: null, error: null, enabled: false });
  },

  _setFix(fix) { set({ fix, error: null }); },
  _setError(msg) { set({ status: 'error', error: msg }); },
}));

/** Call once on client mount to restore persisted preference. */
export function initGPSFromPref(): void {
  if (readPref()) useGPSStore.getState().startWatching();
  else useGPSStore.setState({ enabled: false });
}
