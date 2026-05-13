'use client';

import Link from 'next/link';
import { RefreshCw, Radio, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useVesselStore } from '@/lib/store/vesselStore';

export default function Toolbar() {
  const vesselCount = useVesselStore((s) => s.vessels.size);
  const connectionState = useVesselStore((s) => s.connectionState);
  const purgeStale = useVesselStore((s) => s.purgeStale);
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
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 select-none">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />

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
            className="h-7 w-7"
            aria-label="Settings"
            render={<Link href="/settings" />}
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
        }>
        </TooltipTrigger>
        <TooltipContent side="bottom">Settings</TooltipContent>
      </Tooltip>
      </div>
    </header>
  );
}
