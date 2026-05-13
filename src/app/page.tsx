'use client';

import dynamic from 'next/dynamic';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app/AppSidebar';
import Toolbar from '@/components/app/Toolbar';
import GPSAutoStart from '@/components/app/GPSAutoStart';
import VesselDetails from '@/components/AIS/VesselDetails';

const MapView = dynamic(() => import('@/components/Map/MapView'), { ssr: false });

export default function Home() {
  return (
    <SidebarProvider>
      <GPSAutoStart />
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-0 h-screen overflow-hidden">
        <Toolbar />
        <div className="relative flex-1 min-h-0">
          <MapView />
          <VesselDetails />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
