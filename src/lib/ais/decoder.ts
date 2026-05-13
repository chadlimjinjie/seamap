import type { AISVessel } from './types';

function payloadToBits(payload: string): number[] {
  const bits: number[] = [];
  for (const ch of payload) {
    let v = ch.charCodeAt(0) - 48;
    if (v > 40) v -= 8;
    for (let i = 5; i >= 0; i--) {
      bits.push((v >> i) & 1);
    }
  }
  return bits;
}

function getUint(bits: number[], start: number, len: number): number {
  let v = 0;
  for (let i = 0; i < len; i++) v = (v << 1) | (bits[start + i] ?? 0);
  return v;
}

function getInt(bits: number[], start: number, len: number): number {
  const v = getUint(bits, start, len);
  return v & (1 << (len - 1)) ? v - (1 << len) : v;
}

function getText(bits: number[], start: number, numChars: number): string {
  let s = '';
  for (let i = 0; i < numChars; i++) {
    const v = getUint(bits, start + i * 6, 6);
    s += v < 32 ? String.fromCharCode(v + 64) : String.fromCharCode(v);
  }
  return s.replace(/@+$/, '').trim();
}

function decodeLon(raw: number): number {
  return raw / 600000;
}

function decodeLat(raw: number): number {
  return raw / 600000;
}

function isValidLon(v: number): boolean {
  return v >= -180 && v <= 180 && v !== 181;
}

function isValidLat(v: number): boolean {
  return v >= -90 && v <= 90 && v !== 91;
}

export function decodeMessage(
  payload: string,
  padding: number,
  channel: 'A' | 'B'
): Partial<AISVessel> | null {
  const bits = payloadToBits(payload);
  // Remove padding bits from end
  const usableBits = bits.slice(0, bits.length - padding);

  const msgType = getUint(usableBits, 0, 6);

  switch (msgType) {
    case 1:
    case 2:
    case 3:
      return decodeType123(usableBits, msgType, channel);
    case 5:
      return decodeType5(usableBits, channel);
    case 14:
      return decodeType14(usableBits, channel);
    case 18:
      return decodeType18(usableBits, channel);
    case 21:
      return decodeType21(usableBits, channel);
    case 24:
      return decodeType24(usableBits, channel);
    default:
      return null;
  }
}

function decodeType123(bits: number[], msgType: number, channel: 'A' | 'B'): Partial<AISVessel> {
  if (bits.length < 168) return {};
  const mmsi = getUint(bits, 8, 30);
  const navStatus = getUint(bits, 38, 4);
  const rot = getInt(bits, 42, 8);
  const sogRaw = getUint(bits, 50, 10);
  const posAccuracy = getUint(bits, 60, 1) === 1;
  const lonRaw = getInt(bits, 61, 28);
  const latRaw = getInt(bits, 89, 27);
  const cogRaw = getUint(bits, 116, 12);
  const heading = getUint(bits, 128, 9);
  const timestamp = getUint(bits, 137, 6);
  const raim = getUint(bits, 148, 1) === 1;

  const lon = decodeLon(lonRaw);
  const lat = decodeLat(latRaw);

  return {
    mmsi,
    msgType,
    channel,
    navStatus,
    rot,
    sog: sogRaw / 10,
    posAccuracy,
    lon: isValidLon(lon) ? lon : undefined,
    lat: isValidLat(lat) ? lat : undefined,
    cog: cogRaw < 3600 ? cogRaw / 10 : undefined,
    heading: heading !== 511 ? heading : undefined,
    timestamp,
    raim,
    lastSeen: Date.now(),
  };
}

function decodeType5(bits: number[], channel: 'A' | 'B'): Partial<AISVessel> {
  if (bits.length < 426) return {};
  const mmsi = getUint(bits, 8, 30);
  const imo = getUint(bits, 40, 30);
  const callsign = getText(bits, 70, 7);
  const name = getText(bits, 112, 20);
  const shipType = getUint(bits, 232, 8);
  const dimA = getUint(bits, 240, 9);
  const dimB = getUint(bits, 249, 9);
  const dimC = getUint(bits, 258, 6);
  const dimD = getUint(bits, 264, 6);
  const draughtRaw = getUint(bits, 294, 8);
  const destination = getText(bits, 302, 20);

  return {
    mmsi,
    msgType: 5,
    channel,
    imo: imo !== 0 ? imo : undefined,
    callsign: callsign || undefined,
    name: name || undefined,
    shipType,
    dimA,
    dimB,
    dimC,
    dimD,
    draught: draughtRaw / 10,
    destination: destination || undefined,
    lastSeen: Date.now(),
  };
}

function decodeType14(bits: number[], channel: 'A' | 'B'): Partial<AISVessel> {
  if (bits.length < 40) return {};
  const mmsi = getUint(bits, 8, 30);
  return { mmsi, msgType: 14, channel, lastSeen: Date.now() };
}

function decodeType18(bits: number[], channel: 'A' | 'B'): Partial<AISVessel> {
  if (bits.length < 168) return {};
  const mmsi = getUint(bits, 8, 30);
  const sogRaw = getUint(bits, 46, 10);
  const posAccuracy = getUint(bits, 56, 1) === 1;
  const lonRaw = getInt(bits, 57, 28);
  const latRaw = getInt(bits, 85, 27);
  const cogRaw = getUint(bits, 112, 12);
  const heading = getUint(bits, 124, 9);
  const timestamp = getUint(bits, 133, 6);
  const raim = getUint(bits, 147, 1) === 1;

  const lon = decodeLon(lonRaw);
  const lat = decodeLat(latRaw);

  return {
    mmsi,
    msgType: 18,
    channel,
    sog: sogRaw / 10,
    posAccuracy,
    lon: isValidLon(lon) ? lon : undefined,
    lat: isValidLat(lat) ? lat : undefined,
    cog: cogRaw < 3600 ? cogRaw / 10 : undefined,
    heading: heading !== 511 ? heading : undefined,
    timestamp,
    raim,
    lastSeen: Date.now(),
  };
}

function decodeType21(bits: number[], channel: 'A' | 'B'): Partial<AISVessel> {
  if (bits.length < 272) return {};
  const mmsi = getUint(bits, 8, 30);
  const name = getText(bits, 43, 20);
  const posAccuracy = getUint(bits, 163, 1) === 1;
  const lonRaw = getInt(bits, 164, 28);
  const latRaw = getInt(bits, 192, 27);

  const lon = decodeLon(lonRaw);
  const lat = decodeLat(latRaw);

  return {
    mmsi,
    msgType: 21,
    channel,
    name: name || undefined,
    posAccuracy,
    lon: isValidLon(lon) ? lon : undefined,
    lat: isValidLat(lat) ? lat : undefined,
    lastSeen: Date.now(),
  };
}

function decodeType24(bits: number[], channel: 'A' | 'B'): Partial<AISVessel> {
  if (bits.length < 160) return {};
  const mmsi = getUint(bits, 8, 30);
  const partNo = getUint(bits, 38, 2);

  if (partNo === 0) {
    const name = getText(bits, 40, 20);
    return { mmsi, msgType: 24, channel, name: name || undefined, lastSeen: Date.now() };
  } else if (partNo === 1) {
    const shipType = getUint(bits, 40, 8);
    const callsign = getText(bits, 90, 7);
    return { mmsi, msgType: 24, channel, shipType, callsign: callsign || undefined, lastSeen: Date.now() };
  }

  return { mmsi, msgType: 24, channel, lastSeen: Date.now() };
}
