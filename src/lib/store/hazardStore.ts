import { create } from 'zustand';
import { fetchMaritimeFeatures, distanceKm, bearingDeg } from '../maritime/overpass';
import type { MaritimeFeature } from '../maritime/overpass';

const CACHE_KEY = 'seamap-maritime-cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_LAT = 1.3521;
const DEFAULT_LON = 103.8198;
const REFETCH_DIST_KM = 25; // re-fetch if GPS moves >25 km from cache centre

interface CacheEntry {
  features: MaritimeFeature[];
  centreLat: number;
  centreLon: number;
  fetchedAt: number;
}

export interface RankedFeature extends MaritimeFeature {
  distanceKm: number;
  distanceNm: number;
  bearing: number;
}

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface HazardStore {
  status: LoadStatus;
  error: string | null;
  allFeatures: MaritimeFeature[];
  closestHazards: RankedFeature[];
  closestHarbour: RankedFeature | null;
  lastFetchedAt: number | null;
  fromCache: boolean;

  load: (lat?: number, lon?: number) => Promise<void>;
  rerank: (lat: number, lon: number) => void;
}

function rank(features: MaritimeFeature[], lat: number, lon: number): {
  hazards: RankedFeature[];
  harbour: RankedFeature | null;
} {
  const ranked = features.map((f) => ({
    ...f,
    distanceKm: distanceKm(lat, lon, f.lat, f.lon),
    distanceNm: distanceKm(lat, lon, f.lat, f.lon) / 1.852,
    bearing: bearingDeg(lat, lon, f.lat, f.lon),
  })).sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    hazards: ranked.filter((f) => f.featureType === 'hazard').slice(0, 10),
    harbour: ranked.find((f) => f.featureType === 'harbour' && !!f.name) ?? null,
  };
}

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {}
}

export const useHazardStore = create<HazardStore>((set, get) => ({
  status: 'idle',
  error: null,
  allFeatures: [],
  closestHazards: [],
  closestHarbour: null,
  lastFetchedAt: null,
  fromCache: false,

  async load(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
    // Prevent concurrent fetches
    if (get().status === 'loading') return;

    const cached = readCache();
    const now = Date.now();
    const cacheValid = cached != null && (now - cached.fetchedAt) < CACHE_TTL_MS;
    const cacheFarFromPos = cached != null &&
      distanceKm(lat, lon, cached.centreLat, cached.centreLon) > REFETCH_DIST_KM;

    // Serve from cache immediately if valid and close enough
    if (cacheValid && !cacheFarFromPos) {
      const { hazards, harbour } = rank(cached.features, lat, lon);
      set({
        status: 'ready',
        allFeatures: cached.features,
        closestHazards: hazards,
        closestHarbour: harbour,
        lastFetchedAt: cached.fetchedAt,
        fromCache: true,
        error: null,
      });
      // Still refresh in background if online
      if (navigator.onLine) {
        fetchAndCache(lat, lon, set);
      }
      return;
    }

    // Need fresh data
    set({ status: 'loading', error: null });

    // Use stale cache while fetching if available
    if (cached) {
      const { hazards, harbour } = rank(cached.features, lat, lon);
      set({ allFeatures: cached.features, closestHazards: hazards, closestHarbour: harbour, fromCache: true });
    }

    if (!navigator.onLine) {
      if (cached) {
        set({ status: 'ready', lastFetchedAt: cached.fetchedAt });
      } else {
        set({ status: 'error', error: 'Offline — no cached data yet. Connect to the internet once to load hazard data.' });
      }
      return;
    }

    fetchAndCache(lat, lon, set);
  },

  rerank(lat, lon) {
    const { allFeatures } = get();
    if (!allFeatures.length) return;
    const { hazards, harbour } = rank(allFeatures, lat, lon);
    set({ closestHazards: hazards, closestHarbour: harbour });
  },
}));

async function fetchAndCache(
  lat: number,
  lon: number,
  set: (partial: Partial<HazardStore>) => void
): Promise<void> {
  try {
    const features = await fetchMaritimeFeatures(lat, lon);
    const now = Date.now();
    const entry: CacheEntry = { features, centreLat: lat, centreLon: lon, fetchedAt: now };
    writeCache(entry);
    const { hazards, harbour } = rank(features, lat, lon);
    set({
      status: 'ready',
      allFeatures: features,
      closestHazards: hazards,
      closestHarbour: harbour,
      lastFetchedAt: now,
      fromCache: false,
      error: null,
    });
  } catch (err) {
    const cached = readCache();
    if (cached) {
      set({ status: 'ready', error: null }); // already serving stale cache
    } else {
      set({ status: 'error', error: String(err) });
    }
  }
}
