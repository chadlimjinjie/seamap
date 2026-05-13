'use client';

import { useRef, useCallback } from 'react';
import { Plug, Unplug, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useVesselStore } from '@/lib/store/vesselStore';
import { SerialManager } from '@/lib/serial/SerialManager';

export default function ConnectionPanel() {
  const connectionState = useVesselStore((s) => s.connectionState);
  const stats = useVesselStore((s) => s.stats);
  const setConnectionState = useVesselStore((s) => s.setConnectionState);
  const setStats = useVesselStore((s) => s.setStats);
  const upsertVessel = useVesselStore((s) => s.upsertVessel);
  const managerRef = useRef<SerialManager | null>(null);

  const connect = useCallback(async () => {
    if (!managerRef.current) {
      managerRef.current = new SerialManager(upsertVessel, setConnectionState, setStats);
    }
    try {
      await managerRef.current.connect(38400);
    } catch (err) {
      console.error('Connection failed:', err);
    }
  }, [upsertVessel, setConnectionState, setStats]);

  const disconnect = useCallback(async () => {
    await managerRef.current?.disconnect();
  }, []);

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  const stateColors: Record<string, string> = {
    connected: 'text-green-400',
    connecting: 'text-yellow-400',
    error: 'text-destructive',
    disconnected: 'text-muted-foreground',
  };

  const stateLabels: Record<string, string> = {
    connected: 'Connected',
    connecting: 'Connecting…',
    error: 'Error',
    disconnected: 'Disconnected',
  };

  return (
    <div className="p-3 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          AIS Receiver
        </span>
        <span className={`text-xs font-mono ${stateColors[connectionState]}`}>
          {stateLabels[connectionState]}
        </span>
      </div>

      <div className="flex gap-2 mb-2">
        <Button
          size="sm"
          onClick={connect}
          disabled={isConnected || isConnecting}
          className="flex-1 h-7 text-xs"
        >
          <Plug className="w-3.5 h-3.5 mr-1.5" />
          Connect USB
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={disconnect}
          disabled={!isConnected && !isConnecting}
          className="flex-1 h-7 text-xs"
        >
          <Unplug className="w-3.5 h-3.5 mr-1.5" />
          Disconnect
        </Button>
      </div>

      {isConnected && (
        <>
          <Separator className="mb-2" />
          <div className="grid grid-cols-2 gap-1 text-xs font-mono">
            <Stat label="Sentences" value={stats.sentences.toLocaleString()} />
            <Stat label="Vessels" value={stats.vessels.toLocaleString()} />
            <Stat label="Bytes" value={formatBytes(stats.bytesReceived)} />
            <Stat label="Baud" value="38 400" />
          </div>
        </>
      )}

      {typeof navigator !== 'undefined' && !('serial' in navigator) && (
        <p className="text-xs text-destructive mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          Web Serial requires Chrome / Edge desktop.
        </p>
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
