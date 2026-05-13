export interface AISVessel {
  mmsi: number;
  name?: string;
  callsign?: string;
  lat?: number;
  lon?: number;
  sog?: number;
  cog?: number;
  heading?: number;
  navStatus?: number;
  shipType?: number;
  rot?: number;
  posAccuracy?: boolean;
  raim?: boolean;
  timestamp?: number;
  imo?: number;
  destination?: string;
  draught?: number;
  dimA?: number;
  dimB?: number;
  dimC?: number;
  dimD?: number;
  lastSeen: number;
  msgType: number;
  channel?: 'A' | 'B';
}

export const NAV_STATUS: Record<number, string> = {
  0: 'Underway (engine)',
  1: 'At anchor',
  2: 'Not under command',
  3: 'Restricted manoeuvrability',
  4: 'Constrained by draught',
  5: 'Moored',
  6: 'Aground',
  7: 'Fishing',
  8: 'Underway sailing',
  9: 'HSC',
  10: 'WIG',
  11: 'Towing astern',
  12: 'Towing alongside',
  14: 'AIS-SART',
  15: 'Undefined',
};

export const SHIP_TYPE_LABEL: Record<number, string> = {
  0: 'Not available',
  20: 'Wing in ground',
  21: 'WIG – Hazardous A',
  22: 'WIG – Hazardous B',
  23: 'WIG – Hazardous C',
  24: 'WIG – Hazardous D',
  30: 'Fishing',
  31: 'Towing',
  32: 'Towing (long/heavy)',
  33: 'Dredging/underwater ops',
  34: 'Diving ops',
  35: 'Military ops',
  36: 'Sailing',
  37: 'Pleasure craft',
  40: 'High speed craft',
  50: 'Pilot vessel',
  51: 'Search and rescue',
  52: 'Tug',
  53: 'Port tender',
  54: 'Anti-pollution vessel',
  55: 'Law enforcement',
  58: 'Medical transport',
  59: 'Non-combatant (RR)',
  60: 'Passenger',
  61: 'Passenger – Hazardous A',
  62: 'Passenger – Hazardous B',
  63: 'Passenger – Hazardous C',
  64: 'Passenger – Hazardous D',
  70: 'Cargo',
  71: 'Cargo – Hazardous A',
  72: 'Cargo – Hazardous B',
  73: 'Cargo – Hazardous C',
  74: 'Cargo – Hazardous D',
  80: 'Tanker',
  81: 'Tanker – Hazardous A',
  82: 'Tanker – Hazardous B',
  83: 'Tanker – Hazardous C',
  84: 'Tanker – Hazardous D',
  90: 'Other',
};

export function getShipTypeLabel(type: number): string {
  return SHIP_TYPE_LABEL[type] ?? SHIP_TYPE_LABEL[Math.floor(type / 10) * 10] ?? 'Unknown';
}

export function formatMMSI(mmsi: number): string {
  return mmsi.toString().padStart(9, '0');
}

export function formatSpeed(sog?: number): string {
  if (sog == null || sog >= 102.3) return '—';
  return `${sog.toFixed(1)} kn`;
}

export function formatCOG(cog?: number): string {
  if (cog == null || cog >= 360) return '—';
  return `${cog.toFixed(1)}°`;
}

export function formatHeading(heading?: number): string {
  if (heading == null || heading === 511) return '—';
  return `${heading}°`;
}
