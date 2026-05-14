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

export interface GPSOptions {
  highAccuracy: boolean; // enableHighAccuracy
  maximumAge: number;    // ms
}

const PREF_KEY = 'seamap-gps-enabled';
const GPS_OPTS_KEY = 'seamap-gps-options';
const DEFAULT_GPS_OPTS: GPSOptions = { highAccuracy: false, maximumAge: 5000 };

function readPref(): boolean {
  try { return localStorage.getItem(PREF_KEY) === 'true'; } catch { return false; }
}
function writePref(v: boolean): void {
  try { localStorage.setItem(PREF_KEY, String(v)); } catch {}
}
function readGPSOpts(): GPSOptions {
  try {
    const raw = localStorage.getItem(GPS_OPTS_KEY);
    if (!raw) return DEFAULT_GPS_OPTS;
    return { ...DEFAULT_GPS_OPTS, ...JSON.parse(raw) };
  } catch { return DEFAULT_GPS_OPTS; }
}
function writeGPSOpts(opts: GPSOptions): void {
  try { localStorage.setItem(GPS_OPTS_KEY, JSON.stringify(opts)); } catch {}
}

interface GPSStore {
  status: GPSStatus;
  fix: GPSFix | null;
  error: string | null;
  watchId: number | null;
  enabled: boolean;
  gpsOptions: GPSOptions;

  startWatching: () => void;
  stopWatching: () => void;
  setGpsOptions: (opts: Partial<GPSOptions>) => void;
  _setFix: (fix: GPSFix) => void;
  _setError: (msg: string) => void;
}

export const useGPSStore = create<GPSStore>((set, get) => ({
  status: 'idle',
  fix: null,
  error: null,
  watchId: null,
  enabled: false,
  gpsOptions: DEFAULT_GPS_OPTS,

  startWatching() {
    if (get().watchId != null) return;
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      set({ status: 'error', error: 'Geolocation not supported', enabled: false });
      writePref(false);
      return;
    }
    writePref(true);
    set({ status: 'watching', error: null, enabled: true });
    const { highAccuracy, maximumAge } = get().gpsOptions;
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
      { enableHighAccuracy: highAccuracy, maximumAge },
    );
    set({ watchId: id });
  },

  stopWatching() {
    const { watchId } = get();
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    writePref(false);
    set({ status: 'idle', watchId: null, fix: null, error: null, enabled: false });
  },

  setGpsOptions(opts) {
    const next = { ...get().gpsOptions, ...opts };
    writeGPSOpts(next);
    set({ gpsOptions: next });
    // Restart watch with new options if currently active
    if (get().status === 'watching') {
      const { watchId } = get();
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      set({ watchId: null });
      get().startWatching();
    }
  },

  _setFix(fix) { set({ fix, error: null }); },
  _setError(msg) { set({ status: 'error', error: msg }); },
}));

/** Call once on client mount to restore persisted preference. */
export function initGPSFromPref(): void {
  if (typeof window !== 'undefined') {
    useGPSStore.setState({ gpsOptions: readGPSOpts() });
  }
  if (readPref()) useGPSStore.getState().startWatching();
  else useGPSStore.setState({ enabled: false });
}
