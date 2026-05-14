import { create } from 'zustand';

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface OverlayPositions {
  compass: Corner;
  harbour: Corner;
  hazardDetail: Corner;
}

export const CORNER_CLASSES: Record<Corner, string> = {
  'top-left':     'absolute top-4 left-4',
  'top-right':    'absolute top-4 right-4',
  'bottom-left':  'absolute bottom-4 left-4',
  'bottom-right': 'absolute bottom-4 right-4',
};

const PREF_KEY = 'seamap-overlay-positions';

const DEFAULTS: OverlayPositions = {
  compass:     'top-right',
  harbour:     'bottom-left',
  hazardDetail: 'top-left',
};

function readPrefs(): OverlayPositions {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function writePrefs(p: OverlayPositions): void {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p));
  } catch {}
}

interface SettingsStore {
  overlayPositions: OverlayPositions;
  setOverlayPosition: (overlay: keyof OverlayPositions, corner: Corner) => void;
  resetOverlayPositions: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  overlayPositions: DEFAULTS,

  setOverlayPosition(overlay, corner) {
    const next = { ...get().overlayPositions, [overlay]: corner };
    writePrefs(next);
    set({ overlayPositions: next });
  },

  resetOverlayPositions() {
    writePrefs(DEFAULTS);
    set({ overlayPositions: { ...DEFAULTS } });
  },
}));

// Hydrate from localStorage on first import (client-side only)
if (typeof window !== 'undefined') {
  useSettingsStore.setState({ overlayPositions: readPrefs() });
}
