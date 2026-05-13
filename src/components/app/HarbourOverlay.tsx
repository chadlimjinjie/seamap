'use client';

import { Anchor } from 'lucide-react';
import { useHazardStore } from '@/lib/store/hazardStore';

function fmtDist(nm: number): string {
  return nm < 1 ? `${(nm * 1852).toFixed(0)} m` : `${nm.toFixed(1)} nm`;
}

function fmtBearing(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

export default function HarbourOverlay() {
  const harbour = useHazardStore((s) => s.closestHarbour);
  if (!harbour) return null;

  return (
    <div className="absolute top-4 left-4 z-10 pointer-events-none bg-background/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 flex items-center gap-2 shadow-md">
      <Anchor className="w-4 h-4 shrink-0 text-teal-400" />
      <div className="min-w-0">
        <div className="text-xs font-semibold leading-tight truncate max-w-[160px]">
          {harbour.name ?? harbour.seamarkType ?? 'Harbour'}
        </div>
        <div className="text-[10px] text-muted-foreground leading-tight">
          {fmtDist(harbour.distanceNm)} · {fmtBearing(harbour.bearing)}
        </div>
      </div>
    </div>
  );
}
