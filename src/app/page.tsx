'use client';

import dynamic from 'next/dynamic';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app/AppSidebar';
import Toolbar from '@/components/app/Toolbar';
import GPSAutoStart from '@/components/app/GPSAutoStart';
import VesselDetails from '@/components/AIS/VesselDetails';
import HarbourOverlay from '@/components/app/HarbourOverlay';
import CompassOverlay from '@/components/app/CompassOverlay';
import HazardDetailOverlay from '@/components/app/HazardDetailOverlay';
import { useSettingsStore } from '@/lib/store/settingsStore';
import type { Corner } from '@/lib/store/settingsStore';

const MapView = dynamic(() => import('@/components/Map/MapView'), { ssr: false });

const CORNER_POS: Record<Corner, string> = {
  'top-left':     'absolute top-4 left-4',
  'top-right':    'absolute top-4 right-4',
  'bottom-left':  'absolute bottom-4 left-4',
  'bottom-right': 'absolute bottom-4 right-4',
};

function CornerGroup({ corner }: { corner: Corner }) {
  const positions = useSettingsStore((s) => s.overlayPositions);
  const isRight = corner === 'top-right' || corner === 'bottom-right';
  return (
    <div className={`${CORNER_POS[corner]} z-10 flex ${isRight ? 'flex-row-reverse' : 'flex-row'} gap-2 items-start`}>
      {positions.compass      === corner && <CompassOverlay />}
      {positions.harbour      === corner && <HarbourOverlay />}
      {positions.hazardDetail === corner && <HazardDetailOverlay />}
    </div>
  );
}

export default function Home() {
  return (
    <SidebarProvider
      className="h-svh overflow-hidden"
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 64)',
          '--header-height': 'calc(var(--spacing) * 10)',
        } as React.CSSProperties
      }
    >
      <GPSAutoStart />
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-hidden">
        <Toolbar />
        <div className="relative flex-1 min-h-0">
          <MapView />
          <CornerGroup corner="top-left" />
          <CornerGroup corner="top-right" />
          <CornerGroup corner="bottom-left" />
          <CornerGroup corner="bottom-right" />
          <VesselDetails />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
