'use client';

import dynamic from 'next/dynamic';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app/AppSidebar';
import Toolbar from '@/components/app/Toolbar';
import GPSAutoStart from '@/components/app/GPSAutoStart';
import VesselDetails from '@/components/AIS/VesselDetails';
import HarbourOverlay from '@/components/app/HarbourOverlay';

const MapView = dynamic(() => import('@/components/Map/MapView'), { ssr: false });

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
          <HarbourOverlay />
          <VesselDetails />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
