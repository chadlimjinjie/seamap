'use client';

import { useMemo } from 'react';
import { Search, Ship } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVesselStore } from '@/lib/store/vesselStore';
import { formatMMSI, formatSpeed, formatCOG, NAV_STATUS, getShipTypeLabel } from '@/lib/ais/types';

export default function VesselList() {
  const vessels = useVesselStore((s) => s.vessels);
  const selectedMMSI = useVesselStore((s) => s.selectedMMSI);
  const filterText = useVesselStore((s) => s.filterText);
  const selectVessel = useVesselStore((s) => s.selectVessel);
  const setFilter = useVesselStore((s) => s.setFilter);

  const list = useMemo(() => {
    const all = Array.from(vessels.values());
    const q = filterText.toLowerCase();
    const filtered = q
      ? all.filter(
          (v) =>
            v.mmsi.toString().includes(q) ||
            v.name?.toLowerCase().includes(q) ||
            v.callsign?.toLowerCase().includes(q)
        )
      : all;
    return filtered.sort((a, b) => b.lastSeen - a.lastSeen);
  }, [vessels, filterText]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Vessels
          </span>
          <span className="text-xs text-muted-foreground font-mono">{list.length}</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="MMSI, name, callsign…"
            value={filterText}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8 h-7 text-xs bg-secondary border-border"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {list.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs mt-10 px-4 space-y-2">
            <Ship className="w-8 h-8 mx-auto opacity-40" />
            <p>
              {vessels.size === 0
                ? 'No vessels received yet.\nConnect your AIS receiver.'
                : 'No vessels match the filter.'}
            </p>
          </div>
        ) : (
          list.map((v) => (
            <button
              key={v.mmsi}
              onClick={() => selectVessel(v.mmsi === selectedMMSI ? null : v.mmsi)}
              className={`w-full text-left px-3 py-2 border-b border-border hover:bg-secondary/60 transition-colors ${
                v.mmsi === selectedMMSI ? 'bg-secondary' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-foreground truncate">
                  {v.name ?? formatMMSI(v.mmsi)}
                </span>
                {v.channel && (
                  <Badge
                    variant="outline"
                    className="text-[9px] h-4 px-1 font-mono shrink-0 border-border"
                  >
                    CH{v.channel}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-muted-foreground">{formatMMSI(v.mmsi)}</span>
                {v.sog != null && (
                  <span className="text-[10px] text-muted-foreground">{formatSpeed(v.sog)}</span>
                )}
                {v.cog != null && (
                  <span className="text-[10px] text-muted-foreground">{formatCOG(v.cog)}</span>
                )}
              </div>
              {(v.navStatus != null || v.shipType != null) && (
                <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {v.navStatus != null && (NAV_STATUS[v.navStatus] ?? '')}
                  {v.shipType != null && v.navStatus != null && ' · '}
                  {v.shipType != null && getShipTypeLabel(v.shipType)}
                </div>
              )}
            </button>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
