import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMap } from '@/contexts/MapContext';
import { MAPBOX_TOKEN } from '@/utils/constants';

interface DirectionLayerProps {
  origin: [number, number] | null; // [lng, lat]
  destination: [number, number] | null; // [lng, lat]
}

export default function DirectionLayer({ origin, destination }: DirectionLayerProps) {
  const { map } = useMap();
  const routeLayerId = 'direction-route-line';
  const routeSourceId = 'direction-route-source';

  const cleanup = () => {
    if (!map) return;
    try {
      if (map.getLayer(routeLayerId)) {
        map.removeLayer(routeLayerId);
      }
      if (map.getSource(routeSourceId)) {
        map.removeSource(routeSourceId);
      }
    } catch (e) {
      console.warn('Error cleaning up directions layer:', e);
    }
  };

  useEffect(() => {
    if (!map || !origin || !destination) {
      cleanup();
      return;
    }

    let isSubscribed = true;

    const fetchRoute = async () => {
      try {
        const start = `${origin[0]},${origin[1]}`;
        const end = `${destination[0]},${destination[1]}`;
        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start};${end}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch directions');
        const data = await response.json();

        if (!isSubscribed) return;

        const route = data.routes?.[0]?.geometry;
        if (!route) {
          // Fallback to straight line if no route returned
          drawRoute({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [origin, destination],
            },
          });
          return;
        }

        drawRoute({
          type: 'Feature',
          properties: {},
          geometry: route,
        });

        // Fit map bounds to show the route
        const coordinates = route.coordinates;
        const bounds = coordinates.reduce(
          (acc: mapboxgl.LngLatBounds, coord: [number, number]) => acc.extend(coord),
          new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
        );

        map.fitBounds(bounds, {
          padding: { top: 60, bottom: 100, left: 60, right: 60 },
          maxZoom: 17,
        });
      } catch (err) {
        console.error('Directions fetch error, falling back to direct line:', err);
        if (!isSubscribed) return;
        // Fallback: direct line
        drawRoute({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [origin, destination],
          },
        });
      }
    };

    const drawRoute = (geojson: any) => {
      if (!map) return;

      try {
        const source = map.getSource(routeSourceId) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(geojson);
        } else {
          // Add source
          map.addSource(routeSourceId, {
            type: 'geojson',
            data: geojson,
          });

          // Add active glowing line layer
          map.addLayer({
            id: routeLayerId,
            type: 'line',
            source: routeSourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#0d9488', // Teal accent color
              'line-width': 5,
              'line-opacity': 0.85,
            },
          });
        }
      } catch (e) {
        console.error('Error drawing direction layer:', e);
      }
    };

    fetchRoute();

    return () => {
      isSubscribed = false;
      cleanup();
    };
  }, [map, origin, destination]);

  return null;
}
