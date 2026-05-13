'use client';

import { useEffect } from 'react';
import { useGPSStore } from '@/lib/store/gpsStore';

export default function GPSAutoStart() {
  const startWatching = useGPSStore((s) => s.startWatching);
  useEffect(() => { startWatching(); }, [startWatching]);
  return null;
}
