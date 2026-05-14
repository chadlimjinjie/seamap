'use client';

import { X, AlertTriangle } from 'lucide-react';
import { useHazardStore } from '@/lib/store/hazardStore';

const HAZARD_LABEL: Record<string, string> = {
  rock: 'Rock',
  wreck: 'Wreck',
  obstruction: 'Obstruction',
  reef: 'Reef',
  isolated_danger: 'Isolated Danger',
  underwater_rock: 'Underwater Rock',
  snag: 'Snag',
  shoal: 'Shoal',
};

function fmtDist(nm: number): string {
  return nm < 1 ? `${(nm * 1852).toFixed(0)} m` : `${nm.toFixed(1)} nm`;
}

function fmtBearing(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

export default function HazardDetailOverlay() {
  const hazard = useHazardStore((s) => s.selectedHazard);
  const selectHazard = useHazardStore((s) => s.selectHazard);

  if (!hazard) return null;

  const typeLabel = HAZARD_LABEL[hazard.seamarkType ?? ''] ?? hazard.seamarkType ?? 'Hazard';
  const hasDistance = hazard.distanceNm > 0;

  return (
    <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-md flex items-start gap-2 min-w-[160px] max-w-[220px]">
      <AlertTriangle className="w-4 h-4 shrink-0 text-orange-400 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold leading-tight text-orange-300">{typeLabel}</div>
        {hazard.name && (
          <div className="text-xs text-foreground leading-tight truncate">{hazard.name}</div>
        )}
        {hasDistance && (
          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            {fmtDist(hazard.distanceNm)} · {fmtBearing(hazard.bearing)}
          </div>
        )}
      </div>
      <button
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => selectHazard(null)}
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
