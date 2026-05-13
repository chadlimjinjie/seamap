'use client';

import { useEffect } from 'react';
import { AlertTriangle, Anchor, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useHazardStore } from '@/lib/store/hazardStore';
import { useGPSStore } from '@/lib/store/gpsStore';
import type { RankedFeature } from '@/lib/store/hazardStore';

const HAZARD_LABEL: Record<string, string> = {
  rock: 'Rock',
  wreck: 'Wreck',
  obstruction: 'Obstruct.',
  reef: 'Reef',
  isolated_danger: 'Danger',
  underwater_rock: 'U/W Rock',
  snag: 'Snag',
  shoal: 'Shoal',
};

function fmtDist(nm: number): string {
  return nm < 1 ? `${(nm * 1852).toFixed(0)} m` : `${nm.toFixed(1)} nm`;
}

function fmtBearing(deg: number): string {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function fmtAge(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HazardPanel() {
  const status = useHazardStore((s) => s.status);
  const error = useHazardStore((s) => s.error);
  const closestHazards = useHazardStore((s) => s.closestHazards);
  const closestHarbour = useHazardStore((s) => s.closestHarbour);
  const lastFetchedAt = useHazardStore((s) => s.lastFetchedAt);
  const fromCache = useHazardStore((s) => s.fromCache);
  const load = useHazardStore((s) => s.load);
  const rerank = useHazardStore((s) => s.rerank);
  const gpsFix = useGPSStore((s) => s.fix);

  // Initial load — guard against multiple mounted instances calling load() concurrently
  useEffect(() => {
    const { status } = useHazardStore.getState();
    if (status === 'idle') load(gpsFix?.lat, gpsFix?.lon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rerank when GPS moves
  useEffect(() => {
    if (gpsFix) rerank(gpsFix.lat, gpsFix.lon);
  }, [gpsFix, rerank]);

  const isLoading = status === 'loading';

  return (
    <div className="p-3 pb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Hazards & Harbours
        </span>
        <div className="flex items-center gap-1">
          {lastFetchedAt && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {fromCache ? 'cached' : fmtAge(lastFetchedAt)}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={() => load(gpsFix?.lat, gpsFix?.lon)}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-[10px] text-destructive mb-2 break-words">{error}</p>
      )}

      {isLoading && !closestHazards.length && (
        <p className="text-[10px] text-muted-foreground">Fetching maritime data…</p>
      )}

      {closestHarbour && (
        <>
          <HarbourRow feature={closestHarbour} />
          <Separator className="my-1.5" />
        </>
      )}

      {closestHazards.length > 0 && (
        <div className="space-y-0.5">
          {closestHazards.map((h) => (
            <HazardRow key={h.id} feature={h} />
          ))}
        </div>
      )}

      {status === 'ready' && !closestHazards.length && !closestHarbour && (
        <p className="text-[10px] text-muted-foreground">No features found nearby.</p>
      )}
    </div>
  );
}

function HarbourRow({ feature }: { feature: RankedFeature }) {
  return (
    <div className="flex items-center gap-1.5 px-1.5 py-1 rounded bg-secondary/60">
      <Anchor className="w-3 h-3 shrink-0 text-teal-400" />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium truncate">
          {feature.name ?? feature.seamarkType ?? 'Harbour'}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {fmtDist(feature.distanceNm)} · {fmtBearing(feature.bearing)}
        </div>
      </div>
    </div>
  );
}

function HazardRow({ feature }: { feature: RankedFeature }) {
  return (
    <div className="flex items-center gap-1.5 px-1.5 py-0.5">
      <div className="w-2 h-2 rounded-full bg-red-500/80 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-medium text-muted-foreground">
          {HAZARD_LABEL[feature.seamarkType ?? ''] ?? feature.seamarkType ?? 'Hazard'}
        </span>
        {feature.name && (
          <span className="text-[10px] text-foreground ml-1 truncate">{feature.name}</span>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">
        {fmtDist(feature.distanceNm)} {fmtBearing(feature.bearing)}
      </span>
    </div>
  );
}
