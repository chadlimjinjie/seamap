export interface MaritimeFeature {
  id: number;
  lat: number;
  lon: number;
  name: string | null;
  featureType: 'hazard' | 'harbour';
  seamarkType: string | null;
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const HAZARD_TYPES = [
  'rock', 'wreck', 'obstruction', 'reef',
  'isolated_danger', 'underwater_rock', 'snag', 'shoal',
];
const HARBOUR_TYPES = new Set(['harbour', 'anchorage', 'port', 'marina']);

export async function fetchMaritimeFeatures(
  lat: number,
  lon: number,
  radiusM = 100_000
): Promise<MaritimeFeature[]> {
  const query = `
[out:json][timeout:60];
(
  ${HAZARD_TYPES.map((t) => `node["seamark:type"="${t}"](around:${radiusM},${lat},${lon});`).join('\n  ')}
  node["seamark:type"="harbour"](around:${radiusM},${lat},${lon});
  node["seamark:type"="anchorage"](around:${radiusM},${lat},${lon});
  node["seamark:type"="port"](around:${radiusM},${lat},${lon});
  node["seamark:type"="marina"](around:${radiusM},${lat},${lon});
  node["harbour"="yes"](around:${radiusM},${lat},${lon});
);
out body;`.trim();

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(65_000),
  });

  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const json = await res.json();

  return (json.elements as Array<Record<string, unknown>>).map((el) => {
    const tags = (el.tags ?? {}) as Record<string, string>;
    const seamarkType = tags['seamark:type'] ?? null;
    const isHarbour = (seamarkType != null && HARBOUR_TYPES.has(seamarkType)) || tags['harbour'] === 'yes';
    return {
      id: el.id as number,
      lat: el.lat as number,
      lon: el.lon as number,
      name: tags['seamark:name'] ?? tags['name'] ?? null,
      featureType: isHarbour ? 'harbour' : 'hazard',
      seamarkType,
    };
  });
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
