'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useVesselStore } from '@/lib/store/vesselStore';
import { useGPSStore } from '@/lib/store/gpsStore';
import { useHazardStore } from '@/lib/store/hazardStore';
import { useMapStore } from '@/lib/store/mapStore';

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const hasFlownToGPS = useRef(false);
  const vessels = useVesselStore((s) => s.vessels);
  const selectedMMSI = useVesselStore((s) => s.selectedMMSI);
  const selectVessel = useVesselStore((s) => s.selectVessel);
  const gpsFix = useGPSStore((s) => s.fix);
  const allFeatures = useHazardStore((s) => s.allFeatures);
  const closestHazards = useHazardStore((s) => s.closestHazards);
  const closestHarbour = useHazardStore((s) => s.closestHarbour);
  const flyToCmd = useMapStore((s) => s.flyToCmd);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
            maxzoom: 19,
          },
          openseamap: {
            type: 'raster',
            tiles: ['https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenSeaMap contributors',
            maxzoom: 18,
          },
        },
        layers: [
          { id: 'osm', type: 'raster', source: 'osm' },
          { id: 'openseamap', type: 'raster', source: 'openseamap', paint: { 'raster-opacity': 1 } },
        ],
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      },
      center: [103.8198, 1.3521],
      zoom: 10,
      antialias: true,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    map.on('rotate', () => useMapStore.getState().setBearing(map.getBearing()));

    // Ensure canvas picks up correct dimensions after first paint
    requestAnimationFrame(() => map.resize());

    map.on('load', () => {
      map.addSource('vessels', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'vessels-circle',
        type: 'circle',
        source: 'vessels',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 14, 8],
          'circle-color': [
            'match',
            ['get', 'navStatus'],
            1, '#f0c040',
            5, '#808080',
            0, '#00c8ff',
            '#00c8ff',
          ],
          'circle-stroke-color': [
            'case',
            ['==', ['get', 'selected'], true], '#ffffff',
            'rgba(0,0,0,0.4)',
          ],
          'circle-stroke-width': ['case', ['==', ['get', 'selected'], true], 2, 1],
          'circle-opacity': 0.9,
        },
      });

      map.addLayer({
        id: 'vessels-heading',
        type: 'line',
        source: 'vessels',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.5,
          'line-opacity': 0.7,
        },
      });

      map.addLayer({
        id: 'vessels-label',
        type: 'symbol',
        source: 'vessels',
        minzoom: 12,
        filter: ['==', ['geometry-type'], 'Point'],
        layout: {
          'text-field': ['coalesce', ['get', 'name'], ['get', 'mmsiStr']],
          'text-font': ['Open Sans Regular'],
          'text-size': 11,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#caf0f8',
          'text-halo-color': '#020c1b',
          'text-halo-width': 1.5,
        },
      });

      map.on('click', 'vessels-circle', (e) => {
        const feature = e.features?.[0];
        if (feature?.properties) selectVessel(feature.properties.mmsi as number);
      });

      map.on('mouseenter', 'vessels-circle', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'vessels-circle', () => {
        map.getCanvas().style.cursor = '';
      });

      // Own-ship GPS layer
      map.addSource('ownship', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'ownship-accuracy',
        type: 'circle',
        source: 'ownship',
        filter: ['==', ['get', 'type'], 'accuracy'],
        paint: {
          'circle-radius': ['get', 'radiusPx'],
          'circle-color': '#3b82f6',
          'circle-opacity': 0.15,
          'circle-stroke-color': '#3b82f6',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.4,
        },
      });
      map.addLayer({
        id: 'ownship-dot',
        type: 'circle',
        source: 'ownship',
        filter: ['==', ['get', 'type'], 'position'],
        paint: {
          'circle-radius': 7,
          'circle-color': '#3b82f6',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      // Maritime hazards + harbour layers
      map.addSource('hazards', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addSource('harbour', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // All hazards — small dots
      map.addLayer({
        id: 'hazards-all',
        type: 'circle',
        source: 'hazards',
        filter: ['!=', ['get', 'closest'], true],
        paint: {
          'circle-radius': 4,
          'circle-color': '#ef4444',
          'circle-opacity': 0.6,
          'circle-stroke-color': '#7f1d1d',
          'circle-stroke-width': 1,
        },
      });
      // Top-10 closest hazards — highlighted
      map.addLayer({
        id: 'hazards-closest',
        type: 'circle',
        source: 'hazards',
        filter: ['==', ['get', 'closest'], true],
        paint: {
          'circle-radius': 6,
          'circle-color': '#f97316',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        },
      });
      map.addLayer({
        id: 'hazards-label',
        type: 'symbol',
        source: 'hazards',
        filter: ['==', ['get', 'closest'], true],
        minzoom: 10,
        layout: {
          'text-field': ['coalesce', ['get', 'name'], ['get', 'seamarkType']],
          'text-font': ['Open Sans Regular'],
          'text-size': 10,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#fca5a5',
          'text-halo-color': '#1c0707',
          'text-halo-width': 1,
        },
      });

      // Closest harbour
      map.addLayer({
        id: 'harbour-dot',
        type: 'circle',
        source: 'harbour',
        paint: {
          'circle-radius': 8,
          'circle-color': '#2dd4bf',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
      map.addLayer({
        id: 'harbour-label',
        type: 'symbol',
        source: 'harbour',
        minzoom: 8,
        layout: {
          'text-field': ['coalesce', ['get', 'name'], 'Harbour'],
          'text-font': ['Open Sans Regular'],
          'text-size': 11,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#99f6e4',
          'text-halo-color': '#042f2e',
          'text-halo-width': 1.5,
        },
      });

      // Hazard interactivity — show overlay on click
      const onHazardClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const props = feature.properties as { id: number; name?: string; seamarkType?: string; closest?: boolean };
        const store = useHazardStore.getState();
        const ranked = [...store.closestHazards, ...store.allFeatures].find((f) => f.id === props.id);
        if (ranked && 'distanceKm' in ranked) {
          store.selectHazard(ranked as import('@/lib/store/hazardStore').RankedFeature);
        } else if (ranked) {
          // allFeatures entry — no distance data, select with null distances
          store.selectHazard({ ...ranked, distanceKm: 0, distanceNm: 0, bearing: 0 });
        }
        e.preventDefault();
      };

      map.on('click', 'hazards-closest', onHazardClick);
      map.on('click', 'hazards-all', onHazardClick);

      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['hazards-closest', 'hazards-all'] });
        if (!features.length) useHazardStore.getState().selectHazard(null);
      });

      for (const layer of ['hazards-closest', 'hazards-all']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update = () => {
      if (!map.getSource('vessels')) return;

      const features: GeoJSON.Feature[] = [];

      for (const [, v] of vessels) {
        if (v.lat == null || v.lon == null) continue;

        const heading = v.heading ?? v.cog;
        let hdx: number | undefined;
        let hdy: number | undefined;

        if (heading != null && v.sog != null && v.sog > 0.5) {
          const rad = (heading * Math.PI) / 180;
          const dist = Math.min(v.sog * 0.0002, 0.012);
          hdx = v.lon + Math.sin(rad) * dist;
          hdy = v.lat + Math.cos(rad) * dist;
        }

        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [v.lon, v.lat] },
          properties: {
            mmsi: v.mmsi,
            mmsiStr: v.mmsi.toString(),
            name: v.name ?? null,
            navStatus: v.navStatus ?? -1,
            selected: v.mmsi === selectedMMSI,
          },
        });

        if (hdx != null && hdy != null) {
          features.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [[v.lon, v.lat], [hdx, hdy]] },
            properties: { mmsi: v.mmsi },
          });
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map.getSource('vessels') as unknown as { setData: (d: GeoJSON.FeatureCollection) => void }).setData({
        type: 'FeatureCollection',
        features,
      });
    };

    if (map.loaded()) {
      update();
    } else {
      map.once('load', update);
      return () => { map.off('load', update); };
    }
  }, [vessels, selectedMMSI]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update = () => {
      const src = map.getSource('ownship') as { setData: (d: GeoJSON.FeatureCollection) => void } | undefined;
      if (!src) return;

      if (!gpsFix) {
        src.setData({ type: 'FeatureCollection', features: [] });
        return;
      }

      // Fly to GPS location on first fix
      if (!hasFlownToGPS.current) {
        hasFlownToGPS.current = true;
        map.flyTo({ center: [gpsFix.lon, gpsFix.lat], zoom: 13, duration: 1800 });
      }

      // Convert accuracy (metres) to approximate pixel radius at current zoom
      const metersPerPx = (40075016.686 * Math.cos((gpsFix.lat * Math.PI) / 180)) /
        (256 * Math.pow(2, map.getZoom()));
      const radiusPx = Math.max(4, gpsFix.accuracy / metersPerPx);

      src.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [gpsFix.lon, gpsFix.lat] },
            properties: { type: 'accuracy', radiusPx },
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [gpsFix.lon, gpsFix.lat] },
            properties: { type: 'position' },
          },
        ],
      });
    };

    if (map.loaded()) {
      update();
    } else {
      map.once('load', update);
      return () => { map.off('load', update); };
    }
  }, [gpsFix]);

  // Fly to commanded location (from sidebar hazard clicks)
  useEffect(() => {
    if (!flyToCmd || !mapRef.current) return;
    mapRef.current.flyTo({ center: [flyToCmd.lon, flyToCmd.lat], zoom: flyToCmd.zoom ?? 14, duration: 1200 });
  }, [flyToCmd]);

  // Sync hazard + harbour data to map sources
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const closestIds = new Set(closestHazards.map((h) => h.id));

    const hazardFeatures: GeoJSON.Feature[] = allFeatures
      .filter((f) => f.featureType === 'hazard')
      .map((f) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.lon, f.lat] },
        properties: {
          id: f.id,
          name: f.name,
          seamarkType: f.seamarkType,
          closest: closestIds.has(f.id),
        },
      }));

    const harbourFeatures: GeoJSON.Feature[] = closestHarbour
      ? [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [closestHarbour.lon, closestHarbour.lat] },
          properties: { name: closestHarbour.name, seamarkType: closestHarbour.seamarkType },
        }]
      : [];

    type SrcRef = { setData: (d: GeoJSON.FeatureCollection) => void };

    const update = () => {
      (map.getSource('hazards') as SrcRef | undefined)?.setData({ type: 'FeatureCollection', features: hazardFeatures });
      (map.getSource('harbour') as SrcRef | undefined)?.setData({ type: 'FeatureCollection', features: harbourFeatures });
    };

    if (map.loaded()) update();
    else { map.once('load', update); return () => { map.off('load', update); }; }
  }, [allFeatures, closestHazards, closestHarbour]);

  return <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />;
}
