'use client';

import { useEffect } from 'react';
import { initGPSFromPref } from '@/lib/store/gpsStore';

export default function GPSAutoStart() {
  useEffect(() => { initGPSFromPref(); }, []);
  return null;
}
