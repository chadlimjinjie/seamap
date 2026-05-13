'use client';

import dynamic from 'next/dynamic';
import Toolbar from '@/components/app/Toolbar';
import GPSPanel from '@/components/app/GPSPanel';
import HazardPanel from '@/components/app/HazardPanel';
import ConnectionPanel from '@/components/AIS/ConnectionPanel';
import VesselList from '@/components/AIS/VesselList';
import VesselDetails from '@/components/AIS/VesselDetails';

// MapLibre GL is browser-only — disable SSR
const MapView = dynamic(() => import('@/components/Map/MapView'), { ssr: false });

export default function Home() {
  return (
    <main className="w-full h-screen flex flex-col">
      {/* Top toolbar */}
      <Toolbar />

      {/* Below toolbar: sidebar + map */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <aside className="w-64 shrink-0 bg-card/95 backdrop-blur-sm border-r border-border flex flex-col overflow-hidden">
          <GPSPanel />
          <HazardPanel />
          <ConnectionPanel />
          <VesselList />
        </aside>

        {/* Map area */}
        <div className="relative flex-1 min-w-0">
          <MapView />
          <VesselDetails />
        </div>
      </div>
    </main>
  );
}
