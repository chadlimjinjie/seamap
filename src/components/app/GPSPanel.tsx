'use client';

import { MapPin, MapPinOff, Satellite } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useGPSStore } from '@/lib/store/gpsStore';

export default function GPSPanel() {
  const status = useGPSStore((s) => s.status);
  const fix = useGPSStore((s) => s.fix);
  const error = useGPSStore((s) => s.error);
  const startWatching = useGPSStore((s) => s.startWatching);
  const stopWatching = useGPSStore((s) => s.stopWatching);

  const isWatching = status === 'watching';

  const stateColors: Record<string, string> = {
    idle: 'text-muted-foreground',
    watching: fix ? 'text-green-400' : 'text-yellow-400',
    error: 'text-destructive',
  };

  const stateLabels: Record<string, string> = {
    idle: 'Off',
    watching: fix ? 'Fixed' : 'Searching…',
    error: 'Error',
  };

  return (
    <div className="p-3 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
          <Satellite className="w-3 h-3" />
          GPS
        </span>
        <span className={`text-xs font-mono ${stateColors[status]}`}>
          {stateLabels[status]}
        </span>
      </div>

      <div className="flex gap-2 mb-2">
        <Button
          size="sm"
          onClick={startWatching}
          disabled={isWatching}
          className="flex-1 h-7 text-xs"
        >
          <MapPin className="w-3.5 h-3.5 mr-1.5" />
          Enable
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={stopWatching}
          disabled={!isWatching}
          className="flex-1 h-7 text-xs"
        >
          <MapPinOff className="w-3.5 h-3.5 mr-1.5" />
          Disable
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive mt-1 break-words">{error}</p>
      )}

      {fix && (
        <>
          <Separator className="mb-2" />
          <div className="grid grid-cols-2 gap-1 text-xs font-mono">
            <Stat label="Lat" value={fix.lat.toFixed(5)} />
            <Stat label="Lon" value={fix.lon.toFixed(5)} />
            <Stat label="Accuracy" value={`±${fix.accuracy.toFixed(0)} m`} />
            {fix.altitude != null && (
              <Stat label="Alt" value={`${fix.altitude.toFixed(0)} m`} />
            )}
            {fix.speed != null && (
              <Stat label="Speed" value={`${(fix.speed * 1.944).toFixed(1)} kn`} />
            )}
            {fix.heading != null && (
              <Stat label="Hdg" value={`${fix.heading.toFixed(0)}°`} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary rounded px-2 py-1">
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}
