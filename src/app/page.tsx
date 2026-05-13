'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Toolbar from '@/components/app/Toolbar';
import GPSAutoStart from '@/components/app/GPSAutoStart';
import HazardPanel from '@/components/app/HazardPanel';
import MobileNav from '@/components/app/MobileNav';
import MobileBottomSheet from '@/components/app/MobileBottomSheet';
import VesselList from '@/components/AIS/VesselList';
import VesselDetails from '@/components/AIS/VesselDetails';

const MapView = dynamic(() => import('@/components/Map/MapView'), { ssr: false });

type MobilePanel = 'vessels' | 'hazards' | null;

export default function Home() {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);

  const togglePanel = useCallback((panel: 'vessels' | 'hazards') => {
    setMobilePanel((prev) => (prev === panel ? null : panel));
  }, []);

  const closePanel = useCallback(() => setMobilePanel(null), []);

  return (
    <main className="w-full h-screen flex flex-col">
      <GPSAutoStart />
      <Toolbar />

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar — hidden on mobile */}
        <aside className="hidden md:flex w-64 shrink-0 bg-card/95 backdrop-blur-sm border-r border-border flex-col overflow-hidden">
          <HazardPanel />
          <VesselList />
        </aside>

        {/* Map */}
        <div className="relative flex-1 min-w-0">
          <MapView />
          <VesselDetails />
        </div>
      </div>

      {/* Mobile bottom sheet panels */}
      <MobileBottomSheet open={mobilePanel === 'hazards'} onClose={closePanel}>
        <HazardPanel />
      </MobileBottomSheet>
      <MobileBottomSheet open={mobilePanel === 'vessels'} onClose={closePanel}>
        <VesselList />
      </MobileBottomSheet>

      {/* Mobile bottom nav */}
      <MobileNav active={mobilePanel} onToggle={togglePanel} />
    </main>
  );
}
