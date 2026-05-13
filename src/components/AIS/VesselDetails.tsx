'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useVesselStore } from '@/lib/store/vesselStore';
import {
  formatMMSI,
  formatSpeed,
  formatCOG,
  formatHeading,
  NAV_STATUS,
  getShipTypeLabel,
} from '@/lib/ais/types';

export default function VesselDetails() {
  const selectedMMSI = useVesselStore((s) => s.selectedMMSI);
  const vessels = useVesselStore((s) => s.vessels);
  const selectVessel = useVesselStore((s) => s.selectVessel);

  if (!selectedMMSI) return null;
  const v = vessels.get(selectedMMSI);
  if (!v) return null;

  const age = Math.round((Date.now() - v.lastSeen) / 1000);

  return (
    <div className="absolute bottom-4 right-4 w-72 bg-card border border-border rounded-lg shadow-xl text-xs font-mono z-10">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Vessel Details
          </span>
          {v.channel && (
            <Badge variant="outline" className="text-[9px] h-4 px-1">
              CH{v.channel}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => selectVessel(null)}
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="p-3 space-y-1.5">
        <Row label="Name" value={v.name ?? '—'} highlight />
        <Row label="MMSI" value={formatMMSI(v.mmsi)} />
        {v.callsign && <Row label="Callsign" value={v.callsign} />}
        {v.imo && <Row label="IMO" value={v.imo.toString()} />}

        <Separator className="my-1" />

        {v.lat != null && v.lon != null && (
          <Row label="Position" value={`${v.lat.toFixed(5)}°, ${v.lon.toFixed(5)}°`} />
        )}
        <Row label="SOG" value={formatSpeed(v.sog)} />
        <Row label="COG" value={formatCOG(v.cog)} />
        <Row label="Heading" value={formatHeading(v.heading)} />
        {v.rot != null && v.rot !== -128 && (
          <Row label="ROT" value={`${v.rot > 0 ? '+' : ''}${v.rot}°/min`} />
        )}

        {v.navStatus != null && (
          <>
            <Separator className="my-1" />
            <Row label="Nav Status" value={NAV_STATUS[v.navStatus] ?? `${v.navStatus}`} />
          </>
        )}
        {v.shipType != null && <Row label="Ship Type" value={getShipTypeLabel(v.shipType)} />}
        {v.destination && <Row label="Destination" value={v.destination} />}
        {v.draught != null && v.draught > 0 && (
          <Row label="Draught" value={`${v.draught.toFixed(1)} m`} />
        )}
        {(v.dimA ?? v.dimB) && (
          <Row
            label="Dimensions"
            value={`${(v.dimA ?? 0) + (v.dimB ?? 0)} × ${(v.dimC ?? 0) + (v.dimD ?? 0)} m`}
          />
        )}

        <Separator className="my-1" />
        <Row label="Msg Type" value={`Type ${v.msgType}`} />
        <Row label="Last seen" value={`${age}s ago`} />
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right truncate ${highlight ? 'text-foreground font-semibold' : 'text-foreground/80'}`}>
        {value}
      </span>
    </div>
  );
}
