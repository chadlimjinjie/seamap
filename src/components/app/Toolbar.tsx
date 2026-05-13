'use client';

import { Anchor, RefreshCw, Radio, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVesselStore } from '@/lib/store/vesselStore';

export default function Toolbar() {
  const vesselCount = useVesselStore((s) => s.vessels.size);
  const connectionState = useVesselStore((s) => s.connectionState);
  const purgeStale = useVesselStore((s) => s.purgeStale);
  const { resolvedTheme, setTheme } = useTheme();

  const stateColor: Record<string, string> = {
    connected: 'text-green-500',
    connecting: 'text-yellow-500 animate-pulse',
    error: 'text-destructive',
    disconnected: 'text-muted-foreground',
  };

  const stateLabel: Record<string, string> = {
    connected: 'AIS connected',
    connecting: 'Connecting…',
    error: 'AIS error',
    disconnected: 'AIS disconnected',
  };

  return (
    <header className="h-10 bg-card/90 backdrop-blur-sm border-b border-border flex items-center px-4 gap-3 shrink-0 select-none">
      <Anchor className="w-4 h-4 shrink-0" />
      <span className="font-semibold text-sm tracking-wide">SeaMap</span>

      <div className="h-4 w-px bg-border" />

      <Tooltip>
        <TooltipTrigger className="flex items-center gap-1.5 cursor-default">
          <Radio className={`w-3.5 h-3.5 ${stateColor[connectionState]}`} />
          <span className="text-xs text-muted-foreground font-mono">{vesselCount} vessels</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">{stateLabel[connectionState]}</TooltipContent>
      </Tooltip>

      <div className="flex-1" />

      <Tooltip>
        <TooltipTrigger render={
          <Button
            variant="ghost"
            size="sm"
            onClick={purgeStale}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Purge stale
          </Button>
        }>
        </TooltipTrigger>
        <TooltipContent side="bottom">Remove vessels not seen in 10 minutes</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger render={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="h-7 w-7"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </Button>
        }>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        </TooltipContent>
      </Tooltip>
    </header>
  );
}
